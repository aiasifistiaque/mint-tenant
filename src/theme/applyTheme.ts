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
	const head = font ? `@import url('${font.href}');` : '';
	return `${head}html{${root.join(';')}}html.dark{${darkRules.join(';')}}`;
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
