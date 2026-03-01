import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/lib/services/workout.service';

// GET /api/workout/history?userId=xxx&limit=30

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') ?? '30', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 },
      );
    }

    const history = await WorkoutService.getHistory(userId, limit);

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('[API] /workout/history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 },
    );
  }
}
