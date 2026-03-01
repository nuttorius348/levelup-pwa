// =============================================================
// API: POST /api/workouts/log — Log a completed workout
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logWorkoutSchema } from '@/lib/validators/workouts';
import { grantXP } from '@/lib/xp/engine';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = logWorkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    // Determine difficulty-based action
    const difficulty = parsed.data.difficulty ?? 'beginner';
    const workoutAction = `workout_${difficulty}` as 'workout_beginner' | 'workout_intermediate' | 'workout_advanced';

    // Grant XP first
    const xpResult = await grantXP({
      userId: user.id,
      action: workoutAction,
      metadata: { title: parsed.data.title, duration: parsed.data.durationMinutes },
    });

    // Save workout log
    const { data: log, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        template_id: parsed.data.templateId ?? null,
        title: parsed.data.title,
        duration_minutes: parsed.data.durationMinutes ?? null,
        exercises_completed: parsed.data.exercises,
        notes: parsed.data.notes ?? null,
        mood_before: parsed.data.moodBefore ?? null,
        mood_after: parsed.data.moodAfter ?? null,
        xp_earned: xpResult.grant.finalXP,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to log workout' }, { status: 500 });
    }

    return NextResponse.json({
      log,
      xp: xpResult.grant,
      levelUp: xpResult.levelUp ?? null,
    }, { status: 201 });
  } catch (error) {
    console.error('[API] workouts/log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
