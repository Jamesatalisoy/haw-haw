const CACHE_NAME = 'hawhaw-v2.0';
const ASSETS_TO_CACHE = [
  '/haw-haw/',
  '/haw-haw/index.html',
  '/haw-haw/manifest.json',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Poppins:wght@300;400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap'
];

// Install — cache temel dosyalar
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate — eski cache'leri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — Network first, cache fallback
// Firebase ve API çağrıları her zaman network'ten gitmeli
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase, API ve analytics isteklerini cache'leme
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('cloudinary') ||
    url.hostname.includes('cdn.jsdelivr.net')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Diğer istekler: network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Başarılı yanıtı cache'e kaydet
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline — cache'ten sun
        return caches.match(event.request).then(cached => {
          return cached || new Response('Çevrimdışısınız. İnternet bağlantınızı kontrol edin.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
