// ✅ service-worker.js مع الكاش للصور وملفات HTML/CSS/JS

const CACHE_NAME = 'smartshop-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/store.html',
  '/login.html',
  '/static/css/store.css',
  '/static/js/store.js',
  '/static/js/upload.js',
  '/static/js/admin.js',
  '/upload.html',
  '/admin.html',
  '/manifest.json',
];

self.addEventListener('install', event => {
  console.log('🛠️ Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching static files');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker Activated');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🧹 Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // 🧠 Cache-first strategy for static files and images
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchRes => {
        // 🖼️ Cache images dynamically
        if (event.request.url.includes('/uploads/')) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        }
        return fetchRes;
      });
    }).catch(() => {
      return new Response('❌ Offline and not cached.');
    })
  );
});
