-- =============================================================
-- Migration 004: Stretch Session Tracking
-- =============================================================
-- Stores completed guided stretch sessions with XP breakdown,
-- pose completion data, and morning bonus tracking.
-- Supports progression queries and flexibility stats.
-- =============================================================

-- ── Stretch Sessions Table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS stretch_sessions (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id      TEXT NOT NULL,
  routine_title   TEXT NOT NULL,
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  poses_completed  INTEGER NOT NULL DEFAULT 0,
  poses_skipped    INTEGER NOT NULL DEFAULT 0,
  total_hold_time  INTEGER NOT NULL DEFAULT 0,     -- Actual seconds held
  xp_earned        INTEGER NOT NULL DEFAULT 0,
  coins_earned     INTEGER NOT NULL DEFAULT 0,
  is_morning       BOOLEAN NOT NULL DEFAULT FALSE,
  xp_breakdown     JSONB,                          -- Full StretchXPBreakdown
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_stretch_sessions_user
  ON stretch_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_stretch_sessions_user_date
  ON stretch_sessions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_stretch_sessions_routine
  ON stretch_sessions(user_id, routine_id);

CREATE INDEX IF NOT EXISTS idx_stretch_sessions_morning
  ON stretch_sessions(user_id, is_morning)
  WHERE is_morning = TRUE;

-- ── Stretch Progression Table ─────────────────────────────────
-- Tracks user's current difficulty level and unlock progress

CREATE TABLE IF NOT EXISTS stretch_progression (
  user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_difficulty   TEXT NOT NULL DEFAULT 'beginner'
                       CHECK (current_difficulty IN ('beginner', 'intermediate', 'advanced')),
  total_sessions       INTEGER NOT NULL DEFAULT 0,
  consecutive_days     INTEGER NOT NULL DEFAULT 0,
  last_session_date    DATE,
  intermediate_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  advanced_unlocked     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row-Level Security ────────────────────────────────────────

ALTER TABLE stretch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stretch_progression ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY stretch_sessions_select
  ON stretch_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY stretch_sessions_insert
  ON stretch_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Progression: users can read/update their own row
CREATE POLICY stretch_progression_select
  ON stretch_progression FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY stretch_progression_upsert
  ON stretch_progression FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Helper Function: Update Stretch Streak ────────────────────
-- Called after each session to maintain consecutive_days count

CREATE OR REPLACE FUNCTION update_stretch_progression()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stretch_progression (user_id, total_sessions, consecutive_days, last_session_date, updated_at)
  VALUES (
    NEW.user_id,
    1,
    1,
    CURRENT_DATE,
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_sessions = stretch_progression.total_sessions + 1,
    consecutive_days = CASE
      WHEN stretch_progression.last_session_date = CURRENT_DATE - INTERVAL '1 day'
        THEN stretch_progression.consecutive_days + 1
      WHEN stretch_progression.last_session_date = CURRENT_DATE
        THEN stretch_progression.consecutive_days  -- Same day, no change
      ELSE 1  -- Streak broken, reset to 1
    END,
    last_session_date = CURRENT_DATE,
    intermediate_unlocked = CASE
      WHEN (stretch_progression.total_sessions + 1) >= 10
        AND (CASE
              WHEN stretch_progression.last_session_date = CURRENT_DATE - INTERVAL '1 day'
                THEN stretch_progression.consecutive_days + 1
              WHEN stretch_progression.last_session_date = CURRENT_DATE
                THEN stretch_progression.consecutive_days
              ELSE 1
            END) >= 5
        THEN TRUE
      ELSE stretch_progression.intermediate_unlocked
    END,
    advanced_unlocked = CASE
      WHEN (stretch_progression.total_sessions + 1) >= 30
        AND (CASE
              WHEN stretch_progression.last_session_date = CURRENT_DATE - INTERVAL '1 day'
                THEN stretch_progression.consecutive_days + 1
              WHEN stretch_progression.last_session_date = CURRENT_DATE
                THEN stretch_progression.consecutive_days
              ELSE 1
            END) >= 14
        THEN TRUE
      ELSE stretch_progression.advanced_unlocked
    END,
    current_difficulty = CASE
      WHEN (stretch_progression.total_sessions + 1) >= 30
        AND (CASE
              WHEN stretch_progression.last_session_date = CURRENT_DATE - INTERVAL '1 day'
                THEN stretch_progression.consecutive_days + 1
              WHEN stretch_progression.last_session_date = CURRENT_DATE
                THEN stretch_progression.consecutive_days
              ELSE 1
            END) >= 14
        THEN 'advanced'
      WHEN (stretch_progression.total_sessions + 1) >= 10
        AND (CASE
              WHEN stretch_progression.last_session_date = CURRENT_DATE - INTERVAL '1 day'
                THEN stretch_progression.consecutive_days + 1
              WHEN stretch_progression.last_session_date = CURRENT_DATE
                THEN stretch_progression.consecutive_days
              ELSE 1
            END) >= 5
        THEN 'intermediate'
      ELSE stretch_progression.current_difficulty
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-update progression on session insert
CREATE TRIGGER trg_stretch_progression
  AFTER INSERT ON stretch_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_stretch_progression();
