/**
 * MenuOS — Service Worker v2
 * Stratégie : Cache-First pour assets statiques, Network-First pour Firebase
 */

const SW_VERSION = 'menuos-v2';
const CACHE_STATIC = SW_VERSION + '-static';
const CACHE_DYNAMIC = SW_VERSION + '-dynamic';

// Assets à précacher au install
const PRECACHE_URLS = [
  './',
  './menuos-saas-v12.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Domaines réseau uniquement (pas de cache)
const NETWORK_ONLY = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'wa.me',
  'api.whatsapp.com',
];

// ── INSTALL ────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Install', SW_VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE_URLS.map(url => {
        // Essayer en silencieux — certains assets peuvent manquer
        return cache.add(url).catch(() => {});
      })))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activate', SW_VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
          .map(k => {
            console.log('[SW] Suppression ancien cache :', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ──────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Requêtes non-GET → réseau direct
  if (event.request.method !== 'GET') return;

  // 2. Domaines réseau uniquement (Firebase, WhatsApp…)
  if (NETWORK_ONLY.some(d => url.hostname.includes(d))) {
    event.respondWith(fetch(event.request).catch(() =>
      new Response(JSON.stringify({ error: 'offline' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // 3. Google Fonts → Cache-First avec fallback silencieux
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_DYNAMIC).then(c => c.put(event.request, clone));
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // 4. App shell + assets locaux → Cache-First, puis réseau, mise en cache dynamique
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Revalidation en arrière-plan (stale-while-revalidate)
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_DYNAMIC).then(c => c.put(event.request, response));
          }
        }).catch(() => {});
        return cached;
      }
      // Pas en cache → réseau
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_DYNAMIC).then(c => c.put(event.request, clone));
        return response;
      }).catch(() => {
        // Fallback hors-ligne : retourner la page principale
        if (event.request.destination === 'document') {
          return caches.match('./menuos-saas-v12.html');
        }
        return new Response('Hors ligne', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

// ── PUSH NOTIFICATIONS ─────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'MenuOS', body: 'Nouvelle notification', icon: './icon-192.png' };
  try { data = { ...data, ...event.data.json() }; } catch(e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || './' },
      actions: data.actions || [],
    })
  );
});

// ── NOTIFICATION CLICK ─────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── BACKGROUND SYNC ────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  // Récupérer commandes en attente depuis IndexedDB (si implémenté)
  console.log('[SW] Background sync : commandes en attente');
}

// ── MESSAGE ────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: SW_VERSION });
  }
});
