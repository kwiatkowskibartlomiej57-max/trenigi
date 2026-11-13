/* Zakładka — service worker: aplikacja działa bez internetu.
   Przy każdej nowej wersji zmień WERSJA, żeby telefon pobrał świeże pliki. */
const WERSJA = 'zakladka-2.0.0';
const MEDIA = 'zakladka-media';
const RDZEN = [
  './', 'index.html', 'css/app.css',
  'js/db.js', 'js/core.js', 'js/extras.js', 'js/ui.js',
  'manifest.webmanifest', 'icons/logo.svg', 'icons/favicon-48.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'
];
const OBCE_MEDIA = ['fonts.googleapis.com', 'fonts.gstatic.com', 'covers.openlibrary.org', 'books.google.com', 'books.googleusercontent.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(WERSJA).then(c => c.addAll(RDZEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nazwy => Promise.all(nazwy.filter(n => n !== WERSJA && n !== MEDIA).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function zSieciNajpierw(req) {
  const siec = fetch(req).then(r => {
    if (r.ok) {
      const kopia = r.clone();
      caches.open(WERSJA).then(c => c.put(req, kopia));
    }
    return r;
  });
  const limit = new Promise((_, nie) => setTimeout(() => nie(new Error('timeout')), 4000));
  return Promise.race([siec, limit]).catch(() =>
    caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : siec))
  );
}

function zPamieciNajpierw(req) {
  return caches.match(req).then(r => r || fetch(req).then(odp => {
    if (odp.ok || odp.type === 'opaque') {
      const kopia = odp.clone();
      caches.open(MEDIA).then(c => c.put(req, kopia));
    }
    return odp;
  }));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) e.respondWith(zSieciNajpierw(req));
  else if (OBCE_MEDIA.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) e.respondWith(zPamieciNajpierw(req));
  // pozostałe (wyszukiwarki książek) idą zwyczajnie przez sieć
});
