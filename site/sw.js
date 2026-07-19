// Offline: cache-first app shell; units cached as visited; units.json
// network-first so the frontier advances. VERSION is stamped by build.mjs,
// so every deploy refreshes the shell.
const VERSION = '__BUILD__';
const CACHE = `td-${VERSION}`;
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'progress.js', 'preface.json',
  'manifest.webmanifest', 'favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  if (url.pathname.endsWith('units.json')) {
    e.respondWith(fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit ?? fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return res;
  })));
});

self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : { title: 'Tractatus Daily', body: '' };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: 'icon-192.png' }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list =>
    list.length ? list[0].focus() : clients.openWindow('./')));
});
