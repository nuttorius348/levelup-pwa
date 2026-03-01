// =============================================================
// Root Layout — PWA meta tags, providers, service worker registration
// =============================================================

import type { Metadata, Viewport } from 'next';
import './globals.css';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import ThemeProvider from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: {
    default: 'LevelUp',
    template: '%s | LevelUp',
  },
  description: 'Gamified productivity PWA — routines, workouts, AI coaching, and more.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LevelUp',
    startupImage: [
      {
        url: '/splash/apple-splash-1170-2532.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/apple-splash-1179-2556.png',
        media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/apple-splash-1290-2796.png',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
    { media: '(prefers-color-scheme: light)', color: '#4C6EF5' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* iOS PWA meta tags */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-slate-950 text-white">
        <ThemeProvider>
          {children}
        </ThemeProvider>

        {/* Home screen install prompt (iOS + Android) */}
        <InstallPrompt />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then((reg) => console.log('[SW] Registered:', reg.scope))
                    .catch((err) => console.error('[SW] Registration failed:', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
