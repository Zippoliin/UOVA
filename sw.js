/* Life RPG — Service Worker v1.0
   Handles scheduled local notifications and offline caching */

const CACHE = 'life-rpg-v1';
const ASSETS = ['/', '/index.html', '/App.jsx'];

// ── Install: cache static assets ────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: serve from cache, fall back to network ───────────────────────
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ── Message: schedule a local notification ──────────────────────────────
const timers = {};

self.addEventListener('message', e => {
  const { type, delay, tag, title, body, vibrate, icon } = e.data || {};
  if (type !== 'SCHEDULE_NOTIFICATION') return;

  // Clear any existing timer for this tag
  if (timers[tag]) clearTimeout(timers[tag]);

  timers[tag] = setTimeout(async () => {
    const clients = await self.clients.matchAll({ type: 'window' });
    // Only notify if no window is focused
    const anyFocused = clients.some(c => c.focused);
    if (anyFocused) return;

    self.registration.showNotification(title, {
      body,
      icon: icon || '/icon-192.png',
      badge: '/icon-96.png',
      vibrate: vibrate || [200, 100, 200],
      tag,
      renotify: true,
      data: { url: '/' }
    });
  }, Math.max(0, delay));
});

// ── Notification click: open the app ───────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const existing = clients.find(c => c.url === '/' || c.url.includes('life-rpg'));
      if (existing) return existing.focus();
      return self.clients.openWindow('/');
    })
  );
});
