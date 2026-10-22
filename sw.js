// Service worker da Capi: guarda os arquivos do site para abrir sem internet
// e cuida do toque nas notificações.
const VERSION = '0038331776';
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./js/index-f3a39bb2c0e8c7e13edc4e93d541303a.js",
  "./assets/alarme.359036add981bdcf54d3efe227015af1.wav",
  "./assets/capi.3ceb953354af93d5eb91d8eae7a99af7.wav",
  "./assets/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf",
  "./assets/Baloo2_400Regular.20f6d0043a8ab7fd4a6466f6f6611685.ttf",
  "./assets/Baloo2_500Medium.cf867a5944fb838010f772a139620a75.ttf",
  "./assets/Baloo2_600SemiBold.61e1563819bc0ab5fc68673fc4909c99.ttf",
  "./assets/Baloo2_700Bold.f57ab981c1dec25a04bea3cce20ea18c.ttf",
  "./assets/Baloo2_800ExtraBold.15e8199eb1b3d423d8642f1837b3a9c4.ttf"
];
const CACHE = `capi-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('capi-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // página: tenta a internet primeiro (para pegar versões novas), senão usa a guardada
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./').then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  // arquivos (têm o código no nome, nunca mudam): usa o guardado
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const client = list[0];
      if (client) {
        client.postMessage({ type: 'capi-notification-click', data });
        return client.focus();
      }
      return self.clients.openWindow('./');
    })
  );
});
