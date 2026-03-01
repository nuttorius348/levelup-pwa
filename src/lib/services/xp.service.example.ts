// @ts-nocheck
// =============================================================
// XP Service — Usage Examples
// =============================================================
//
// This file demonstrates production usage patterns for the
// XPService module across common scenarios.
// =============================================================

import { XPService, awardXP } from './xp.service';

// ── Example 1: Award XP for a routine completion ─────────────

export async function handleRoutineCompletion(
  userId: string,
  routineId: string,
  routineName: string,
) {
  // Step 1: Prevent duplicate completion
  const completion = await XPService.recordRoutineCompletion(userId, routineId);
  
  if (completion.isDuplicate) {
    return { success: false, message: 'Routine already completed today' };
  }

  // Step 2: Award XP with idempotency key
  const result = await awardXP({
    userId,
    action: 'routine_complete',
    idempotencyKey: `routine_${routineId}_${new Date().toISOString().split('T')[0]}`,
    metadata: {
      routineId,
      routineName,
      source: 'routine_completion_api',
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    xpAwarded: result.grant.finalXP,
    coinsEarned: result.grant.coinsEarned,
    levelUp: result.levelUp,
    newLevel: result.newLevel,
    capped: result.capped,
  };
}

// ── Example 2: Award XP for a workout with difficulty ────────

export async function handleWorkoutLog(
  userId: string,
  workoutId: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  durationMinutes: number,
) {
  const result = await awardXP({
    userId,
    action: 'workout_logged',
    workoutDifficulty: difficulty,
    workoutDurationMinutes: durationMinutes,
    idempotencyKey: `workout_${workoutId}`,
    metadata: {
      workoutId,
      difficulty,
      duration: durationMinutes,
      source: 'workout_api',
    },
  });

  return {
    success: result.success,
    xpAwarded: result.grant.finalXP,
    breakdown: {
      base: result.grant.baseXP,
      durationBonus: Math.min(durationMinutes, 60),
      streakMultiplier: result.grant.streakMultiplier,
      final: result.grant.finalXP,
    },
    cooledDown: result.cooledDown, // True if < 30 min since last workout
  };
}

// ── Example 3: Award XP for outfit submission ────────────────

export async function handleOutfitRating(
  userId: string,
  outfitId: string,
  aiScore: number, // 1-10
  previousBestScore?: number,
) {
  const result = await awardXP({
    userId,
    action: 'outfit_submit',
    outfitScore: aiScore,
    previousOutfitScore: previousBestScore,
    idempotencyKey: `outfit_${outfitId}`,
    metadata: {
      outfitId,
      aiScore,
      previousBest: previousBestScore,
      source: 'outfit_rating_api',
    },
  });

  return {
    success: result.success,
    xpAwarded: result.grant.finalXP,
    scoreBonusXP: result.grant.bonusXP,
    improvementBonus: previousBestScore && aiScore > previousBestScore,
    cooledDown: result.cooledDown, // True if < 5 min since last outfit
  };
}

// ── Example 4: Award XP for morning stretch ──────────────────

export async function handleStretchSession(
  userId: string,
  sessionId: string,
  sessionTime: Date,
) {
  const hour = sessionTime.getHours();
  const isMorning = hour >= 5 && hour < 9;

  const result = await awardXP({
    userId,
    action: 'stretch_complete',
    isMorningStretch: isMorning,
    idempotencyKey: `stretch_${sessionId}`,
    metadata: {
      sessionId,
      time: sessionTime.toISOString(),
      isMorning,
      source: 'stretch_api',
    },
  });

  return {
    success: result.success,
    xpAwarded: result.grant.finalXP,
    morningBonus: isMorning ? 15 : 0,
    cooledDown: result.cooledDown, // True if < 1 hr since last stretch
  };
}

// ── Example 5: Daily login streak update ─────────────────────

export async function handleDailyLogin(userId: string) {
  // Step 1: Update streak
  await XPService.updateStreak(userId);

  // Step 2: Get stats to check streak tier
  const stats = await XPService.getUserStats(userId);
  
  if (!stats) {
    return { success: false, error: 'User not found' };
  }

  // Step 3: Auto-award streak milestone if reached
  if (stats.streak.untilNextMilestone === 0) {
    const result = await awardXP({
      userId,
      action: 'streak_milestone',
      idempotencyKey: `streak_milestone_${stats.streak.currentDays}_${new Date().toISOString().split('T')[0]}`,
      metadata: {
        milestoneDay: stats.streak.currentDays,
        tier: stats.streak.tier.name,
        source: 'daily_login',
      },
    });

    return {
      success: true,
      streakDays: stats.streak.currentDays,
      streakTier: stats.streak.tier.name,
      milestoneReached: true,
      milestoneXP: result.grant.finalXP,
    };
  }

  return {
    success: true,
    streakDays: stats.streak.currentDays,
    streakTier: stats.streak.tier.name,
    milestoneReached: false,
  };
}

// ── Example 6: Get user dashboard data ───────────────────────

export async function getUserDashboard(userId: string) {
  const stats = await XPService.getUserStats(userId);
  
  if (!stats) {
    return null;
  }

  return {
    level: stats.level,
    title: stats.levelInfo.title,
    currentXP: stats.levelInfo.currentLevelXP,
    nextLevelXP: stats.levelInfo.nextLevelXP,
    progressPercent: stats.levelInfo.progressPercent,
    totalXP: stats.totalXP,
    coins: stats.coins,
    
    streak: {
      days: stats.streak.currentDays,
      isActive: stats.isStreakActive,
      tier: stats.streak.tier.name,
      multiplier: stats.streak.tier.multiplier,
      nextMilestone: stats.streak.nextMilestone,
      daysUntilMilestone: stats.streak.untilNextMilestone,
    },
  };
}

// ── Example 7: Transaction history for audit ─────────────────

export async function getRecentActivity(userId: string) {
  const transactions = await XPService.getTransactionHistory(userId, 20);

  return transactions.map((tx) => ({
    id: tx.id,
    action: tx.action_type,
    xpAwarded: tx.final_xp,
    coinsEarned: tx.coins_earned,
    timestamp: tx.created_at,
    metadata: tx.metadata,
  }));
}

// ── Example 8: API Route Handler (Next.js App Router) ────────

export async function POST_RoutineComplete(request: Request) {
  const { userId, routineId, routineName } = await request.json();

  // Validate inputs
  if (!userId || !routineId) {
    return Response.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  // Handle completion
  const result = await handleRoutineCompletion(userId, routineId, routineName);

  if (!result.success) {
    return Response.json(
      { error: result.error || result.message },
      { status: 400 },
    );
  }

  return Response.json({
    success: true,
    data: {
      xpAwarded: result.xpAwarded,
      coinsEarned: result.coinsEarned,
      newLevel: result.newLevel,
      levelUp: result.levelUp
        ? {
            oldLevel: result.levelUp.oldLevel,
            newLevel: result.levelUp.newLevel,
            coinsAwarded: result.levelUp.coinsAwarded,
          }
        : null,
    },
  });
}

// ── Example 9: Retry logic for critical operations ───────────

export async function awardXPWithRetry(
  params: Parameters<typeof awardXP>[0],
  maxRetries = 3,
) {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await awardXP(params);
      
      if (result.success) {
        return result;
      }

      // If failed but not a duplicate, retry
      if (!result.isDuplicate && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        continue;
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw lastError || new Error('Failed after retries');
}

// ── Example 10: Batch XP awards (with rate limiting) ─────────

export async function awardBatchXP(
  awards: Array<Parameters<typeof awardXP>[0]>,
  delayMs = 100,
) {
  const results = [];

  for (const award of awards) {
    const result = await awardXP(award);
    results.push(result);
    
    // Rate limit to prevent DB overload
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
