/* eslint-disable no-undef */
// This is a minimal service worker for caching and offline functionality
const CACHE_NAME = "batterysync-cache-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  // Update paths to match React structure
  "/img/favicon.png",
  "/img/icon-192.png",
  "/img/icon-512.png",
  //"/audio/notification.mp3",
  //"https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css",
];

// batterysync-react/public/service-worker.js
// Service worker installation
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  self.skipWaiting(); // Force activation

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Service worker activation and cache cleanup
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log("[ServiceWorker] Removing old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log("[ServiceWorker] Claiming clients");
        return self.clients.claim();
      })
  );
});

// Fetch handler with network-first strategy for dynamic content
self.addEventListener("fetch", (event) => {
  // Don't cache API or WebSocket requests
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("/ws") ||
    event.request.url.includes(".hot-update.") ||
    event.request.url.includes("socket")
  ) {
    return;
  }

  // For HTML pages, use network first strategy
  if (event.request.headers.get("Accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fetch fails, try from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other assets, use cache first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses or non-GET requests
        if (
          !response ||
          response.status !== 200 ||
          event.request.method !== "GET"
        ) {
          return response;
        }

        // Clone the response to cache it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  console.log("[ServiceWorker] Push received");

  let notificationData = {
    title: "BatterySync",
    body: "Battery status update",
    icon: "/img/icon-192.png",
  };

  try {
    if (event.data) {
      notificationData = { ...notificationData, ...event.data.json() };
    }
  } catch (error) {
    console.error("[ServiceWorker] Error parsing push data:", error);
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: "/img/icon-192.png",
      vibrate: [200, 100, 200],
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[ServiceWorker] Notification click received");

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      // If there's an open window, focus it
      for (const client of windowClients) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }

      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
