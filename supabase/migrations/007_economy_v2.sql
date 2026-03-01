-- =============================================================
-- Migration 007: Economy v2 — Active boosts, daily login rewards,
-- login calendar, cosmetic equip tracking, theme unlocks
-- =============================================================

-- ============================================================
-- ACTIVE BOOSTS (power-ups with expiry)
-- ============================================================
-- When a user activates a boost item, create a row here.
-- The XP engine checks this table before applying multipliers.
-- Expired boosts are left in place for history (soft-expire via expires_at).

CREATE TABLE IF NOT EXISTS public.active_boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('xp_multiplier', 'coin_multiplier', 'streak_shield')),
  multiplier NUMERIC(4,2) DEFAULT 1.0,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_consumed BOOLEAN DEFAULT false,    -- For one-shot boosts like streak shield
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_active_boosts_user_active ON public.active_boosts(user_id, expires_at)
  WHERE is_consumed = false;
CREATE INDEX idx_active_boosts_type ON public.active_boosts(user_id, boost_type, expires_at);

-- RLS
ALTER TABLE public.active_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active Boosts: self read" ON public.active_boosts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Active Boosts: self insert" ON public.active_boosts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DAILY LOGIN CALENDAR (retention hook)
-- ============================================================
-- Tracks each day the user opened the app.
-- Consecutive-day bonuses ramp up through a 7-day cycle.
-- After Day 7, cycle resets with higher rewards.

CREATE TABLE IF NOT EXISTS public.login_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_in_cycle SMALLINT NOT NULL DEFAULT 1,     -- 1-7 within the reward cycle
  cycle_number SMALLINT NOT NULL DEFAULT 1,     -- Which cycle (1, 2, 3...)
  coins_awarded INTEGER NOT NULL DEFAULT 0,
  bonus_item_slug TEXT,                          -- Optional bonus item on Day 7
  claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, login_date)
);

CREATE INDEX idx_login_calendar_user_date ON public.login_calendar(user_id, login_date DESC);

-- RLS
ALTER TABLE public.login_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Login Calendar: self read" ON public.login_calendar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Login Calendar: self insert" ON public.login_calendar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Login Calendar: self update" ON public.login_calendar FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- COMEBACK BONUSES (win-back retention)
-- ============================================================
-- If a user was inactive for 3+ days and returns, they get a
-- comeback bonus that scales with absence (up to a cap).

CREATE TABLE IF NOT EXISTS public.comeback_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  days_absent INTEGER NOT NULL,
  coins_awarded INTEGER NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  boost_hours INTEGER DEFAULT 0,                  -- Optional free XP boost duration
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comeback_user ON public.comeback_bonuses(user_id, claimed_at DESC);

-- RLS
ALTER TABLE public.comeback_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comeback: self read" ON public.comeback_bonuses FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- EQUIPPED COSMETICS VIEW (denormalized for fast reads)
-- ============================================================
-- One equipped item per category per user.
-- Uses the existing user_rewards table's is_equipped column.
-- This function returns the user's equipped loadout.

CREATE OR REPLACE FUNCTION public.get_equipped_cosmetics(p_user_id UUID)
RETURNS TABLE (
  category TEXT,
  reward_id UUID,
  reward_name TEXT,
  icon TEXT,
  effects JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.category, r.id, r.name, r.icon, r.effects
  FROM public.user_rewards ur
  JOIN public.rewards r ON r.id = ur.reward_id
  WHERE ur.user_id = p_user_id AND ur.is_equipped = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- HELPER: Get active boost multiplier for a user
-- ============================================================
-- Returns the highest active XP multiplier for a user.
-- Called by the XP engine before granting XP.

CREATE OR REPLACE FUNCTION public.get_active_boost_multiplier(
  p_user_id UUID,
  p_boost_type TEXT DEFAULT 'xp_multiplier'
)
RETURNS NUMERIC AS $$
DECLARE
  max_mult NUMERIC;
BEGIN
  SELECT COALESCE(MAX(multiplier), 1.0)
  INTO max_mult
  FROM public.active_boosts
  WHERE user_id = p_user_id
    AND boost_type = p_boost_type
    AND expires_at > NOW()
    AND is_consumed = false;
  RETURN max_mult;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- HELPER: Check if user has active streak shield
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_streak_shield(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.active_boosts
    WHERE user_id = p_user_id
      AND boost_type = 'streak_shield'
      AND is_consumed = false
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- HELPER: Consume streak shield (mark as used)
-- ============================================================

CREATE OR REPLACE FUNCTION public.consume_streak_shield(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  shield_id UUID;
BEGIN
  SELECT id INTO shield_id
  FROM public.active_boosts
  WHERE user_id = p_user_id
    AND boost_type = 'streak_shield'
    AND is_consumed = false
    AND expires_at > NOW()
  ORDER BY expires_at ASC
  LIMIT 1;

  IF shield_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.active_boosts SET is_consumed = true WHERE id = shield_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HELPER: Increment user coins
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_coins(
  user_id_input UUID,
  amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET coins = GREATEST(0, coins + amount)
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HELPER: Award XP (simple wrapper, use XP engine for full flow)
-- ============================================================
-- This is a simplified version for comeback bonuses.
-- For full XP flow with multipliers/caps/etc, use the grantXP() service.

CREATE OR REPLACE FUNCTION public.award_xp(
  user_id_input UUID,
  amount INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_total BIGINT;
  new_total BIGINT;
  new_level INTEGER;
BEGIN
  SELECT total_xp INTO current_total
  FROM public.users
  WHERE id = user_id_input;

  new_total := current_total + amount;

  -- Simple level calculation (floor of 100 * level^1.5)
  -- For level 1: 100, level 2: 282, level 3: 519...
  -- We reverse it: level = floor((total_xp / 100)^(1/1.5))
  new_level := FLOOR(POWER(new_total / 100.0, 1.0 / 1.5));
  new_level := GREATEST(1, LEAST(100, new_level));

  UPDATE public.users
  SET total_xp = new_total,
      level = new_level
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED: Insert shop items into rewards table
-- ============================================================
-- Idempotent: uses ON CONFLICT on name + category combo.
-- (We add a unique constraint first)

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rewards_name_category_unique'
  ) THEN
    ALTER TABLE public.rewards ADD CONSTRAINT rewards_name_category_unique UNIQUE (name, category);
  END IF;
END $$;

-- Badges
INSERT INTO public.rewards (name, description, category, icon, cost_coins, cost_level, rarity, sort_order, effects)
VALUES
  ('First Step',    'Started the journey',         'badge', '🐣', 25,    1,  'common',    10,  '{}'),
  ('Early Bird',    'Stretch before 9 AM pro',     'badge', '🌅', 50,    3,  'common',    20,  '{}'),
  ('Iron Will',     'Logged 10 workouts',          'badge', '🏋️', 100,   5,  'common',    30,  '{}'),
  ('Week Warrior',  '7-day streak survivor',       'badge', '🔥', 150,   5,  'rare',      40,  '{}'),
  ('Fashionista',   'Scored 8+ on an outfit',      'badge', '👗', 200,   10, 'rare',      50,  '{}'),
  ('Centurion',     '100-day streak achieved',     'badge', '👑', 2000,  30, 'legendary', 60,  '{}')
ON CONFLICT (name, category) DO NOTHING;

-- Avatars
INSERT INTO public.rewards (name, description, category, icon, cost_coins, cost_level, rarity, sort_order, effects)
VALUES
  ('Flame Ring',    'Fiery profile border',        'avatar', '🔥', 200,  5,  'common',    10, '{"border": "flame"}'),
  ('Neon Glow',     'Glowing neon outline',        'avatar', '💜', 500,  15, 'rare',      20, '{"border": "neon"}'),
  ('Gold Frame',    'Prestige gold border',        'avatar', '✨', 1500, 30, 'epic',      30, '{"border": "gold"}'),
  ('Diamond Frame', 'Top-tier crystalline frame',  'avatar', '💎', 5000, 50, 'legendary', 40, '{"border": "diamond"}'),
  ('Hologram',      'Animated holographic avatar', 'avatar', '🌈', 8000, 75, 'legendary', 50, '{"border": "hologram", "animated": true}')
ON CONFLICT (name, category) DO NOTHING;

-- Themes
INSERT INTO public.rewards (name, description, category, icon, cost_coins, cost_level, rarity, sort_order, effects)
VALUES
  ('Midnight',  'Deep blue-black tones',       'theme', '🌑', 300,  5,  'common',    10, '{"themeSlug": "midnight"}'),
  ('Forest',    'Rich green nature theme',     'theme', '🌲', 300,  5,  'common',    20, '{"themeSlug": "forest"}'),
  ('Sunset',    'Warm orange-pink gradient',   'theme', '🌅', 500,  10, 'rare',      30, '{"themeSlug": "sunset"}'),
  ('Cyberpunk', 'Neon purple + electric blue', 'theme', '🌆', 1000, 20, 'epic',      40, '{"themeSlug": "cyberpunk"}'),
  ('Aurora',    'Northern lights shimmer',     'theme', '🌌', 3000, 40, 'legendary', 50, '{"themeSlug": "aurora"}')
ON CONFLICT (name, category) DO NOTHING;

-- Titles
INSERT INTO public.rewards (name, description, category, icon, cost_coins, cost_level, rarity, sort_order, effects)
VALUES
  ('"The Grinder"',   'Show off your hustle',     'title', '⚙️', 100,   5,   'common',    10, '{}'),
  ('"Beast Mode"',    'Gym culture title',        'title', '🦁', 300,   15,  'rare',      20, '{}'),
  ('"Drip Lord"',     'Fashion game strong',      'title', '💧', 500,   20,  'rare',      30, '{}'),
  ('"Zen Master"',    'Stretch & calm excellence','title', '🧘', 500,   20,  'rare',      40, '{}'),
  ('"Living Legend"',  'For level 100 achievers', 'title', '🏆', 10000, 100, 'legendary', 50, '{}')
ON CONFLICT (name, category) DO NOTHING;

-- Boosts
INSERT INTO public.rewards (name, description, category, icon, cost_coins, cost_level, rarity, sort_order, effects, is_limited_edition)
VALUES
  ('XP Surge (1hr)',       '1.5× XP for 1 hour',        'boost', '⚡', 150,  5,  'common', 10, '{"xpMultiplier": 1.5, "durationMinutes": 60}',   false),
  ('XP Blitz (24hr)',      '1.25× XP for 24 hours',     'boost', '🔋', 400,  10, 'rare',   20, '{"xpMultiplier": 1.25, "durationMinutes": 1440}', false),
  ('Gold Rush (1hr)',      '2× coins for 1 hour',        'boost', '🪙', 200,  10, 'common', 30, '{"coinMultiplier": 2.0, "durationMinutes": 60}',  false),
  ('Streak Shield',        'Protect streak for 1 miss',  'boost', '🛡️', 750,  15, 'epic',   40, '{"streakProtection": 1}',                        false),
  ('Double XP Weekend',    '2× XP for 48 hours',         'boost', '🎆', 2000, 25, 'epic',   50, '{"xpMultiplier": 2.0, "durationMinutes": 2880}',  true)
ON CONFLICT (name, category) DO NOTHING;
