export const dynamic = 'force-dynamic';

// =============================================================
// API: POST /api/routines/complete — Mark a routine item done
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { grantXP } from '@/lib/xp/engine';
import { completeRoutineItemSchema } from '@/lib/validators/routines';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = completeRoutineItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { routineId, routineItemId } = parsed.data;
    const today = new Date().toISOString().split('T')[0];

    // Check if already completed today
    const { data: existing } = await supabase
      .from('routine_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('routine_item_id', routineItemId)
      .eq('completed_date', today)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already completed today' }, { status: 409 });
    }

    // Grant XP
    const xpResult = await grantXP({
      userId: user.id,
      action: 'routine_task',
      metadata: { routine_id: routineId, item_id: routineItemId },
    });

    // Record completion
    await supabase.from('routine_completions').insert({
      user_id: user.id,
      routine_id: routineId,
      routine_item_id: routineItemId,
      completed_date: today,
      xp_earned: xpResult.grant.finalXP,
    });

    // Check if all items in routine are now complete → bonus XP
    const { data: allItems } = await supabase
      .from('routine_items')
      .select('id')
      .eq('routine_id', routineId);

    const { data: todayCompletions } = await supabase
      .from('routine_completions')
      .select('routine_item_id')
      .eq('user_id', user.id)
      .eq('routine_id', routineId)
      .eq('completed_date', today);

    const allComplete = allItems?.every((item: { id: string }) =>
      todayCompletions?.some((c: { routine_item_id: string | null }) => c.routine_item_id === item.id),
    );

    let fullRoutineXP = null;
    if (allComplete) {
      const bonusResult = await grantXP({
        userId: user.id,
        action: 'routine_full',
        metadata: { routine_id: routineId },
      });
      fullRoutineXP = bonusResult.grant;
    }

    return NextResponse.json({
      completed: true,
      xp: xpResult.grant,
      fullRoutineBonus: fullRoutineXP,
      levelUp: xpResult.levelUp ?? null,
    });
  } catch (error) {
    console.error('[API] routines/complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
