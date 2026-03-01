-- =============================================================
-- Seed Shop Items — Themes, Badges, Titles, Avatars, Boosts
-- Run in Supabase SQL Editor after migration
-- =============================================================

-- Clear existing items (safe for fresh setup; remove for prod)
-- DELETE FROM shop_items;

INSERT INTO shop_items (name, description, category, subcategory, icon_url, price_coins, level_required, is_limited, is_active, metadata) VALUES

-- ─── THEMES ──────────────────────────────────────────────────
('Midnight Purple',   'Deep violet dark theme',           'theme', 'dark',   '🟣', 50,   1,  false, true, '{"primary":"#7C3AED","bg":"#0F0520","rarity":"common"}'),
('Ocean Blue',        'Calm ocean-inspired palette',      'theme', 'dark',   '🔵', 50,   1,  false, true, '{"primary":"#0EA5E9","bg":"#0A1628","rarity":"common"}'),
('Forest Green',      'Nature-inspired green tones',      'theme', 'dark',   '🟢', 75,   3,  false, true, '{"primary":"#22C55E","bg":"#0A1F0A","rarity":"common"}'),
('Sunset Orange',     'Warm sunset gradient vibes',       'theme', 'warm',   '🟠', 100,  5,  false, true, '{"primary":"#F97316","bg":"#1A0F05","rarity":"rare"}'),
('Cherry Blossom',    'Soft pink sakura aesthetic',        'theme', 'light',  '🌸', 150,  8,  false, true, '{"primary":"#EC4899","bg":"#1A0510","rarity":"rare"}'),
('Neon Cyberpunk',    'Bright neon on dark chrome',        'theme', 'neon',   '💜', 250, 15,  false, true, '{"primary":"#A855F7","bg":"#0D0D1A","accent":"#06FFA5","rarity":"epic"}'),
('Golden Luxe',       'Premium gold & black theme',        'theme', 'luxury', '✨', 500, 25,  true,  true, '{"primary":"#EAB308","bg":"#0F0D05","accent":"#FDE68A","rarity":"legendary"}'),

-- ─── BADGES ──────────────────────────────────────────────────
('Early Bird',        'Wake up and complete routines before 8am',   'badge', 'achievement', '🌅', 30,   1,  false, true, '{"rarity":"common"}'),
('Streak Master',     'Maintain a 7-day streak',                    'badge', 'streak',      '🔥', 50,   3,  false, true, '{"requiredStreak":7,"rarity":"common"}'),
('Ironclad',          'Complete 30 workouts',                       'badge', 'workout',     '🏋️', 100,  5,  false, true, '{"requiredWorkouts":30,"rarity":"rare"}'),
('Fashion Icon',      'Get a 9+ outfit rating',                    'badge', 'outfit',      '👔', 150,  8,  false, true, '{"requiredRating":9,"rarity":"rare"}'),
('Zen Master',        'Complete 50 stretch sessions',               'badge', 'stretch',     '🧘', 120, 10,  false, true, '{"requiredSessions":50,"rarity":"rare"}'),
('Grind King',        'Reach Level 20',                             'badge', 'level',       '👑', 300, 20,  false, true, '{"rarity":"epic"}'),
('Diamond Hands',     'Never miss a day for 30 days',              'badge', 'streak',      '💎', 500, 15,  true,  true, '{"requiredStreak":30,"rarity":"legendary"}'),

-- ─── TITLES ──────────────────────────────────────────────────
('The Determined',    'Show your grit',                    'title', 'mindset',  '💪', 25,   1,  false, true, '{"rarity":"common"}'),
('Night Owl',         'For the late-night grinders',       'title', 'time',     '🦉', 40,   2,  false, true, '{"rarity":"common"}'),
('Routine Machine',   'Never skips a task',                'title', 'routine',  '⚙️', 75,   5,  false, true, '{"rarity":"rare"}'),
('Style Guru',        'Fashion-forward title',             'title', 'outfit',   '🎩', 100,  8,  false, true, '{"rarity":"rare"}'),
('XP Farmer',         'Always earning',                    'title', 'xp',       '🌾', 60,   3,  false, true, '{"rarity":"common"}'),
('Legend',            'Reached the top',                   'title', 'prestige', '⭐', 400, 25,  false, true, '{"rarity":"epic"}'),
('Immortal',          'Beyond legendary',                  'title', 'prestige', '🔮', 750, 40,  true,  true, '{"rarity":"legendary"}'),

-- ─── AVATARS ─────────────────────────────────────────────────
('Blue Warrior',      'Clean blue avatar frame',           'avatar', 'frame', '🛡️', 40,   1,  false, true, '{"frameColor":"#3B82F6","rarity":"common"}'),
('Green Guardian',    'Nature-themed avatar frame',        'avatar', 'frame', '🌿', 40,   1,  false, true, '{"frameColor":"#22C55E","rarity":"common"}'),
('Fire Ring',         'Burning avatar border',             'avatar', 'frame', '🔥', 100,  5,  false, true, '{"frameColor":"#EF4444","animated":true,"rarity":"rare"}'),
('Electric Pulse',    'Animated electric border',          'avatar', 'frame', '⚡', 150, 10,  false, true, '{"frameColor":"#EAB308","animated":true,"rarity":"rare"}'),
('Cosmic Aura',       'Galaxy-themed animated frame',      'avatar', 'frame', '🌌', 300, 20,  false, true, '{"frameColor":"#A855F7","animated":true,"rarity":"epic"}'),
('Rainbow Halo',      'Legendary rainbow glow effect',     'avatar', 'frame', '🌈', 600, 30,  true,  true, '{"animated":true,"rainbow":true,"rarity":"legendary"}'),

-- ─── BOOSTS ──────────────────────────────────────────────────
('XP Boost (1hr)',     'Earn 1.5x XP for one hour',       'boost', 'xp',      '⚡', 30,   1,  false, true, '{"xpMultiplier":1.5,"durationMinutes":60,"rarity":"common"}'),
('XP Boost (3hr)',     'Earn 1.5x XP for three hours',    'boost', 'xp',      '⚡', 75,   3,  false, true, '{"xpMultiplier":1.5,"durationMinutes":180,"rarity":"common"}'),
('Double XP (1hr)',    'Earn 2x XP for one hour',          'boost', 'xp',      '🔥', 100,  5,  false, true, '{"xpMultiplier":2.0,"durationMinutes":60,"rarity":"rare"}'),
('Coin Magnet (1hr)',  'Earn 2x coins for one hour',       'boost', 'coin',    '🧲', 80,   3,  false, true, '{"coinMultiplier":2.0,"durationMinutes":60,"rarity":"rare"}'),
('Streak Shield',      'Protects your streak for one day', 'boost', 'streak',  '🛡️', 150,  5,  false, true, '{"streakProtection":1,"rarity":"epic"}'),
('Mega Boost (3hr)',   'Earn 2x XP + 2x coins',           'boost', 'combo',   '💥', 250, 10,  false, true, '{"xpMultiplier":2.0,"coinMultiplier":2.0,"durationMinutes":180,"rarity":"epic"}'),
('Ultimate Boost',     '3x XP + 3x coins for one hour',   'boost', 'combo',   '💫', 500, 20,  true,  true, '{"xpMultiplier":3.0,"coinMultiplier":3.0,"durationMinutes":60,"rarity":"legendary"}')

ON CONFLICT DO NOTHING;
