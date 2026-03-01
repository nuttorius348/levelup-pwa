// =============================================================
// Economy Types — Currency, boosts, cosmetics, retention
// =============================================================

// ── Active Boost ──────────────────────────────────────────────

export type BoostType = 'xp_multiplier' | 'coin_multiplier' | 'streak_shield';

export interface ActiveBoost {
  id: string;
  userId: string;
  rewardId: string;
  boostType: BoostType;
  multiplier: number;
  activatedAt: string;
  expiresAt: string;
  isConsumed: boolean;
  /** Computed: minutes remaining. Negative if expired. */
  minutesRemaining: number;
}

export interface BoostEffects {
  xpMultiplier?: number;
  coinMultiplier?: number;
  streakProtection?: number;
  durationMinutes?: number;
}

// ── Daily Login Reward ────────────────────────────────────────

export interface DailyLoginReward {
  dayInCycle: number;        // 1-7
  coins: number;
  bonusDescription: string | null;
  icon: string;
  isToday: boolean;
  claimed: boolean;
}

export interface LoginCalendarEntry {
  loginDate: string;         // YYYY-MM-DD
  dayInCycle: number;
  cycleNumber: number;
  coinsAwarded: number;
  bonusItemSlug: string | null;
  claimed: boolean;
}

export interface LoginCalendarState {
  currentDay: number;        // 1-7 in cycle
  currentCycle: number;
  streak: number;            // Consecutive login days (can differ from XP streak)
  rewards: DailyLoginReward[];
  todayClaimed: boolean;
  nextReward: DailyLoginReward | null;
}

// ── Comeback Bonus ────────────────────────────────────────────

export interface ComebackBonus {
  daysAbsent: number;
  coinsAwarded: number;
  xpAwarded: number;
  boostHours: number;        // Free XP boost duration
  message: string;
}

// ── Theme ─────────────────────────────────────────────────────

export interface ThemeDefinition {
  slug: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'free' | 'common' | 'rare' | 'epic' | 'legendary';
  colors: {
    bg: string;              // Background
    bgSecondary: string;     // Card/surface bg
    bgTertiary: string;      // Subtle surface
    accent: string;          // Primary accent
    accentHover: string;     // Accent hover state
    accentMuted: string;     // Muted accent (borders, subtle)
    text: string;            // Primary text
    textSecondary: string;   // Secondary text
    textMuted: string;       // Muted/disabled text
    border: string;          // Default border
    success: string;         // Green/success
    warning: string;         // Amber/warning
    error: string;           // Red/error
    xpBar: string;           // XP progress bar gradient start
    xpBarEnd: string;        // XP progress bar gradient end
  };
}

export interface UserThemeState {
  activeTheme: string;       // slug
  unlockedThemes: string[];  // slugs
}

// ── Equipped Cosmetics ────────────────────────────────────────

export interface EquippedCosmetics {
  avatar: EquippedItem | null;
  theme: EquippedItem | null;
  badge: EquippedItem | null;
  title: EquippedItem | null;
}

export interface EquippedItem {
  rewardId: string;
  name: string;
  icon: string;
  effects: Record<string, unknown>;
}

// ── Shop Enhancements ─────────────────────────────────────────

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'text-slate-300',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

export const RARITY_BG: Record<ItemRarity, string> = {
  common: 'from-slate-500/10 to-slate-600/5',
  rare: 'from-blue-500/10 to-blue-600/5',
  epic: 'from-purple-500/10 to-purple-600/5',
  legendary: 'from-amber-500/10 to-amber-600/5',
};

export const RARITY_BORDER: Record<ItemRarity, string> = {
  common: 'border-slate-500/20',
  rare: 'border-blue-500/20',
  epic: 'border-purple-500/20',
  legendary: 'border-amber-500/20',
};

// ── Retention Hook Events ─────────────────────────────────────

export type RetentionEventType =
  | 'daily_login_claimed'
  | 'comeback_bonus'
  | 'streak_shield_used'
  | 'limited_item_purchased'
  | 'cycle_completed'
  | 'first_purchase';

export interface RetentionEvent {
  type: RetentionEventType;
  userId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}
