import { NextRequest, NextResponse } from 'next/server';
import { updateStreak } from '@/lib/services/xp.service';

/**
 * POST /api/xp/update-streak
 * Update user's daily login streak
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    const success = await updateStreak(userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update streak' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Update streak error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
