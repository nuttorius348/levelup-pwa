export const dynamic = 'force-dynamic';

// =============================================================
// POST /api/tasks/complete — Mark a routine item or ad-hoc task done
// Awards XP immediately per task (routine_task action, 15 XP base)
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { grantXP } from '@/lib/xp/engine';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, routineId, routineItemId, taskId } = body;
    const today = new Date().toISOString().split('T')[0];

    if (type === 'routine' && routineId && routineItemId) {
      // Check if already completed today
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from('routine_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('routine_item_id', routineItemId)
        .eq('completed_date', today)
        .single();

      if (existing) {
        return NextResponse.json({ completed: true, alreadyDone: true, xp: 0 });
      }

      // Award XP for completing the task
      let xpEarned = 0;
      try {
        const xpResult = await grantXP({
          userId: user.id,
          action: 'routine_task',
          metadata: { routine_id: routineId, item_id: routineItemId, source: 'tasks_page' },
        });
        xpEarned = xpResult.grant.finalXP;
      } catch (xpErr) {
        console.error('[API] tasks/complete XP error:', xpErr);
      }

      // Record completion
      const { error: insertErr } = await admin
        .from('routine_completions')
        .insert({
          user_id: user.id,
          routine_id: routineId,
          routine_item_id: routineItemId,
          completed_date: today,
          xp_earned: xpEarned,
        });

      if (insertErr) {
        console.error('[API] tasks/complete routine error:', insertErr.message);
        return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 });
      }

      return NextResponse.json({ completed: true, xp: xpEarned });
    }

    if (type === 'adhoc' && taskId) {
      const admin = createAdminClient();
      const { error: updateErr } = await admin
        .from('checklist_tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (updateErr) {
        console.error('[API] tasks/complete adhoc error:', updateErr.message);
        return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
      }

      // Award XP for ad-hoc task
      let xpEarned = 0;
      try {
        const xpResult = await grantXP({
          userId: user.id,
          action: 'routine_task',
          metadata: { task_id: taskId, source: 'adhoc_task' },
        });
        xpEarned = xpResult.grant.finalXP;
      } catch (xpErr) {
        console.error('[API] tasks/complete adhoc XP error:', xpErr);
      }

      return NextResponse.json({ completed: true, xp: xpEarned });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('[API] tasks/complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
