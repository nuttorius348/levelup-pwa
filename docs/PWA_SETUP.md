# LevelUp PWA Implementation

Complete Progressive Web App setup with home screen install, iOS 16.4+ Web Push, offline support, and background sync.

## 📱 Features

- ✅ **Home Screen Install** — iOS, Android, Desktop
- ✅ **Push Notifications** — iOS 16.4+, Android, Desktop with VAPID
- ✅ **Offline Support** — App shell precaching, network-first navigation
- ✅ **Background Sync** — Queued XP grants and workout logs sync when online
- ✅ **Scheduled Push** — Morning quotes (7 AM) and streak reminders (8 PM)
- ✅ **Cache Strategies** — Network-first navigation, cache-first static assets, stale-while-revalidate images

## 🏗️ Architecture

### Core Files

```
src/app/manifest.ts                       # Web App Manifest (icons, screenshots, shortcuts)
public/sw.js                             # Service Worker (caching, push, sync)
src/app/layout.tsx                       # SW registration + InstallPrompt

src/lib/notifications/web-push.ts        # Client-side push subscription utilities

src/app/api/notifications/
  subscribe/route.ts                     # Save push subscription to DB
  send/route.ts                          # Trigger push notification (cron-protected)
  preferences/route.ts                   # Save/load per-user notification prefs

src/app/api/cron/notifications/route.ts  # Background cron jobs (morning quote, streak reminder)

src/components/pwa/
  InstallPrompt.tsx                      # Home screen install prompt (iOS + Android)
  NotificationManager.tsx                # Push notification opt-in UI

src/app/settings/page.tsx                # Settings page (hosts NotificationManager)
src/app/pwa/page.tsx                     # PWA documentation page

supabase/migrations/
  001_initial_schema.sql                 # push_subscriptions table + notifications_enabled column
  006_notification_preferences.sql       # notification_preferences JSONB column
```

## 📱 iOS 16.4+ Web Push Requirements

iOS 16.4+ supports Web Push, but with **strict requirements**:

1. ✅ App MUST be installed to home screen (standalone mode)
2. ✅ Permission MUST be requested from a user gesture (button tap)
3. ✅ Service worker must be registered and active
4. ✅ VAPID keys must be configured
5. ✅ Push handler MUST call `showNotification()`

**All requirements implemented in LevelUp.**

### How it Works

1. User visits site → `InstallPrompt` appears after 3 seconds
2. iOS: Manual instructions (Share → Add to Home Screen)
3. Android/Desktop: Native `beforeinstallprompt` dialog
4. User installs → `NotificationManager` becomes available in Settings
5. User taps "Enable Push Notifications" → Permission requested from gesture
6. Subscription saved to `push_subscriptions` table with VAPID keys
7. Cron jobs send scheduled notifications via `web-push` npm library

## 💾 Caching Strategy

| Strategy                  | Scope                                        |
|---------------------------|----------------------------------------------|
| **Precache**              | App shell (/, /dashboard, /offline)         |
| **Network-first**         | Navigation requests                          |
| **Cache-first**           | Static assets (CSS, JS, fonts, icons, splash) |
| **Stale-while-revalidate**| Images and other resources                   |
| **Network-only**          | API routes (/api/*)                          |

## 🔄 Background Sync

When offline, XP grants and workout logs are queued in IndexedDB and automatically synced when the connection is restored.

### Sync Queues

- **xp-queue** — Offline XP grants
- **workout-queue** — Offline workout logs

Service worker listens for `sync` events and POSTs queued data to:
- `/api/xp/grant`
- `/api/workouts/log`

## ⏰ Scheduled Notifications

### Morning Quote (7:00 AM daily)

Sends today's AI-generated motivational quote to users who opt in. Uses theme rotation (boxing → comeback → discipline).

**API:** `GET /api/cron/notifications?job=morning-quote`

### Streak Reminder (8:00 PM daily)

Reminds users who haven't been active today to maintain their streak. Only sent if no XP earned since midnight.

**API:** `GET /api/cron/notifications?job=streak-reminder`

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications?job=morning-quote",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/cron/notifications?job=streak-reminder",
      "schedule": "0 20 * * *"
    }
  ]
}
```

## 🔐 Environment Variables

```bash
# VAPID Configuration
VAPID_CONTACT_EMAIL=mailto:your@email.com       # Or https://yoursite.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key    # Base64 URL-safe
VAPID_PRIVATE_KEY=your_private_key              # Base64 URL-safe (server-only)

# Cron Authentication
CRON_SECRET=your_random_secret                  # Strong random string

# App URL (for cron jobs to fetch daily quote)
NEXT_PUBLIC_APP_URL=https://levelup.yoursite.com
```

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key: BK...
Private Key: xJ...
```

Add both to `.env.local` and deploy secrets.

## 🧪 Testing

### iOS Testing

1. Open Safari on iPhone running **iOS 16.4+**
2. Navigate to your deployed site
3. Tap **Share** → **Add to Home Screen**
4. Open LevelUp from home screen (standalone mode)
5. Go to **Settings** and tap **Enable Push Notifications**
6. Grant permission when prompted
7. Trigger a test notification:

```bash
curl -X POST https://yourapp.com/api/notifications/send \
  -H "x-cron-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "Push works! 🎉",
    "url": "/dashboard"
  }'
```

### Android Testing

1. Open Chrome on Android
2. Visit site → Install prompt appears automatically
3. Tap **Install**
4. Open app → Go to Settings → Enable notifications

### Desktop Testing

Works on Chrome/Edge 42+, Firefox 44+. Install prompt appears in address bar.

## 📊 Database Schema

### `push_subscriptions` Table

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `profiles` Notification Columns

```sql
ALTER TABLE profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT 
  '{"streakReminder": true, "dailyQuote": true, "workoutReminder": true, "levelUp": true}'::jsonb;
```

## 🎯 Notification Preferences

Users can toggle individual notification types:

- 🔥 **Streak Reminder** — Daily reminder to maintain streak
- 💬 **Daily Quote** — Morning motivational quote
- 💪 **Workout Reminder** — Reminder to log workout
- ⬆️ **Level Up** — Celebrate level-up achievements

Preferences saved to `profiles.notification_preferences` JSONB column.

Cron jobs filter recipients based on these preferences:

```typescript
// Example: Only send to users with dailyQuote enabled
const prefs = profile.notification_preferences as Record<string, boolean>;
if (!prefs || prefs.dailyQuote !== false) {
  // Send notification
}
```

## 🔗 API Endpoints

### Client-Side

- `POST /api/notifications/subscribe` — Save push subscription
- `GET /api/notifications/preferences` — Load user preferences
- `POST /api/notifications/preferences` — Save user preferences

### Server-Side (Cron-Protected)

- `POST /api/notifications/send` — Trigger push notification
- `GET /api/cron/notifications?job=morning-quote` — Morning quote job
- `GET /api/cron/notifications?job=streak-reminder` — Streak reminder job
- `GET /api/cron/notifications?job=all` — Run all jobs (testing)

## 🚀 Deployment Checklist

- [ ] Generate VAPID keys (`npx web-push generate-vapid-keys`)
- [ ] Add environment variables to production (Vercel Secrets)
- [ ] Deploy `vercel.json` cron configuration
- [ ] Run DB migrations (`supabase/migrations/001_*.sql` + `006_*.sql`)
- [ ] Test iOS 16.4+ install + push
- [ ] Test Android install + push
- [ ] Verify cron jobs run at scheduled times
- [ ] Check Service Worker registration in DevTools
- [ ] Verify push subscriptions in `push_subscriptions` table

## 📚 Resources

- [Web App Manifest](https://web.dev/add-manifest/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push npm](https://github.com/web-push-libs/web-push)
- [iOS 16.4+ Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

## 🎉 Done!

Your PWA is fully configured. Visit `/pwa` for interactive documentation, `/settings` for notification management.
