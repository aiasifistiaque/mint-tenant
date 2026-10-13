import { Scope } from './tokens';
import { PdfTemplate } from './types';

/** Settings as the server sends them (backend normalizeSettings), with nothing set yet. */
export const EMPTY_SETTINGS = {
	business: { name: '', logo: '', address: '', phone: '', email: '', website: '', taxId: '', note: '' },
	currency: { symbol: '', code: '', name: '', decimals: 2, position: 'before' as const, grouping: 'standard' as const },
	dateFormat: 'D MMM YYYY',
	timezone: '',
	texts: [] as SavedText[],
};

export type SavedText = { key: string; label: string; text: string };

/** {{texts.<key>}}'s root — like the server's textsRoot. */
export const textsRoot = (s: any): Record<string, string> => Object.fromEntries(((s?.texts || []) as SavedText[]).map(t => [t.key, t.text]));

/** "Terms & conditions" → terms_conditions, as the server names a saved text. */
export const textKey = (v: string) =>
	String(v || '')
		.trim()
		.toLowerCase()
		.replace(/&/g, ' ')
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.replace(/^(\d)/, 't$1')
		.slice(0, 40);

/**
 * What a template reads when drawn with sample data (the gallery, the
 * designer before a record is picked) — like the server's /render: the
 * scope's business details once they're set, the sample's until then (`own`:
 * always the scope's).
 */
export const sampleScope = (t: PdfTemplate, settings: any, tz: string, data?: any, own = false): Scope => {
	const s = settings || EMPTY_SETTINGS;
	const sample = data || t.sample || {};
	const record = sample[t.alias] ?? {};
	const now = new Date();
	// `own`: the designer shows the project's own business details even while empty, so it can ask for them.
	const business = own || s.business?.name ? s.business : { ...s.business, ...(sample.business || {}) };
	return {
		roots: { ...sample, [t.alias]: record, record, business, texts: textsRoot(s), today: now, now, template: { name: t.name } },
		settings: s,
		tz: s.timezone || tz,
	};
};

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** Dates come over JSON as ISO text: back into dates, so a token with no filter prints them as the PDF does. */
const revive = (v: any): any => {
	if (typeof v === 'string') return ISO.test(v) ? new Date(v) : v;
	if (Array.isArray(v)) return v.map(revive);
	if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, revive(x)]));
	return v;
};

/** A record's data from the server (POST /<route>/export/template, as: 'data'). */
export const recordScope = (data: { roots: any; settings: any; tz: string }): Scope => ({
	roots: { ...revive(data.roots), today: new Date(), now: new Date() },
	settings: data.settings,
	tz: data.tz,
});
