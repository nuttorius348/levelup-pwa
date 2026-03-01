// =============================================================
// XP Service — Production-ready XP management with idempotency
// =============================================================
//
// This service provides a clean interface for awarding XP with:
//  • Idempotency via unique transaction IDs
//  • Comprehensive error handling
//  • Transaction logging
//  • Duplicate prevention
//  • Type-safe return values
//  • Audit trail
// =============================================================

import type {
  XPActionType,
  XPGrant,
  LevelUpEvent,
  LevelInfo,
  StreakInfo,
  WorkoutDifficulty,
} from '@/types/xp';
import { grantXP } from '@/lib/xp/engine';
import { getLevelInfo } from '@/lib/xp/levels';
import { getStreakInfo, isStreakActive } from '@/lib/xp/streaks';
import { outfitScoreBonusXP, WORKOUT_XP_BY_DIFFICULTY } from '@/lib/constants/xp';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Types ─────────────────────────────────────────────────────

interface AwardXPRequest {
  userId: string;
  action: XPActionType;
  idempotencyKey?: string;       // Prevents duplicate awards
  metadata?: Record<string, unknown>;
  
  // Context-specific fields
  workoutDifficulty?: WorkoutDifficulty;
  workoutDurationMinutes?: number;
  outfitScore?: number;           // 1-10
  previousOutfitScore?: number;   // For improvement detection
  isMorningStretch?: boolean;     // Before 9 AM
}

interface AwardXPResponse {
  success: boolean;
  grant: XPGrant;
  newTotalXP: number;
  newCoins: number;
  newLevel: number;
  levelInfo: LevelInfo;
  levelUp?: LevelUpEvent;
  isDuplicate: boolean;
  capped: boolean;
  cooledDown: boolean;
  transactionId: string;
  error?: string;
}

interface GetUserStatsResponse {
  userId: string;
  level: number;
  levelInfo: LevelInfo;
  totalXP: number;
  coins: number;
  streak: StreakInfo;
  isStreakActive: boolean;
}

// ── Service Class ─────────────────────────────────────────────

export class XPService {
  /**
   * Award XP to a user with automatic handling of:
   *  - Workout difficulty scaling
   *  - Workout duration bonus
   *  - Outfit score tiers
   *  - Outfit improvement detection
   *  - Morning stretch bonus
   *  - Idempotency (duplicate prevention)
   */
  static async awardXP(request: AwardXPRequest): Promise<AwardXPResponse> {
    const {
      userId,
      action,
      idempotencyKey,
      metadata = {},
      workoutDifficulty,
      workoutDurationMinutes,
      outfitScore,
      previousOutfitScore,
      isMorningStretch,
    } = request;

    const supabase = createAdminClient();

    try {
      // ── 1. Idempotency Check ────────────────────────────────
      if (idempotencyKey) {
        const { data: existing } = await supabase
          .from('xp_transactions')
          .select('id, final_xp, coins_earned, metadata')
          .eq('user_id', userId)
          .eq('metadata->>idempotencyKey', idempotencyKey)
          .single();

        if (existing) {
          // Already processed — return cached result
          const { data: user } = await supabase
            .from('users')
            .select('total_xp, coins, level')
            .eq('id', userId)
            .single();

          return {
            success: true,
            grant: {
              action,
              baseXP: 0,
              streakMultiplier: 1.0,
              bonusXP: 0,
              finalXP: existing.final_xp,
              coinsEarned: existing.coins_earned,
              metadata: existing.metadata as Record<string, unknown>,
            },
            newTotalXP: user?.total_xp ?? 0,
            newCoins: user?.coins ?? 0,
            newLevel: user?.level ?? 1,
            levelInfo: getLevelInfo(user?.total_xp ?? 0),
            isDuplicate: true,
            capped: false,
            cooledDown: false,
            transactionId: existing.id,
          };
        }
      }

      // ── 2. Determine Action + Bonus XP ──────────────────────
      let primaryAction = action;
      let bonusXP = 0;
      const enrichedMetadata: Record<string, unknown> = { ...metadata, idempotencyKey };

      // Workout difficulty mapping
      if (
        (action === 'workout_beginner' ||
         action === 'workout_intermediate' ||
         action === 'workout_advanced') &&
        workoutDifficulty
      ) {
        primaryAction = WORKOUT_XP_BY_DIFFICULTY[workoutDifficulty].action;
      }

      // Workout duration bonus
      if (workoutDurationMinutes && workoutDurationMinutes > 0) {
        const durationBonus = Math.min(workoutDurationMinutes, 60);
        bonusXP += durationBonus;
        enrichedMetadata.workoutDurationMinutes = workoutDurationMinutes;
      }

      // Outfit score tier bonus
      if (action === 'outfit_submit' && outfitScore) {
        bonusXP += outfitScoreBonusXP(outfitScore);
        enrichedMetadata.outfitScore = outfitScore;
      }

      // Outfit improvement bonus (award separately)
      if (previousOutfitScore && outfitScore && outfitScore > previousOutfitScore) {
        enrichedMetadata.previousScore = previousOutfitScore;
        enrichedMetadata.scoreImprovement = outfitScore - previousOutfitScore;
        // Will award improvement XP separately below
      }

      // Morning stretch bonus
      if (action === 'stretch_complete' && isMorningStretch) {
        bonusXP += 15; // STRETCH_MORNING_BONUS
        enrichedMetadata.isMorningStretch = true;
      }

      // ── 3. Award Primary XP ─────────────────────────────────
      const result = await grantXP({
        userId,
        action: primaryAction,
        bonusXP,
        metadata: enrichedMetadata,
      });

      // ── 4. Award Outfit Improvement (if applicable) ─────────
      if (
        previousOutfitScore &&
        outfitScore &&
        outfitScore > previousOutfitScore &&
        !result.capped
      ) {
        await grantXP({
          userId,
          action: 'outfit_improvement',
          metadata: {
            previousScore: previousOutfitScore,
            newScore: outfitScore,
            improvement: outfitScore - previousOutfitScore,
          },
        });
      }

      // ── 5. Fetch Fresh User Stats ───────────────────────────
      const { data: user } = await supabase
        .from('users')
        .select('total_xp, level')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found after XP grant');

      // ── 6. Get Transaction ID ───────────────────────────────
      const { data: transaction } = await supabase
        .from('xp_transactions')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        success: true,
        grant: result.grant,
        newTotalXP: user.total_xp,
        newCoins: result.newCoins,
        newLevel: user.level,
        levelInfo: getLevelInfo(user.total_xp),
        levelUp: result.levelUp,
        isDuplicate: false,
        capped: result.capped,
        cooledDown: result.cooledDown,
        transactionId: transaction?.id ?? '',
      };
    } catch (error) {
      // ── Error Handling ──────────────────────────────────────
      console.error('[XPService] Award failed:', error);
      
      return {
        success: false,
        grant: {
          action,
          baseXP: 0,
          streakMultiplier: 1.0,
          bonusXP: 0,
          finalXP: 0,
          coinsEarned: 0,
        },
        newTotalXP: 0,
        newCoins: 0,
        newLevel: 1,
        levelInfo: getLevelInfo(0),
        isDuplicate: false,
        capped: false,
        cooledDown: false,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get comprehensive user stats (level, XP, streak, coins).
   */
  static async getUserStats(userId: string): Promise<GetUserStatsResponse | null> {
    const supabase = createAdminClient();

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('level, total_xp, coins, streak_days, longest_streak, last_active_date, timezone')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('[XPService] User not found:', userId);
        return null;
      }

      const levelInfo = getLevelInfo(user.total_xp);
      const streak = getStreakInfo(
        user.streak_days,
        user.longest_streak,
        user.last_active_date,
      );
      const streakActive = isStreakActive(user.last_active_date, user.timezone);

      return {
        userId,
        level: user.level,
        levelInfo,
        totalXP: user.total_xp,
        coins: user.coins,
        streak,
        isStreakActive: streakActive,
      };
    } catch (error) {
      console.error('[XPService] Failed to fetch user stats:', error);
      return null;
    }
  }

  /**
   * Calculate level from total XP (pure function, no DB access).
   */
  static calculateLevel(totalXP: number): LevelInfo {
    return getLevelInfo(totalXP);
  }

  /**
   * Update streak and last_active_date (call this on daily login).
   */
  static async updateStreak(userId: string): Promise<boolean> {
    const supabase = createAdminClient();

    try {
      const { data: user } = await supabase
        .from('users')
        .select('streak_days, longest_streak, last_active_date, timezone')
        .eq('id', userId)
        .single();

      if (!user) return false;

      const today = new Date().toISOString().split('T')[0]!;
      const streakActive = isStreakActive(user.last_active_date, user.timezone);

      let newStreak = user.streak_days;
      if (streakActive) {
        // Already logged in today or yesterday → increment
        newStreak = user.streak_days + 1;
      } else {
        // Streak broken → restart at 1
        newStreak = 1;
      }

      const newLongest = Math.max(newStreak, user.longest_streak);

      await supabase
        .from('users')
        .update({
          streak_days: newStreak,
          longest_streak: newLongest,
          last_active_date: today,
        })
        .eq('id', userId);

      return true;
    } catch (error) {
      console.error('[XPService] Failed to update streak:', error);
      return false;
    }
  }

  /**
   * Get XP transaction history for a user (audit log).
   */
  static async getTransactionHistory(
    userId: string,
    limit: number = 50,
  ): Promise<any[]> {
    const supabase = createAdminClient();

    try {
      const { data, error } = await supabase
        .from('xp_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      console.error('[XPService] Failed to fetch transaction history:', error);
      return [];
    }
  }

  /**
   * Prevent duplicate routine completion on the same date.
   */
  static async recordRoutineCompletion(
    userId: string,
    routineId: string,
  ): Promise<{ success: boolean; isDuplicate: boolean }> {
    const supabase = createAdminClient();

    try {
      const today = new Date().toISOString().split('T')[0]!;

      // Check if already completed today
      const { data: existing } = await supabase
        .from('routine_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('routine_id', routineId)
        .eq('completed_date', today)
        .single();

      if (existing) {
        return { success: false, isDuplicate: true };
      }

      // Insert completion record
      const { error } = await supabase
        .from('routine_completions')
        .insert({
          user_id: userId,
          routine_id: routineId,
          completed_date: today,
        });

      if (error) throw error;

      return { success: true, isDuplicate: false };
    } catch (error) {
      console.error('[XPService] Failed to record routine completion:', error);
      return { success: false, isDuplicate: false };
    }
  }
}

// ── Convenience Exports ───────────────────────────────────────

export const awardXP = XPService.awardXP.bind(XPService);
export const getUserStats = XPService.getUserStats.bind(XPService);
export const calculateLevel = XPService.calculateLevel.bind(XPService);
export const updateStreak = XPService.updateStreak.bind(XPService);
export const getTransactionHistory = XPService.getTransactionHistory.bind(XPService);
export const recordRoutineCompletion = XPService.recordRoutineCompletion.bind(XPService);
