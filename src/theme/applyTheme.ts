import { system } from './index';
import { Theme } from './palettes';
import { PAIRS, SEMANTIC, valueOf } from './roles';
import { THEME_CSS_KEY, THEME_STYLE_ID } from './themeBoot';

/**
 * Applies a colour theme by overriding the CSS variables Chakra generates for
 * the admin's colour tokens — no reload, no second Chakra system, and every
 * component that already uses the tokens follows.
 *
 * Two kinds of token are covered:
 *
 * - The paired raw tokens most of the admin's own chrome uses (`sidebar.light`
 *   with `_dark: sidebar.dark`, `table.bg.light`/`.dark`, …). Both halves are
 *   set at once from the theme's light and dark palettes; the component's own
 *   `_dark` picks one, as it always has.
 * - Chakra's mode-aware semantic tokens (`bg`, `fg`, `border`, `gray.solid`,
 *   …) that the built-in components use. These are set once under `html`
 *   (light) and once under `html.dark` — next-themes puts the mode's class on
 *   <html>.
 *
 * The rules are written unlayered, and Chakra emits its tokens inside
 * `@layer tokens`, so these win without any specificity games.
 */

/** `sidebar.bodyText.light` → `--chakra-colors-sidebar-body-text-light`, as Chakra names it. */
const cssVar = (token: string) => system.token.var(`colors.${token}`).replace(/^var\(|\)$/g, '');

const CORNERS = {
	square: { container: '3px', modal: '4px', menu: '3px', menuInner: '2px', button: '3px', input: '2px', l1: '2px', l2: '3px', l3: '4px' },
	soft: { container: '10px', modal: '12px', menu: '10px', menuInner: '6px', button: '7px', input: '7px', l1: '4px', l2: '6px', l3: '8px' },
	round: { container: '20px', modal: '24px', menu: '18px', menuInner: '12px', button: '9999px', input: '14px', l1: '6px', l2: '10px', l3: '14px' },
};

const DENSITY = { compact: '4px', comfortable: '', roomy: '13px' };

/**
 * A theme's `look` (palettes.ts): the `--panel-*` variables theme/index.ts and
 * config `radius` read, Chakra's font and radius tokens, and table rules.
 * Returns the root declarations, the @imports and any extra rules.
 */
const lookCss = (theme: Theme) => {
	const look = theme.look;
	const root: string[] = [];
	const rules: string[] = [];
	const imports: string[] = [];
	if (!look) return { root, rules, imports };
	if (look.font) {
		imports.push(look.font.href);
		root.push(`--panel-font:${look.font.family}`, `--chakra-fonts-body:${look.font.family}`, `--chakra-fonts-heading:${theme.headingFont?.family || look.font.family}`);
		if (!theme.headingFont) root.push(`--chakra-fonts-display:${look.font.family}`);
	}
	if (look.text) root.push(`--panel-text:${look.text}`);
	if (look.weight) root.push(`--panel-weight:${look.weight}`);
	const h = look.headings;
	if (h) {
		root.push(`--panel-heading-case:${h.uppercase ? 'uppercase' : 'none'}`, `--panel-heading-weight:${h.weight}`, `--panel-heading-weight-3:${h.weight}`);
		if (h.spacing) root.push(`--panel-heading-spacing:${h.spacing}`, `--panel-heading-spacing-3:${h.spacing}`);
	}
	const l = look.labels;
	if (l) {
		root.push(`--panel-label-size:${l.size}`, `--panel-label-case:${l.uppercase ? 'uppercase' : 'none'}`);
		if (l.font) root.push(`--panel-label-font:${l.font}`);
		if (l.weight) root.push(`--panel-label-weight:${l.weight}`);
		if (l.spacing) root.push(`--panel-label-spacing:${l.spacing}`);
	}
	if (look.corners) {
		const c = CORNERS[look.corners];
		root.push(
			`--panel-r-container:${c.container}`,
			`--panel-r-modal:${c.modal}`,
			`--panel-r-menu:${c.menu}`,
			`--panel-r-menu-inner:${c.menuInner}`,
			`--panel-r-button:${c.button}`,
			`--panel-r-input:${c.input}`,
			`--chakra-radii-l1:${c.l1}`,
			`--chakra-radii-l2:${c.l2}`,
			`--chakra-radii-l3:${c.l3}`,
		);
	}
	const t = look.table;
	if (t) {
		const cell = '.chakra-table__cell';
		const head = '.chakra-table__columnHeader';
		const pad = DENSITY[t.density];
		if (pad) rules.push(`${cell},${head}{padding-top:${pad}!important;padding-bottom:${pad}!important}`);
		// Rows carry a fixed 40px height (RowContainerMd) besides the padding.
		if (t.density === 'compact') rules.push(`.chakra-table__body .chakra-table__row{height:32px}${head}{height:30px}`);
		if (t.density === 'roomy') rules.push(`.chakra-table__body .chakra-table__row{height:54px}${head}{height:44px}`);
		// Chakra writes style props (a page's own fontSize, Title's caps) as
		// unlayered classes too, so the table text rules need !important to win.
		if (t.text) rules.push(`${cell},${cell} p{font-size:${t.text}!important}`);
		const line = 'var(--chakra-colors-border)';
		if (t.lines === 'grid') rules.push(`${cell},${head}{border:1px solid ${line}}.chakra-table__root{border-collapse:collapse}`);
		if (t.lines === 'none') rules.push(`${cell},${head},.chakra-table__row{border-bottom-width:0!important}`);
		if (t.striped) rules.push(`.chakra-table__body .chakra-table__row:nth-of-type(even):not(:hover){background:var(--chakra-colors-bg-subtle)}`);
		if (t.header !== 'caps') {
			const plain = `text-transform:none!important;letter-spacing:0!important;font-size:calc(${t.text || '13px'} - 0.5px)!important;font-weight:600!important;font-family:var(--panel-font,inherit)!important`;
			rules.push(`${head},${head} *{${plain}}`);
		}
		if (t.header === 'filled') rules.push(`${head}{background:var(--chakra-colors-bg-muted)!important}`);
	}
	return { root, rules, imports };
};

/** The stylesheet for a theme; empty for the built-in look. */
export const themeCss = (theme: Theme) => {
	if (theme.builtIn) return '';
	const { light, dark } = theme;
	const root = [
		...PAIRS.flatMap(([l, d, v]) => [`${cssVar(l)}:${valueOf(v, light)}`, `${cssVar(d)}:${valueOf(v, dark)}`]),
		...SEMANTIC.map(([t, v]) => `${cssVar(t)}:${valueOf(v, light)}`),
		`color-scheme:light`,
	];
	const darkRules = [...SEMANTIC.map(([t, v]) => `${cssVar(t)}:${valueOf(v, dark)}`), `color-scheme:dark`];
	// A heading typeface: its stylesheet first (an @import must lead), then the
	// tokens page titles read (`display`). Kept in the same cached stylesheet,
	// so the boot script replays the font too.
	const font = theme.headingFont;
	if (font) root.push(`--chakra-fonts-display:${font.family}`);
	if (font?.weight) root.push(`--chakra-font-weights-display:${font.weight}`);
	const look = lookCss(theme);
	root.push(...look.root);
	const head = [font?.href, ...look.imports]
		.filter(Boolean)
		.map(href => `@import url('${href}');`)
		.join('');
	return `${head}html{${root.join(';')}}html.dark{${darkRules.join(';')}}${look.rules.join('')}`;
};

export const applyTheme = (theme: Theme) => {
	if (typeof document === 'undefined') return;
	const css = themeCss(theme);
	let el = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
	if (!el) {
		el = document.createElement('style');
		el.id = THEME_STYLE_ID;
		document.head.appendChild(el);
	}
	if (el.textContent !== css) el.textContent = css;
	try {
		if (css) localStorage.setItem(THEME_CSS_KEY, css);
		else localStorage.removeItem(THEME_CSS_KEY);
	} catch {
		// Storage is only the pre-paint cache; the theme itself is applied above.
	}
};
