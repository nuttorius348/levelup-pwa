// =============================================================
// Level Curve — Thresholds, titles, and progression math
// =============================================================
//
// FORMULA: XP(level) = floor(100 × level^1.5)
//
// This exponent (1.5) creates a curve that:
//  • Feels fast early (hook → "I'm already level 5!")
//  • Slows gradually (investment → "I've put in real work")
//  • Never feels impossible (prestige → "Level 100 is reachable")
//
// ┌───────┬──────────┬──────────┬──────────────────┐
// │ Level │ Total XP │ XP gap   │ Days @ 320 XP/d  │
// ├───────┼──────────┼──────────┼──────────────────┤
// │  1    │        0 │     183  │            1     │
// │  2    │      283 │     236  │            1     │
// │  5    │    1,118 │     358  │            4     │
// │ 10    │    3,162 │     579  │           10     │
// │ 15    │    5,809 │     778  │           18     │
// │ 20    │    8,944 │     965  │           28     │
// │ 25    │   12,500 │   1,143  │           39     │
// │ 30    │   16,432 │   1,316  │           51     │
// │ 40    │   25,298 │   1,648  │           79     │
// │ 50    │   35,355 │   1,968  │          110     │
// │ 60    │   46,476 │   2,279  │          145     │
// │ 75    │   64,952 │   2,725  │          203     │
// │ 100   │  100,000 │     n/a  │          313     │
// └───────┴──────────┴──────────┴──────────────────┘
//
// With a 90-day streak (2.0× ≈ 640 XP/d) those numbers halve.
// =============================================================

import type { LevelInfo } from '@/types/xp';
import { BASE_XP_PER_LEVEL, LEVEL_EXPONENT, MAX_LEVEL } from '@/lib/constants/xp';

// ── Level Titles ──────────────────────────────────────────────

const LEVEL_TITLES: [number, string][] = [
  [1,  'Novice'],
  [5,  'Apprentice'],
  [10, 'Challenger'],
  [15, 'Adept'],
  [20, 'Warrior'],
  [25, 'Veteran'],
  [30, 'Elite'],
  [40, 'Champion'],
  [50, 'Master'],
  [60, 'Grandmaster'],
  [75, 'Mythic'],
  [90, 'Transcendent'],
  [100, 'Legend'],
];

/**
 * Get the title for a given level (highest qualifying bracket).
 */
export function titleForLevel(level: number): string {
  let title = 'Novice';
  for (const [minLevel, t] of LEVEL_TITLES) {
    if (level >= minLevel) title = t;
    else break;
  }
  return title;
}

// ── Core Math ─────────────────────────────────────────────────

/**
 * Total XP required to REACH a given level.
 * Level 1 = 0 XP (everyone starts here).
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_XP_PER_LEVEL * Math.pow(level, LEVEL_EXPONENT));
}

/**
 * XP gap between level N and level N+1.
 */
export function xpForNextLevel(currentLevel: number): number {
  return xpRequiredForLevel(currentLevel + 1) - xpRequiredForLevel(currentLevel);
}

/**
 * Determine what level a total XP count maps to.
 * Uses binary search for O(log n) instead of a linear scan.
 */
export function levelFromTotalXP(totalXP: number): number {
  if (totalXP <= 0) return 1;

  let lo = 1;
  let hi = MAX_LEVEL;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (xpRequiredForLevel(mid) <= totalXP) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
}

/**
 * Full level info snapshot for a user.
 */
export function getLevelInfo(totalXP: number): LevelInfo {
  const level = levelFromTotalXP(totalXP);
  const xpFloor = xpRequiredForLevel(level);
  const xpCeiling = xpRequiredForLevel(Math.min(level + 1, MAX_LEVEL + 1));
  const xpNeededForNext = xpCeiling - xpFloor;
  const xpInLevel = totalXP - xpFloor;
  const progressPercent =
    xpNeededForNext > 0
      ? Math.min(100, Math.round((xpInLevel / xpNeededForNext) * 100))
      : 100;

  return {
    level,
    title: titleForLevel(level),
    xpFloor,
    xpCeiling,
    xpInLevel,
    xpNeeded: Math.max(0, xpCeiling - totalXP),
    progressPercent,
  };
}

// ── Pre-computed Lookup Table ─────────────────────────────────

export const LEVEL_TABLE = Array.from({ length: MAX_LEVEL }, (_, i) => {
  const level = i + 1;
  return {
    level,
    title: titleForLevel(level),
    totalXP: xpRequiredForLevel(level),
    xpToNext: xpForNextLevel(level),
  };
});
