-- =============================================================
-- LevelUp PWA — Full Database Migration
-- =============================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ── 1. Users (auth-linked profile) ──────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE,
  display_name text,
  avatar_url text,
  level integer NOT NULL DEFAULT 1,
  total_xp integer NOT NULL DEFAULT 0,
  current_level_xp integer NOT NULL DEFAULT 0,
  coins integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  timezone text NOT NULL DEFAULT 'UTC',
  theme text NOT NULL DEFAULT 'default',
  notifications_enabled boolean NOT NULL DEFAULT true,
  notification_preferences jsonb NOT NULL DEFAULT '{}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Profiles (alias / view of users for compatibility) ───

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  level integer NOT NULL DEFAULT 1,
  total_xp integer NOT NULL DEFAULT 0,
  current_level_xp integer NOT NULL DEFAULT 0,
  coins integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  timezone text NOT NULL DEFAULT 'UTC',
  theme text NOT NULL DEFAULT 'default',
  notifications_enabled boolean NOT NULL DEFAULT true,
  notification_preferences jsonb NOT NULL DEFAULT '{}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 3. XP Ledger ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS xp_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  base_xp integer NOT NULL,
  multiplier numeric NOT NULL DEFAULT 1.0,
  final_xp integer NOT NULL,
  coins_earned integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_user ON xp_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_date ON xp_ledger(created_at);

-- ── 4. XP Transactions ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  base_xp integer NOT NULL,
  multiplier numeric NOT NULL DEFAULT 1.0,
  final_xp integer NOT NULL,
  coins_earned integer NOT NULL DEFAULT 0,
  source_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);

-- ── 5. Daily XP Caps ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_xp_caps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  cap_date date NOT NULL,
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, action, cap_date)
);

-- ── 6. Routines ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '📋',
  color text NOT NULL DEFAULT '#6366f1',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  recurrence jsonb NOT NULL DEFAULT '{"type":"daily"}',
  xp_reward integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_routines_user ON routines(user_id);

-- ── 7. Routine Items ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS routine_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  xp_value integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routine_items_routine ON routine_items(routine_id);

-- ── 8. Routine Completions ──────────────────────────────────

CREATE TABLE IF NOT EXISTS routine_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  routine_item_id uuid REFERENCES routine_items(id) ON DELETE SET NULL,
  completed_date date NOT NULL,
  xp_earned integer NOT NULL DEFAULT 0,
  streak_multiplier numeric NOT NULL DEFAULT 1.0,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date ON routine_completions(user_id, completed_date);

-- ── 9. Workouts ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'strength',
  difficulty text NOT NULL DEFAULT 'intermediate',
  estimated_minutes integer,
  tutorial_url text,
  thumbnail_url text,
  exercises jsonb NOT NULL DEFAULT '[]',
  is_template boolean NOT NULL DEFAULT false,
  is_favorite boolean NOT NULL DEFAULT false,
  times_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 10. Workout Templates ───────────────────────────────────

CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'strength',
  difficulty text NOT NULL DEFAULT 'intermediate',
  estimated_minutes integer,
  tutorial_url text,
  thumbnail_url text,
  exercises jsonb NOT NULL DEFAULT '[]',
  is_template boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid,
  is_favorite boolean NOT NULL DEFAULT false,
  times_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 11. Workout Logs ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
  title text NOT NULL,
  duration_minutes integer,
  calories_estimated integer,
  exercises_completed jsonb NOT NULL DEFAULT '[]',
  notes text,
  mood_before integer,
  mood_after integer,
  xp_earned integer NOT NULL DEFAULT 0,
  streak_multiplier numeric NOT NULL DEFAULT 1.0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user ON workout_logs(user_id);

-- ── 12. Workout Personal Records ────────────────────────────

CREATE TABLE IF NOT EXISTS workout_personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  type text NOT NULL,
  value numeric NOT NULL,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  workout_log_id uuid REFERENCES workout_logs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 13. Workout Overload History ────────────────────────────

CREATE TABLE IF NOT EXISTS workout_overload_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  date date NOT NULL,
  best_weight numeric NOT NULL DEFAULT 0,
  best_reps integer NOT NULL DEFAULT 0,
  best_volume numeric NOT NULL DEFAULT 0,
  total_volume numeric NOT NULL DEFAULT 0,
  estimated_1rm numeric NOT NULL DEFAULT 0,
  sets integer NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'intermediate',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 14. Stretch Sessions ────────────────────────────────────

CREATE TABLE IF NOT EXISTS stretch_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id text NOT NULL,
  routine_title text NOT NULL,
  difficulty text NOT NULL DEFAULT 'beginner',
  duration_seconds integer NOT NULL DEFAULT 0,
  poses_completed integer NOT NULL DEFAULT 0,
  poses_skipped integer NOT NULL DEFAULT 0,
  total_hold_time integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  coins_earned integer NOT NULL DEFAULT 0,
  is_morning boolean NOT NULL DEFAULT false,
  xp_breakdown jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stretch_sessions_user ON stretch_sessions(user_id);

-- ── 15. Stretch Progression ─────────────────────────────────

CREATE TABLE IF NOT EXISTS stretch_progression (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_difficulty text NOT NULL DEFAULT 'beginner',
  total_sessions integer NOT NULL DEFAULT 0,
  consecutive_days integer NOT NULL DEFAULT 0,
  last_session_date date,
  intermediate_unlocked boolean NOT NULL DEFAULT false,
  advanced_unlocked boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 16. Outfit Ratings ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS outfit_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_hash text,
  rating_score numeric,
  overall_score numeric,
  style_tags text[],
  color_harmony numeric,
  fit_score numeric,
  occasion_match text,
  feedback_text text,
  ai_feedback text,
  suggestions text[],
  ai_suggestions text[],
  ai_provider text NOT NULL DEFAULT 'openai',
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 17. Levels ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS levels (
  level integer PRIMARY KEY,
  xp_required integer NOT NULL,
  xp_to_next integer,
  title text,
  icon text,
  coin_reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 18. Rewards ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  icon text,
  image_url text,
  cost_coins integer NOT NULL DEFAULT 0,
  cost_level integer NOT NULL DEFAULT 0,
  is_limited_edition boolean NOT NULL DEFAULT false,
  stock_remaining integer,
  rarity text DEFAULT 'common',
  effects jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 19. User Rewards ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  is_equipped boolean NOT NULL DEFAULT false,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_id)
);

-- ── 20. Calendar Events ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'personal',
  category text NOT NULL DEFAULT 'other',
  source_id text,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz NOT NULL DEFAULT now(),
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  all_day boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  color text,
  reminder_minutes integer[],
  completed boolean NOT NULL DEFAULT false,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  routine_id uuid,
  xp_awarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);

-- ── 21. Shop Items ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  subcategory text,
  icon_url text,
  preview_url text,
  price_coins integer NOT NULL DEFAULT 0,
  level_required integer NOT NULL DEFAULT 1,
  is_limited boolean NOT NULL DEFAULT false,
  stock_remaining integer,
  metadata jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 22. User Inventory ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  is_equipped boolean NOT NULL DEFAULT false,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- ── 23. User Purchases ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  price_paid integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 24. Push Subscriptions ──────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  keys_p256dh text NOT NULL,
  keys_auth text NOT NULL,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 25. Checklist Tasks ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS checklist_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  date date NOT NULL DEFAULT CURRENT_DATE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checklist_user_date ON checklist_tasks(user_id, date);

-- ── 26. Daily Quotes ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_date date NOT NULL UNIQUE,
  quote_text text NOT NULL,
  theme text NOT NULL DEFAULT 'motivation',
  tone text NOT NULL DEFAULT 'inspiring',
  attribution text NOT NULL DEFAULT 'LevelUp AI',
  tags text[] NOT NULL DEFAULT '{}',
  follow_up text,
  ai_provider text NOT NULL DEFAULT 'openai',
  fallback_used boolean NOT NULL DEFAULT false,
  generation_latency_ms integer,
  total_reads integer NOT NULL DEFAULT 0,
  unique_readers integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 27. Quote Reads ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quote_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quote_date date NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  is_morning_read boolean NOT NULL DEFAULT false,
  xp_earned integer NOT NULL DEFAULT 0,
  morning_bonus_earned integer NOT NULL DEFAULT 0,
  source text,
  UNIQUE(user_id, quote_date)
);

-- ── 28. Quotes (user-generated) ─────────────────────────────

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quote_text text NOT NULL,
  theme text NOT NULL DEFAULT 'motivation',
  tone text NOT NULL DEFAULT 'inspiring',
  attribution text NOT NULL DEFAULT 'LevelUp AI',
  tags text[] NOT NULL DEFAULT '{}',
  follow_up text,
  ai_provider text NOT NULL DEFAULT 'openai',
  fallback_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 29. Active Boosts ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS active_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES rewards(id) ON DELETE SET NULL,
  boost_type text NOT NULL,
  multiplier numeric NOT NULL DEFAULT 1.5,
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_consumed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_active_boosts_user ON active_boosts(user_id);

-- ── 30. Login Calendar ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS login_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  login_date date NOT NULL,
  day_in_cycle integer NOT NULL DEFAULT 1,
  cycle_number integer NOT NULL DEFAULT 1,
  coins_awarded integer NOT NULL DEFAULT 0,
  bonus_item_slug text,
  claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, login_date)
);

-- ── 31. Comeback Bonuses ────────────────────────────────────

CREATE TABLE IF NOT EXISTS comeback_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  days_absent integer NOT NULL DEFAULT 0,
  coins_awarded integer NOT NULL DEFAULT 0,
  xp_awarded integer NOT NULL DEFAULT 0,
  boost_hours integer NOT NULL DEFAULT 0,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

-- ── 32. Quest Templates ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS quest_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  quest_type text NOT NULL,
  target_count integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 50,
  coin_reward integer NOT NULL DEFAULT 10,
  icon text NOT NULL DEFAULT '🎯',
  reset_frequency text NOT NULL DEFAULT 'daily',
  difficulty text NOT NULL DEFAULT 'normal',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 33. User Quests ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_template_id uuid NOT NULL REFERENCES quest_templates(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  target integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  claimed boolean NOT NULL DEFAULT false,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  claimed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);

-- =============================================================
-- RPC Functions
-- =============================================================

-- Get XP required for a level
CREATE OR REPLACE FUNCTION xp_for_level(target_level integer)
RETURNS integer AS $$
BEGIN
  RETURN FLOOR(100 * POWER(target_level, 1.5))::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get user's rank by total XP
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  rank_val integer;
BEGIN
  SELECT COUNT(*) + 1 INTO rank_val
  FROM profiles
  WHERE total_xp > (SELECT total_xp FROM profiles WHERE id = p_user_id);
  RETURN rank_val;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get equipped cosmetics for a user
CREATE OR REPLACE FUNCTION get_equipped_cosmetics(p_user_id uuid)
RETURNS TABLE(category text, reward_id uuid, reward_name text, icon text, effects jsonb) AS $$
BEGIN
  RETURN QUERY
  SELECT r.category, r.id, r.name, r.icon, r.effects
  FROM user_rewards ur
  JOIN rewards r ON r.id = ur.reward_id
  WHERE ur.user_id = p_user_id AND ur.is_equipped = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get active boost multiplier
CREATE OR REPLACE FUNCTION get_active_boost_multiplier(p_user_id uuid, p_boost_type text DEFAULT 'xp')
RETURNS numeric AS $$
DECLARE
  total_mult numeric := 1.0;
BEGIN
  SELECT COALESCE(MAX(multiplier), 1.0) INTO total_mult
  FROM active_boosts
  WHERE user_id = p_user_id
    AND boost_type = p_boost_type
    AND expires_at > now()
    AND is_consumed = false;
  RETURN total_mult;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if user has streak shield
CREATE OR REPLACE FUNCTION has_streak_shield(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM active_boosts
    WHERE user_id = p_user_id
      AND boost_type = 'streak_shield'
      AND expires_at > now()
      AND is_consumed = false
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Consume streak shield
CREATE OR REPLACE FUNCTION consume_streak_shield(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  shield_id uuid;
BEGIN
  SELECT id INTO shield_id FROM active_boosts
  WHERE user_id = p_user_id
    AND boost_type = 'streak_shield'
    AND expires_at > now()
    AND is_consumed = false
  LIMIT 1;

  IF shield_id IS NULL THEN RETURN false; END IF;

  UPDATE active_boosts SET is_consumed = true WHERE id = shield_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Increment coins
CREATE OR REPLACE FUNCTION increment_coins(user_id_input uuid, amount integer)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET coins = coins + amount, updated_at = now() WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql;

-- Award XP (updates profile totals)
CREATE OR REPLACE FUNCTION award_xp(user_id_input uuid, amount integer)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET total_xp = total_xp + amount,
      current_level_xp = current_level_xp + amount,
      updated_at = now()
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql;

-- Assign daily quests
CREATE OR REPLACE FUNCTION assign_daily_quests(target_user_id uuid)
RETURNS void AS $$
DECLARE
  tmpl RECORD;
  tomorrow timestamptz := (CURRENT_DATE + interval '1 day')::timestamptz;
BEGIN
  -- Skip if already assigned today
  IF EXISTS (
    SELECT 1 FROM user_quests
    WHERE user_id = target_user_id
      AND assigned_at::date = CURRENT_DATE
  ) THEN RETURN; END IF;

  -- Pick 3 random active daily quests
  FOR tmpl IN
    SELECT * FROM quest_templates
    WHERE is_active = true AND reset_frequency = 'daily'
    ORDER BY random()
    LIMIT 3
  LOOP
    INSERT INTO user_quests (user_id, quest_template_id, target, expires_at)
    VALUES (target_user_id, tmpl.id, tmpl.target_count, tomorrow);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Increment quest progress
CREATE OR REPLACE FUNCTION increment_quest_progress(
  target_user_id uuid,
  target_quest_type text,
  increment_amount integer DEFAULT 1
)
RETURNS void AS $$
BEGIN
  UPDATE user_quests uq
  SET progress = LEAST(progress + increment_amount, target),
      completed = (progress + increment_amount >= target),
      completed_at = CASE WHEN progress + increment_amount >= target THEN now() ELSE completed_at END
  FROM quest_templates qt
  WHERE uq.quest_template_id = qt.id
    AND uq.user_id = target_user_id
    AND qt.quest_type = target_quest_type
    AND uq.completed = false
    AND uq.expires_at > now();
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_xp_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_overload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stretch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stretch_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE comeback_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own data
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Service role can do everything (API routes use service_role key)
-- These policies allow authenticated users to read their own data
-- The service_role key bypasses RLS entirely

CREATE POLICY "Own data" ON xp_ledger FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON xp_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON daily_xp_caps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON routines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON routine_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON workout_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON workout_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON workout_personal_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON workout_overload_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON stretch_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON stretch_progression FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON outfit_ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON user_inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON user_purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON checklist_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON quote_reads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON quotes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON active_boosts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON login_calendar FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON comeback_bonuses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON user_quests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data" ON user_rewards FOR ALL USING (auth.uid() = user_id);

-- Routine items: allow read if user owns the parent routine
CREATE POLICY "Read own routine items" ON routine_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "Write own routine items" ON routine_items FOR ALL
  USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()));

-- Public read access for reference tables
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON levels FOR SELECT USING (true);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON rewards FOR SELECT USING (true);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON shop_items FOR SELECT USING (true);

ALTER TABLE quest_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON quest_templates FOR SELECT USING (true);

ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON daily_quotes FOR SELECT USING (true);

-- Leaderboard: allow reading other users' profiles (limited columns done in app)
CREATE POLICY "Leaderboard read" ON profiles FOR SELECT USING (true);

-- =============================================================
-- Seed: Default Quest Templates
-- =============================================================

INSERT INTO quest_templates (name, description, quest_type, target_count, xp_reward, coin_reward, icon, reset_frequency, difficulty) VALUES
  ('Daily Warrior', 'Complete 3 workouts', 'daily_workouts', 3, 75, 15, '💪', 'daily', 'normal'),
  ('Stretch Master', 'Complete 2 stretch sessions', 'daily_stretches', 2, 50, 10, '🧘', 'daily', 'easy'),
  ('XP Hunter', 'Earn 200 XP today', 'daily_xp', 200, 100, 20, '⭐', 'daily', 'hard'),
  ('Streak Builder', 'Maintain a 7-day streak', 'weekly_streak', 7, 150, 30, '🔥', 'weekly', 'epic'),
  ('Fashion Forward', 'Get 3 outfit ratings', 'outfit_ratings', 3, 60, 12, '👔', 'daily', 'normal'),
  ('Consistent', 'Log in every day this week', 'daily_login', 7, 100, 25, '📅', 'weekly', 'normal')
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Migration complete! 33 tables + 10 RPC functions + RLS policies created.' AS status;
