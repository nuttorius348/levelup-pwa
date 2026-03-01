-- =============================================================
-- Seed Shop Items — Themes, Badges, Titles, Avatars, Boosts
-- Run in Supabase SQL Editor after migration
-- =============================================================

-- Clear existing items (safe for fresh setup; remove for prod)
-- DELETE FROM shop_items;

INSERT INTO shop_items (name, description, category, subcategory, icon_url, price_coins, level_required, rarity, is_limited, is_active, metadata) VALUES

-- ─── THEMES ──────────────────────────────────────────────────
('Midnight Purple',   'Deep violet dark theme',           'theme', 'dark',   '🟣', 50,   1,  'common',    false, true, '{"primary":"#7C3AED","bg":"#0F0520"}'),
('Ocean Blue',        'Calm ocean-inspired palette',      'theme', 'dark',   '🔵', 50,   1,  'common',    false, true, '{"primary":"#0EA5E9","bg":"#0A1628"}'),
('Forest Green',      'Nature-inspired green tones',      'theme', 'dark',   '🟢', 75,   3,  'common',    false, true, '{"primary":"#22C55E","bg":"#0A1F0A"}'),
('Sunset Orange',     'Warm sunset gradient vibes',       'theme', 'warm',   '🟠', 100,  5,  'rare',      false, true, '{"primary":"#F97316","bg":"#1A0F05"}'),
('Cherry Blossom',    'Soft pink sakura aesthetic',        'theme', 'light',  '🌸', 150,  8,  'rare',      false, true, '{"primary":"#EC4899","bg":"#1A0510"}'),
('Neon Cyberpunk',    'Bright neon on dark chrome',        'theme', 'neon',   '💜', 250, 15,  'epic',      false, true, '{"primary":"#A855F7","bg":"#0D0D1A","accent":"#06FFA5"}'),
('Golden Luxe',       'Premium gold & black theme',        'theme', 'luxury', '✨', 500, 25,  'legendary', true,  true, '{"primary":"#EAB308","bg":"#0F0D05","accent":"#FDE68A"}'),

-- ─── BADGES ──────────────────────────────────────────────────
('Early Bird',        'Wake up and complete routines before 8am',   'badge', 'achievement', '🌅', 30,   1,  'common',    false, true, '{}'),
('Streak Master',     'Maintain a 7-day streak',                    'badge', 'streak',      '🔥', 50,   3,  'common',    false, true, '{"requiredStreak":7}'),
('Ironclad',          'Complete 30 workouts',                       'badge', 'workout',     '🏋️', 100,  5,  'rare',      false, true, '{"requiredWorkouts":30}'),
('Fashion Icon',      'Get a 9+ outfit rating',                    'badge', 'outfit',      '👔', 150,  8,  'rare',      false, true, '{"requiredRating":9}'),
('Zen Master',        'Complete 50 stretch sessions',               'badge', 'stretch',     '🧘', 120, 10,  'rare',      false, true, '{"requiredSessions":50}'),
('Grind King',        'Reach Level 20',                             'badge', 'level',       '👑', 300, 20,  'epic',      false, true, '{}'),
('Diamond Hands',     'Never miss a day for 30 days',              'badge', 'streak',      '💎', 500, 15,  'legendary', true,  true, '{"requiredStreak":30}'),

-- ─── TITLES ──────────────────────────────────────────────────
('The Determined',    'Show your grit',                    'title', 'mindset',  '💪', 25,   1,  'common',    false, true, '{}'),
('Night Owl',         'For the late-night grinders',       'title', 'time',     '🦉', 40,   2,  'common',    false, true, '{}'),
('Routine Machine',   'Never skips a task',                'title', 'routine',  '⚙️', 75,   5,  'rare',      false, true, '{}'),
('Style Guru',        'Fashion-forward title',             'title', 'outfit',   '🎩', 100,  8,  'rare',      false, true, '{}'),
('XP Farmer',         'Always earning',                    'title', 'xp',       '🌾', 60,   3,  'common',    false, true, '{}'),
('Legend',            'Reached the top',                   'title', 'prestige', '⭐', 400, 25,  'epic',      false, true, '{}'),
('Immortal',          'Beyond legendary',                  'title', 'prestige', '🔮', 750, 40,  'legendary', true,  true, '{}'),

-- ─── AVATARS ─────────────────────────────────────────────────
('Blue Warrior',      'Clean blue avatar frame',           'avatar', 'frame', '🛡️', 40,   1,  'common',    false, true, '{"frameColor":"#3B82F6"}'),
('Green Guardian',    'Nature-themed avatar frame',        'avatar', 'frame', '🌿', 40,   1,  'common',    false, true, '{"frameColor":"#22C55E"}'),
('Fire Ring',         'Burning avatar border',             'avatar', 'frame', '🔥', 100,  5,  'rare',      false, true, '{"frameColor":"#EF4444","animated":true}'),
('Electric Pulse',    'Animated electric border',          'avatar', 'frame', '⚡', 150, 10,  'rare',      false, true, '{"frameColor":"#EAB308","animated":true}'),
('Cosmic Aura',       'Galaxy-themed animated frame',      'avatar', 'frame', '🌌', 300, 20,  'epic',      false, true, '{"frameColor":"#A855F7","animated":true}'),
('Rainbow Halo',      'Legendary rainbow glow effect',     'avatar', 'frame', '🌈', 600, 30,  'legendary', true,  true, '{"animated":true,"rainbow":true}'),

-- ─── BOOSTS ──────────────────────────────────────────────────
('XP Boost (1hr)',     'Earn 1.5x XP for one hour',       'boost', 'xp',      '⚡', 30,   1,  'common',    false, true, '{"xpMultiplier":1.5,"durationMinutes":60}'),
('XP Boost (3hr)',     'Earn 1.5x XP for three hours',    'boost', 'xp',      '⚡', 75,   3,  'common',    false, true, '{"xpMultiplier":1.5,"durationMinutes":180}'),
('Double XP (1hr)',    'Earn 2x XP for one hour',          'boost', 'xp',      '🔥', 100,  5,  'rare',      false, true, '{"xpMultiplier":2.0,"durationMinutes":60}'),
('Coin Magnet (1hr)',  'Earn 2x coins for one hour',       'boost', 'coin',    '🧲', 80,   3,  'rare',      false, true, '{"coinMultiplier":2.0,"durationMinutes":60}'),
('Streak Shield',      'Protects your streak for one day', 'boost', 'streak',  '🛡️', 150,  5,  'epic',      false, true, '{"streakProtection":1}'),
('Mega Boost (3hr)',   'Earn 2x XP + 2x coins',           'boost', 'combo',   '💥', 250, 10,  'epic',      false, true, '{"xpMultiplier":2.0,"coinMultiplier":2.0,"durationMinutes":180}'),
('Ultimate Boost',     '3x XP + 3x coins for one hour',   'boost', 'combo',   '💫', 500, 20,  'legendary', true,  true, '{"xpMultiplier":3.0,"coinMultiplier":3.0,"durationMinutes":60}')

ON CONFLICT DO NOTHING;
