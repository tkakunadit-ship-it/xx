/**
 * Service Worker — HD Video Enhancer
 *
 * KETERBATASAN YANG DISENGAJA (bukan bug):
 * Build Next.js menghasilkan file JS/CSS dengan nama ter-hash yang berubah tiap kali
 * `next build` dijalankan (mis. /_next/static/chunks/app-<hash>.js). Service worker
 * yang ditulis manual tidak bisa tahu nama hash itu sebelum build terjadi, jadi precache
 * penuh ala aplikasi native tidak realistis dilakukan di sini tanpa plugin build (mis.
 * next-pwa/Serwist) yang menghasilkan precache manifest otomatis dari output build.
 *
 * Strategi nyata yang dipakai sebagai gantinya:
 *  - Precache eksplisit hanya untuk aset yang path-nya stabil (root, manifest, ikon).
 *  - Same-origin lainnya (termasuk chunk Next.js): stale-while-revalidate — dilayani dari
 *    cache jika ada (agar cepat & bisa offline setelah kunjungan pertama), lalu diperbarui
 *    di background dari network.
 *  - Engine FFmpeg dari unpkg.com (ffmpeg-core.js/.wasm, ~30MB, URL ter-versi): cache-first,
 *    supaya tidak diunduh ulang di setiap sesi.
 *  - File video pengguna TIDAK PERNAH lewat fetch handler ini (diproses via ffmpeg.wasm
 *    langsung di memory, bukan lewat request jaringan), jadi tidak ada risiko video
 *    pengguna tersimpan di cache ini.
 */

const CACHE_VERSION = 'hdve-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
];

const RUNTIME_CACHEABLE_HOSTS = ['unpkg.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('hdve-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (RUNTIME_CACHEABLE_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const networkFetch = fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || networkFetch;
        })
      )
    );
  }
});
