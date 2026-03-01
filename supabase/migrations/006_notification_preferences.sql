-- =============================================================
-- Migration 006: Add notification preferences JSONB to profiles
-- =============================================================
-- Stores per-user notification category toggles:
--   { "streakReminder": true, "dailyQuote": true, "dailyReminder": true, "workoutReminder": true, "levelUp": true }
-- Used by cron jobs to filter who receives each notification type.
-- =============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"streakReminder": true, "dailyQuote": true, "dailyReminder": true, "workoutReminder": true, "levelUp": true}'::jsonb;

-- Index for cron job filtering
CREATE INDEX IF NOT EXISTS idx_profiles_notifications_enabled
  ON profiles (notifications_enabled)
  WHERE notifications_enabled = true;
