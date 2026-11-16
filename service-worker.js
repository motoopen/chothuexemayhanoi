const CACHE_NAME = 'motoopen-v4';
const SITE_PREFIX = '/chothuexemayhanoi/';
const MAX_PAGES = 30;
const STATIC_ASSETS = [
  '/chothuexemayhanoi/assets/css/home.css',
  '/chothuexemayhanoi/assets/css/style.css',
  '/chothuexemayhanoi/assets/js/site.js',
  '/chothuexemayhanoi/assets/js/home-ui.js'
];

// Keep at most MAX_PAGES cached HTML documents (offline fallback only).
function trim(cache) {
  return cache.keys().then(keys => {
    const pages = keys.filter(req => req.mode === 'navigate' || /\/$|\.html$/.test(new URL(req.url).pathname));
    if (pages.length <= MAX_PAGES) return null;
    return Promise.all(pages.slice(0, pages.length - MAX_PAGES).map(req => cache.delete(req)));
  });
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Delete old motoopen-* caches (they may hold pages with old prices) and take control.
// Open tabs are NOT reloaded; they pick up new content on their next navigation.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('motoopen-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SITE_PREFIX)) return;

  const isNavigation = request.mode === 'navigate' || request.destination === 'document';

  // Pages: always from the network (bypassing the HTTP cache) so price and legal edits show
  // at once; the cached copy is only an offline fallback.
  if (isNavigation) {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' }))
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy).then(() => trim(cache)));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const network = fetch(request).then(response => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});
