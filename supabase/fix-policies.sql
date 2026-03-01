-- =============================================================
-- LevelUp — Fix: Drop all existing policies then recreate
-- Run this in Supabase SQL Editor if the first migration
-- partially failed on policies.
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
-- Recreate RLS policies
-- =============================================================

-- Enable RLS on all tables
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
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;

-- Profiles: allow full read (leaderboard) + own write
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User-owned data tables (CRUD own rows)
CREATE POLICY "xp_ledger_all" ON xp_ledger FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "xp_transactions_all" ON xp_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "daily_xp_caps_all" ON daily_xp_caps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "routines_all" ON routines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "routine_completions_all" ON routine_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "workouts_all" ON workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "workout_templates_all" ON workout_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "workout_logs_all" ON workout_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "workout_personal_records_all" ON workout_personal_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "workout_overload_history_all" ON workout_overload_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "stretch_sessions_all" ON stretch_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "stretch_progression_all" ON stretch_progression FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "outfit_ratings_all" ON outfit_ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "calendar_events_all" ON calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_inventory_all" ON user_inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_purchases_all" ON user_purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "push_subscriptions_all" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "checklist_tasks_all" ON checklist_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "quote_reads_all" ON quote_reads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "quotes_all" ON quotes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "active_boosts_all" ON active_boosts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "login_calendar_all" ON login_calendar FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "comeback_bonuses_all" ON comeback_bonuses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_quests_all" ON user_quests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_rewards_all" ON user_rewards FOR ALL USING (auth.uid() = user_id);

-- Routine items: allow if user owns parent routine
CREATE POLICY "routine_items_select" ON routine_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "routine_items_all" ON routine_items FOR ALL
  USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()));

-- Public read for reference tables
CREATE POLICY "levels_read" ON levels FOR SELECT USING (true);
CREATE POLICY "rewards_read" ON rewards FOR SELECT USING (true);
CREATE POLICY "shop_items_read" ON shop_items FOR SELECT USING (true);
CREATE POLICY "quest_templates_read" ON quest_templates FOR SELECT USING (true);
CREATE POLICY "daily_quotes_read" ON daily_quotes FOR SELECT USING (true);

-- Seed quest templates if empty
INSERT INTO quest_templates (name, description, quest_type, target_count, xp_reward, coin_reward, icon, reset_frequency, difficulty)
SELECT * FROM (VALUES
  ('Daily Warrior', 'Complete 3 workouts', 'daily_workouts', 3, 75, 15, '💪', 'daily', 'normal'),
  ('Stretch Master', 'Complete 2 stretch sessions', 'daily_stretches', 2, 50, 10, '🧘', 'daily', 'easy'),
  ('XP Hunter', 'Earn 200 XP today', 'daily_xp', 200, 100, 20, '⭐', 'daily', 'hard'),
  ('Streak Builder', 'Maintain a 7-day streak', 'weekly_streak', 7, 150, 30, '🔥', 'weekly', 'epic'),
  ('Fashion Forward', 'Get 3 outfit ratings', 'outfit_ratings', 3, 60, 12, '👔', 'daily', 'normal'),
  ('Consistent', 'Log in every day this week', 'daily_login', 7, 100, 25, '📅', 'weekly', 'normal')
) AS t(name, description, quest_type, target_count, xp_reward, coin_reward, icon, reset_frequency, difficulty)
WHERE NOT EXISTS (SELECT 1 FROM quest_templates LIMIT 1);

SELECT 'Policies fixed! All RLS policies recreated successfully.' AS status;
