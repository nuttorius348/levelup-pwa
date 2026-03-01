-- =============================================================
-- Checklist Tasks Table
-- =============================================================
-- Stores daily task lists with automatic reset functionality

CREATE TABLE IF NOT EXISTS checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for fast queries
  CONSTRAINT checklist_tasks_user_date_order UNIQUE (user_id, date, order_index)
);

-- Indexes
CREATE INDEX idx_checklist_tasks_user_date ON checklist_tasks(user_id, date);
CREATE INDEX idx_checklist_tasks_completed ON checklist_tasks(user_id, completed) WHERE completed = true;

-- RLS Policies
ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON checklist_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON checklist_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON checklist_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON checklist_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_checklist_tasks_updated_at
  BEFORE UPDATE ON checklist_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old tasks (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_old_checklist_tasks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM checklist_tasks
  WHERE date < CURRENT_DATE - INTERVAL '7 days';
END;
$$;

-- Comments
COMMENT ON TABLE checklist_tasks IS 'Daily task checklist with automatic reset';
COMMENT ON COLUMN checklist_tasks.date IS 'Task date (YYYY-MM-DD) for daily reset logic';
COMMENT ON COLUMN checklist_tasks.order_index IS 'Display order within the day';
