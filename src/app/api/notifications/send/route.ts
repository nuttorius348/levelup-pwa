export const dynamic = 'force-dynamic';

// =============================================================
// API: POST /api/notifications/send — Trigger push notification
// Protected by CRON_SECRET for cron jobs, or admin auth
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import webPush from 'web-push';
import { z } from 'zod';

// Configure VAPID
webPush.setVapidDetails(
  process.env.VAPID_CONTACT_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const sendNotificationSchema = z.object({
  userId: z.string().uuid().optional(),     // Send to specific user
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
  icon: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or admin auth
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = sendNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get push subscriptions
    let query = admin
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (parsed.data.userId) {
      query = query.eq('user_id', parsed.data.userId);
    }

    const { data: subscriptions } = await query;

    if (!subscriptions?.length) {
      return NextResponse.json({ sent: 0, message: 'No active subscriptions' });
    }

    // Send notifications
    const payload = JSON.stringify({
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url ?? '/',
      icon: parsed.data.icon ?? '/icons/icon-192x192.png',
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          payload,
        );
        sent++;
      } catch (err: any) {
        failed++;
        // If subscription expired, deactivate it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await admin
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id);
        }
      }
    }

    return NextResponse.json({ sent, failed });
  } catch (error) {
    console.error('[API] notifications/send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
