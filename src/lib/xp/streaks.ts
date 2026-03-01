// =============================================================
// Streak System — Tier-based multipliers with milestone rewards
// =============================================================
//
// PSYCHOLOGY: The multiplier uses a STEP function, not linear.
// Users feel a tangible "power-up" when they cross a tier
// boundary, creating micro-celebrations and loss aversion
// ("I'm 2 days from the next tier — I can't break now!").
//
// Anti-cheat: streak validation uses the user's timezone,
// and last_active_date is only set server-side.
// =============================================================

import type { StreakInfo, StreakTier } from '@/types/xp';
import {
  STREAK_TIERS,
  STREAK_MILESTONES,
  STREAK_MILESTONE_REWARDS,
} from '@/lib/constants/xp';

/**
 * Get the streak tier for a given number of consecutive days.
 * Returns the highest tier whose minDays ≤ streakDays.
 */
export function getStreakTier(streakDays: number): StreakTier {
  let tier = STREAK_TIERS[0]!;
  for (const t of STREAK_TIERS) {
    if (streakDays >= t.minDays) tier = t;
    else break;
  }
  return tier;
}

/**
 * Get the streak multiplier for a given number of consecutive days.
 *
 * ┌──────────┬────────┬──────────────┐
 * │ Days     │ Multi  │ Label        │
 * ├──────────┼────────┼──────────────┤
 * │ 0–2      │ 1.0×   │ No Streak    │
 * │ 3–6      │ 1.1×   │ Warming Up   │
 * │ 7–13     │ 1.25×  │ On Fire      │
 * │ 14–29    │ 1.4×   │ Unstoppable  │
 * │ 30–59    │ 1.6×   │ Machine      │
 * │ 60–89    │ 1.8×   │ Legendary    │
 * │ 90+      │ 2.0×   │ Mythic       │
 * └──────────┴────────┴──────────────┘
 */
export function calculateStreakMultiplier(streakDays: number): number {
  return getStreakTier(streakDays).multiplier;
}

/**
 * Determine if a streak is still active given the last active date.
 * A streak breaks if the user misses a full calendar day IN THEIR TIMEZONE.
 */
export function isStreakActive(
  lastActiveDate: string | null,
  timezone: string = 'America/New_York',
): boolean {
  if (!lastActiveDate) return false;

  const now = new Date();
  const last = new Date(lastActiveDate);

  // Convert to user's local calendar date (YYYY-MM-DD)
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: timezone });
  const todayStr = fmt.format(now);
  const lastStr = fmt.format(last);

  if (todayStr === lastStr) return true;  // Same day

  // Diff in days
  const today = new Date(todayStr);
  const lastDay = new Date(lastStr);
  const diffDays = (today.getTime() - lastDay.getTime()) / 86_400_000;

  return diffDays <= 1;   // Yesterday = still active
}

/**
 * Check if a streak count sits exactly on a milestone.
 */
export function isStreakMilestone(streakDays: number): boolean {
  return STREAK_MILESTONES.includes(streakDays);
}

/**
 * Get the reward for a streak milestone (or null if not a milestone).
 */
export function getStreakMilestoneReward(
  streakDays: number,
): { xp: number; coins: number } | null {
  return STREAK_MILESTONE_REWARDS[streakDays] ?? null;
}

/**
 * Find the next milestone the user hasn't reached yet.
 */
export function nextMilestone(currentStreak: number): number | null {
  for (const m of STREAK_MILESTONES) {
    if (m > currentStreak) return m;
  }
  return null;
}

/**
 * "At risk" = the user has been inactive for 20+ hours.
 * Used to show a warning notification: "Your streak is about to break!"
 */
export function isStreakAtRisk(lastActiveDate: string | null): boolean {
  if (!lastActiveDate) return false;
  const hoursAgo = (Date.now() - new Date(lastActiveDate).getTime()) / 3_600_000;
  return hoursAgo >= 20;
}

/**
 * Build full StreakInfo for display.
 */
export function getStreakInfo(
  currentStreak: number,
  longestStreak: number,
  lastActiveDate: string | null,
): StreakInfo {
  return {
    currentStreak,
    longestStreak,
    tier: getStreakTier(currentStreak),
    multiplier: calculateStreakMultiplier(currentStreak),
    nextMilestone: nextMilestone(currentStreak),
    lastActiveDate,
    isAtRisk: isStreakAtRisk(lastActiveDate),
  };
}
