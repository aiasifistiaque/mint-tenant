import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';

/**
 * Passkeys in the browser — shared by the sign-in step (app/auth/login) and
 * Settings → Two-factor authentication. The browser's own prompt does the
 * work: Touch ID / Face ID with Apple Keychain, Google Password Manager in
 * Chrome, Windows Hello, a phone by QR code, or a security key.
 */

export { startAuthentication, startRegistration };

export const passkeysSupported = () => typeof window !== 'undefined' && browserSupportsWebAuthn();

/** "Chrome on macOS" — the suggested name for a passkey added here. */
export const deviceName = () => {
	if (typeof navigator === 'undefined') return 'Passkey';
	const ua = navigator.userAgent;
	const browser = /Edg\//.test(ua)
		? 'Edge'
		: /OPR\//.test(ua)
		? 'Opera'
		: /Firefox\//.test(ua)
		? 'Firefox'
		: /Chrome\//.test(ua)
		? 'Chrome'
		: /Safari\//.test(ua)
		? 'Safari'
		: 'Browser';
	const os = /iPhone/.test(ua)
		? 'iPhone'
		: /iPad/.test(ua)
		? 'iPad'
		: /Android/.test(ua)
		? 'Android'
		: /Mac OS X/.test(ua)
		? 'macOS'
		: /Windows/.test(ua)
		? 'Windows'
		: /Linux/.test(ua)
		? 'Linux'
		: '';
	return os ? `${browser} on ${os}` : browser;
};

/** A browser's passkey error, in words. */
export const passkeyError = (e: any, adding = false): string => {
	const name = e?.name || e?.cause?.name;
	if (name === 'NotAllowedError' || name === 'AbortError')
		return adding
			? 'The passkey prompt was closed before it finished.'
			: 'The passkey prompt was closed, or this browser has no passkey for this account.';
	if (name === 'InvalidStateError') return 'That passkey is already added to your account.';
	if (name === 'SecurityError') return 'Passkeys only work on a secure page (https) with the right address.';
	if (name === 'NotSupportedError') return 'This browser doesn’t support passkeys.';
	return e?.data?.message || e?.message || 'Something went wrong with the passkey.';
};
