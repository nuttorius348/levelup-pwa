-- ============================================================
-- Daily Quotes System — Cache + Read Tracking
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. DAILY QUOTE CACHE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- One row per day — AI-generated motivational quote.
-- Rotates automatically at midnight (date changes).
-- Public read access for iPhone widgets.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE public.daily_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Date key (UNIQUE — only one quote per day)
  quote_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  
  -- Quote content (from AI)
  quote_text TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('underdog-boxing', 'comeback-narrative', 'discipline-resilience')),
  tone TEXT NOT NULL CHECK (tone IN ('gritty', 'reflective', 'stoic', 'intense', 'calm', 'dramatic')),
  attribution TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  follow_up TEXT,
  
  -- AI metadata
  ai_provider TEXT NOT NULL CHECK (ai_provider IN ('openai', 'anthropic', 'google')),
  fallback_used BOOLEAN DEFAULT false,
  generation_latency_ms INTEGER,
  
  -- Stats
  total_reads INTEGER NOT NULL DEFAULT 0,
  unique_readers INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_daily_quotes_date ON public.daily_quotes(quote_date DESC);

-- Auto-update updated_at
CREATE TRIGGER daily_quotes_updated_at
  BEFORE UPDATE ON public.daily_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Row-level security (PUBLIC READ for widgets)
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily quotes are publicly readable"
  ON public.daily_quotes
  FOR SELECT
  USING (true);

CREATE POLICY "Only service can insert daily quotes"
  ON public.daily_quotes
  FOR INSERT
  WITH CHECK (false);  -- Only service role can insert

CREATE POLICY "Only service can update daily quotes"
  ON public.daily_quotes
  FOR UPDATE
  USING (false);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. QUOTE READ TRACKING
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- Tracks when users view quotes.
-- UNIQUE(user_id, quote_date) prevents duplicate XP grants.
-- Morning reads (before 9 AM) get bonus XP.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE public.quote_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quote_date DATE NOT NULL,
  
  -- Read metadata
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_morning_read BOOLEAN GENERATED ALWAYS AS (
    EXTRACT(HOUR FROM read_at AT TIME ZONE 'America/New_York') < 9
  ) STORED,
  
  -- XP granted
  xp_earned INTEGER NOT NULL DEFAULT 0,
  morning_bonus_earned INTEGER NOT NULL DEFAULT 0,
  
  -- Device context (for widget analytics)
  source TEXT CHECK (source IN ('web', 'widget', 'share')),
  
  -- UNIQUE constraint prevents duplicate XP
  UNIQUE(user_id, quote_date)
);

-- Indexes
CREATE INDEX idx_quote_reads_user_date ON public.quote_reads(user_id, quote_date DESC);
CREATE INDEX idx_quote_reads_date ON public.quote_reads(quote_date DESC);
CREATE INDEX idx_quote_reads_morning ON public.quote_reads(is_morning_read) WHERE is_morning_read = true;

-- Row-level security
ALTER TABLE public.quote_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quote reads"
  ON public.quote_reads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quote reads"
  ON public.quote_reads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. ADD NEW XP ACTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Update XP action enum to include quote reading
ALTER TYPE public.xp_action_type ADD VALUE IF NOT EXISTS 'quote_read';
ALTER TYPE public.xp_action_type ADD VALUE IF NOT EXISTS 'quote_morning_bonus';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. INCREMENT READ COUNTERS (TRIGGER)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.increment_daily_quote_reads()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment total reads (every read)
  UPDATE public.daily_quotes
  SET 
    total_reads = total_reads + 1,
    unique_readers = unique_readers + 1
  WHERE quote_date = NEW.quote_date;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_quote_read
  AFTER INSERT ON public.quote_reads
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_daily_quote_reads();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. HELPER FUNCTION: Get Today's Quote (with fallback)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMENT ON TABLE public.daily_quotes IS 'AI-generated daily motivational quotes, one per day. Public read access for widgets.';
COMMENT ON TABLE public.quote_reads IS 'Tracks when users read daily quotes. UNIQUE(user_id, quote_date) prevents duplicate XP.';
