-- =============================================================
-- LevelUp — COMPREHENSIVE FIX SCRIPT
-- Run this in Supabase SQL Editor to fix all issues
-- =============================================================

-- Drop ALL existing policies first
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- =============================================================
-- 1. Ensure users table exists with auto-create trigger
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
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

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create user profile for any auth users that don't have one
INSERT INTO public.users (id, display_name)
SELECT au.id, COALESCE(au.raw_user_meta_data->>'full_name', 'User')
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- =============================================================
-- 2. Ensure all required tables exist
-- =============================================================

CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '📋',
  color TEXT NOT NULL DEFAULT '#4C6EF5',
  recurrence JSONB NOT NULL DEFAULT '{"type":"daily"}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  xp_value INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  routine_item_id UUID REFERENCES routine_items(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_date DATE NOT NULL UNIQUE,
  quote_text TEXT NOT NULL,
  theme TEXT,
  tone TEXT,
  attribution TEXT,
  tags JSONB DEFAULT '[]',
  follow_up TEXT,
  ai_provider TEXT,
  fallback_used BOOLEAN DEFAULT false,
  generation_latency_ms INTEGER DEFAULT 0,
  total_reads INTEGER DEFAULT 0,
  unique_readers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'badge',
  subcategory TEXT,
  icon_url TEXT,
  preview_url TEXT,
  price_coins INTEGER NOT NULL DEFAULT 100,
  level_required INTEGER NOT NULL DEFAULT 1,
  is_limited BOOLEAN NOT NULL DEFAULT false,
  stock_remaining INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES shop_items(id),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outfit_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT,
  overall_score NUMERIC,
  style_tags JSONB,
  color_harmony NUMERIC,
  fit_score NUMERIC,
  occasion_match NUMERIC,
  ai_feedback TEXT,
  ai_suggestions JSONB,
  ai_provider TEXT,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  base_xp INTEGER NOT NULL DEFAULT 0,
  bonus_xp INTEGER NOT NULL DEFAULT 0,
  final_xp INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 3. Enable RLS on all tables
-- =============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- =============================================================
-- 4. Create RLS policies
-- =============================================================

-- Users table
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Routines
CREATE POLICY "routines_all" ON routines FOR ALL USING (auth.uid() = user_id);

-- Routine items: via parent routine
CREATE POLICY "routine_items_select" ON routine_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "routine_items_insert" ON routine_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "routine_items_delete" ON routine_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()));

-- Routine completions
CREATE POLICY "routine_completions_all" ON routine_completions FOR ALL USING (auth.uid() = user_id);

-- Daily quotes (public read, service role write)
CREATE POLICY "daily_quotes_read" ON daily_quotes FOR SELECT USING (true);
CREATE POLICY "daily_quotes_insert" ON daily_quotes FOR INSERT WITH CHECK (true);

-- Shop items (public read)
CREATE POLICY "shop_items_read" ON shop_items FOR SELECT USING (true);

-- User inventory
CREATE POLICY "user_inventory_all" ON user_inventory FOR ALL USING (auth.uid() = user_id);

-- Outfit ratings
CREATE POLICY "outfit_ratings_all" ON outfit_ratings FOR ALL USING (auth.uid() = user_id);

-- XP ledger
CREATE POLICY "xp_ledger_all" ON xp_ledger FOR ALL USING (auth.uid() = user_id);

-- Apply policies to any other user_id tables that exist
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'user_id' 
    AND table_schema = 'public'
    AND table_name NOT IN ('routines', 'routine_completions', 'user_inventory', 'outfit_ratings', 'xp_ledger')
  LOOP
    BEGIN
      EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (auth.uid() = user_id)',
        tbl || '_user_policy', tbl);
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Policy already exists
    END;
  END LOOP;
END $$;

SELECT 'All fixes applied successfully! Tables, trigger, and RLS policies are set up.' AS status;
