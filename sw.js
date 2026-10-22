self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('smv-cache-v1').then((cache) => {
      return cache.addAll([
        './Forum.html',
        './manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
