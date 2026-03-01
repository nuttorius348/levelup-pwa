'use client';

// =============================================================
// Settings Page — PWA settings, notification preferences
// =============================================================

import NotificationManager from '@/components/pwa/NotificationManager';

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/dashboard" className="text-white/50 hover:text-white transition-colors">
            ← Back
          </a>
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        {/* Push Notifications */}
        <section>
          <NotificationManager />
        </section>

        {/* App Info */}
        <section className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">
            About
          </h3>
          <div className="space-y-2 text-sm text-white/50">
            <div className="flex justify-between">
              <span>App</span>
              <span className="text-white/80">LevelUp</span>
            </div>
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-white/80">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>PWA</span>
              <span className="text-white/80" id="pwa-status">Checking...</span>
            </div>
          </div>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                document.addEventListener('DOMContentLoaded', () => {
                  const el = document.getElementById('pwa-status');
                  if (el) {
                    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
                    el.textContent = isStandalone ? 'Installed ✓' : 'Not installed';
                  }
                });
              `,
            }}
          />
        </section>
      </div>
    </main>
  );
}
