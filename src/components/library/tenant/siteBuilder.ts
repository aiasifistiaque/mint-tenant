/**
 * The site builder lives on its own address (repo mint-builder,
 * builder.mintapp.shop). The panel opens it in a new tab and hands it the
 * signed-in user's token over postMessage — only to the builder's exact
 * origin, never in the address — and the builder keeps it in its own
 * HttpOnly session cookie (mint-builder src/app/auth/handoff).
 */

import { TOKEN_NAME } from '../config/lib/constants/constants';

export const BUILDER_URL = (
	process.env.NEXT_PUBLIC_BUILDER_URL || (process.env.NODE_ENV === 'production' ? 'https://builder.mintapp.shop' : 'http://localhost:3400')
).replace(/\/+$/, '');

const BUILDER_ORIGIN = (() => {
	try {
		return new URL(BUILDER_URL).origin;
	} catch {
		return BUILDER_URL;
	}
})();

/** The signed-in user's token — the store mirrors auth.token into localStorage, so it's the one RTK sends. */
const currentToken = (): string | null => {
	try {
		const t = localStorage.getItem(TOKEN_NAME);
		return t && t !== 'null' && t !== 'undefined' ? t : null;
	} catch {
		return null;
	}
};

/**
 * Opens the builder for a website project (its publicSlug), signed in as
 * this user. Call it from a click — browsers block tabs opened otherwise.
 * Returns null when the tab was blocked (or nobody is signed in).
 */
export const openSiteBuilder = (project: string, page?: string): Window | null => {
	const token = currentToken();
	if (!token) return null;
	const query = new URLSearchParams({ project, ...(page && { page }) });
	const tab = window.open(`${BUILDER_URL}/auth/handoff?${query}`, '_blank');
	if (!tab) return null;
	const onMessage = (e: MessageEvent) => {
		if (e.origin !== BUILDER_ORIGIN || e.source !== tab || e.data?.type !== 'MINT_BUILDER_READY') return;
		window.removeEventListener('message', onMessage);
		tab.postMessage({ type: 'MINT_BUILDER_AUTH', token, project }, BUILDER_ORIGIN);
	};
	window.addEventListener('message', onMessage);
	// The handoff page asks within a few seconds; stop listening after a minute either way.
	setTimeout(() => window.removeEventListener('message', onMessage), 60_000);
	tab.focus();
	return tab;
};
