export const dynamic = 'force-dynamic';

// =============================================================
// POST /api/stretch/complete — Save a completed stretch session
// =============================================================
//
// Body: {
//   session: StretchSession (completed)
// }
//
// Awards XP via stretch_complete (+ stretch_morning_bonus),
// persists session to DB, updates progression.
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { StretchService } from '@/lib/services/stretch.service';
import { grantXP } from '@/lib/xp/engine';
import type { StretchSession } from '@/types/stretch';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session: StretchSession = body.session;

    if (!session || session.status !== 'completed') {
      return NextResponse.json(
        { error: 'Invalid or incomplete session' },
        { status: 400 },
      );
    }

    // 1. Persist the session
    const saveResult = await StretchService.saveSession(session);

    if (!saveResult.success) {
      return NextResponse.json(
        { error: saveResult.error ?? 'Failed to save session' },
        { status: 500 },
      );
    }

    // 2. Award XP via engine (stretch_complete action)
    let xpResult: any = { grant: { finalXP: 0, coinsEarned: 0 }, levelUp: null };
    try {
      xpResult = await grantXP({
        userId: session.userId,
        action: 'stretch_complete',
        metadata: {
          sessionId: session.id,
          routineId: session.routineId,
          posesCompleted: session.posesCompleted,
          durationSeconds: session.totalDurationSeconds,
        },
      });

      // Morning bonus (before 9 AM)
      if (session.xpBreakdown?.morningBonusXP > 0) {
        await grantXP({
          userId: session.userId,
          action: 'stretch_morning_bonus',
          metadata: { sessionId: session.id },
        });
      }
    } catch (xpErr) {
      console.error('[API /stretch/complete] XP grant error:', xpErr);
      // Non-critical — session is already saved
    }

    // 3. Return XP breakdown
    return NextResponse.json({
      success: true,
      xpAwarded: xpResult.grant.finalXP,
      coinsAwarded: xpResult.grant.coinsEarned,
      isMorning: session.xpBreakdown?.morningBonusXP > 0,
      breakdown: session.xpBreakdown,
      levelUp: xpResult.levelUp ?? null,
    });
  } catch (err) {
    console.error('[API /stretch/complete] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
