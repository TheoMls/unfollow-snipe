const CACHE_NAME = "unfollow-snipe-v1";
const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./privacy.html",
    "./attributions.html",
    "./manifest.json",
    "./assets/css/style.css",
    "./assets/css/guide.css",
    "./assets/css/layout.css",
    "./assets/css/privacy-screen.css",
    "./assets/css/fonts.css",
    "./assets/fonts/plus-jakarta-sans-v12-latin-300.woff2",
    "./assets/fonts/plus-jakarta-sans-v12-latin-500.woff2",
    "./assets/fonts/plus-jakarta-sans-v12-latin-600.woff2",
    "./assets/fonts/plus-jakarta-sans-v12-latin-700.woff2",
    "./assets/fonts/plus-jakarta-sans-v12-latin-regular.woff2",
    "./assets/js/script.js",
    "./assets/js/theme.js",
    "./assets/js/validate.js",
    "./assets/img/logo.png",
    "./assets/img/github.svg",
    "./assets/img/sun.svg",
    "./assets/img/moon.svg",
    "./assets/img/og-image.png",
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
];

// Install Event
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                STATIC_ASSETS.map((asset) =>
                    cache.add(asset).catch((err) => {
                        console.warn(`[PWA] Failed to cache asset: ${asset}`, err);
                    })
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// Activate Event
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Bypass unsupported schemes (e.g. chrome-extension://)
    if (url.protocol !== "http:" && url.protocol !== "https:") return;

    // Bypass dynamic third-party ads or donation scripts
    if (url.origin.includes("googlesyndication") || url.origin.includes("buymeacoffee")) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchAndCache = () =>
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === "opaque")) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                });

            if (cachedResponse) {
                event.waitUntil(fetchAndCache().catch(() => {/* Ignore background errors when offline */ }));
                return cachedResponse;
            }

            return fetchAndCache().catch(() => {
                return new Response("Offline resource unavailable", {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: new Headers({ "Content-Type": "text/plain" })
                });
            });
        })
    );
});