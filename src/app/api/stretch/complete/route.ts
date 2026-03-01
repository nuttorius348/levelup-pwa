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

    // 2. Return XP breakdown
    return NextResponse.json({
      success: true,
      xpAwarded: session.xpBreakdown.totalXP,
      coinsAwarded: session.xpBreakdown.coinsEarned,
      isMorning: session.xpBreakdown.morningBonusXP > 0,
      breakdown: session.xpBreakdown,
    });
  } catch (err) {
    console.error('[API /stretch/complete] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
