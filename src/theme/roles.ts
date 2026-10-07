import type { Palette } from './palettes';

/**
 * How a palette's roles (palettes.ts) map onto the Chakra colour tokens the
 * panel uses. Shared by colors.theme.ts / index.ts — which paint the built-in
 * look (the website's, palettes.ts MINT) into the tokens themselves, so the
 * first paint is already right — and applyTheme.ts, which overrides the same
 * tokens' CSS variables when an account picks another theme.
 *
 * No imports but types: colors.theme.ts reads this before the system exists.
 */

type Role = keyof Palette;
export type Value = Role | ((p: Palette) => string);

export const mix = (a: string, pct: number, b: string) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;
export const alpha = (a: string, pct: number) => mix(a, pct, 'transparent');

/** [light token, dark token, value] — the same value taken from each palette. */
export const PAIRS: [string, string, Value][] = [
	['navbar.light', 'navbar.dark', 'page'],
	['navbar.blurLight', 'navbar.blurDark', 'page'],
	['background.light', 'background.dark', 'page'],
	['background.cardLight', 'background.cardDark', 'subtle'],
	['result.bg.light', 'result.bg.dark', 'page'],

	['sidebar.light', 'sidebar.dark', 'sidebar'],
	['sidebar.header.light', 'sidebar.header.dark', 'sidebar'],
	['sidebar.headerBlur.light', 'sidebar.headerBlur.dark', p => alpha(p.sidebar, 55)],
	['sidebar.borderBottom.light', 'sidebar.borderBottom.dark', 'sidebarRail'],
	['sidebar.selectedItemBorder.light', 'sidebar.selectedItemBorder.dark', 'sidebarRail'],
	['sidebar.selectedItemBg.light', 'sidebar.selectedItemBg.dark', 'surface'],
	['sidebar.rail.light', 'sidebar.rail.dark', 'sidebarRail'],
	['sidebar.hoverUnderline.light', 'sidebar.hoverUnderline.dark', p => mix(p.sidebarText, 45, p.sidebar)],
	['sidebar.headerText.light', 'sidebar.headerText.dark', 'sidebarTextActive'],
	['sidebar.bodyText.light', 'sidebar.bodyText.dark', 'sidebarText'],
	['sidebar.bodyText.headingLight', 'sidebar.bodyText.headingDark', 'sidebarHeading'],
	['sidebar.bodyText.selectedLight', 'sidebar.bodyText.selectedDark', 'sidebarTextActive'],
	['sidebar.hoverLight', 'sidebar.hoverDark', p => mix(p.sidebarText, 8, p.sidebar)],
	['sidebar.itemHover.light', 'sidebar.itemHover.dark', p => mix(p.sidebarText, 4, p.sidebar)],
	['sidebar.itemActive.light', 'sidebar.itemActive.dark', p => mix(p.sidebarText, 8, p.sidebar)],

	['navbar.text.light', 'navbar.text.dark', 'text'],
	['navbar.border.light', 'navbar.border.dark', 'border'],
	['navbar.borderBottomLight', 'navbar.borderBottomDark', 'border'],

	['menu.light', 'menu.dark', 'surface'],
	['hover.light', 'hover.dark', 'subtle'],
	['card.light', 'card.dark', 'surface'],
	['header.light', 'header.dark', 'surface'],
	['container.light', 'container.dark', 'surface'],
	['container.newLight', 'container.newDark', 'surface'],
	['container.borderLight', 'container.borderDark', 'border'],
	['border.light', 'border.dark', 'border'],
	['selectBorder.light', 'selectBorder.dark', 'border'],
	['eborder.light', 'eborder.dark', 'borderMuted'],

	['field.bg.light', 'field.bg.dark', 'surface'],
	['field.border.light', 'field.border.dark', 'border'],
	['field.borderHover.light', 'field.borderHover.dark', p => mix(p.border, 80, p.text)],
	['field.placeholder.light', 'field.placeholder.dark', p => mix(p.textMuted, 75, p.surface)],
	['field.focusRing.light', 'field.focusRing.dark', 'accent'],

	['text.light', 'text.dark', 'text'],
	['text.selected', 'text.selectedDark', 'text'],
	['text.secondary.light', 'text.secondary.dark', 'textMuted'],
	['text.heading.light', 'text.heading.dark', 'text'],
	['text.formLabel.light', 'text.formLabel.dark', 'text'],
	['heading.light', 'heading.dark', 'text'],
	['heading.lightMuted', 'heading.darkMuted', 'textMuted'],

	['table.bg.light', 'table.bg.dark', 'surface'],
	['table.bgLight', 'table.bgDark', 'surface'],
	['table.head.bgLight', 'table.head.bgDark', 'surface'],
	['table.head.textLight', 'table.head.textDark', 'textMuted'],
	['table.row.light', 'table.row.dark', 'surface'],
	['table.row.hoverLight', 'table.row.hoverDark', 'subtle'],
	['table.innerBorder.light', 'table.innerBorder.dark', 'borderMuted'],
	['table.outerBorder.light', 'table.outerBorder.dark', 'borderMuted'],
	['table.cardBorder.light', 'table.cardBorder.dark', 'borderMuted'],

	['brand.light', 'brand.dark', 'accent'],

	['stroke.deepL', 'stroke.deepD', 'borderMuted'],
	['pos.light', 'pos.dark', 'muted'],
	['image.50', 'image.900', 'muted'],
	['image.100', 'image.800', p => mix(p.muted, 88, p.text)],
	['sidebar.hover.bgLight', 'sidebar.hover.bgDark', p => mix(p.sidebarText, 6, p.sidebar)],
	['menu.blurLight', 'menu.blurDark', p => alpha(p.surface, 80)],
];

/** Mode-aware semantic tokens, set per mode. */
export const SEMANTIC: [string, Value][] = [
	['bg', 'page'],
	['bg.subtle', 'subtle'],
	['bg.muted', 'muted'],
	['bg.emphasized', p => mix(p.muted, 90, p.text)],
	['bg.panel', 'surface'],
	['fg', 'text'],
	['fg.muted', 'textMuted'],
	['fg.subtle', p => mix(p.textMuted, 70, p.page)],
	['border', 'border'],
	['border.muted', 'borderMuted'],
	['border.subtle', 'borderMuted'],
	['border.emphasized', p => mix(p.border, 85, p.text)],
	// Solid buttons and switches default to the gray palette; its solid is the
	// theme's accent.
	['gray.solid', 'accent'],
	['gray.contrast', 'accentFg'],
	['gray.focusRing', 'accent'],
	['brand.solid', 'accent'],
	['brand.contrast', 'accentFg'],
	['brand.focusRing', 'accent'],
	['accent.solid', 'accent'],
	['accent.contrast', 'accentFg'],
	['accent.fg', p => mix(p.accent, 80, p.text)],
	['accent.subtle', p => mix(p.accent, 12, p.surface)],
	['accent.muted', p => mix(p.accent, 30, p.surface)],
	['accent.focusRing', 'accent'],
	// Legacy single-value tokens some older components still name. Set per
	// mode, since they have no dark twin.
	['brand.500', 'accent'],
	['brand.600', 'accent'],
	['brand.200', 'accent'],
	['text.500', 'text'],
	['text.shade', 'textMuted'],
	['header.500', 'text'],
	['header.200', 'text'],
];

export const valueOf = (v: Value, p: Palette) => (typeof v === 'function' ? v(p) : p[v]);

/**
 * Single-valued tokens in SEMANTIC (no dark twin): applyTheme sets them per
 * mode; the built-in look gives them the light palette's value.
 */
export const LEGACY_TOKENS = new Set(['brand.500', 'brand.600', 'brand.200', 'text.500', 'text.shade', 'header.500', 'header.200']);
