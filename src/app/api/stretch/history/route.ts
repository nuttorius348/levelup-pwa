// =============================================================
// GET /api/stretch/history — Fetch stretch session history
// =============================================================
//
// Query params:
//   userId  (required) — user ID
//   limit   (optional, default 20)
//   offset  (optional, default 0)
//
// Returns: { sessions: StretchHistoryEntry[], total: number }
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { StretchService } from '@/lib/services/stretch.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    const sessions = await StretchService.getHistory(userId, limit, offset);
    const total = await StretchService.getSessionCount(userId);

    return NextResponse.json({
      sessions,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[API /stretch/history] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
