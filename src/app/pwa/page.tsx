'use client';

// =============================================================
// PWA Demo/Documentation Page
// =============================================================

export default function PWADemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/" className="text-white/50 hover:text-white transition-colors">
            ← Home
          </a>
          <h1 className="text-lg font-bold">PWA Guide</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {/* Overview */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>📱</span>
            <span>Progressive Web App Setup</span>
          </h2>
          <p className="text-white/60 leading-relaxed">
            LevelUp is a fully-featured Progressive Web App with home screen install,
            offline support, push notifications, and background sync. This page documents
            the complete setup.
          </p>
        </section>

        {/* Features */}
        <section>
          <h3 className="text-xl font-bold mb-4">✨ Features</h3>
          <div className="grid gap-3">
            {[
              { icon: '🏠', title: 'Home Screen Install', desc: 'Add to home screen on iOS, Android, and Desktop' },
              { icon: '🔔', title: 'Push Notifications', desc: 'iOS 16.4+, Android, and Desktop push alerts' },
              { icon: '📴', title: 'Offline Support', desc: 'App shell precaching, network-first navigation' },
              { icon: '🔄', title: 'Background Sync', desc: 'Queued XP grants and workout logs sync when online' },
              { icon: '⏰', title: 'Scheduled Push', desc: 'Morning quotes (7 AM) and streak reminders (8 PM)' },
              { icon: '⚡', title: 'Fast Loads', desc: 'Cache-first static assets, stale-while-revalidate' },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="font-semibold text-white/90 mb-1">{item.title}</h4>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* iOS 16.4+ Web Push Requirements */}
        <section>
          <h3 className="text-xl font-bold mb-4">📱 iOS 16.4+ Web Push</h3>
          <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              iOS 16.4+ supports Web Push notifications, but with strict requirements:
            </p>
            <ol className="space-y-3 text-sm text-white/60">
              <li className="flex gap-3">
                <span className="text-amber-400 font-bold">1.</span>
                <span>App MUST be installed to home screen (standalone mode)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400 font-bold">2.</span>
                <span>Permission MUST be requested from a user gesture (button tap)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400 font-bold">3.</span>
                <span>Service worker must be registered and active</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400 font-bold">4.</span>
                <span>VAPID keys must be configured</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400 font-bold">5.</span>
                <span>Push handler MUST call <code className="text-xs bg-black/30 px-1.5 py-0.5 rounded">showNotification()</code></span>
              </li>
            </ol>
            <p className="text-xs text-white/40 mt-4">
              ✅ All requirements implemented in LevelUp
            </p>
          </div>
        </section>

        {/* Architecture */}
        <section>
          <h3 className="text-xl font-bold mb-4">🏗️ Architecture</h3>
          <div className="space-y-3">
            {[
              {
                file: 'src/app/manifest.ts',
                desc: 'Web App Manifest (name, icons, screenshots, shortcuts)',
              },
              {
                file: 'public/sw.js',
                desc: 'Service Worker (caching, offline, push, background sync)',
              },
              {
                file: 'src/lib/notifications/web-push.ts',
                desc: 'Client-side push subscription utilities',
              },
              {
                file: 'src/app/api/notifications/subscribe/route.ts',
                desc: 'API: Save push subscription to database',
              },
              {
                file: 'src/app/api/notifications/send/route.ts',
                desc: 'API: Trigger push notification (cron-protected)',
              },
              {
                file: 'src/app/api/notifications/preferences/route.ts',
                desc: 'API: Save/load per-user notification preferences',
              },
              {
                file: 'src/app/api/cron/notifications/route.ts',
                desc: 'Cron: Scheduled push (morning quote, streak reminder)',
              },
              {
                file: 'src/components/pwa/InstallPrompt.tsx',
                desc: 'Component: Home screen install prompt (iOS + Android)',
              },
              {
                file: 'src/components/pwa/NotificationManager.tsx',
                desc: 'Component: Push notification opt-in UI',
              },
            ].map((item) => (
              <div key={item.file} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <code className="text-xs text-violet-400 font-mono block mb-1">
                  {item.file}
                </code>
                <p className="text-xs text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Caching Strategy */}
        <section>
          <h3 className="text-xl font-bold mb-4">💾 Caching Strategy</h3>
          <div className="space-y-2">
            {[
              { strategy: 'Precache', scope: 'App shell (/, /dashboard, /offline)', color: 'violet' },
              { strategy: 'Network-first', scope: 'Navigation requests', color: 'blue' },
              { strategy: 'Cache-first', scope: 'Static assets (CSS, JS, fonts, icons, splash)', color: 'green' },
              { strategy: 'Stale-while-revalidate', scope: 'Images and other resources', color: 'amber' },
              { strategy: 'Network-only', scope: 'API routes (/api/*)', color: 'red' },
            ].map((item) => (
              <div key={item.strategy} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold bg-${item.color}-500/10 text-${item.color}-400 border border-${item.color}-500/20`}>
                    {item.strategy}
                  </span>
                  <span className="text-sm text-white/70">{item.scope}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Background Sync */}
        <section>
          <h3 className="text-xl font-bold mb-4">🔄 Background Sync</h3>
          <p className="text-sm text-white/60 mb-4 leading-relaxed">
            When offline, XP grants and workout logs are queued in IndexedDB and
            automatically synced when the connection is restored.
          </p>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <h4 className="text-sm font-semibold text-white/80 mb-2">Sync Queues</h4>
            <ul className="space-y-1 text-xs text-white/50">
              <li>• <strong className="text-white/70">xp-queue</strong> — Offline XP grants</li>
              <li>• <strong className="text-white/70">workout-queue</strong> — Offline workout logs</li>
            </ul>
            <p className="text-xs text-white/40 mt-3">
              Service worker listens for <code className="bg-black/30 px-1 rounded">sync</code> events and POSTs queued data.
            </p>
          </div>
        </section>

        {/* Scheduled Notifications */}
        <section>
          <h3 className="text-xl font-bold mb-4">⏰ Scheduled Notifications</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white/80">Morning Quote</h4>
                <span className="text-xs text-white/40">7:00 AM daily</span>
              </div>
              <p className="text-xs text-white/50">
                Sends today's AI-generated motivational quote to users who opt in.
                Uses theme rotation (boxing → comeback → discipline).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white/80">Streak Reminder</h4>
                <span className="text-xs text-white/40">8:00 PM daily</span>
              </div>
              <p className="text-xs text-white/50">
                Reminds users who haven't been active today to maintain their streak.
                Only sent if no XP earned since midnight.
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/40 mb-2">Vercel Cron Configuration:</p>
            <pre className="text-xs bg-black/30 p-3 rounded overflow-x-auto">
              <code>{`{
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
}`}</code>
            </pre>
          </div>
        </section>

        {/* Environment Variables */}
        <section>
          <h3 className="text-xl font-bold mb-4">🔐 Environment Variables</h3>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="space-y-3 text-xs">
              <div>
                <code className="text-violet-400 font-mono block mb-1">VAPID_CONTACT_EMAIL</code>
                <p className="text-white/40">Your contact email (mailto: or https:// URL)</p>
              </div>
              <div>
                <code className="text-violet-400 font-mono block mb-1">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code>
                <p className="text-white/40">VAPID public key (base64 URL-safe)</p>
              </div>
              <div>
                <code className="text-violet-400 font-mono block mb-1">VAPID_PRIVATE_KEY</code>
                <p className="text-white/40">VAPID private key (base64 URL-safe, server-only)</p>
              </div>
              <div>
                <code className="text-violet-400 font-mono block mb-1">CRON_SECRET</code>
                <p className="text-white/40">Secret for authenticating cron jobs</p>
              </div>
            </div>
            <p className="text-xs text-white/30 mt-4">
              Generate VAPID keys: <code className="bg-black/30 px-1.5 py-0.5 rounded">npx web-push generate-vapid-keys</code>
            </p>
          </div>
        </section>

        {/* Testing */}
        <section>
          <h3 className="text-xl font-bold mb-4">🧪 Testing</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <h4 className="text-sm font-semibold text-white/80 mb-2">iOS Testing</h4>
              <ol className="space-y-1 text-xs text-white/50">
                <li>1. Open Safari on iPhone running iOS 16.4+</li>
                <li>2. Tap Share → Add to Home Screen</li>
                <li>3. Open LevelUp from home screen (standalone mode)</li>
                <li>4. Go to Settings and tap "Enable Push Notifications"</li>
                <li>5. Grant permission when prompted</li>
              </ol>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <h4 className="text-sm font-semibold text-white/80 mb-2">Manual Push Test</h4>
              <pre className="text-xs bg-black/30 p-3 rounded mt-2 overflow-x-auto">
                <code>{`curl -X POST https://yourapp.com/api/notifications/send \\
  -H "x-cron-secret: YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Test",
    "body": "Push works!",
    "url": "/dashboard"
  }'`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Links */}
        <section>
          <h3 className="text-xl font-bold mb-4">🔗 Quick Links</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="/settings"
              className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/20 transition-colors text-center"
            >
              <span className="text-2xl block mb-2">⚙️</span>
              <span className="text-sm font-semibold text-white/90">Settings</span>
            </a>
            <a
              href="/quote"
              className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/20 transition-colors text-center"
            >
              <span className="text-2xl block mb-2">💬</span>
              <span className="text-sm font-semibold text-white/90">Daily Quote</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
