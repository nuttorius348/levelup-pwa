export const dynamic = 'force-dynamic';

// =============================================================
// POST /api/tasks/claim-daily — Claim XP for completing all daily tasks
// Only awards XP when ALL routine + ad-hoc tasks are done
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { grantXP } from '@/lib/xp/engine';

function isRoutineActiveForDay(recurrence: { type: string; days?: number[] } | null, dayOfWeek: number): boolean {
  if (!recurrence) return true;
  switch (recurrence.type) {
    case 'daily': return true;
    case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends': return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom': return recurrence.days?.includes(dayOfWeek) ?? true;
    default: return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();
    const admin = createAdminClient();

    // 1. Get active routines for today
    const { data: routines } = await admin
      .from('routines')
      .select('*, routine_items(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('deleted_at', null);

    const activeRoutines = (routines ?? []).filter((r: any) =>
      isRoutineActiveForDay(r.recurrence, dayOfWeek)
    );

    const allRoutineItems = activeRoutines.flatMap((r: any) => r.routine_items ?? []);

    // 2. Get today's routine completions
    const { data: completions } = await admin
      .from('routine_completions')
      .select('routine_item_id')
      .eq('user_id', user.id)
      .eq('completed_date', today);

    const completedIds = new Set((completions ?? []).map((c: any) => c.routine_item_id));

    // 3. Check all routine items are complete
    const allRoutinesDone = allRoutineItems.length === 0 || allRoutineItems.every((item: any) => completedIds.has(item.id));

    // 4. Get ad-hoc tasks for today
    const { data: adHocTasks } = await admin
      .from('checklist_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today);

    const allAdHocDone = (adHocTasks ?? []).length === 0 || (adHocTasks ?? []).every((t: any) => t.completed);

    // 5. Must have at least one task
    const totalTasks = allRoutineItems.length + (adHocTasks?.length ?? 0);
    if (totalTasks === 0) {
      return NextResponse.json({
        error: 'No tasks for today',
        allDone: false,
      }, { status: 400 });
    }

    // 6. Check everything is done
    if (!allRoutinesDone || !allAdHocDone) {
      return NextResponse.json({
        error: 'Not all tasks are completed',
        allDone: false,
        routineProgress: {
          done: allRoutineItems.filter((i: any) => completedIds.has(i.id)).length,
          total: allRoutineItems.length,
        },
        adHocProgress: {
          done: (adHocTasks ?? []).filter((t: any) => t.completed).length,
          total: (adHocTasks ?? []).length,
        },
      }, { status: 400 });
    }

    // 7. Award XP! One grant for tasks + one bonus for full day
    const taskXPResult = await grantXP({
      userId: user.id,
      action: 'routine_task',
      overrideBaseXP: Math.min(totalTasks * 15, 225), // Respect original spirit of cap
      metadata: {
        type: 'daily_claim',
        totalTasks,
        routineTasks: allRoutineItems.length,
        adHocTasks: adHocTasks?.length ?? 0,
        date: today,
      },
    });

    const bonusResult = await grantXP({
      userId: user.id,
      action: 'routine_full',
      metadata: { type: 'daily_complete', totalTasks, date: today },
    });

    const totalXP = taskXPResult.grant.finalXP + bonusResult.grant.finalXP;
    const totalCoins = taskXPResult.grant.coinsEarned + bonusResult.grant.coinsEarned;

    return NextResponse.json({
      success: true,
      xp: totalXP,
      coins: totalCoins,
      totalTasks,
      levelUp: taskXPResult.levelUp ?? bonusResult.levelUp ?? null,
      newLevel: bonusResult.levelUp?.newLevel ?? taskXPResult.levelUp?.newLevel ?? null,
      capped: taskXPResult.capped || bonusResult.capped,
    });
  } catch (error) {
    console.error('[API] tasks/claim-daily error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
