// =============================================================
// API: POST /api/cron/notifications — Background notification cron
// =============================================================
//
// Designed to be called by Vercel Cron (or equivalent) on a schedule.
// Protected by CRON_SECRET header.
//
// Jobs:
//  • Morning Quote    — 7 AM daily for users who opted in
//  • Daily Reminder   — 9 AM daily check-in reminder
//  • Workout Reminder — 6 PM daily workout reminder
//  • Streak Reminder  — 8 PM daily for users who haven't been active
//
// Vercel Cron config (vercel.json):
// {
//   "crons": [
//     { "path": "/api/cron/notifications?job=morning-quote", "schedule": "0 7 * * *" },
//     { "path": "/api/cron/notifications?job=daily-reminder", "schedule": "0 9 * * *" },
//     { "path": "/api/cron/notifications?job=workout-reminder", "schedule": "0 18 * * *" },
//     { "path": "/api/cron/notifications?job=streak-reminder", "schedule": "0 20 * * *" }
//   ]
// }
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import webPush from 'web-push';

// Configure VAPID
webPush.setVapidDetails(
  process.env.VAPID_CONTACT_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// ── Types ─────────────────────────────────────────────────────

interface PushTarget {
  userId: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
  subId: string;
}

// ── Helpers ───────────────────────────────────────────────────

async function sendPush(
  target: PushTarget,
  payload: { title: string; body: string; url?: string; tag?: string; icon?: string },
  admin: ReturnType<typeof createAdminClient>,
): Promise<boolean> {
  try {
    await webPush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.keys_p256dh, auth: target.keys_auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? '/dashboard',
        icon: payload.icon ?? '/icons/icon-192x192.png',
        tag: payload.tag ?? 'levelup-cron',
      }),
    );
    return true;
  } catch (err: any) {
    // Expired subscription — deactivate
    if (err.statusCode === 410 || err.statusCode === 404) {
      await admin.from('push_subscriptions').update({ is_active: false }).eq('id', target.subId);
    }
    return false;
  }
}

async function getActiveSubscriptions(admin: ReturnType<typeof createAdminClient>): Promise<PushTarget[]> {
  const { data } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, keys_p256dh, keys_auth')
    .eq('is_active', true);

  if (!data) return [];

  return data.map((sub: any) => ({
    userId: sub.user_id,
    endpoint: sub.endpoint,
    keys_p256dh: sub.keys_p256dh,
    keys_auth: sub.keys_auth,
    subId: sub.id,
  }));
}

// ── Job: Morning Quote ────────────────────────────────────────

async function runMorningQuote(admin: ReturnType<typeof createAdminClient>) {
  const subscriptions = await getActiveSubscriptions(admin);
  if (!subscriptions.length) return { sent: 0, failed: 0, job: 'morning-quote' };

  // Get today's quote
  let quoteText = 'Start your day with purpose. Every rep counts. 🔥';
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/ai/quote/today`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      quoteText = data.quote?.quoteText || data.quote?.text || quoteText;
    }
  } catch {
    // Use fallback quote above
  }

  // Filter to users with dailyQuote pref enabled (check notification_preferences JSONB)
  // For users without explicit prefs, still send (default = enabled)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, notification_preferences')
    .eq('notifications_enabled', true);

  const enabledUserIds = new Set<string>();
  if (profiles) {
    for (const profile of profiles) {
      const prefs = profile.notification_preferences as Record<string, boolean> | null;
      // Default to enabled if no prefs set
      if (!prefs || prefs.dailyQuote !== false) {
        enabledUserIds.add(profile.id);
      }
    }
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    if (!enabledUserIds.has(sub.userId)) continue;

    const success = await sendPush(sub, {
      title: '💬 Your Morning Quote',
      body: quoteText.length > 120 ? quoteText.substring(0, 117) + '...' : quoteText,
      url: '/quote',
      tag: 'daily-quote',
    }, admin);

    if (success) sent++;
    else failed++;
  }

  return { sent, failed, job: 'morning-quote' };
}

// ── Job: Streak Reminder ──────────────────────────────────────

async function runStreakReminder(admin: ReturnType<typeof createAdminClient>) {
  const subscriptions = await getActiveSubscriptions(admin);
  if (!subscriptions.length) return { sent: 0, failed: 0, job: 'streak-reminder' };

  // Find users who haven't earned XP today
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Get all user IDs with active subscriptions
  const subUserIds = [...new Set(subscriptions.map((s) => s.userId))];

  // Check who HAS activity today (xp_ledger entries)
  const { data: activeToday } = await admin
    .from('xp_ledger')
    .select('user_id')
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`)
    .in('user_id', subUserIds);

  const activeUserIds = new Set((activeToday || []).map((r: any) => r.user_id));

  // Filter to users who opted in to streak reminders
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, notification_preferences, streak_days')
    .eq('notifications_enabled', true)
    .in('id', subUserIds);

  const targetUsers = new Map<string, number>(); // userId -> streak
  if (profiles) {
    for (const profile of profiles) {
      // Skip users who already have activity today
      if (activeUserIds.has(profile.id)) continue;

      const prefs = profile.notification_preferences as Record<string, boolean> | null;
      // Default to enabled
      if (!prefs || prefs.streakReminder !== false) {
        targetUsers.set(profile.id, (profile as any).streak_days ?? 0);
      }
    }
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    if (!targetUsers.has(sub.userId)) continue;

    const streak = targetUsers.get(sub.userId) ?? 0;
    const body = streak > 0
      ? `You have a ${streak}-day streak! Don't let it break — log something before midnight. 🔥`
      : `Start a new streak today! Complete any task to begin. 💪`;

    const success = await sendPush(sub, {
      title: '🔥 Streak Reminder',
      body,
      url: '/dashboard',
      tag: 'streak-reminder',
    }, admin);

    if (success) sent++;
    else failed++;
  }

  return { sent, failed, job: 'streak-reminder' };
}

// ── Job: Daily Reminder ───────────────────────────────────────

async function runDailyReminder(admin: ReturnType<typeof createAdminClient>) {
  const subscriptions = await getActiveSubscriptions(admin);
  if (!subscriptions.length) return { sent: 0, failed: 0, job: 'daily-reminder' };

  // Filter to users with dailyReminder pref enabled
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, notification_preferences, display_name')
    .eq('notifications_enabled', true);

  const enabledUserIds = new Set<string>();
  const userNames = new Map<string, string>();

  if (profiles) {
    for (const profile of profiles) {
      const prefs = profile.notification_preferences as Record<string, boolean> | null;
      // Check for dailyReminder pref (defaults to enabled if not set)
      if (!prefs || prefs.dailyReminder !== false) {
        enabledUserIds.add(profile.id);
        userNames.set(profile.id, profile.display_name || 'Champion');
      }
    }
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    if (!enabledUserIds.has(sub.userId)) continue;

    const name = userNames.get(sub.userId) || 'Champion';
    const body = `Good morning, ${name}! Ready to level up today? Check in and earn your XP. 💪`;

    const success = await sendPush(sub, {
      title: '🌅 Daily Check-In',
      body,
      url: '/dashboard',
      tag: 'daily-reminder',
    }, admin);

    if (success) sent++;
    else failed++;
  }

  return { sent, failed, job: 'daily-reminder' };
}

// ── Job: Workout Reminder ─────────────────────────────────────

async function runWorkoutReminder(admin: ReturnType<typeof createAdminClient>) {
  const subscriptions = await getActiveSubscriptions(admin);
  if (!subscriptions.length) return { sent: 0, failed: 0, job: 'workout-reminder' };

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Get all user IDs with active subscriptions
  const subUserIds = [...new Set(subscriptions.map((s) => s.userId))];

  // Check who has already logged a workout today
  const { data: workoutsToday } = await admin
    .from('workout_logs')
    .select('user_id')
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`)
    .in('user_id', subUserIds);

  const loggedTodayIds = new Set((workoutsToday || []).map((r: any) => r.user_id));

  // Filter to users with workoutReminder pref enabled
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, notification_preferences')
    .eq('notifications_enabled', true)
    .in('id', subUserIds);

  const targetUserIds = new Set<string>();
  if (profiles) {
    for (const profile of profiles) {
      // Skip users who already logged a workout today
      if (loggedTodayIds.has(profile.id)) continue;

      const prefs = profile.notification_preferences as Record<string, boolean> | null;
      // Default to enabled
      if (!prefs || prefs.workoutReminder !== false) {
        targetUserIds.add(profile.id);
      }
    }
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    if (!targetUserIds.has(sub.userId)) continue;

    const body = `Don't forget to log your workout today! Every rep counts. 🏋️`;

    const success = await sendPush(sub, {
      title: '💪 Workout Reminder',
      body,
      url: '/workout',
      tag: 'workout-reminder',
    }, admin);

    if (success) sent++;
    else failed++;
  }

  return { sent, failed, job: 'workout-reminder' };
}

// ── Route Handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  return handleCron(request);
}

// Also support GET for Vercel Cron (which sends GET requests)
export async function GET(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret =
      request.headers.get('x-cron-secret') ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = request.nextUrl.searchParams.get('job');
    const admin = createAdminClient();

    switch (job) {
      case 'morning-quote':
        return NextResponse.json(await runMorningQuote(admin));

      case 'daily-reminder':
        return NextResponse.json(await runDailyReminder(admin));

      case 'workout-reminder':
        return NextResponse.json(await runWorkoutReminder(admin));

      case 'streak-reminder':
        return NextResponse.json(await runStreakReminder(admin));

      case 'all': {
        // Run all jobs (useful for testing)
        const quoteResult = await runMorningQuote(admin);
        const dailyResult = await runDailyReminder(admin);
        const workoutResult = await runWorkoutReminder(admin);
        const streakResult = await runStreakReminder(admin);
        return NextResponse.json({ results: [quoteResult, dailyResult, workoutResult, streakResult] });
      }

      default:
        return NextResponse.json(
          { error: `Unknown job: ${job}. Use ?job=morning-quote|daily-reminder|workout-reminder|streak-reminder|all` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[CRON] notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
