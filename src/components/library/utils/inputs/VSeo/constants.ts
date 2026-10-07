/**
 * Shared constants for the SEO editor.
 *
 * The length windows are Google's practical pixel limits expressed in
 * characters. They are guidance, not validation: going over does not block a
 * save, it just greys the counter.
 *
 * Ported from ags-admin's VSeo (Chakra v2) — see docs on that field for the
 * original rationale. Values are unchanged; only VSeo.tsx itself needed to
 * change for Chakra v3.
 */

export const TITLE_MIN = 30;
export const TITLE_MAX = 60;
export const TITLE_HARD_MAX = 70;

export const DESCRIPTION_MIN = 70;
export const DESCRIPTION_MAX = 160;
export const DESCRIPTION_HARD_MAX = 320;

export const OG_TYPE_OPTIONS = [
	// Empty means "let the page decide" — a product page picks product, a
	// blog post picks article. Pinning a value here overrides that.
	{ label: 'Auto (match the page type)', value: '' },
	{ label: 'Website', value: 'website' },
	{ label: 'Article', value: 'article' },
	{ label: 'Book', value: 'book' },
	{ label: 'Profile', value: 'profile' },
];

export const TWITTER_CARD_OPTIONS = [
	{ label: 'Large image summary (default)', value: '' },
	{ label: 'Large image summary', value: 'summary_large_image' },
	{ label: 'Summary', value: 'summary' },
	{ label: 'App', value: 'app' },
	{ label: 'Player', value: 'player' },
];

export const IMAGE_PREVIEW_OPTIONS = [
	{ label: 'Large (recommended)', value: 'large' },
	{ label: 'Standard', value: 'standard' },
	{ label: 'None', value: 'none' },
];

export const CHANGE_FREQUENCY_OPTIONS = [
	{ label: 'Always', value: 'always' },
	{ label: 'Hourly', value: 'hourly' },
	{ label: 'Daily', value: 'daily' },
	{ label: 'Weekly', value: 'weekly' },
	{ label: 'Monthly', value: 'monthly' },
	{ label: 'Yearly', value: 'yearly' },
	{ label: 'Never', value: 'never' },
];

/**
 * Which JSON-LD generator the frontend should run for this page.
 * 'auto' lets the page pick from its own kind, which is right almost always.
 */
export const SCHEMA_TYPE_OPTIONS = [
	{ label: 'Auto (match the page type)', value: 'auto' },
	{ label: 'None', value: 'none' },
	{ label: 'Web Page', value: 'WebPage' },
	{ label: 'Article', value: 'Article' },
	{ label: 'Blog Posting', value: 'BlogPosting' },
	{ label: 'Product', value: 'Product' },
	{ label: 'Place', value: 'Place' },
	{ label: 'Organization', value: 'Organization' },
	{ label: 'Local Business', value: 'LocalBusiness' },
	{ label: 'FAQ Page', value: 'FAQPage' },
	{ label: 'Job Posting', value: 'JobPosting' },
	{ label: 'Service', value: 'Service' },
];

// This admin serves several storefronts (frontend/mint-app/user-app/store),
// so there is no single canonical public domain the way ags-admin has one —
// fall back to whatever host the admin itself is being viewed from, which is
// only ever used for the cosmetic SERP-preview breadcrumb, never published.
export const SITE_URL =
	process.env.NEXT_PUBLIC_WEBSITE_URL ||
	(typeof window !== 'undefined' ? window.location.origin : 'https://example.com');

/** Spreadable {color, _dark:{color}} props for a light/dark hex pair. */
export const tone = (pair: { light: string; dark: string }) => ({
	color: pair.light,
	_dark: { color: pair.dark },
});

export const TEXT_FAINT = { light: '#8A94A3', dark: '#7C8794' };
export const TEXT_MUTED = { light: '#5F6B7A', dark: '#9AA5B1' };
export const TEXT_BODY = { light: '#3D4552', dark: '#D7DCE3' };
export const TEXT_STRONG = { light: '#1F2530', dark: '#F0F2F5' };
export const SUCCESS = { light: '#2F855A', dark: '#5FD98A' };
export const WARNING = { light: '#B7791F', dark: '#F2B355' };
export const DANGER = { light: '#C53030', dark: '#FC8181' };
export const CARD_BG = { light: '#F7F8FA', dark: 'rgba(255,255,255,0.03)' };
export const CARD_BORDER = { light: '#E4E4E4', dark: 'rgba(255,255,255,0.14)' };
