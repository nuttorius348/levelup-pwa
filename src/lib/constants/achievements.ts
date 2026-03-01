// =============================================================
// Achievement Catalog — Unlockable milestones
// =============================================================
//
// DESIGN: Achievements serve three psychological purposes:
//  1. DISCOVERY — hidden achievements reward exploration
//  2. GOAL-SETTING — visible ones give players clear targets
//  3. IDENTITY — badges from achievements let users signal
//     "I'm a streak person" vs "I'm a gym person"
//
// XP rewards are intentionally LARGE for achievements to create
// "burst moments" that feel like a jackpot — breaking the
// steady drip of daily XP with an unexpected spike.
// =============================================================

export interface AchievementDef {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'routines' | 'workouts' | 'streaks' | 'style' | 'wellness' | 'special';
  xpReward: number;
  coinReward: number;
  requirement: { type: string; value: number };
  isHidden: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── STREAKS ─────────────────────────────────────────────────
  { slug: 'streak-3',    name: 'Spark',            description: '3-day streak',                icon: '🌒', category: 'streaks',   xpReward: 50,     coinReward: 25,    requirement: { type: 'streak', value: 3 },    isHidden: false },
  { slug: 'streak-7',    name: 'Week Warrior',     description: '7-day streak',                icon: '🔥', category: 'streaks',   xpReward: 150,    coinReward: 75,    requirement: { type: 'streak', value: 7 },    isHidden: false },
  { slug: 'streak-14',   name: 'Two-Week Titan',   description: '14-day streak',               icon: '⚡', category: 'streaks',   xpReward: 300,    coinReward: 150,   requirement: { type: 'streak', value: 14 },   isHidden: false },
  { slug: 'streak-30',   name: 'Monthly Machine',  description: '30-day streak',               icon: '🤖', category: 'streaks',   xpReward: 750,    coinReward: 400,   requirement: { type: 'streak', value: 30 },   isHidden: false },
  { slug: 'streak-60',   name: 'Diamond Hands',    description: '60-day streak',               icon: '💎', category: 'streaks',   xpReward: 1500,   coinReward: 800,   requirement: { type: 'streak', value: 60 },   isHidden: false },
  { slug: 'streak-100',  name: 'Centurion',        description: '100-day streak',              icon: '👑', category: 'streaks',   xpReward: 5000,   coinReward: 2500,  requirement: { type: 'streak', value: 100 },  isHidden: false },
  { slug: 'streak-365',  name: 'Legendary',        description: '365-day streak',              icon: '🏆', category: 'streaks',   xpReward: 15000,  coinReward: 10000, requirement: { type: 'streak', value: 365 },  isHidden: true },

  // ── ROUTINES ────────────────────────────────────────────────
  { slug: 'routine-1',     name: 'First Habit',      description: 'Complete your first routine item',  icon: '✅', category: 'routines', xpReward: 25,     coinReward: 10,    requirement: { type: 'routine_items', value: 1 },    isHidden: false },
  { slug: 'routine-10',    name: 'Getting Hooked',   description: 'Complete 10 routine items',         icon: '📋', category: 'routines', xpReward: 75,     coinReward: 40,    requirement: { type: 'routine_items', value: 10 },   isHidden: false },
  { slug: 'routine-50',    name: 'Creature of Habit',description: 'Complete 50 routine items',         icon: '🧠', category: 'routines', xpReward: 200,    coinReward: 100,   requirement: { type: 'routine_items', value: 50 },   isHidden: false },
  { slug: 'routine-100',   name: 'Habit Builder',    description: 'Complete 100 routine items',        icon: '🏗️', category: 'routines', xpReward: 500,    coinReward: 250,   requirement: { type: 'routine_items', value: 100 },  isHidden: false },
  { slug: 'routine-500',   name: 'Routine Master',   description: 'Complete 500 routine items',        icon: '⭐', category: 'routines', xpReward: 2000,   coinReward: 1000,  requirement: { type: 'routine_items', value: 500 },  isHidden: false },
  { slug: 'routine-full-7',name: 'Perfect Week',     description: 'Full routines for 7 days straight', icon: '🗓️', category: 'routines', xpReward: 350,    coinReward: 175,   requirement: { type: 'full_routines_consecutive', value: 7 }, isHidden: false },

  // ── WORKOUTS ────────────────────────────────────────────────
  { slug: 'workout-1',     name: 'First Pump',       description: 'Log your first workout',            icon: '💪', category: 'workouts', xpReward: 50,     coinReward: 25,    requirement: { type: 'workouts_logged', value: 1 },   isHidden: false },
  { slug: 'workout-10',    name: 'Gym Regular',      description: 'Log 10 workouts',                   icon: '🏃', category: 'workouts', xpReward: 200,    coinReward: 100,   requirement: { type: 'workouts_logged', value: 10 },  isHidden: false },
  { slug: 'workout-25',    name: 'Iron Regular',     description: 'Log 25 workouts',                   icon: '🏋️', category: 'workouts', xpReward: 500,    coinReward: 250,   requirement: { type: 'workouts_logged', value: 25 },  isHidden: false },
  { slug: 'workout-100',   name: 'Gym Rat',          description: 'Log 100 workouts',                  icon: '🦾', category: 'workouts', xpReward: 2000,   coinReward: 1000,  requirement: { type: 'workouts_logged', value: 100 }, isHidden: false },
  { slug: 'workout-adv-10',name: 'Beast Mode',       description: '10 advanced workouts',              icon: '🔱', category: 'workouts', xpReward: 750,    coinReward: 400,   requirement: { type: 'advanced_workouts', value: 10 }, isHidden: false },
  { slug: 'workout-hour',  name: 'Marathon Session',  description: 'Single workout over 60 minutes',   icon: '⏱️', category: 'workouts', xpReward: 100,    coinReward: 50,    requirement: { type: 'workout_duration_min', value: 60 }, isHidden: false },

  // ── STYLE (outfit rating) ───────────────────────────────────
  { slug: 'outfit-1',      name: 'Style Check',      description: 'Get your first outfit rated',       icon: '👔', category: 'style',    xpReward: 25,     coinReward: 10,    requirement: { type: 'outfits_rated', value: 1 },     isHidden: false },
  { slug: 'outfit-10',     name: 'Fashion Forward',  description: '10 outfits rated',                  icon: '👗', category: 'style',    xpReward: 200,    coinReward: 100,   requirement: { type: 'outfits_rated', value: 10 },    isHidden: false },
  { slug: 'outfit-10-score',name: 'Drip God',        description: 'Score a perfect 10',                icon: '💧', category: 'style',    xpReward: 500,    coinReward: 250,   requirement: { type: 'outfit_score', value: 10 },     isHidden: true },
  { slug: 'outfit-improve-5',name: 'Glow Up',        description: 'Improve your score 5 times',        icon: '📈', category: 'style',    xpReward: 300,    coinReward: 150,   requirement: { type: 'outfit_improvements', value: 5 }, isHidden: false },

  // ── WELLNESS (stretch) ──────────────────────────────────────
  { slug: 'stretch-1',     name: 'Limber Up',        description: 'Complete your first stretch',       icon: '🧘', category: 'wellness', xpReward: 25,     coinReward: 10,    requirement: { type: 'stretches_completed', value: 1 }, isHidden: false },
  { slug: 'stretch-30',    name: 'Flexy',            description: '30 stretch sessions',               icon: '🤸', category: 'wellness', xpReward: 500,    coinReward: 250,   requirement: { type: 'stretches_completed', value: 30 }, isHidden: false },
  { slug: 'stretch-morning-7', name: 'Rise & Shine', description: '7 morning stretches',               icon: '🌅', category: 'wellness', xpReward: 200,    coinReward: 100,   requirement: { type: 'morning_stretches', value: 7 }, isHidden: false },

  // ── SPECIAL ─────────────────────────────────────────────────
  { slug: 'level-10',      name: 'Double Digits',    description: 'Reach level 10',                    icon: '🔟', category: 'special',  xpReward: 250,    coinReward: 125,   requirement: { type: 'level', value: 10 },    isHidden: false },
  { slug: 'level-25',      name: 'Quarter Century',  description: 'Reach level 25',                    icon: '🏅', category: 'special',  xpReward: 750,    coinReward: 400,   requirement: { type: 'level', value: 25 },    isHidden: false },
  { slug: 'level-50',      name: 'Half Century',     description: 'Reach level 50',                    icon: '5️⃣',  category: 'special',  xpReward: 2500,   coinReward: 1250,  requirement: { type: 'level', value: 50 },    isHidden: false },
  { slug: 'level-100',     name: 'Max Level',        description: 'Reach level 100',                   icon: '💯', category: 'special',  xpReward: 10000,  coinReward: 5000,  requirement: { type: 'level', value: 100 },   isHidden: true },
  { slug: 'all-features',  name: 'Renaissance',      description: 'Use every feature in one day',      icon: '🎭', category: 'special',  xpReward: 500,    coinReward: 250,   requirement: { type: 'features_used_daily', value: 6 }, isHidden: true },
  { slug: 'first-purchase', name: 'Big Spender',     description: 'Buy your first shop item',          icon: '🛍️', category: 'special',  xpReward: 50,     coinReward: 0,     requirement: { type: 'purchases', value: 1 }, isHidden: false },
];
