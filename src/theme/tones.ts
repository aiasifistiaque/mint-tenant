/**
 * The marketing website's colour tones (mint-webpage lib/tones.ts). The site
 * gives each workflow step, feature group and chart one tone; the panel does
 * the same for sidebar groups, stat cards and charts, so it reads as colourful
 * as the site without colouring the data itself.
 *
 * `fg` is the tone as text or a thin glyph on the page (600 by day, 400 at
 * night), `solid` its dot or bar, `soft` the faint wash behind it.
 */
export type Tone = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'cyan';

type ToneColors = { fg: { _light: string; _dark: string }; solid: string; soft: { _light: string; _dark: string } };

export const TONES: Record<Tone, ToneColors> = {
	emerald: { fg: { _light: '#059669', _dark: '#34d399' }, solid: '#10b981', soft: { _light: '#ecfdf5', _dark: 'rgb(52 211 153 / 0.1)' } },
	sky: { fg: { _light: '#0284c7', _dark: '#38bdf8' }, solid: '#0ea5e9', soft: { _light: '#f0f9ff', _dark: 'rgb(56 189 248 / 0.1)' } },
	violet: { fg: { _light: '#7c3aed', _dark: '#a78bfa' }, solid: '#8b5cf6', soft: { _light: '#f5f3ff', _dark: 'rgb(167 139 250 / 0.1)' } },
	amber: { fg: { _light: '#d97706', _dark: '#fbbf24' }, solid: '#f59e0b', soft: { _light: '#fffbeb', _dark: 'rgb(251 191 36 / 0.1)' } },
	rose: { fg: { _light: '#e11d48', _dark: '#fb7185' }, solid: '#f43f5e', soft: { _light: '#fff1f2', _dark: 'rgb(251 113 133 / 0.1)' } },
	cyan: { fg: { _light: '#0891b2', _dark: '#22d3ee' }, solid: '#06b6d4', soft: { _light: '#ecfeff', _dark: 'rgb(34 211 238 / 0.1)' } },
};

/** The order tones are handed out in, one per item in a list. */
export const TONE_ORDER: Tone[] = ['emerald', 'sky', 'violet', 'amber', 'rose', 'cyan'];

export const toneAt = (i: number): ToneColors => TONES[TONE_ORDER[((i % TONE_ORDER.length) + TONE_ORDER.length) % TONE_ORDER.length]];

/** The brand gradient — the logo, accent words and the main call to action. */
export const BRAND_GRADIENT = 'linear-gradient(110deg, #10b981 0%, #06b6d4 40%, #6366f1 75%, #a855f7 100%)';

/** The header and footer items' small spaced capitals (the website's `.caps`). */
export const CAPS = {
	textTransform: 'uppercase',
	letterSpacing: '0.16em',
	fontSize: '11.5px',
	fontWeight: '300',
} as const;

/** Labels: JetBrains Mono in small spaced capitals (the website's eyebrows). */
export const MONO_CAPS = {
	fontFamily: 'mono',
	textTransform: 'uppercase',
	letterSpacing: '0.14em',
	fontSize: '10.5px',
	fontWeight: '400',
} as const;

/**
 * The website's icon tile (`.glyph`): a quiet neutral tile with a hairline
 * border and a soft top highlight; the icon inside is drawn in one tone.
 */
export const GLYPH = {
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
	borderWidth: '1px',
	borderColor: 'border',
	background: 'linear-gradient(180deg, #ffffff 0%, #f5f6f8 100%)',
	boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.9), 0 1px 2px rgb(16 24 40 / 0.05)',
	_dark: {
		borderColor: '#2a2a2a',
		background: 'linear-gradient(180deg, #202020 0%, #161616 100%)',
		boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.06), 0 1px 2px rgb(0 0 0 / 0.4)',
	},
} as const;
