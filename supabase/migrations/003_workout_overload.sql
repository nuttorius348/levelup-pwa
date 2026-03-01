-- =============================================================
-- 003: Workout System — Personal Records & Overload History
-- =============================================================
--
-- Adds tables for progressive overload tracking that complement
-- the existing workouts + workout_logs tables in 001.
-- =============================================================

-- ── Personal Records ──────────────────────────────────────────
-- Tracks best weight, reps, volume, est. 1RM for each exercise

CREATE TABLE IF NOT EXISTS workout_personal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,                    -- References exercise library ID
  type TEXT NOT NULL CHECK (type IN ('weight', 'reps', 'volume', '1rm')),
  value NUMERIC NOT NULL DEFAULT 0,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One record per user + exercise + type
  CONSTRAINT uq_pr_user_exercise_type UNIQUE (user_id, exercise_id, type)
);

CREATE INDEX idx_pr_user_id ON workout_personal_records(user_id);
CREATE INDEX idx_pr_exercise_id ON workout_personal_records(exercise_id);
CREATE INDEX idx_pr_user_exercise ON workout_personal_records(user_id, exercise_id);

-- ── Overload History ──────────────────────────────────────────
-- One row per exercise per workout session (for charting trends)

CREATE TABLE IF NOT EXISTS workout_overload_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  best_weight NUMERIC NOT NULL DEFAULT 0,
  best_reps INTEGER NOT NULL DEFAULT 0,
  best_volume NUMERIC NOT NULL DEFAULT 0,      -- best single set volume
  total_volume NUMERIC NOT NULL DEFAULT 0,     -- all sets combined
  estimated_1rm NUMERIC NOT NULL DEFAULT 0,    -- Epley formula
  sets INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_overload_user_id ON workout_overload_history(user_id);
CREATE INDEX idx_overload_exercise ON workout_overload_history(user_id, exercise_id);
CREATE INDEX idx_overload_date ON workout_overload_history(user_id, exercise_id, date DESC);

-- ── Workout Templates (favorites) ─────────────────────────────
-- Allow saving custom workout templates separately from the
-- main workouts table (which stores both templates and sessions)

-- Add is_favorite column to workouts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE workouts ADD COLUMN is_favorite BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add times_completed column to workouts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'times_completed'
  ) THEN
    ALTER TABLE workouts ADD COLUMN times_completed INTEGER DEFAULT 0;
  END IF;
END $$;

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE workout_personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_overload_history ENABLE ROW LEVEL SECURITY;

-- Personal Records RLS
CREATE POLICY "Users can view own PRs"
  ON workout_personal_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PRs"
  ON workout_personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PRs"
  ON workout_personal_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Overload History RLS
CREATE POLICY "Users can view own overload history"
  ON workout_overload_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own overload history"
  ON workout_overload_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Updated At Trigger ────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pr_updated_at
  BEFORE UPDATE ON workout_personal_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
