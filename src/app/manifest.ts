// =============================================================
// PWA Web Manifest — Dynamic route handler
// =============================================================

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LevelUp — Gamified Productivity',
    short_name: 'LevelUp',
    description: 'Level up your life with gamified routines, workouts, and AI-powered features',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#4C6EF5',
    orientation: 'portrait',
    scope: '/',
    id: '/',
    categories: ['productivity', 'health', 'fitness', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/dashboard.png',
        sizes: '390x844',
        type: 'image/png',
        // @ts-expect-error — form_factor not yet in TS types
        form_factor: 'narrow',
        label: 'Dashboard with XP bar and daily routines',
      },
      {
        src: '/screenshots/workouts.png',
        sizes: '390x844',
        type: 'image/png',
        // @ts-expect-error
        form_factor: 'narrow',
        label: 'Workout logger with tutorials',
      },
    ],
    shortcuts: [
      {
        name: 'My Routines',
        short_name: 'Routines',
        url: '/routines',
        icons: [{ src: '/icons/shortcut-routines.png', sizes: '96x96' }],
      },
      {
        name: 'Log Workout',
        short_name: 'Workout',
        url: '/workouts/log',
        icons: [{ src: '/icons/shortcut-workout.png', sizes: '96x96' }],
      },
      {
        name: 'Rate Outfit',
        short_name: 'Outfit',
        url: '/outfit',
        icons: [{ src: '/icons/shortcut-outfit.png', sizes: '96x96' }],
      },
    ],
    // iOS-specific PWA meta handled in layout.tsx via <meta> tags
  };
}
