import type { MetadataRoute } from 'next';

/**
 * The web app manifest (/manifest.webmanifest): what a phone or computer uses
 * to install the panel as an app — its name, icon, the screen it opens on and
 * that it opens full screen without the browser's bars. The service worker
 * (public/sw.js, registered by tenant/pwaBoot.ts) supplies the offline page.
 */
export default function manifest(): MetadataRoute.Manifest {
	return {
		id: '/',
		name: 'MINT',
		short_name: 'MINT',
		description: 'Your MINT workspace — projects, data, websites and APIs.',
		// Signed in: the organization's home; signed out, the panel sends it to Sign in.
		start_url: '/dashboard',
		scope: '/',
		display: 'standalone',
		// The website's page colour (layout.tsx viewport.themeColor, light).
		background_color: '#fbfbfd',
		theme_color: '#fbfbfd',
		categories: ['business', 'productivity'],
		icons: [
			{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
			{ src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
			{ src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
		],
		// Long-press the app icon (Android, Windows): straight to these.
		shortcuts: [
			{ name: 'Projects', url: '/dashboard', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
			{ name: 'Notifications', url: '/notifications', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
		],
	};
}
