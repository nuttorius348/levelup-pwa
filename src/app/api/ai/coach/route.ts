// =============================================================
// API: POST /api/ai/coach
// AI workout/routine coaching endpoint
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { aiRouter } from '@/lib/ai/router';
import { buildWorkoutAdvicePrompt, WORKOUT_COACH_SYSTEM_PROMPT } from '@/lib/ai/prompts/workout-coach';
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const coachRequestSchema = z.object({
  question: z.string().min(5).max(1000),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  goals: z.array(z.string().max(100)).max(5).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = checkRateLimit(`ai:coach:${user.id}`, RATE_LIMITS.ai);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limited', retryAfterMs: rl.resetMs }, { status: 429 });
    }

    const body = await request.json();
    const parsed = coachRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    // Get recent workout history for context
    const { data: recentWorkouts } = await supabase
      .from('workout_logs')
      .select('title, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(5);

    const prompt = buildWorkoutAdvicePrompt({
      question: parsed.data.question,
      fitnessLevel: parsed.data.fitnessLevel,
      recentWorkouts: recentWorkouts?.map((w: { title: string }) => w.title) ?? [],
      goals: parsed.data.goals,
    });

    const response = await aiRouter.generateText(
      'workout-coach',
      prompt,
      { systemPrompt: WORKOUT_COACH_SYSTEM_PROMPT, temperature: 0.7 },
    );

    return NextResponse.json({
      advice: response.text,
      provider: response.provider,
    });
  } catch (error) {
    console.error('[API] coach error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
