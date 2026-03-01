export const dynamic = 'force-dynamic';

// =============================================================
// GET /api/stretch/stats — Flexibility stats + progression
// =============================================================
//
// Query params:
//   userId (required)
//
// Returns: {
//   stats: FlexibilityStats,
//   progression: { difficulty, canAdvance, ... }
// }
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { StretchService } from '@/lib/services/stretch.service';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    // Fetch stats + progression in parallel
    const [stats, sessionCount] = await Promise.all([
      StretchService.getFlexibilityStats(userId),
      StretchService.getSessionCount(userId),
    ]);

    // Get progression data from DB
    let currentDifficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    let currentStreak = 0;

    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('stretch_progression')
        .select('current_difficulty, consecutive_days')
        .eq('user_id', userId)
        .single();

      if (data) {
        currentDifficulty = data.current_difficulty as typeof currentDifficulty;
        currentStreak = data.consecutive_days ?? 0;
      }
    } catch {
      // No progression row yet — default to beginner
    }

    const progression = StretchService.checkProgression({
      totalSessions: sessionCount,
      currentStreak,
      currentDifficulty,
    });

    // Daily challenge status
    const dailyChallenge = StretchService.getDailyChallenge();
    const dailyChallengeCompleted = await StretchService.hasDailyChallengeCompleted(userId);

    return NextResponse.json({
      stats,
      progression: {
        currentDifficulty,
        currentStreak,
        ...progression,
      },
      dailyChallenge: {
        routine: {
          id: dailyChallenge.routine.id,
          title: dailyChallenge.routine.title,
          icon: dailyChallenge.routine.icon,
          estimatedMinutes: dailyChallenge.routine.estimatedMinutes,
        },
        bonusXP: dailyChallenge.bonusXP,
        completed: dailyChallengeCompleted,
        expiresAt: dailyChallenge.expiresAt,
      },
    });
  } catch (err) {
    console.error('[API /stretch/stats] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
