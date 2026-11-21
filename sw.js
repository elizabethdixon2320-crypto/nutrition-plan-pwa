const CACHE_NAME = "nutrition-plan-v13";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=13",
  "./data.js?v=13",
  "./brand-data.js?v=13",
  "./food-nutrition.js?v=13",
  "./chart.js?v=13",
  "./nutrition.js?v=13",
  "./meal-planner.js?v=13",
  "./recipe-planner.js?v=13",
  "./daily-planner.js?v=13",
  "./preferred-planner.js?v=13",
  "./app.js?v=13",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/ui/home.svg",
  "./icons/ui/salad.svg",
  "./icons/ui/chart-line.svg",
  "./icons/ui/user-circle.svg",
  "./icons/ui/search.svg",
  "./icons/ui/scale.svg",
  "./icons/ui/x.svg",
  "./icons/ui/target-arrow.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("nutrition-plan-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Fetch navigations first so an existing installation can discover a new app shell.
  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  const isAppDocument = url.origin === scope.origin && (url.pathname === scope.pathname || url.pathname === `${scope.pathname}index.html`);
  if (event.request.mode === "navigate" && isAppDocument) {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok && (response.headers.get("content-type") || "").includes("text/html")) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy)));
      }
      return response;
    }).catch(async () => (await caches.match("./index.html")) || caches.match("./")));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
