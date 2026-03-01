// =============================================================
// Service Worker — PWA offline support + push notifications
// =============================================================
// This file runs as a plain JS service worker in the browser.
// DO NOT use TypeScript syntax here — it must be valid ES2020 JS.
//
// Features:
//  • App shell precaching (offline support)
//  • Network-first navigation with offline fallback
//  • Cache-first static assets
//  • Stale-while-revalidate for images
//  • Web Push notifications (iOS 16.4+ / Android / Desktop)
//  • Background sync for offline XP grants
//  • Periodic background sync for daily quote prefetch
//  • Cache versioning with stale cache cleanup
// =============================================================

const CACHE_VERSION = 2;
const CACHE_NAME = `levelup-v${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// App shell — precached on install
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSTALL — Precache app shell
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }),
  );
  // Activate new SW immediately (skip waiting for tabs to close)
  self.skipWaiting();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACTIVATE — Clean up old caches
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('levelup-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FETCH — Caching strategies
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip API routes — always network
  if (url.pathname.startsWith('/api/')) return;

  // Skip Supabase / external
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        }),
    );
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/splash/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
        );
      }),
    );
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached); // Fall back to cache on network error
      return cached || networkFetch;
    }),
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUSH NOTIFICATIONS (iOS 16.4+ / Android / Desktop)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// iOS 16.4+ Web Push requirements:
//  1. App MUST be added to home screen (standalone mode)
//  2. User MUST grant Notification permission via a USER GESTURE
//  3. Service worker must be registered
//  4. VAPID keys must be configured
//  5. The push event handler must call showNotification()
//
// This handler works identically on iOS, Android, and desktop.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    // If not JSON, treat as plain text
    data = { title: 'LevelUp', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image || undefined,
    data: {
      url: data.url || '/dashboard',
      timestamp: Date.now(),
    },
    tag: data.tag || 'levelup-default',
    renotify: !!data.tag, // Re-notify only for tagged notifications
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    // iOS 16.4+ supports these:
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'LevelUp', options));
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTIFICATION CLICK — Route to correct page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing tab if matches
        for (const client of clients) {
          if (new URL(client.url).pathname === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new tab
        return self.clients.openWindow(url);
      }),
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTIFICATION CLOSE — Analytics (optional)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

self.addEventListener('notificationclose', (event) => {
  // Could log dismiss analytics here
  console.log('[SW] Notification dismissed:', event.notification.tag);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BACKGROUND SYNC — Retry failed offline mutations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-xp-grants') {
    event.waitUntil(syncOfflineQueue('xp-queue', '/api/xp/grant'));
  }
  if (event.tag === 'sync-workout-logs') {
    event.waitUntil(syncOfflineQueue('workout-queue', '/api/workouts/log'));
  }
});

/**
 * Generic offline queue syncer.
 * Reads queued items from IndexedDB and POSTs to the given endpoint.
 */
async function syncOfflineQueue(storeName, endpoint) {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const items = await getAllFromStore(store);

    for (const item of items) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });

        if (response.ok) {
          store.delete(item.id);
          console.log(`[SW] Synced offline item: ${item.id}`);
        }
      } catch (err) {
        console.warn(`[SW] Failed to sync item ${item.id}, will retry`, err);
      }
    }
  } catch (err) {
    console.error(`[SW] syncOfflineQueue(${storeName}) error:`, err);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PERIODIC BACKGROUND SYNC — Prefetch daily quote
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Note: periodicsync is Chrome-only as of 2025. iOS does NOT support it.
// For iOS background notifications, use server-side push via cron.

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'prefetch-daily-quote') {
    event.waitUntil(
      fetch('/api/ai/quote/today')
        .then((res) => res.json())
        .then((data) => {
          console.log('[SW] Daily quote prefetched:', data.quote?.text?.substring(0, 50));
        })
        .catch((err) => console.warn('[SW] Periodic sync failed:', err)),
    );
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IndexedDB helpers for offline queue
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DB_NAME = 'levelup-offline';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('xp-queue')) {
        db.createObjectStore('xp-queue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('workout-queue')) {
        db.createObjectStore('workout-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
