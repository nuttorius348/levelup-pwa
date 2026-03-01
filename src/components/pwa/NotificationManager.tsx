'use client';

// =============================================================
// NotificationManager — Push notification opt-in UI
// =============================================================
//
// iOS 16.4+ Web Push REQUIREMENTS:
//  1. PWA must be installed to home screen (standalone mode)
//  2. Permission must be requested from a USER GESTURE (button tap)
//  3. Service worker must be registered and active
//  4. VAPID keys must be configured
//
// This component handles:
//  • Feature detection (is push supported?)
//  • Standalone mode detection (iOS requirement)
//  • Permission request from user gesture
//  • VAPID subscription
//  • Server subscription save via API
//  • Enable/disable toggle
//  • Notification schedule preferences
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToPush, isPushSubscribed, unsubscribeFromPush } from '@/lib/notifications/web-push';

// ── Detect capabilities ───────────────────────────────────────

function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// ── Notification Types ────────────────────────────────────────

interface NotificationPrefs {
  streakReminder: boolean;
  dailyQuote: boolean;
  dailyReminder: boolean;
  workoutReminder: boolean;
  levelUp: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  streakReminder: true,
  dailyQuote: true,
  dailyReminder: true,
  workoutReminder: true,
  levelUp: true,
};

// ── Component ─────────────────────────────────────────────────

export default function NotificationManager() {
  const [supported, setSupported] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [showPrefs, setShowPrefs] = useState(false);

  // ── Init ────────────────────────────────────────────────────

  useEffect(() => {
    setSupported(isPushSupported());
    setStandalone(isStandalone());
    setIosDevice(isIOS());

    if (isPushSupported()) {
      setPermissionState(Notification.permission);
      isPushSubscribed().then(setSubscribed);
    }

    // Load prefs from localStorage
    try {
      const stored = localStorage.getItem('notification-prefs');
      if (stored) setPrefs(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // ── Subscribe ───────────────────────────────────────────────
  // IMPORTANT: This MUST be called from a user gesture (click/tap).
  // iOS 16.4+ will reject permission requests that aren't from a gesture.

  const handleSubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const subscription = await subscribeToPush();
      if (subscription) {
        setSubscribed(true);
        setPermissionState('granted');
        console.log('[Notifications] Subscribed successfully');
      } else {
        setError('Permission denied or not supported');
        setPermissionState(Notification.permission);
      }
    } catch (err) {
      console.error('[Notifications] Subscribe error:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Unsubscribe ─────────────────────────────────────────────

  const handleUnsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      console.log('[Notifications] Unsubscribed');
    } catch (err) {
      console.error('[Notifications] Unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Toggle individual preferences ──────────────────────────

  const togglePref = useCallback((key: keyof NotificationPrefs) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('notification-prefs', JSON.stringify(updated));
      // Also save to server
      fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => { /* best-effort */ });
      return updated;
    });
  }, []);

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🔔</span>
        <div>
          <h2 className="font-bold text-lg">Notifications</h2>
          <p className="text-xs text-white/40">
            {subscribed ? 'Push notifications are enabled' : 'Get reminded to stay on track'}
          </p>
        </div>
      </div>

      {/* Not supported */}
      {!supported && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/60">
          <p>Push notifications are not supported in this browser.</p>
          <p className="text-xs text-white/30 mt-1">
            Try Safari 16.4+ on iOS or Chrome on Android.
          </p>
        </div>
      )}

      {/* iOS: Not installed warning */}
      {supported && iosDevice && !standalone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm"
        >
          <p className="font-semibold text-amber-400 mb-2">
            📱 Install required for iOS push
          </p>
          <p className="text-white/60 text-xs leading-relaxed">
            On iOS 16.4+, push notifications only work when LevelUp is installed
            to your home screen. Tap <strong>Share ⬆</strong> → <strong>Add to Home Screen</strong> in Safari first.
          </p>
        </motion.div>
      )}

      {/* Permission denied */}
      {supported && permissionState === 'denied' && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm">
          <p className="font-semibold text-red-400 mb-1">Notifications blocked</p>
          <p className="text-white/60 text-xs">
            Open your browser/device settings to re-enable notifications for this site.
          </p>
        </div>
      )}

      {/* Subscribe / Unsubscribe button */}
      {supported && permissionState !== 'denied' && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={subscribed ? handleUnsubscribe : handleSubscribe}
          disabled={loading || (iosDevice && !standalone)}
          className={`
            w-full py-4 rounded-xl font-semibold text-lg transition-all min-h-[56px]
            flex items-center justify-center gap-3
            ${subscribed
              ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              : 'bg-violet-600 text-white hover:bg-violet-700'
            }
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : subscribed ? (
            <>
              <span>🔕</span>
              <span>Disable Notifications</span>
            </>
          ) : (
            <>
              <span>🔔</span>
              <span>Enable Push Notifications</span>
            </>
          )}
        </motion.button>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}

      {/* Notification Preferences (when subscribed) */}
      {subscribed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-1"
        >
          <button
            onClick={() => setShowPrefs(!showPrefs)}
            className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/5 text-left flex items-center justify-between hover:bg-white/[0.05] transition-colors"
          >
            <span className="text-sm font-medium text-white/80">Notification Preferences</span>
            <span className="text-white/30 text-xs">{showPrefs ? '▼' : '▶'}</span>
          </button>

          <AnimatePresence>
            {showPrefs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-3">
                  {([
                    { key: 'streakReminder' as const, label: 'Streak Reminder', desc: 'Daily reminder to maintain your streak (8 PM)', icon: '🔥' },
                    { key: 'dailyQuote' as const, label: 'Daily Quote', desc: 'Morning motivational quote notification (7 AM)', icon: '💬' },
                    { key: 'dailyReminder' as const, label: 'Daily Check-In', desc: 'Morning reminder to start your day (9 AM)', icon: '🌅' },
                    { key: 'workoutReminder' as const, label: 'Workout Reminder', desc: 'Reminder to log your workout (6 PM)', icon: '💪' },
                    { key: 'levelUp' as const, label: 'Level Up', desc: 'Celebrate when you level up', icon: '⬆️' },
                  ]).map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-white/80">{item.label}</p>
                          <p className="text-xs text-white/40">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePref(item.key)}
                        className={`
                          relative w-11 h-6 rounded-full transition-colors
                          ${prefs[item.key] ? 'bg-violet-600' : 'bg-white/10'}
                        `}
                      >
                        <motion.div
                          animate={{ x: prefs[item.key] ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Info */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
          How push works
        </h3>
        <ul className="space-y-1 text-xs text-white/50">
          <li>• <strong className="text-white/70">iOS 16.4+:</strong> Install to home screen first, then enable notifications</li>
          <li>• <strong className="text-white/70">Android:</strong> Click "Enable" above — works immediately</li>
          <li>• <strong className="text-white/70">Streak alerts:</strong> Sent at 8 PM if you haven't been active</li>
          <li>• <strong className="text-white/70">Morning quotes:</strong> Fresh AI quote every morning at 7 AM</li>
          <li>• <strong className="text-white/70">Privacy:</strong> We never share your push token with third parties</li>
        </ul>
      </div>
    </div>
  );
}
