const CACHE_NAME = "batterysync-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  // Update paths to match React structure
  "/img/favicon.png",
  "/img/icon-192.png",
  "/img/icon-512.png",
  "/audio/notification.mp3",
  "https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css",
];

// Install Service Worker & Cache Files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache opened");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Service Worker & Remove Old Cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request because it's a one-time use
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response because it's a one-time use
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Don't cache API requests
          if (!event.request.url.includes("batterysync-backend.onrender.com")) {
            cache.put(event.request, responseToCache);
          }
        });

        return response;
      });
    })
  );
});

// Push event - handle notifications
self.addEventListener("push", (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/img/icon-192.png",
    badge: "/img/icon-192.png",
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
