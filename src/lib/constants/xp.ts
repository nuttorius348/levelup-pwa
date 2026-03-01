// =============================================================
// XP Economy Constants — The single source of truth
// =============================================================
//
// DESIGN GOALS
// ────────────
// • A "perfect day" (all actions, no streak) yields ~320 base XP
// • With a 90-day streak (2.0×) that doubles to ~640 XP/day
// • Level 10 takes ~2 weeks of engaged play (hook period)
// • Level 50 takes ~6 months (long-term retention)
// • Level 100 takes ~14–18 months (prestige / whale territory)
// • Daily caps prevent binge-grinding; cooldowns prevent spam
// • Coins accumulate slowly so the shop always has something to save for
//
// FORMULAS AT A GLANCE
// ────────────────────
// Final XP   = (baseXP + bonusXP) × streakMultiplier
// Coins      = floor(finalXP / COINS_PER_XP)
// Level N XP = floor(BASE_XP_PER_LEVEL × N ^ LEVEL_EXPONENT)
// Streak ×   = tier lookup (step function, not linear)
// =============================================================

import type {
  XPActionType,
  XPActionConfig,
  OutfitScoreTier,
  StreakTier,
} from '@/types/xp';

// ── 1. ACTION DEFINITIONS ─────────────────────────────────────

export const XP_ACTIONS: Record<XPActionType, XPActionConfig> = {
  // ▸ ROUTINES ──────────────────────────────────────────────────
  routine_task: {
    action: 'routine_task',
    baseXP: 15,
    dailyCap: 225,           // 15 tasks max before cap (15 × 15)
    streakEligible: true,
    cooldownMinutes: 0,
    description: 'Complete a routine checklist item',
  },
  routine_full: {
    action: 'routine_full',
    baseXP: 75,
    dailyCap: 150,           // 2 full routines per day
    streakEligible: true,
    cooldownMinutes: 0,
    description: 'Complete every item in a routine',
  },

  // ▸ WORKOUTS (difficulty-scaled) ──────────────────────────────
  workout_beginner: {
    action: 'workout_beginner',
    baseXP: 25,
    dailyCap: 250,
    streakEligible: true,
    cooldownMinutes: 30,     // Can't spam workouts faster than 30 min
    description: 'Log a beginner workout',
  },
  workout_intermediate: {
    action: 'workout_intermediate',
    baseXP: 50,
    dailyCap: 250,
    streakEligible: true,
    cooldownMinutes: 30,
    description: 'Log an intermediate workout',
  },
  workout_advanced: {
    action: 'workout_advanced',
    baseXP: 100,
    dailyCap: 250,
    streakEligible: true,
    cooldownMinutes: 30,
    description: 'Log an advanced workout',
  },
  workout_duration_bonus: {
    action: 'workout_duration_bonus',
    baseXP: 1,              // 1 XP per minute
    dailyCap: 60,            // Max 60 bonus from duration
    streakEligible: false,
    cooldownMinutes: 0,
    description: 'Bonus XP per minute of workout',
  },

  // ▸ STRETCHING ────────────────────────────────────────────────
  stretch_complete: {
    action: 'stretch_complete',
    baseXP: 20,
    dailyCap: 60,            // 3 sessions per day
    streakEligible: true,
    cooldownMinutes: 60,
    description: 'Complete a stretch session',
  },
  stretch_morning_bonus: {
    action: 'stretch_morning_bonus',
    baseXP: 15,
    dailyCap: 15,            // Once per day
    streakEligible: false,
    cooldownMinutes: 0,
    description: 'Stretch before 9 AM',
  },

  // ▸ OUTFIT RATING ─────────────────────────────────────────────
  outfit_submit: {
    action: 'outfit_submit',
    baseXP: 10,
    dailyCap: 30,            // 3 uploads per day
    streakEligible: false,
    cooldownMinutes: 5,      // One outfit per 5 minutes
    description: 'Submit an outfit for AI rating',
  },
  outfit_score_bonus: {
    action: 'outfit_score_bonus',
    baseXP: 0,              // Bonus only, varies by score tier
    dailyCap: 120,
    streakEligible: false,
    cooldownMinutes: 0,
    description: 'Bonus XP based on outfit score',
  },
  outfit_improvement: {
    action: 'outfit_improvement',
    baseXP: 25,
    dailyCap: 50,            // 2 improvements per day
    streakEligible: false,
    cooldownMinutes: 0,
    description: 'Score higher than your previous rating',
  },

  // ▸ QUOTES ────────────────────────────────────────────────────
  quote_generated: {
    action: 'quote_generated',
    baseXP: 5,
    dailyCap: 25,            // 5 quotes per day
    streakEligible: false,
    cooldownMinutes: 1,
    description: 'Generate a custom motivational quote',
  },
  quote_read: {
    action: 'quote_read',
    baseXP: 10,
    dailyCap: 10,            // Once per day
    streakEligible: true,    // Encourage daily ritual
    cooldownMinutes: 0,
    description: 'Read the daily motivational quote',
  },
  quote_morning_bonus: {
    action: 'quote_morning_bonus',
    baseXP: 15,
    dailyCap: 15,            // Once per day
    streakEligible: false,
    cooldownMinutes: 0,
    description: 'Read the quote before 9 AM',
  },

  // ▸ DAILY LOGIN ───────────────────────────────────────────────
  daily_login: {
    action: 'daily_login',
    baseXP: 25,
    dailyCap: 25,            // Once per day
    streakEligible: true,
    cooldownMinutes: 0,
    description: 'Open the app today',
  },

  // ▸ CALENDAR ──────────────────────────────────────────────────
  calendar_event_done: {
    action: 'calendar_event_done',
    baseXP: 10,
    dailyCap: 50,            // 5 events per day
    streakEligible: true,
    cooldownMinutes: 0,
    description: 'Complete a calendar event',
  },

  // ▸ STREAK MILESTONES ─────────────────────────────────────────
  streak_milestone: {
    action: 'streak_milestone',
    baseXP: 0,              // Varies per milestone (see STREAK_MILESTONE_REWARDS)
    dailyCap: Infinity,
    streakEligible: false,
    cooldownMinutes: 0,
    description: 'Hit a streak milestone',
  },

  // ▸ ACHIEVEMENTS ──────────────────────────────────────────────
  achievement_unlock: {
    action: 'achievement_unlock',
    baseXP: 0,              // Varies per achievement
    dailyCap: Infinity,
    streakEligible: false,
    cooldownMinutes: 0,
    description: 'Unlock an achievement',
  },

  // ▸ LEVEL UP ──────────────────────────────────────────────────
  level_up_bonus: {
    action: 'level_up_bonus',
    baseXP: 0,              // Coins only, no XP
    dailyCap: Infinity,
    streakEligible: false,
    cooldownMinutes: 0,
    description: 'Level-up coin bonus',
  },

  // ▸ ADMIN ─────────────────────────────────────────────────────
  admin_grant: {
    action: 'admin_grant',
    baseXP: 0,
    dailyCap: Infinity,
    streakEligible: false,
    cooldownMinutes: 0,
    description: 'Admin-granted XP',
  },
  admin_deduct: {
    action: 'admin_deduct',
    baseXP: 0,
    dailyCap: Infinity,
    streakEligible: false,
    cooldownMinutes: 0,
    description: 'Admin XP deduction',
  },
};

// ── 2. COIN ECONOMY ───────────────────────────────────────────

/** Every N XP earns 1 coin */
export const COINS_PER_XP = 5;

/** On level-up: coins = newLevel × this value */
export const LEVEL_UP_COIN_MULTIPLIER = 25;

// ── 3. LEVEL CURVE ────────────────────────────────────────────

/** XP formula: floor(BASE × level ^ EXPONENT).  Level 1 = 0 XP. */
export const BASE_XP_PER_LEVEL = 100;
export const LEVEL_EXPONENT = 1.5;
export const MAX_LEVEL = 100;

// ── 4. STREAK TIERS (step function) ──────────────────────────

export const STREAK_TIERS: StreakTier[] = [
  { minDays: 0,   multiplier: 1.0,  label: 'No Streak',    icon: '🌑' },
  { minDays: 3,   multiplier: 1.1,  label: 'Warming Up',   icon: '🌒' },
  { minDays: 7,   multiplier: 1.25, label: 'On Fire',      icon: '🔥' },
  { minDays: 14,  multiplier: 1.4,  label: 'Unstoppable',  icon: '⚡' },
  { minDays: 30,  multiplier: 1.6,  label: 'Machine',      icon: '🤖' },
  { minDays: 60,  multiplier: 1.8,  label: 'Legendary',    icon: '💎' },
  { minDays: 90,  multiplier: 2.0,  label: 'Mythic',       icon: '👑' },
];

/** Streak milestones that award one-time bonus XP + coins */
export const STREAK_MILESTONE_REWARDS: Record<number, { xp: number; coins: number }> = {
  3:   { xp: 50,    coins: 25 },
  7:   { xp: 150,   coins: 75 },
  14:  { xp: 300,   coins: 150 },
  30:  { xp: 750,   coins: 400 },
  60:  { xp: 1500,  coins: 800 },
  90:  { xp: 3000,  coins: 1500 },
  100: { xp: 5000,  coins: 2500 },
  180: { xp: 7500,  coins: 4000 },
  365: { xp: 15000, coins: 10000 },
};

export const STREAK_MILESTONES = Object.keys(STREAK_MILESTONE_REWARDS).map(Number);

// ── 5. WORKOUT DIFFICULTY MAP ─────────────────────────────────

export const WORKOUT_XP_BY_DIFFICULTY = {
  beginner:     { action: 'workout_beginner'     as XPActionType, baseXP: 25 },
  intermediate: { action: 'workout_intermediate'  as XPActionType, baseXP: 50 },
  advanced:     { action: 'workout_advanced'      as XPActionType, baseXP: 100 },
} as const;

// ── 6. OUTFIT SCORE TIERS ─────────────────────────────────────

export const OUTFIT_SCORE_TIERS: OutfitScoreTier[] = [
  { minScore: 1,  maxScore: 3,  bonusXP: 5,   label: 'Needs Work' },
  { minScore: 4,  maxScore: 5,  bonusXP: 15,  label: 'Decent' },
  { minScore: 6,  maxScore: 7,  bonusXP: 25,  label: 'Looking Good' },
  { minScore: 8,  maxScore: 9,  bonusXP: 40,  label: 'Fire Fit' },
  { minScore: 10, maxScore: 10, bonusXP: 60,  label: 'Drip God' },
];

/** Get bonus XP for an outfit score */
export function outfitScoreBonusXP(score: number): number {
  const tier = OUTFIT_SCORE_TIERS.find(t => score >= t.minScore && score <= t.maxScore);
  return tier?.bonusXP ?? 0;
}

// ── 7. DAILY XP BUDGET (reference) ───────────────────────────
//
// These are the THEORETICAL daily maxima. In practice, a typical
// engaged user hits ~60% of this. Caps prevent no-lifers from
// lapping casual players too fast.
//
// ┌──────────────────────┬───────┬──────────┐
// │ Source               │ Base  │ Daily Cap │
// ├──────────────────────┼───────┼──────────┤
// │ Routine tasks (×15)  │  225  │    225    │
// │ Routine full (×2)    │  150  │    150    │
// │ Workout intermediate │   50  │    250    │
// │ Workout duration     │  +30  │     60    │
// │ Stretch (×2)         │   40  │     60    │
// │ Morning stretch      │   15  │     15    │
// │ Outfit submit        │   10  │     30    │
// │ Outfit score bonus   │  ~25  │    120    │
// │ Outfit improvement   │   25  │     50    │
// │ Quote (×3)           │   15  │     25    │
// │ Daily login          │   25  │     25    │
// │ Calendar events (×3) │   30  │     50    │
// ├──────────────────────┼───────┼──────────┤
// │ TOTAL (no streak)    │ ~640  │  ~1,060   │
// │ × 2.0 streak (90d)  │~1,280 │  ~2,120   │
// └──────────────────────┴───────┴──────────┘
//
// Typical engaged user ("perfect day", no streak): ~320 XP
// Typical engaged user (30-day streak):            ~510 XP
// Hardcore grinder (90-day streak):                ~800 XP
