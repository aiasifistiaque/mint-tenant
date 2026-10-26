import type { AnalyticsVisitor, VisitorPlace } from '@/components/library/store/services/tenantApi';

/** Shared wording for the Analytics pages (docs/multi-tenancy WO-56). */

export const number = (v: number) => v.toLocaleString();

/** 🇧🇩 from "BD" — a flag without an image. */
export const flag = (code?: string | null) =>
	code && /^[A-Za-z]{2}$/.test(code) ? String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1f1a5 + c.charCodeAt(0))) : '';

/** Seconds as "42s", "3m 05s", "1h 02m". */
export const duration = (s?: number | null) => {
	if (typeof s !== 'number' || !Number.isFinite(s) || s <= 0) return '—';
	if (s < 60) return `${Math.round(s)}s`;
	if (s < 3600) return `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`;
	return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;
};

/** "just now", "5 min ago", "3 h ago", then the date. */
export const ago = (at?: string) => {
	if (!at) return '—';
	const ms = Date.now() - new Date(at).getTime();
	if (ms < 60_000) return 'just now';
	if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
	if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} h ago`;
	return new Date(at).toLocaleDateString(undefined, { dateStyle: 'medium' });
};

export const time = (at: string) => new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** The name a visitor goes by here: who the site says they are, or "Visitor 3f9a2c". */
export const visitorName = (v: Pick<AnalyticsVisitor, 'name' | 'email' | 'visitorId'>) => v.name || v.email || `Visitor ${v.visitorId.slice(0, 6)}`;

/** "Dhaka, Bangladesh" (with its flag). */
export const placeLine = (p?: Pick<VisitorPlace, 'city' | 'country' | 'countryCode' | 'region'> | null) => {
	if (!p || (!p.city && !p.country)) return '';
	return [flag(p.countryCode), [p.city, p.country].filter(Boolean).join(', ')].filter(Boolean).join(' ');
};

/** "Samsung SM-S918B · Chrome · Android" — the model when the browser tells it. */
export const deviceLine = (v: Pick<AnalyticsVisitor, 'device' | 'deviceModel' | 'browser' | 'os'>) =>
	[v.deviceModel || (v.device ? v.device[0].toUpperCase() + v.device.slice(1) : ''), v.browser, v.os].filter(x => x && !/^Unknown/.test(x)).join(' · ');

/** "Paid search · Google Ads", "Direct". */
export const sourceLine = (channel?: string, source?: string) => [channel, source].filter(Boolean).join(' · ');

/** The ad network a click id belongs to, as people call it. */
export const AD_NETWORK: Record<string, string> = {
	google: 'Google Ads (gclid)',
	microsoft: 'Microsoft Ads (msclkid)',
	meta: 'Meta (fbclid)',
	tiktok: 'TikTok (ttclid)',
	linkedin: 'LinkedIn (li_fat_id)',
	x: 'X (twclid)',
	snapchat: 'Snapchat (ScCid)',
	pinterest: 'Pinterest (epik)',
};

export const CHANNELS = ['Direct', 'Organic search', 'Paid search', 'Social', 'Paid social', 'Email', 'Referral', 'Paid other'];
