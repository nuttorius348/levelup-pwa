-- ============================================================
-- LevelUp PWA — Full Database Schema
-- Supabase PostgreSQL Migration
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS (PROFILES)
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  total_xp BIGINT NOT NULL DEFAULT 0,
  current_level_xp BIGINT NOT NULL DEFAULT 0,
  coins BIGINT NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  timezone TEXT DEFAULT 'America/New_York',
  theme TEXT DEFAULT 'default',
  notifications_enabled BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_level ON public.users(level);
CREATE INDEX idx_users_total_xp ON public.users(total_xp DESC);
CREATE INDEX idx_users_last_active ON public.users(last_active_date);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- XP LEDGER (append-only audit trail)
-- ============================================================
CREATE TYPE public.xp_action_type AS ENUM (
  'routine_item_complete',
  'routine_full_complete',
  'workout_logged',
  'stretch_complete',
  'outfit_rated',
  'quote_generated',
  'daily_login',
  'streak_bonus',
  'achievement_unlock',
  'level_up_bonus',
  'admin_grant',
  'admin_deduct'
);

CREATE TABLE public.xp_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action xp_action_type NOT NULL,
  base_xp INTEGER NOT NULL,
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  final_xp INTEGER NOT NULL,  -- base_xp × multiplier (rounded)
  coins_earned INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',  -- action-specific context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_ledger_user_date ON public.xp_ledger(user_id, created_at DESC);
CREATE INDEX idx_xp_ledger_action ON public.xp_ledger(action);

-- ============================================================
-- ROUTINES
-- ============================================================
CREATE TABLE public.routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#4C6EF5',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  recurrence JSONB DEFAULT '{"type": "daily"}',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for routines
CREATE INDEX idx_routines_user ON public.routines(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_routines_active ON public.routines(is_active, user_id);

-- ============================================================
-- ROUTINE COMPLETIONS
-- ============================================================
CREATE TABLE public.routine_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  streak_multiplier NUMERIC(4,2) DEFAULT 1.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, routine_id, completed_date)
);

-- Indexes for routine completions
CREATE INDEX idx_routine_completions_user_date ON public.routine_completions(user_id, completed_date DESC);
CREATE INDEX idx_routine_completions_routine ON public.routine_completions(routine_id, completed_date DESC);

-- ============================================================
-- WORKOUTS
-- ============================================================
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('strength', 'cardio', 'flexibility', 'hiit', 'sports', 'other')),
  difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER,
  tutorial_url TEXT,
  thumbnail_url TEXT,
  exercises JSONB DEFAULT '[]',
  is_template BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for workouts
CREATE INDEX idx_workouts_user ON public.workouts(user_id);
CREATE INDEX idx_workouts_category ON public.workouts(category);
CREATE INDEX idx_workouts_difficulty ON public.workouts(difficulty);

-- ============================================================
-- WORKOUT LOGS
-- ============================================================
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER,
  calories_estimated INTEGER,
  exercises_completed JSONB DEFAULT '[]',
  notes TEXT,
  mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 5),
  mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  streak_multiplier NUMERIC(4,2) DEFAULT 1.0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for workout logs
CREATE INDEX idx_workout_logs_user_date ON public.workout_logs(user_id, completed_at DESC);
CREATE INDEX idx_workout_logs_workout ON public.workout_logs(workout_id);

-- ============================================================
-- STRETCH SESSIONS
-- ============================================================
CREATE TABLE public.stretch_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  body_focus TEXT[],
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for stretch sessions
CREATE INDEX idx_stretch_sessions_user_date ON public.stretch_sessions(user_id, completed_at DESC);

-- ============================================================
-- OUTFIT RATINGS
-- ============================================================
CREATE TABLE public.outfit_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  rating_score INTEGER CHECK (rating_score BETWEEN 1 AND 10),
  feedback_text TEXT,
  suggestions TEXT[],
  style_tags TEXT[],
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for outfit ratings
CREATE INDEX idx_outfit_ratings_user_date ON public.outfit_ratings(user_id, created_at DESC);
CREATE INDEX idx_outfit_ratings_score ON public.outfit_ratings(rating_score);

-- ============================================================
-- XP TRANSACTIONS (Ledger)
-- ============================================================
CREATE TYPE public.xp_action_type AS ENUM (
  'routine_complete',
  'workout_logged',
  'stretch_complete',
  'outfit_rated',
  'quote_generated',
  'daily_login',
  'streak_bonus',
  'achievement_unlock',
  'level_up_bonus',
  'admin_grant',
  'admin_deduct'
);

CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action xp_action_type NOT NULL,
  base_xp INTEGER NOT NULL,
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  final_xp INTEGER NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  source_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for XP transactions
CREATE INDEX idx_xp_transactions_user_date ON public.xp_transactions(user_id, created_at DESC);
CREATE INDEX idx_xp_transactions_action ON public.xp_transactions(action);
CREATE INDEX idx_xp_transactions_source ON public.xp_transactions(source_id) WHERE source_id IS NOT NULL;

-- ============================================================
-- LEVELS
-- ============================================================
CREATE TABLE public.levels (
  level INTEGER PRIMARY KEY,
  xp_required BIGINT NOT NULL,
  xp_to_next BIGINT,
  title TEXT,
  icon TEXT,
  coin_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-populate levels 1-100
INSERT INTO public.levels (level, xp_required, xp_to_next, title, icon, coin_reward)
SELECT 
  lvl AS level,
  FLOOR(POWER(lvl, 1.5) * 100) AS xp_required,
  CASE 
    WHEN lvl < 100 THEN FLOOR(POWER(lvl + 1, 1.5) * 100) - FLOOR(POWER(lvl, 1.5) * 100)
    ELSE NULL
  END AS xp_to_next,
  CASE 
    WHEN lvl = 1 THEN 'Novice'
    WHEN lvl = 10 THEN 'Apprentice'
    WHEN lvl = 25 THEN 'Journeyman'
    WHEN lvl = 50 THEN 'Expert'
    WHEN lvl = 75 THEN 'Master'
    WHEN lvl = 100 THEN 'Legend'
    ELSE NULL
  END AS title,
  CASE 
    WHEN lvl = 1 THEN '🌱'
    WHEN lvl = 10 THEN '⚡'
    WHEN lvl = 25 THEN '💎'
    WHEN lvl = 50 THEN '👑'
    WHEN lvl = 75 THEN '🔥'
    WHEN lvl = 100 THEN '🏆'
    ELSE NULL
  END AS icon,
  lvl * 10 AS coin_reward
FROM generate_series(1, 100) AS lvl;

-- ============================================================
-- REWARDS (Shop Items)
-- ============================================================
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('avatar', 'theme', 'badge', 'title', 'boost', 'special')),
  icon TEXT,
  image_url TEXT,
  cost_coins INTEGER NOT NULL,
  cost_level INTEGER DEFAULT 1,
  is_limited_edition BOOLEAN DEFAULT false,
  stock_remaining INTEGER,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  effects JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for rewards
CREATE INDEX idx_rewards_category ON public.rewards(category, is_active);
CREATE INDEX idx_rewards_cost ON public.rewards(cost_coins);
CREATE INDEX idx_rewards_rarity ON public.rewards(rarity);

-- User reward purchases
CREATE TABLE public.user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, reward_id)
);

-- Indexes for user rewards
CREATE INDEX idx_user_rewards_user ON public.user_rewards(user_id);
CREATE INDEX idx_user_rewards_equipped ON public.user_rewards(user_id, is_equipped) WHERE is_equipped = true;

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'custom' CHECK (event_type IN ('routine', 'workout', 'stretch', 'custom', 'reminder')),
  source_id UUID,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  color TEXT,
  reminder_minutes INTEGER[],
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for calendar events
CREATE INDEX idx_calendar_user_range ON public.calendar_events(user_id, start_at, end_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_calendar_type ON public.calendar_events(event_type);
CREATE INDEX idx_calendar_source ON public.calendar_events(source_id) WHERE source_id IS NOT NULL;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Calculate XP required for a given level (level^1.5 * 100)
CREATE OR REPLACE FUNCTION public.xp_for_level(target_level INTEGER)
RETURNS BIGINT AS $$
BEGIN
  RETURN FLOOR(POWER(target_level, 1.5) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get user's global rank by total XP
CREATE OR REPLACE FUNCTION public.get_user_rank(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO user_rank
  FROM public.users
  WHERE total_xp > (SELECT total_xp FROM public.users WHERE id = p_user_id);
  
  RETURN user_rank;
END;
$$ LANGUAGE plpgsql STABLE;

-- Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER routines_updated_at BEFORE UPDATE ON public.routines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER workouts_updated_at BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Users: public read, self update
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users: public read" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users: self update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- XP Transactions: self read only
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "XP Transactions: self read" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);

-- Routines: self CRUD
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Routines: self read" ON public.routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Routines: self insert" ON public.routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Routines: self update" ON public.routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Routines: self delete" ON public.routines FOR DELETE USING (auth.uid() = user_id);

-- Routine Completions: self CRUD
ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Routine Completions: self read" ON public.routine_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Routine Completions: self insert" ON public.routine_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Workouts: self CRUD
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workouts: self read" ON public.workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Workouts: self insert" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Workouts: self update" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Workouts: self delete" ON public.workouts FOR DELETE USING (auth.uid() = user_id);

-- Workout Logs: self CRUD
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workout Logs: self read" ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Workout Logs: self insert" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stretch Sessions: self CRUD
ALTER TABLE public.stretch_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stretch Sessions: self read" ON public.stretch_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Stretch Sessions: self insert" ON public.stretch_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Outfit Ratings: self CRUD
ALTER TABLE public.outfit_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Outfit Ratings: self read" ON public.outfit_ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Outfit Ratings: self insert" ON public.outfit_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Levels: public read
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Levels: public read" ON public.levels FOR SELECT USING (true);

-- Rewards: public read
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rewards: public read" ON public.rewards FOR SELECT USING (is_active = true);

-- User Rewards: self CRUD
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User Rewards: self read" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User Rewards: self insert" ON public.user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User Rewards: self update" ON public.user_rewards FOR UPDATE USING (auth.uid() = user_id);

-- Calendar Events: self CRUD
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Calendar Events: self read" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Calendar Events: self insert" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Calendar Events: self update" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Calendar Events: self delete" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);
