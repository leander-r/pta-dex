// ============================================================
// PTA Dex Service Worker — network-first + cache fallback
// ============================================================

// Bump this on any deploy that changes cached asset shapes — the activate handler
// below deletes any cache whose name doesn't match, which is what actually evicts
// stale hashed JS/CSS files. Leaving this unversioned means the cache only grows:
// cache-first fetch adds new hashed filenames every deploy but never removes old ones.
const CACHE_NAME = 'pta-dex-v2';
const PRECACHE_URLS = ['./', './index.html'];

// ── Install ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only handle GET requests for same-origin
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Never cache Discord webhooks or external API calls
    if (url.href.includes('discord.com') || url.href.includes('pokeapi.co')) return;

    // Network-first for the bundled Pokédex/game-data JSON — these used to be fetched
    // cross-origin (raw.githubusercontent.com), which this worker's same-origin check
    // above always skipped, so they never went through cache-first. Now that they're
    // bundled same-origin, treat them like the HTML case (network-first, cache as
    // fallback) instead of cache-first: cache-first would mean a data update shipped
    // in a new deploy is invisible to anyone who already cached the old version, since
    // cache-first never re-checks the network once something is cached.
    if (url.pathname.endsWith('pokedex.min.json') || url.pathname.endsWith('pta-game-data.min.json')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Network-first for HTML navigation requests
    if (request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
        );
        return;
    }

    // Cache-first for JS / CSS / images / fonts
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            return fetch(request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});
