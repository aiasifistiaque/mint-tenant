import { FC } from 'react';
import { Monitor, Smartphone, Tablet, HelpCircle } from 'lucide-react';
import type { AdminSessionView } from '../../store/services/sessionsApi';

/**
 * How a signed-in session reads — shared by Settings → Signed-in devices and
 * the super admin's Login sessions page.
 */

export const DeviceIcon: FC<{ type: AdminSessionView['deviceType']; size?: number }> = ({ type, size = 16 }) => {
	const props = { size, strokeWidth: 1.75 };
	if (type === 'mobile') return <Smartphone {...props} />;
	if (type === 'tablet') return <Tablet {...props} />;
	if (type === 'desktop') return <Monitor {...props} />;
	return <HelpCircle {...props} />;
};

/** "Chrome on macOS". */
export const deviceLabel = (s: Pick<AdminSessionView, 'browser' | 'os'>) =>
	[s.browser, s.os].filter(v => v && !/^Unknown/.test(v)).join(' on ') || 'Unknown device';

/** 🇧🇩 from "BD" — the flag emoji is the two regional-indicator letters. */
export const flagOf = (countryCode?: string | null) =>
	countryCode && /^[a-z]{2}$/i.test(countryCode)
		? String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65))
		: '';

/** "🇧🇩 Dhaka, Bangladesh", or "Location unknown". */
export const placeLabel = (s: Pick<AdminSessionView, 'location' | 'countryCode'>) =>
	s.location ? `${flagOf(s.countryCode)} ${s.location}`.trim() : 'Location unknown';

const METHODS: Record<string, string> = {
	password: 'Password',
	'email-code': 'Password + email code',
	passkey: 'Password + passkey',
	'backup-code': 'Password + backup code',
	invitation: 'Accepted an invite',
	legacy: 'Signed in before device tracking',
};
export const methodLabel = (m?: string) => METHODS[m || ''] || m || '';

/** "just now", "5 min ago", "3 h ago", "2 days ago", then the date. */
export const ago = (iso?: string | null) => {
	if (!iso) return '';
	const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
	if (s < 60) return 'just now';
	if (s < 3600) return `${Math.floor(s / 60)} min ago`;
	if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
	if (s < 86400 * 7) return `${Math.floor(s / 86400)} day${s < 86400 * 2 ? '' : 's'} ago`;
	return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const when = (iso?: string | null) =>
	iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
