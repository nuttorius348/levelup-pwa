export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { syncRoutineToCalendar, syncWeeklyRoutines } from '@/lib/services/calendar-sync.service';

/**
 * POST /api/calendar/sync-routine
 * Sync a routine to calendar
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, routineId, routineName, scheduledTime, category, mode = 'single' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    if (mode === 'weekly') {
      // Sync all routines for the week
      const result = await syncWeeklyRoutines(userId);
      return NextResponse.json(result);
    }

    // Sync single routine
    if (!routineId || !routineName) {
      return NextResponse.json(
        { error: 'Missing required fields: routineId, routineName' },
        { status: 400 }
      );
    }

    const result = await syncRoutineToCalendar({
      userId,
      routineId,
      routineName,
      scheduledTime,
      category,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Sync routine error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
