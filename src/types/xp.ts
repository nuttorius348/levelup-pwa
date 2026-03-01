// =============================================================
// XP & Gamification Types
// =============================================================

// ── Action Types ──────────────────────────────────────────────
export type XPActionType =
  | 'routine_task'           // Single checklist item
  | 'routine_full'           // All items in a routine finished
  | 'workout_beginner'       // Easy workout
  | 'workout_intermediate'   // Medium workout
  | 'workout_advanced'       // Hard workout
  | 'workout_duration_bonus' // Extra XP per minute
  | 'stretch_complete'       // Stretch session
  | 'stretch_morning_bonus'  // Done before 9 AM
  | 'outfit_submit'          // Uploaded an outfit
  | 'outfit_score_bonus'     // Bonus scaled by AI score
  | 'outfit_improvement'     // Improved over previous rating
  | 'quote_generated'        // Generated a custom quote
  | 'quote_read'             // Read the daily quote
  | 'quote_morning_bonus'    // Read before 9 AM
  | 'daily_login'            // Opening the app
  | 'streak_milestone'       // Hit a streak milestone (7, 14, 30…)
  | 'achievement_unlock'     // Unlocked an achievement
  | 'level_up_bonus'         // Level-up coin drop
  | 'calendar_event_done'    // Completed a calendar event
  | 'admin_grant'            // Manual admin grant
  | 'admin_deduct';          // Manual admin deduction

// ── Action Config ─────────────────────────────────────────────
export interface XPActionConfig {
  action: XPActionType;
  baseXP: number;
  dailyCap: number;             // Max XP from this action per day
  streakEligible: boolean;      // Whether streak multiplier applies
  cooldownMinutes?: number;     // Min gap between same action (anti-spam)
  description: string;          // Human-readable label
}

// ── XP Grant ──────────────────────────────────────────────────
export interface XPGrant {
  action: XPActionType;
  baseXP: number;
  streakMultiplier: number;
  bonusXP: number;              // Additional contextual XP
  finalXP: number;              // (baseXP + bonusXP) × streakMultiplier
  coinsEarned: number;
  metadata?: Record<string, unknown>;
}

// ── Level Info ────────────────────────────────────────────────
export interface LevelInfo {
  level: number;
  title: string;                // "Novice", "Warrior", etc.
  xpFloor: number;              // Total XP to reach this level
  xpCeiling: number;            // Total XP to reach NEXT level
  xpInLevel: number;            // XP progress within current level
  xpNeeded: number;             // XP remaining to level up
  progressPercent: number;      // 0–100
}

// ── Streak Info ───────────────────────────────────────────────
export interface StreakTier {
  minDays: number;
  multiplier: number;
  label: string;
  icon: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  tier: StreakTier;
  multiplier: number;
  nextMilestone: number | null;  // Days until next milestone
  lastActiveDate: string | null;
  isAtRisk: boolean;             // True if 20+ hours since last activity
}

// ── Leaderboard ───────────────────────────────────────────────
export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  totalXP: number;
  rank: number;
}

// ── Daily Cap Status ──────────────────────────────────────────
export interface DailyCapStatus {
  action: XPActionType;
  earned: number;
  cap: number;
  remaining: number;
  isMaxed: boolean;
}

// ── Level-Up Event ────────────────────────────────────────────
export interface LevelUpEvent {
  previousLevel: number;
  newLevel: number;
  coinsAwarded: number;
  newTitle: string | null;
  unlockedRewards: string[];    // Reward IDs now purchasable
}

// ── Workout Difficulty ────────────────────────────────────────
export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';

// ── Outfit Score Tier ─────────────────────────────────────────
export interface OutfitScoreTier {
  minScore: number;
  maxScore: number;
  bonusXP: number;
  label: string;
}
