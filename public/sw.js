// v3: caminhos RELATIVOS ao scope do service worker — o jogo funciona na raiz
// OU numa subpasta (portal da Wings Studios). A versão nova também limpa o
// cache errado de quem abriu a v2 dentro do portal.
const CACHE = "wing-blocks-v3";
const NA_PASTA = (caminho) => new URL(caminho, self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        NA_PASTA("./"),
        NA_PASTA("index.html"),
        NA_PASTA("manifest.webmanifest"),
        NA_PASTA("assets/logo_wings_studios.png"),
        NA_PASTA("icons/icon-192.png"),
        NA_PASTA("icons/icon-512.png"),
      ]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("wing-blocks-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(NA_PASTA("index.html"), copy));
          return response;
        })
        .catch(() => caches.match(NA_PASTA("index.html"))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (!res.ok) return res;
        const copy = res.clone();
        void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return res;
      });
    }),
  );
});
