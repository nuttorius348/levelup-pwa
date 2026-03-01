// =============================================================
// Notification Helpers — Trigger push notifications
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import webPush from 'web-push';

// Configure VAPID (safe to call multiple times)
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

// ── Types ─────────────────────────────────────────────────────

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

// ── Send push notification to a specific user ────────────────

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!process.env.VAPID_PRIVATE_KEY) {
    console.warn('[Notifications] VAPID keys not configured, skipping push');
    return;
  }

  const admin = createAdminClient();

  // Get user's active push subscriptions
  const { data: subscriptions } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, keys_p256dh, keys_auth')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!subscriptions?.length) {
    return; // User not subscribed to push
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/dashboard',
    icon: payload.icon ?? '/icons/icon-192x192.png',
    tag: payload.tag ?? 'levelup-notification',
  });

  // Send to all user's devices
  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        },
        pushPayload,
      );
    } catch (err: any) {
      // Expired subscription — deactivate
      if (err.statusCode === 410 || err.statusCode === 404) {
        await admin
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', sub.id);
      }
    }
  }
}

// ── Level Up Notification ─────────────────────────────────────

export async function sendLevelUpNotification(
  userId: string,
  oldLevel: number,
  newLevel: number,
): Promise<void> {
  // Check if user has levelUp notifications enabled
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('notification_preferences, notifications_enabled')
    .eq('id', userId)
    .single();

  if (!profile?.notifications_enabled) return;

  const prefs = profile.notification_preferences as Record<string, boolean> | null;
  if (prefs && prefs.levelUp === false) return;

  // Send notification
  await sendPushToUser(userId, {
    title: '⬆️ Level Up!',
    body: `Congratulations! You've reached level ${newLevel}. Keep pushing! 🎉`,
    url: '/dashboard',
    tag: 'level-up',
  });
}

// ── XP Milestone Notification ────────────────────────────────

export async function sendXPMilestoneNotification(
  userId: string,
  totalXP: number,
): Promise<void> {
  // Check if this is a milestone (100, 500, 1000, 5000, 10000, etc.)
  const milestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
  
  // Check if we just crossed a milestone (within the last XP grant)
  // This is a simple check - you might want to make this more sophisticated
  const isMilestone = milestones.includes(totalXP);
  
  if (!isMilestone) return;

  // Check if user has levelUp notifications enabled (we use same pref for milestones)
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('notification_preferences, notifications_enabled')
    .eq('id', userId)
    .single();

  if (!profile?.notifications_enabled) return;

  const prefs = profile.notification_preferences as Record<string, boolean> | null;
  if (prefs && prefs.levelUp === false) return;

  // Send notification
  await sendPushToUser(userId, {
    title: '🏆 XP Milestone!',
    body: `Amazing! You've reached ${totalXP.toLocaleString()} total XP! 💪`,
    url: '/dashboard',
    tag: 'xp-milestone',
  });
}
