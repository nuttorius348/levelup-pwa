// =============================================================
// API: POST /api/xp/grant — Server-validated XP grant
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { grantXP } from '@/lib/xp/engine';
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';
import { sendLevelUpNotification, sendXPMilestoneNotification } from '@/lib/notifications/helpers';
import { z } from 'zod';

const grantXPSchema = z.object({
  action: z.enum([
    'routine_task',
    'routine_full',
    'workout_beginner',
    'workout_intermediate',
    'workout_advanced',
    'stretch_complete',
    'outfit_submit',
    'quote_read',
    'daily_login',
  ]),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = checkRateLimit(`xp:${user.id}`, RATE_LIMITS.xp);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = grantXPSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await grantXP({
      userId: user.id,
      action: parsed.data.action,
      metadata: parsed.data.metadata,
    });

    // Fire-and-forget push notifications for level ups and XP milestones
    if (result.levelUp) {
      sendLevelUpNotification(
        user.id,
        result.levelUp.previousLevel,
        result.levelUp.newLevel,
      ).catch((err) => console.error('[Notifications] Level up push failed:', err));
    }

    sendXPMilestoneNotification(user.id, result.newTotalXP).catch((err) =>
      console.error('[Notifications] XP milestone push failed:', err),
    );

    return NextResponse.json({
      xp: result.grant,
      newTotalXP: result.newTotalXP,
      newCoins: result.newCoins,
      levelUp: result.levelUp ?? null,
    });
  } catch (error) {
    console.error('[API] xp/grant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
