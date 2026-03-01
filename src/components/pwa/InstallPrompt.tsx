'use client';

// =============================================================
// InstallPrompt — Home screen install flow (iOS + Android)
// =============================================================
//
// iOS does NOT fire `beforeinstallprompt`. Instead we detect
// standalone mode is missing and show a manual instruction sheet.
//
// Android/Desktop: intercept `beforeinstallprompt` and show a
// native install prompt on user interaction.
//
// This is CRITICAL for iOS 16+ Web Push — the PWA must be
// installed to the home screen before push can work.
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// ── Detect environment ────────────────────────────────────────

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// ── Component ─────────────────────────────────────────────────

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return;

    // Check if user previously dismissed (show again after 7 days)
    const lastDismissed = localStorage.getItem('install-prompt-dismissed');
    if (lastDismissed) {
      const daysSince = (Date.now() - Number(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    setIsIOSDevice(isIOS());

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault(); // Prevent Chrome's mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: show after a short delay (no beforeinstallprompt event)
    if (isIOS()) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Handle native install ──────────────────────────────────

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;

    if (result.outcome === 'accepted') {
      console.log('[Install] User accepted install prompt');
      setShowPrompt(false);
    } else {
      console.log('[Install] User dismissed install prompt');
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // ── Handle dismiss ─────────────────────────────────────────

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', String(Date.now()));
  }, []);

  // ── Don't render if dismissed or not needed ────────────────

  if (!showPrompt || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe-bottom"
      >
        <div className="max-w-md mx-auto bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-white">Install LevelUp</h3>
                  <p className="text-xs text-white/50">Get the full app experience</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-white/30 hover:text-white/60 p-1"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Benefits */}
          <div className="px-5 pb-3">
            <div className="flex gap-4 text-xs text-white/60">
              <div className="flex items-center gap-1">
                <span>🔔</span>
                <span>Push alerts</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📴</span>
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⚡</span>
                <span>Faster loads</span>
              </div>
            </div>
          </div>

          {isIOSDevice ? (
            /* iOS Manual Instructions */
            <div className="px-5 pb-5">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                <p className="text-sm font-semibold text-white/90">
                  Add to Home Screen:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Tap the <strong className="text-white/90">Share</strong> button
                      <span className="inline-block mx-1 px-1.5 py-0.5 rounded bg-white/10 text-xs">
                        ⬆
                      </span>
                      in Safari
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Scroll down and tap <strong className="text-white/90">Add to Home Screen</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Tap <strong className="text-white/90">Add</strong> to confirm</span>
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Required for push notifications on iOS 16.4+
                </p>
              </div>
            </div>
          ) : (
            /* Android/Desktop native prompt */
            <div className="p-5 pt-2">
              <button
                onClick={handleInstall}
                className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors min-h-[48px]"
              >
                Install App
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
