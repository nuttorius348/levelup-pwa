// =============================================================
// Stretch Engine Service — Session lifecycle, XP, progression
// =============================================================
//
// Core responsibilities:
//  • Create & manage guided stretch sessions
//  • Timer-based pose holds with side switching
//  • XP calculation with morning bonus + difficulty scaling
//  • Difficulty progression: beginner → intermediate → advanced
//  • Flexibility stats tracking
//  • Supabase persistence
// =============================================================

import type {
  StretchSession,
  StretchXPBreakdown,
  StretchRoutinePose,
  StretchDifficulty,
  StretchSessionStatus,
  StretchHistoryEntry,
  FlexibilityStats,
  StretchCategory,
  BodyRegion,
  STRETCH_PROGRESSION,
} from '@/types/stretch';
import type { XPActionType } from '@/types/xp';
import {
  getRoutineById,
  STRETCH_ROUTINE_LIBRARY,
  STRETCH_POSE_LIBRARY,
} from '@/lib/constants/stretches';
import {
  STRETCH_XP_SCALING,
  STRETCH_PROGRESSION as PROGRESSION_CONFIG,
} from '@/types/stretch';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';

// ── Constants ─────────────────────────────────────────────────

/** Base XP for completing any stretch session */
const BASE_XP = 20;

/** Morning bonus XP (before 9 AM) */
const MORNING_BONUS_XP = 15;

/** XP for completing every pose without skipping */
const FULL_COMPLETION_BONUS_XP = 10;

/** Duration bonus: +1 XP per minute over 5 min threshold */
const DURATION_BONUS_PER_MINUTE = 1;
const DURATION_BONUS_THRESHOLD_MINUTES = 5;
const DURATION_BONUS_CAP = 15;

/** Difficulty bonus XP (maps from STRETCH_XP_SCALING) */
// beginner = 0, intermediate = 5, advanced = 10

/** Coins earned per 10 XP */
const COINS_PER_10_XP = 1;

/** Cooldown between sessions for XP (60 min) */
const SESSION_COOLDOWN_MS = 60 * 60 * 1000;

/** Daily XP cap for stretch sessions */
const DAILY_XP_CAP = 60;

// ── Helper: Generate unique IDs ───────────────────────────────

function generateId(prefix: string = 'ss'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ── Helper: Morning check ─────────────────────────────────────

function isMorningSession(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 5 && hour < 9;
}

// ══════════════════════════════════════════════════════════════
// STRETCH SERVICE CLASS
// ══════════════════════════════════════════════════════════════

export class StretchService {
  // ────────────────────────────────────────────────────────────
  // SESSION LIFECYCLE
  // ────────────────────────────────────────────────────────────

  /**
   * Create a new stretch session from a routine ID.
   * Applies difficulty progression (hold multiplier, transition time).
   */
  static createSession(
    userId: string,
    routineId: string,
    difficultyOverride?: StretchDifficulty,
  ): StretchSession {
    const routine = getRoutineById(routineId);
    if (!routine) {
      throw new Error(`Routine not found: ${routineId}`);
    }

    const difficulty = difficultyOverride ?? routine.difficulty;
    const progression = PROGRESSION_CONFIG[difficulty];

    // Apply difficulty scaling to each pose's hold time
    const scaledPoses: StretchRoutinePose[] = routine.poses.map((rp) => ({
      ...rp,
      holdSeconds: Math.round(rp.holdSeconds * progression.holdMultiplier),
      transitionSeconds: progression.transitionSeconds,
    }));

    return {
      id: generateId('ss'),
      userId,
      routineId: routine.id,
      routineTitle: routine.title,
      difficulty,
      status: 'idle',
      poses: scaledPoses,

      // Timing
      startedAt: '',
      totalDurationSeconds: 0,

      // Current state
      currentPoseIndex: 0,
      currentSide: 1,
      holdTimeRemaining: scaledPoses[0]?.holdSeconds ?? 0,
      isTransitioning: false,

      // Progress
      posesCompleted: 0,
      posesSkipped: 0,
      totalHoldTime: 0,

      // XP (calculated on completion)
      xpBreakdown: StretchService.emptyXPBreakdown(),
    };
  }

  /**
   * Start the session — sets status to 'active' and records start time.
   */
  static startSession(session: StretchSession): StretchSession {
    if (session.status !== 'idle') {
      throw new Error(`Cannot start session in "${session.status}" state`);
    }

    return {
      ...session,
      status: 'active',
      startedAt: new Date().toISOString(),
      holdTimeRemaining: session.poses[0]?.holdSeconds ?? 0,
      isTransitioning: true, // Start with a transition into first pose
    };
  }

  /**
   * Begin the current pose (end transition phase).
   */
  static beginPose(session: StretchSession): StretchSession {
    if (session.status !== 'active') return session;

    return {
      ...session,
      isTransitioning: false,
    };
  }

  /**
   * Tick the hold timer by 1 second.
   * Returns updated session + whether the hold is complete.
   */
  static tick(session: StretchSession): { session: StretchSession; holdComplete: boolean } {
    if (session.status !== 'active' || session.isTransitioning) {
      return { session, holdComplete: false };
    }

    const remaining = session.holdTimeRemaining - 1;

    if (remaining <= 0) {
      // Hold complete — mark and advance
      return {
        session: {
          ...session,
          holdTimeRemaining: 0,
          totalHoldTime: session.totalHoldTime + session.poses[session.currentPoseIndex].holdSeconds,
          totalDurationSeconds: session.totalDurationSeconds + 1,
        },
        holdComplete: true,
      };
    }

    return {
      session: {
        ...session,
        holdTimeRemaining: remaining,
        totalDurationSeconds: session.totalDurationSeconds + 1,
      },
      holdComplete: false,
    };
  }

  /**
   * Advance to the next side or next pose.
   * Returns null when all poses are done (session should be completed).
   */
  static advancePose(session: StretchSession): StretchSession | null {
    if (session.status !== 'active') return session;

    const currentPose = session.poses[session.currentPoseIndex];
    const hasTwoSides = currentPose.pose.sidesCount === 2;

    // If two-sided and we just did side 1 → switch to side 2
    if (hasTwoSides && session.currentSide === 1) {
      return {
        ...session,
        currentSide: 2,
        holdTimeRemaining: currentPose.holdSeconds,
        isTransitioning: true,
        posesCompleted: session.posesCompleted, // Not yet counted
      };
    }

    // Pose fully done (both sides or single side)
    const nextIndex = session.currentPoseIndex + 1;

    // All poses done → signal completion
    if (nextIndex >= session.poses.length) {
      return null; // Caller should call completeSession()
    }

    // Move to next pose
    return {
      ...session,
      currentPoseIndex: nextIndex,
      currentSide: 1,
      holdTimeRemaining: session.poses[nextIndex].holdSeconds,
      isTransitioning: true,
      posesCompleted: session.posesCompleted + 1,
    };
  }

  /**
   * Skip the current pose entirely (both sides).
   */
  static skipPose(session: StretchSession): StretchSession | null {
    if (session.status !== 'active') return session;

    const nextIndex = session.currentPoseIndex + 1;

    if (nextIndex >= session.poses.length) {
      return null; // All done
    }

    return {
      ...session,
      currentPoseIndex: nextIndex,
      currentSide: 1,
      holdTimeRemaining: session.poses[nextIndex].holdSeconds,
      isTransitioning: true,
      posesCompleted: session.posesCompleted,
      posesSkipped: session.posesSkipped + 1,
    };
  }

  /**
   * Pause the session.
   */
  static pauseSession(session: StretchSession): StretchSession {
    if (session.status !== 'active') return session;

    return {
      ...session,
      status: 'paused',
      pausedAt: new Date().toISOString(),
    };
  }

  /**
   * Resume the session from pause.
   */
  static resumeSession(session: StretchSession): StretchSession {
    if (session.status !== 'paused') return session;

    return {
      ...session,
      status: 'active',
      pausedAt: undefined,
    };
  }

  /**
   * Cancel the session — no XP awarded.
   */
  static cancelSession(session: StretchSession): StretchSession {
    return {
      ...session,
      status: 'cancelled',
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Complete the session — calculate XP and finalize.
   */
  static completeSession(session: StretchSession): StretchSession {
    const now = new Date();
    const startDate = new Date(session.startedAt);
    const actualDuration = Math.round((now.getTime() - startDate.getTime()) / 1000);

    // Count the last pose as completed
    const finalPosesCompleted = session.posesCompleted + 1;

    const xpBreakdown = StretchService.calculateXP({
      difficulty: session.difficulty,
      posesCompleted: finalPosesCompleted,
      totalPoses: session.poses.length,
      durationMinutes: Math.round(actualDuration / 60),
      isMorning: isMorningSession(startDate),
      streakMultiplier: 1.0, // Set by caller from user's streak
    });

    return {
      ...session,
      status: 'completed',
      completedAt: now.toISOString(),
      totalDurationSeconds: actualDuration,
      posesCompleted: finalPosesCompleted,
      xpBreakdown,
    };
  }

  // ────────────────────────────────────────────────────────────
  // XP CALCULATION
  // ────────────────────────────────────────────────────────────

  /**
   * Calculate XP breakdown for a completed session.
   *
   * Formula:
   *   base (20) + morning (15) + completion (10) + duration (1/min cap 15)
   *   + difficulty (0/5/10) × streak multiplier
   */
  static calculateXP(params: {
    difficulty: StretchDifficulty;
    posesCompleted: number;
    totalPoses: number;
    durationMinutes: number;
    isMorning: boolean;
    streakMultiplier: number;
  }): StretchXPBreakdown {
    const { difficulty, posesCompleted, totalPoses, durationMinutes, isMorning, streakMultiplier } = params;

    // 1. Base XP
    const baseXP = BASE_XP;

    // 2. Morning bonus
    const morningBonusXP = isMorning ? MORNING_BONUS_XP : 0;

    // 3. Full completion bonus (all poses, no skips)
    const completionBonusXP = posesCompleted >= totalPoses ? FULL_COMPLETION_BONUS_XP : 0;

    // 4. Duration bonus: +1 per min over 5 min, capped at 15
    const extraMinutes = Math.max(0, durationMinutes - DURATION_BONUS_THRESHOLD_MINUTES);
    const durationBonusXP = Math.min(extraMinutes * DURATION_BONUS_PER_MINUTE, DURATION_BONUS_CAP);

    // 5. Difficulty bonus
    const difficultyBonusXP = STRETCH_XP_SCALING[difficulty];

    // 6. Sum + streak multiplier
    const rawTotal = baseXP + morningBonusXP + completionBonusXP + durationBonusXP + difficultyBonusXP;
    const totalXP = Math.round(rawTotal * streakMultiplier);

    // 7. Coins: 1 per 10 XP
    const coinsEarned = Math.floor(totalXP / 10) * COINS_PER_10_XP;

    return {
      baseXP,
      morningBonusXP,
      completionBonusXP,
      durationBonusXP,
      difficultyBonusXP,
      streakMultiplier,
      totalXP,
      coinsEarned,
    };
  }

  /** Empty XP breakdown (idle sessions) */
  static emptyXPBreakdown(): StretchXPBreakdown {
    return {
      baseXP: 0,
      morningBonusXP: 0,
      completionBonusXP: 0,
      durationBonusXP: 0,
      difficultyBonusXP: 0,
      streakMultiplier: 1.0,
      totalXP: 0,
      coinsEarned: 0,
    };
  }

  // ────────────────────────────────────────────────────────────
  // DIFFICULTY PROGRESSION
  // ────────────────────────────────────────────────────────────

  /**
   * Check if a user qualifies for the next difficulty tier.
   *
   * Requirements:
   *   intermediate: 10+ sessions, 5+ consecutive days
   *   advanced: 30+ sessions, 14+ consecutive days
   */
  static checkProgression(stats: {
    totalSessions: number;
    currentStreak: number;
    currentDifficulty: StretchDifficulty;
  }): {
    canAdvance: boolean;
    nextDifficulty: StretchDifficulty | null;
    sessionsNeeded: number;
    streakNeeded: number;
  } {
    const { totalSessions, currentStreak, currentDifficulty } = stats;

    if (currentDifficulty === 'advanced') {
      return { canAdvance: false, nextDifficulty: null, sessionsNeeded: 0, streakNeeded: 0 };
    }

    const next: StretchDifficulty = currentDifficulty === 'beginner' ? 'intermediate' : 'advanced';

    const requirements: Record<StretchDifficulty, { sessions: number; streak: number }> = {
      beginner: { sessions: 0, streak: 0 },
      intermediate: { sessions: 10, streak: 5 },
      advanced: { sessions: 30, streak: 14 },
    };

    const req = requirements[next];
    const sessionsNeeded = Math.max(0, req.sessions - totalSessions);
    const streakNeeded = Math.max(0, req.streak - currentStreak);
    const canAdvance = sessionsNeeded === 0 && streakNeeded === 0;

    return { canAdvance, nextDifficulty: next, sessionsNeeded, streakNeeded };
  }

  /**
   * Get the effective hold duration for a pose at a given difficulty.
   */
  static getEffectiveHold(baseSeconds: number, difficulty: StretchDifficulty): number {
    return Math.round(baseSeconds * PROGRESSION_CONFIG[difficulty].holdMultiplier);
  }

  // ────────────────────────────────────────────────────────────
  // SESSION HELPERS
  // ────────────────────────────────────────────────────────────

  /**
   * Get the current pose being performed.
   */
  static getCurrentPose(session: StretchSession): StretchRoutinePose | null {
    if (session.currentPoseIndex >= session.poses.length) return null;
    return session.poses[session.currentPoseIndex];
  }

  /**
   * Get the next upcoming pose (for preview).
   */
  static getNextPose(session: StretchSession): StretchRoutinePose | null {
    const nextIdx = session.currentPoseIndex + 1;
    if (nextIdx >= session.poses.length) return null;
    return session.poses[nextIdx];
  }

  /**
   * Get overall session progress (0-100).
   */
  static getProgress(session: StretchSession): number {
    if (session.poses.length === 0) return 0;

    // Count total "sides" as units of progress
    const totalUnits = session.poses.reduce(
      (sum, p) => sum + p.pose.sidesCount,
      0,
    );

    let completedUnits = 0;
    for (let i = 0; i < session.currentPoseIndex; i++) {
      completedUnits += session.poses[i].pose.sidesCount;
    }

    // Partial credit for current pose
    if (session.currentPoseIndex < session.poses.length) {
      const current = session.poses[session.currentPoseIndex];
      if (session.currentSide === 2) completedUnits += 1;
    }

    return Math.min(100, Math.round((completedUnits / totalUnits) * 100));
  }

  /**
   * Estimated time remaining in the session (seconds).
   */
  static getTimeRemaining(session: StretchSession): number {
    let remaining = session.holdTimeRemaining;

    // Current pose remaining sides
    const currentPose = session.poses[session.currentPoseIndex];
    if (currentPose && currentPose.pose.sidesCount === 2 && session.currentSide === 1) {
      remaining += currentPose.holdSeconds + currentPose.transitionSeconds;
    }

    // Remaining poses
    for (let i = session.currentPoseIndex + 1; i < session.poses.length; i++) {
      const p = session.poses[i];
      remaining += (p.holdSeconds * p.pose.sidesCount) + (p.transitionSeconds * p.pose.sidesCount);
    }

    return remaining;
  }

  /**
   * Format seconds as mm:ss.
   */
  static formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ────────────────────────────────────────────────────────────
  // SUPABASE PERSISTENCE
  // ────────────────────────────────────────────────────────────

  /**
   * Save a completed stretch session to the database.
   */
  static async saveSession(session: StretchSession): Promise<{ success: boolean; error?: string }> {
    if (session.status !== 'completed') {
      return { success: false, error: 'Session not completed' };
    }

    try {
      const supabase = createAdminClient();

      // Upsert the stretch session log
      const { error: logError } = await supabase
        .from('stretch_sessions')
        .insert({
          id: session.id,
          user_id: session.userId,
          routine_id: session.routineId,
          routine_title: session.routineTitle,
          difficulty: session.difficulty,
          duration_seconds: session.totalDurationSeconds,
          poses_completed: session.posesCompleted,
          poses_skipped: session.posesSkipped,
          total_hold_time: session.totalHoldTime,
          xp_earned: session.xpBreakdown.totalXP,
          coins_earned: session.xpBreakdown.coinsEarned,
          is_morning: session.xpBreakdown.morningBonusXP > 0,
          xp_breakdown: session.xpBreakdown as unknown as Json,
          completed_at: session.completedAt,
        });

      if (logError) {
        console.error('[StretchService] Save error:', logError);
        return { success: false, error: logError.message };
      }

      return { success: true };
    } catch (err) {
      console.error('[StretchService] Save exception:', err);
      return { success: false, error: 'Unexpected error saving session' };
    }
  }

  /**
   * Fetch stretch session history for a user.
   */
  static async getHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<StretchHistoryEntry[]> {
    try {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('stretch_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        routineTitle: row.routine_title,
        category: row.category ?? 'full_body',
        difficulty: row.difficulty,
        durationMinutes: Math.round(row.duration_seconds / 60),
        posesCompleted: row.poses_completed,
        totalHoldTime: row.total_hold_time,
        xpEarned: row.xp_earned,
        isMorning: row.is_morning,
        completedAt: row.completed_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Compute flexibility stats from session history.
   */
  static async getFlexibilityStats(userId: string): Promise<FlexibilityStats> {
    const defaultStats: FlexibilityStats = {
      totalSessions: 0,
      totalMinutes: 0,
      totalHoldTime: 0,
      averageDuration: 0,
      morningSessions: 0,
      currentWeekSessions: 0,
      weeklyGoal: 5,
      favoriteCategory: null,
      bodyRegionCoverage: {} as Record<BodyRegion, number>,
      longestHold: { pose: '', seconds: 0 },
    };

    try {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('stretch_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error || !data || data.length === 0) return defaultStats;

      // Aggregate stats
      const totalSessions = data.length;
      const totalSeconds = data.reduce((s: number, r: any) => s + (r.duration_seconds ?? 0), 0);
      const totalMinutes = Math.round(totalSeconds / 60);
      const totalHoldTime = data.reduce((s: number, r: any) => s + (r.total_hold_time ?? 0), 0);
      const morningSessions = data.filter((r: any) => r.is_morning).length;

      // Current week sessions
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const currentWeekSessions = data.filter(
        (r: any) => new Date(r.completed_at) >= weekStart,
      ).length;

      // Favorite category (most frequent routine_id → look up category)
      const categoryCount: Record<string, number> = {};
      for (const row of data) {
        const routine = getRoutineById(row.routine_id);
        if (routine) {
          categoryCount[routine.category] = (categoryCount[routine.category] ?? 0) + 1;
        }
      }
      const favoriteCategory = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] as StretchCategory | undefined ?? null;

      return {
        totalSessions,
        totalMinutes,
        totalHoldTime,
        averageDuration: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
        morningSessions,
        currentWeekSessions,
        weeklyGoal: 5,
        favoriteCategory,
        bodyRegionCoverage: {} as Record<BodyRegion, number>,
        longestHold: { pose: '', seconds: 0 },
      };
    } catch {
      return defaultStats;
    }
  }

  /**
   * Count total completed sessions for a user (for progression checks).
   */
  static async getSessionCount(userId: string): Promise<number> {
    try {
      const supabase = createAdminClient();
      const { count, error } = await supabase
        .from('stretch_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return error ? 0 : (count ?? 0);
    } catch {
      return 0;
    }
  }

  // ────────────────────────────────────────────────────────────
  // DAILY CHALLENGE
  // ────────────────────────────────────────────────────────────

  /**
   * Get today's daily stretch challenge.
   * Rotates through routines based on day-of-year.
   */
  static getDailyChallenge(): {
    routine: typeof STRETCH_ROUTINE_LIBRARY[number];
    bonusXP: number;
    expiresAt: string;
  } {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Rotate through routines by day
    const routine = STRETCH_ROUTINE_LIBRARY[dayOfYear % STRETCH_ROUTINE_LIBRARY.length];

    // End of day
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    return {
      routine,
      bonusXP: 10, // Extra 10 XP for daily challenge
      expiresAt: endOfDay.toISOString(),
    };
  }

  /**
   * Check if user has completed today's daily challenge.
   */
  static async hasDailyChallengeCompleted(userId: string): Promise<boolean> {
    try {
      const supabase = createAdminClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const challenge = StretchService.getDailyChallenge();

      const { count, error } = await supabase
        .from('stretch_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('routine_id', challenge.routine.id)
        .gte('completed_at', today.toISOString());

      return !error && (count ?? 0) > 0;
    } catch {
      return false;
    }
  }

  // ────────────────────────────────────────────────────────────
  // BREATHING CUE HELPERS
  // ────────────────────────────────────────────────────────────

  /**
   * Get the breathing phase for a given second within a hold.
   * 4-second breath cycle: inhale (2s) → exhale (2s)
   */
  static getBreathingPhase(elapsedSeconds: number): 'inhale' | 'exhale' {
    const cyclePosition = elapsedSeconds % 4;
    return cyclePosition < 2 ? 'inhale' : 'exhale';
  }

  /**
   * Get a progress ring "percentage" for breathing animation.
   * Returns 0→1 for inhale, 1→0 for exhale (for UI ring).
   */
  static getBreathingProgress(elapsedSeconds: number): number {
    const cyclePosition = elapsedSeconds % 4;
    if (cyclePosition < 2) {
      return cyclePosition / 2; // 0 → 1 during inhale
    }
    return 1 - (cyclePosition - 2) / 2; // 1 → 0 during exhale
  }
}
