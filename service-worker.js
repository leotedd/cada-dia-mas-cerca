/* =========================================================================
   CADA DÍA MÁS CERCA — service-worker.js
   -------------------------------------------------------------------------
   Objetivo: permitir instalar el sitio en la pantalla de inicio y que
   funcione offline, SIN que una versión antigua quede "congelada" después
   de publicar cambios.

   Estrategia:
     - "Network-first" para TODO el contenido propio (HTML, CSS, JS e
       imágenes). Si hay conexión, siempre se sirve la versión más nueva y
       se refresca la copia en caché. Sin conexión, se usa la última copia
       guardada. Así las fotos y frases nuevas se ven en cuanto haya red.
     - "Stale-while-revalidate" solo para las tipografías de Google Fonts
       (no cambian y conviene tenerlas rápido/offline).
     - En cada publicación se sube CACHE_VERSION: al activarse el SW nuevo
       se borran TODOS los cachés anteriores y toma control de inmediato.
   ========================================================================= */

const CACHE_VERSION = 'cdmc-v1-2026-09-05';
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const FONT_CACHE = `fonts-${CACHE_VERSION}`;

// Recursos mínimos para que la app abra offline tras la primera visita.
const PRECACHE_URLS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/pwa.js',
  './css/pwa.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(RUNTIME_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => { /* si algo falla, no bloquea la instalación */ })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== RUNTIME_CACHE && key !== FONT_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Permite que la página pida activar el SW nuevo sin recargar a mano.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Tipografías de Google: stale-while-revalidate.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, FONT_CACHE));
    return;
  }

  // Solo gestionamos recursos del propio origen.
  if (url.origin !== self.location.origin) return;

  // Navegaciones y recursos propios: network-first.
  event.respondWith(networkFirst(req));
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(request, { cache: 'no-store' });
    if (fresh && fresh.status === 200 && fresh.type === 'basic') {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && (res.status === 200 || res.type === 'opaque')) {
        cache.put(request, res.clone());
      }
      return res;
    })
    .catch(() => null);
  return cached || network || fetch(request);
}
