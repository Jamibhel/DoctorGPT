const CACHE_NAME = "bji-medisupport-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/bji-medisupport-192.png",
  "/icons/bji-medisupport-512.png",
  "/brand/bji-medisupport-logo.mp4.mp4"
];

// Install: Cache essential app shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first with cache fallback for static app shell
// NEVER cache patient data, API calls, or POST/PUT mutations indiscriminately
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and external URLs
  if (event.request.method !== "GET" || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Skip API routes or dynamic state endpoints
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first strategy for app shell HTML and static assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If valid static asset response, update cache in background
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML request failed and not in cache, fallback to root shell
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/");
          }
        });
      })
  );
});
