const CACHE = "mareas-bilbao-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// La app en sí (HTML/manifest/iconos) es "shell": propia del sitio, y NO es
// la función de mareas ni ninguna API externa (Open-Meteo, IHM).
function isAppShellRequest(request){
  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return false; // dominios externos (ej. Open-Meteo): nunca es shell
  if(url.pathname.startsWith('/.netlify/functions/')) return false; // la función de mareas tampoco
  return true;
}

self.addEventListener("fetch", (e) => {
  if(e.request.method !== 'GET') return;

  if(isAppShellRequest(e.request)){
    // CACHÉ PRIMERO para la app en sí: así abre al instante si ya está
    // instalada (con o sin conexión), y de paso se refresca en segundo plano
    // por si hay una versión nueva disponible para la próxima vez.
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const network = fetch(e.request).then((res) => {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  } else {
    // RED PRIMERO para los datos de marea/temperatura: se prefiere siempre
    // el dato más fresco si hay conexión, y solo se cae a la última copia
    // guardada cuando no la hay. Esto no cambia respecto a antes.
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
