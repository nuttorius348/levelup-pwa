export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/lib/services/workout.service';

// GET /api/workout/overload?userId=xxx&exerciseId=ex_001&limit=20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const exerciseId = searchParams.get('exerciseId');
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    if (!userId || !exerciseId) {
      return NextResponse.json(
        { error: 'Missing userId or exerciseId' },
        { status: 400 },
      );
    }

    const history = await WorkoutService.getOverloadHistory(
      userId,
      exerciseId,
      limit,
    );

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('[API] /workout/overload error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overload history' },
      { status: 500 },
    );
  }
}

// POST /api/workout/overload — Get suggestions for multiple exercises
// Body: { userId, exerciseIds: string[] }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, exerciseIds } = body;

    if (!userId || !exerciseIds?.length) {
      return NextResponse.json(
        { error: 'Missing userId or exerciseIds' },
        { status: 400 },
      );
    }

    const suggestions = await WorkoutService.getOverloadSuggestions(
      userId,
      exerciseIds,
    );

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error('[API] /workout/overload suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 },
    );
  }
}
