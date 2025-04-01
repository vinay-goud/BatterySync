/* eslint-disable no-undef */
// This is a minimal service worker for caching and offline functionality
const CACHE_NAME = "batterysync-cache-v1";
const urlsToCache = [
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

// batterysync-react/public/service-worker.js
// This is a minimal service worker for caching and offline functionality

// Install event - cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache opened");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event - clean up old caches
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
          if (!event.request.url.includes("/api/")) {
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
    icon: "img/icon-192.png",
    badge: "img/icon-192.png",
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});
