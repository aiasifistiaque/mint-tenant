'use client';

import { useSyncExternalStore } from 'react';
import { PWA_INSTALL_EVENT } from './pwaBoot';

/**
 * Installing the panel as an app (account menu → Install app). Chrome, Edge
 * and Android hand over a prompt (caught early by pwaBoot.ts); Safari and the
 * rest have no prompt, so InstallAppDialog shows that browser's own steps.
 */

type InstallPrompt = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

declare global {
	interface Window {
		__mintInstall?: InstallPrompt | null;
	}
}

export type InstallPlatform = 'ios' | 'android' | 'mac-safari' | 'other';

export const installPlatform = (): InstallPlatform => {
	if (typeof navigator === 'undefined') return 'other';
	const ua = navigator.userAgent;
	// iPadOS says it's a Mac; touch gives it away.
	if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
	if (/Android/.test(ua)) return 'android';
	if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|Firefox|OPR/.test(ua)) return 'mac-safari';
	return 'other';
};

/** Opened as the installed app (from the home screen / dock), not in a browser tab. */
const isStandalone = () =>
	window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const subscribe = (onChange: () => void) => {
	const standalone = window.matchMedia('(display-mode: standalone)');
	window.addEventListener(PWA_INSTALL_EVENT, onChange);
	standalone.addEventListener('change', onChange);
	return () => {
		window.removeEventListener(PWA_INSTALL_EVENT, onChange);
		standalone.removeEventListener('change', onChange);
	};
};

// A string, so the snapshot compares equal between renders.
const getSnapshot = () => `${isStandalone() ? 1 : 0}${window.__mintInstall ? 1 : 0}`;
const getServerSnapshot = () => '10'; // nothing to offer until the browser says

export const useInstallApp = () => {
	const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	return {
		/** Already running as the installed app: nothing to install. */
		installed: snap[0] === '1',
		/** The browser can show its own install prompt (promptInstall). */
		canPrompt: snap[1] === '1',
	};
};

/** Shows the browser's install prompt. A prompt can be used once; the browser offers a new one later if dismissed. */
export const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
	const prompt = window.__mintInstall;
	if (!prompt) return 'unavailable';
	window.__mintInstall = null;
	window.dispatchEvent(new Event(PWA_INSTALL_EVENT));
	await prompt.prompt();
	const { outcome } = await prompt.userChoice;
	return outcome;
};
