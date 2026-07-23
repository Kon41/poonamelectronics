// Poonam Electronics — service worker
// Purpose: makes the app installable as a PWA and keeps a basic offline shell.
// It does NOT cache live data — Firebase calls always go straight to the network,
// so rates/ledger/staff stay real-time. Only the app shell (HTML/CSS/JS/icons) is cached
// so the app can still open (read-only, last-loaded view) if there's no signal.

const CACHE_NAME = "poonam-electronics-shell-v4.0.1";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-32x32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only manage requests for our own app-shell files.
  // Everything else (Firebase, Google APIs, fonts, jsPDF, etc.) is left untouched
  // and goes straight to the network as normal.
  const isShellFile = SHELL_FILES.some((f) => url.pathname.endsWith(f.replace("./", "/")));
  const isNavigation = event.request.mode === "navigate";

  if (isShellFile || isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
