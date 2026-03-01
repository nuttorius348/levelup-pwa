export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/lib/services/workout.service';
import { XPService } from '@/lib/services/xp.service';
import { WORKOUT_XP_BY_DIFFICULTY } from '@/lib/constants/xp';
import type { WorkoutDifficulty } from '@/types/xp';

// POST /api/workout/complete
// Body: { userId, session (serialized WorkoutSession), moodAfter?, streakMultiplier? }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, session, moodAfter, streakMultiplier = 1.0 } = body;

    if (!userId || !session) {
      return NextResponse.json(
        { error: 'Missing userId or session' },
        { status: 400 },
      );
    }

    // 1. Complete the session (calculates XP, detects PRs)
    const result = await WorkoutService.completeSession(
      session,
      moodAfter,
      streakMultiplier,
    );

    // 2. Save workout log to DB
    const logId = await WorkoutService.saveWorkoutLog(result.session);

    // 3. Save personal records
    if (result.personalRecords.length > 0) {
      await WorkoutService.savePersonalRecords(userId, result.personalRecords);
    }

    // 4. Record overload data for each exercise
    for (const exercise of result.session.exercises) {
      await WorkoutService.recordOverload(
        userId,
        exercise,
        result.session.difficulty,
      );
    }

    // 5. Award XP via XP Service
    const difficulty = result.session.difficulty as WorkoutDifficulty;
    const xpAction = WORKOUT_XP_BY_DIFFICULTY[difficulty].action;
    const durationMinutes = Math.floor(
      result.session.totalDurationSeconds / 60,
    );

    const xpResult = await XPService.awardXP({
      userId,
      action: xpAction,
      workoutDifficulty: difficulty,
      workoutDurationMinutes: durationMinutes,
      idempotencyKey: `workout_${logId ?? result.session.id}`,
      metadata: {
        workoutId: result.session.id,
        logId,
        totalVolume: result.session.totalVolume,
        personalRecords: result.personalRecords.length,
        exercisesCompleted: result.session.exercisesCompleted,
      },
    });

    return NextResponse.json({
      success: true,
      logId,
      xpBreakdown: result.xpBreakdown,
      personalRecords: result.personalRecords,
      xpAwarded: xpResult.grant.finalXP,
      levelUp: xpResult.levelUp ?? null,
      newLevel: xpResult.newLevel,
      newTotalXP: xpResult.newTotalXP,
    });
  } catch (error) {
    console.error('[API] /workout/complete error:', error);
    return NextResponse.json(
      { error: 'Failed to complete workout' },
      { status: 500 },
    );
  }
}
