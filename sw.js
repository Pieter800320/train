var CACHE = 'falkenburg-v291';
var ASSETS = [
  '/train/',
  '/train/index.html',
  '/train/manifest.json',
  '/train/icon-192.png',
  '/train/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS).catch(function(){});
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;

  // Network-first for HTML — always serve the freshest index.html
  var isHTML = url.endsWith('/train/') || url.endsWith('index.html') || url.endsWith('/train');
  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          caches.open(CACHE).then(function(c) { c.put(e.request, response.clone()); });
        }
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  } else {
    // Cache-first for static assets (icons, manifest)
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            caches.open(CACHE).then(function(c) { c.put(e.request, response.clone()); });
          }
          return response;
        });
      })
    );
  }
});
