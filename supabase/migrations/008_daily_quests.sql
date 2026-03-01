-- Migration 008: Daily Quest System
-- =====================================================
-- Tables for quest templates and user quest tracking
-- =====================================================

-- Quest templates (reusable quest definitions)
CREATE TABLE IF NOT EXISTS quest_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL, -- 'daily_workouts', 'daily_stretches', 'daily_xp', 'weekly_streak', 'outfit_ratings', 'daily_login'
  target_count INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coin_reward INTEGER NOT NULL DEFAULT 10,
  icon TEXT DEFAULT '🎯',
  reset_frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  difficulty TEXT NOT NULL DEFAULT 'normal', -- 'easy', 'normal', 'hard', 'epic'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User quest instances (assigned quests with progress)
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_template_id UUID NOT NULL REFERENCES quest_templates(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_quest UNIQUE (user_id, quest_template_id, assigned_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_template ON user_quests(quest_template_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_active ON user_quests(user_id, completed, claimed, expires_at);
CREATE INDEX IF NOT EXISTS idx_quest_templates_active ON quest_templates(is_active, reset_frequency);

-- Insert default quest templates
INSERT INTO quest_templates (name, description, quest_type, target_count, xp_reward, coin_reward, icon, difficulty) VALUES
-- Daily Quests (Easy)
('First Workout', 'Complete your first workout of the day', 'daily_workouts', 1, 50, 10, '💪', 'easy'),
('Stretch Break', 'Complete a stretch routine', 'daily_stretches', 1, 30, 5, '🧘', 'easy'),
('Login Streak', 'Log in to LevelUp', 'daily_login', 1, 20, 5, '⭐', 'easy'),

-- Daily Quests (Normal)
('Active Day', 'Complete 3 workouts today', 'daily_workouts', 3, 150, 30, '🔥', 'normal'),
('Flexibility Focus', 'Complete 5 stretches', 'daily_stretches', 5, 100, 20, '🌟', 'normal'),
('XP Hunter', 'Earn 500 XP today', 'daily_xp', 500, 100, 25, '⚡', 'normal'),
('Fashion Check', 'Rate 3 outfits', 'outfit_ratings', 3, 75, 15, '👔', 'normal'),

-- Daily Quests (Hard)
('Beast Mode', 'Complete 5 workouts today', 'daily_workouts', 5, 300, 60, '🦾', 'hard'),
('XP Grinder', 'Earn 1,000 XP today', 'daily_xp', 1000, 250, 50, '💎', 'hard'),
('Master Rater', 'Rate 10 outfits', 'outfit_ratings', 10, 200, 40, '🎨', 'hard'),

-- Weekly Quests (Epic)
('Week Warrior', 'Maintain a 7-day login streak', 'weekly_streak', 7, 500, 100, '🏆', 'epic'),
('Workout Champion', 'Complete 20 workouts this week', 'daily_workouts', 20, 750, 150, '👑', 'epic'),
('XP Legend', 'Earn 5,000 XP this week', 'daily_xp', 5000, 1000, 200, '⚔️', 'epic')
ON CONFLICT DO NOTHING;

-- Function to auto-assign daily quests
CREATE OR REPLACE FUNCTION assign_daily_quests(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  template RECORD;
  quest_expires TIMESTAMPTZ;
BEGIN
  -- Calculate expiration (end of day)
  quest_expires := (CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second')::TIMESTAMPTZ;
  
  -- Assign 3 random daily quests (1 easy, 1 normal, 1 hard)
  FOR template IN (
    SELECT * FROM quest_templates 
    WHERE is_active = true 
      AND reset_frequency = 'daily'
      AND difficulty = 'easy'
    ORDER BY RANDOM()
    LIMIT 1
  ) LOOP
    INSERT INTO user_quests (user_id, quest_template_id, target, expires_at)
    VALUES (target_user_id, template.id, template.target_count, quest_expires)
    ON CONFLICT (user_id, quest_template_id, assigned_at) DO NOTHING;
  END LOOP;
  
  FOR template IN (
    SELECT * FROM quest_templates 
    WHERE is_active = true 
      AND reset_frequency = 'daily'
      AND difficulty = 'normal'
    ORDER BY RANDOM()
    LIMIT 1
  ) LOOP
    INSERT INTO user_quests (user_id, quest_template_id, target, expires_at)
    VALUES (target_user_id, template.id, template.target_count, quest_expires)
    ON CONFLICT (user_id, quest_template_id, assigned_at) DO NOTHING;
  END LOOP;
  
  FOR template IN (
    SELECT * FROM quest_templates 
    WHERE is_active = true 
      AND reset_frequency = 'daily'
      AND difficulty = 'hard'
    ORDER BY RANDOM()
    LIMIT 1
  ) LOOP
    INSERT INTO user_quests (user_id, quest_template_id, target, expires_at)
    VALUES (target_user_id, template.id, template.target_count, quest_expires)
    ON CONFLICT (user_id, quest_template_id, assigned_at) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to increment quest progress
CREATE OR REPLACE FUNCTION increment_quest_progress(
  target_user_id UUID,
  target_quest_type TEXT,
  increment_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_quests uq
  SET progress = LEAST(progress + increment_amount, target),
      completed = (progress + increment_amount) >= target,
      completed_at = CASE 
        WHEN (progress + increment_amount) >= target AND completed = false 
        THEN NOW() 
        ELSE completed_at 
      END
  FROM quest_templates qt
  WHERE uq.quest_template_id = qt.id
    AND uq.user_id = target_user_id
    AND qt.quest_type = target_quest_type
    AND uq.expires_at > NOW()
    AND uq.claimed = false;
END;
$$ LANGUAGE plpgsql;
