/**
 * The installable-app bits that must run before React (app/layout.tsx puts this
 * in a beforeInteractive script). Kept free of imports, like theme/themeBoot.ts.
 *
 * - Chrome, Edge and Android offer to install with a `beforeinstallprompt`
 *   event that can fire before the page has hydrated. It is kept on
 *   `window.__mintInstall` (and its own mini-bar held back) so the account
 *   menu's Install app can show the browser's prompt later (installApp.ts).
 * - The service worker (public/sw.js) is registered in production builds only:
 *   in `next dev` it would outlive restarts and get in the way of reloads.
 */
export const PWA_INSTALL_EVENT = 'mint:install';

export const pwaBootScript = (registerWorker: boolean) =>
	`(function(){try{window.__mintInstall=null;` +
	`addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__mintInstall=e;dispatchEvent(new Event('${PWA_INSTALL_EVENT}'))});` +
	`addEventListener('appinstalled',function(){window.__mintInstall=null;dispatchEvent(new Event('${PWA_INSTALL_EVENT}'))});` +
	(registerWorker
		? `if('serviceWorker' in navigator)addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(){})});`
		: '') +
	`}catch(e){}})();`;
