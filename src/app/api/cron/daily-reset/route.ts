export const dynamic = 'force-dynamic';

// =============================================================
// API: POST /api/cron/daily-reset
// Runs daily via Vercel Cron — resets caps, updates streaks
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // 1. Update streaks — users active yesterday keep their streak
    //    Users NOT active yesterday get their streak broken
    const { data: activeUsers } = await admin
      .from('profiles')
      .select('id, streak_days, longest_streak, last_active_date')
      .not('last_active_date', 'is', null);

    let streaksUpdated = 0;
    let streaksBroken = 0;

    for (const user of activeUsers ?? []) {
      if (user.last_active_date === yesterday || user.last_active_date === today) {
        // Streak continues — no action needed
        streaksUpdated++;
      } else {
        // Streak broken
        await admin
          .from('profiles')
          .update({ streak_days: 0 })
          .eq('id', user.id);
        streaksBroken++;
      }
    }

    // 2. Clean up old daily caps (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    await admin
      .from('daily_xp_caps')
      .delete()
      .lt('cap_date', sevenDaysAgo);

    return NextResponse.json({
      date: today,
      streaksUpdated,
      streaksBroken,
      message: 'Daily reset complete',
    });
  } catch (error) {
    console.error('[CRON] daily-reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
