'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '@/components/library';

/** The code the backend's adminProtect sends for a signed-out session. */
export const REVOKED_CODE = 'SESSION_REVOKED';
/** The tenant API's: this account was removed from the organization the token works in. */
export const ORG_REVOKED_CODE = 'ORG_ACCESS_REVOKED';
/** Tells the login page why it's showing (read once, then cleared). */
export const SIGNED_OUT_KEY = 'mint:signed-out';

/**
 * Signs this browser out the moment the server says its session was signed
 * out — from another device's Settings → Signed-in devices, or by a super
 * admin on Login sessions — or, in the tenant panel, that the account was
 * removed from the organization it was working in. Any API response of 401 with
 * `{ code: 'SESSION_REVOKED' }` triggers it, whichever part of the app made
 * the request (RTK Query and plain fetch both go through window.fetch).
 *
 * Mounted once in the root providers, next to ThemeSync.
 */
const SessionGuard = () => {
	const dispatch = useDispatch();

	useEffect(() => {
		const w = window as any;
		if (w.__mintSessionGuard) return;
		const original = window.fetch.bind(window);
		let signingOut = false;

		const signOut = () => {
			if (signingOut) return;
			signingOut = true;
			try {
				sessionStorage.setItem(SIGNED_OUT_KEY, 'revoked');
			} catch {
				/* private mode: the login page just won't say why */
			}
			dispatch(logout());
		};

		w.__mintSessionGuard = true;
		window.fetch = async (...args: Parameters<typeof fetch>) => {
			const res = await original(...args);
			if (res.status === 401) {
				res
					.clone()
					.json()
					.then(body => (body?.code === REVOKED_CODE || body?.code === ORG_REVOKED_CODE) && signOut())
					.catch(() => undefined);
			}
			return res;
		};
		return () => {
			window.fetch = original;
			w.__mintSessionGuard = false;
		};
	}, [dispatch]);

	return null;
};

export default SessionGuard;
