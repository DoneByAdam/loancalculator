// ClearDebt Service Worker — v1.0
const CACHE = 'cleardebt-v1';
const ASSETS = [
  '/loancalculator/',
  '/loancalculator/index.html',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
];

// Install — cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for assets, network-first for navigation
self.addEventListener('fetch', e => {
  const { request } = e;
  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension')) return;

  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Cache successful responses for static assets
        if (response.ok && (request.url.includes('cdnjs') || request.url.includes('fonts'))) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — return the main app
        if (request.mode === 'navigate') return caches.match('/loancalculator/index.html');
      });
    })
  );
});
