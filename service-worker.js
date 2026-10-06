const CACHE_NAME = 'motoopen-v3';
const SITE_PREFIX = '/chothuexemayhanoi/';
const STATIC_ASSETS = [
  '/chothuexemayhanoi/assets/css/home.css',
  '/chothuexemayhanoi/assets/css/style.css',
  '/chothuexemayhanoi/assets/js/site.js',
  '/chothuexemayhanoi/assets/js/home-ui.js',
  '/chothuexemayhanoi/motoai_v39_modelfirst_nomarkdown_nolink.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

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

  if (isNavigation) {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' }))
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
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
