self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('motoopen-v1').then(cache => 
      cache.addAll([
        '/',
        '/chothuexemayhanoi/index.html',
        '/chothuexemayhanoi/assets/css/style.css',
        '/chothuexemayhanoi/motoai_v26_autolearn_multisite.js'
      ])
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
