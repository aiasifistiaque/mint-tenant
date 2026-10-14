/*
 * The panel's service worker — what makes it installable as an app, and what
 * shows the "You're offline" page instead of the browser's error when a page
 * is opened with no connection.
 *
 * It caches nothing else on purpose: pages and data always come from the
 * network, so an installed app is never a deploy behind and never shows
 * someone else's records from a cache. Scripts and styles already sit in the
 * browser's own cache (Next serves them immutable).
 *
 * Change VERSION whenever offline.html changes, so phones fetch the new copy.
 * It must stay self-contained (its logo is inline): offline, nothing else loads.
 */
const VERSION = 'mint-pwa-1';
const OFFLINE = '/offline.html';

self.addEventListener('install', event => {
	event.waitUntil(
		caches
			.open(VERSION)
			.then(cache => cache.add(OFFLINE))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) if (key !== VERSION) await caches.delete(key);
			// Starts the page's request while the worker boots, so pages don't wait on it.
			if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
			await self.clients.claim();
		})(),
	);
});

self.addEventListener('fetch', event => {
	const { request } = event;
	// Only page loads; everything else (scripts, the API, images) goes past untouched.
	if (request.mode !== 'navigate') return;
	event.respondWith(
		(async () => {
			try {
				return (await event.preloadResponse) || (await fetch(request));
			} catch {
				return (await caches.match(OFFLINE)) || Response.error();
			}
		})(),
	);
});
