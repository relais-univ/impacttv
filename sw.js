// ==================== SERVICE WORKER IMPACT TV ====================
const CACHE_NAME = 'impacttv-v2'; // ✅ Changé en v2 pour forcer la mise à jour
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icône.png'
];

// Installation : mise en cache
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker : installation v2');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Fichiers mis en cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => console.log('⚠️ Erreur cache:', err))
  );
  self.skipWaiting(); // Force l'activation immédiate
});

// Activation : nettoyage des anciens caches (v1)
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker : activation v2');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Ancien cache supprimé:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Prend le contrôle immédiatement
});

// Fetch : sert depuis le cache ou le réseau
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes POST ou Firebase/API
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firebase')) return;
  if (event.request.url.includes('googleapis')) return;
  if (event.request.url.includes('pipedapi')) return;
  if (event.request.url.includes('youtube')) return;
  if (event.request.url.includes('chretien.fr')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourne le cache si trouvé, sinon va chercher sur le réseau
        return response || fetch(event.request).then((fetchResponse) => {
          // Met en cache les nouvelles ressources du même domaine
          if (event.request.url.startsWith(self.location.origin)) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          }
          return fetchResponse;
        });
      })
      .catch(() => {
        // Fallback hors ligne pour la navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
