'use client';

import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import colors from './colors.theme';
import { DEFAULT_THEME, themeById } from './palettes';
import { LEGACY_TOKENS, SEMANTIC, valueOf } from './roles';
import {
	buttonRecipe,
	comboboxSlotRecipe,
	dialogSlotRecipe,
	drawerSlotRecipe,
	inputRecipe,
	menuSlotRecipe,
	nativeSelectSlotRecipe,
	selectSlotRecipe,
	tableSlotRecipe,
	textareaRecipe,
} from './recipes';

const SANS = 'var(--font-outfit), ui-sans-serif, system-ui, sans-serif';
const MONO = 'var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace';

/**
 * The built-in palette (the website's, palettes.ts) as Chakra's mode-aware
 * semantic tokens — bg, fg, border, gray.solid, accent… — the same roles
 * applyTheme.ts sets for the other colour themes.
 */
const PAINTED = (() => {
	const { light, dark } = themeById(DEFAULT_THEME);
	const out: Record<string, any> = {};
	SEMANTIC.filter(([token]) => !LEGACY_TOKENS.has(token)).forEach(([token, v]) => {
		const [group, key = 'DEFAULT'] = token.split('.');
		out[group] = out[group] || {};
		out[group][key] = { value: { _light: valueOf(v, light), _dark: valueOf(v, dark) } };
	});
	return out;
})();

const merge = (base: Record<string, any>, over: Record<string, any>) => {
	const out = { ...base };
	Object.entries(over).forEach(([k, v]) => (out[k] = { ...(base[k] || {}), ...v }));
	return out;
};

export const system = createSystem(defaultConfig, {
	theme: {
		tokens: {
			colors: colors,
			// The website's type: Outfit for everything (slim and geometric, light
			// weights), JetBrains Mono for labels. Both come from next/font in
			// app/layout.tsx as CSS variables.
			fonts: {
				body: { value: SANS },
				heading: { value: SANS },
				mono: { value: MONO },
				// Page titles only. Outfit, unless a colour theme brings its own
				// heading typeface (palettes.ts `headingFont`).
				display: { value: 'inherit' },
			},
			// The website never goes past 500 — no semibold or bold. The
			// components spell weights as numbers (`fontWeight='600'`), so the
			// numbers themselves are tokens here, a step lighter.
			fontWeights: {
				display: { value: '200' },
				medium: { value: '400' },
				semibold: { value: '500' },
				bold: { value: '500' },
				'500': { value: '400' },
				'600': { value: '500' },
				'700': { value: '500' },
				'800': { value: '500' },
			},
		},
		semanticTokens: {
			colors: merge({
				brand: {
					solid: { value: '{colors.blue.500}' },
					contrast: { value: 'white' },
					fg: { value: '{colors.blue.700}' },
					muted: { value: '{colors.blue.100}' },
					subtle: { value: '{colors.blue.50}' },
					emphasized: { value: '{colors.blue.600}' },
					focusRing: { value: '{colors.blue.500}' },
				},

				// The theme's accent — primary actions, links, selection. Components
				// use these rather than `brand.*` or a literal colour so a colour
				// theme (applyTheme.ts) recolours them; the defaults are the
				// neutral black/white accent this admin has always had.
				accent: {
					solid: { value: { _light: '#171717', _dark: '#fafafa' } },
					contrast: { value: { _light: '#ffffff', _dark: '#0a0a0a' } },
					// Accent-coloured text on the page: links, selected labels.
					fg: { value: { _light: '#171717', _dark: '#fafafa' } },
					// A faint accent tint behind selected rows and chips.
					subtle: { value: { _light: '{colors.neutral.100}', _dark: '#171717' } },
					muted: { value: { _light: '{colors.neutral.200}', _dark: '#222222' } },
					focusRing: { value: { _light: '#171717', _dark: '#d4d4d4' } },
				},

				// Chakra derives bg/fg/border from the `gray` scale, and this theme
				// collapses that scale onto a few brand values — which left muted
				// text and every default border black-on-black in dark mode. These
				// point at the `neutral` ramp instead so the built-in components
				// resolve to something visible.
				bg: {
					DEFAULT: { value: { _light: '#ffffff', _dark: '#000000' } },
					subtle: { value: { _light: '{colors.neutral.50}', _dark: '#0a0a0a' } },
					muted: { value: { _light: '{colors.neutral.100}', _dark: '#151515' } },
					emphasized: { value: { _light: '{colors.neutral.200}', _dark: '#1f1f1f' } },
					panel: { value: { _light: '#ffffff', _dark: '#0a0a0a' } },
					inverted: { value: { _light: '#171717', _dark: '#fafafa' } },
				},
				fg: {
					DEFAULT: { value: { _light: '#171717', _dark: '{colors.text.dark}' } },
					muted: { value: { _light: '{colors.neutral.500}', _dark: '#8f8f8f' } },
					subtle: { value: { _light: '{colors.neutral.400}', _dark: '#6b6b6b' } },
					inverted: { value: { _light: '#fafafa', _dark: '#0a0a0a' } },
				},
				border: {
					DEFAULT: { value: { _light: '{colors.border.light}', _dark: '{colors.border.dark}' } },
					muted: { value: { _light: '#ebebeb', _dark: '#1c1c1c' } },
					subtle: { value: { _light: '{colors.neutral.100}', _dark: '#161616' } },
					emphasized: { value: { _light: '{colors.neutral.300}', _dark: '#333333' } },
				},
				gray: {
					contrast: { value: { _light: '#ffffff', _dark: '#0a0a0a' } },
					fg: { value: { _light: '{colors.neutral.700}', _dark: '{colors.neutral.300}' } },
					subtle: { value: { _light: '{colors.neutral.100}', _dark: '#171717' } },
					muted: { value: { _light: '{colors.neutral.200}', _dark: '#222222' } },
					emphasized: { value: { _light: '{colors.neutral.300}', _dark: '#2e2e2e' } },
					solid: { value: { _light: '#171717', _dark: '#fafafa' } },
					focusRing: { value: { _light: '#171717', _dark: '#d4d4d4' } },
				},

				// Form-control surface, shared by input / textarea / select.
				field: {
					bg: { value: { _light: '{colors.field.bg.light}', _dark: '{colors.field.bg.dark}' } },
					border: {
						value: { _light: '{colors.field.border.light}', _dark: '{colors.field.border.dark}' },
					},
					borderHover: {
						value: {
							_light: '{colors.field.borderHover.light}',
							_dark: '{colors.field.borderHover.dark}',
						},
					},
					placeholder: {
						value: {
							_light: '{colors.field.placeholder.light}',
							_dark: '{colors.field.placeholder.dark}',
						},
					},
					focusRing: {
						value: {
							_light: '{colors.field.focusRing.light}',
							_dark: '{colors.field.focusRing.dark}',
						},
					},
				},
			}, PAINTED),

			// Chakra's `l1/l2/l3` layer radii drive the corner of every built-in
			// component. The defaults (2 / 4 / 6px) read as a much older UI than
			// the rest of this admin.
			// The website's corners: soft fields (12px), rounder panels and
			// dialogs (20px); buttons are pills (recipes.ts).
			radii: {
				l1: { value: '8px' },
				l2: { value: '12px' },
				l3: { value: '20px' },
			},
		},
		recipes: {
			button: buttonRecipe,
			input: inputRecipe,
			textarea: textareaRecipe,
		},
		slotRecipes: {
			combobox: comboboxSlotRecipe,
			dialog: dialogSlotRecipe,
			drawer: drawerSlotRecipe,
			menu: menuSlotRecipe,
			nativeSelect: nativeSelectSlotRecipe,
			select: selectSlotRecipe,
			table: tableSlotRecipe,
		},
		breakpoints: {
			sm: '480px',
			md: '768px',
			lg: '992px',
			xl: '1280px',
			'2xl': '1536px',
		},
	},
	globalCss: {
		html: { fontFamily: SANS },
		body: {
			bg: 'bg',
			fontFamily: SANS,
			fontWeight: 300,
			textRendering: 'optimizeLegibility',
		},
		// Modernist headlines, as on the website: uppercase and extra-light.
		'h1, h2, h3': { textTransform: 'uppercase' },
		'h1, h2': { fontWeight: '200 !important', letterSpacing: '-0.012em' },
		h3: { fontWeight: '300 !important', letterSpacing: '0.02em' },
		'strong, b': { fontWeight: 500 },
		'::selection': { bg: '#c7f5e0', color: '#0b0d14' },
		':focus-visible': { outline: '2px solid #8b5cf6', outlineOffset: '2px' },
		// Field labels: the website's small spaced capitals in JetBrains Mono.
		'label[data-scope=field][data-part=label]': {
			fontFamily: MONO,
			fontSize: '10.5px !important',
			fontWeight: '400 !important',
			letterSpacing: '0.14em',
			textTransform: 'uppercase',
			color: 'fg.muted',
		},
		// `fg` resolves to the same #171717 / text.dark pair this used to spell
		// out, but through a token, so a colour theme (applyTheme.ts) reaches it.
		'body, p, span': {
			color: 'fg',
			fontSize: '15px',
		},
		// …except inside a button, where text takes the button's own colour and
		// size. The rule above painted a loading button's spinner and "Saving…"
		// (Chakra wraps both in spans) the page's text colour — dark on a dark
		// button, invisible — and at 15px in a 13px button.
		'button span': {
			color: 'inherit',
			fontSize: 'inherit',
		},
		'h1, h2, h3, h4, h5, h6': {
			color: '{colors.text.light}',
			_dark: {
				color: '{colors.text.dark}',
			},
		},
		// Scrollbars inside panels, tables and modals; the platform default is a
		// heavy grey bar that fights the rest of the chrome.
		'*::-webkit-scrollbar': { width: '10px', height: '10px' },
		'*::-webkit-scrollbar-track': { bg: 'transparent' },
		'*::-webkit-scrollbar-thumb': {
			bg: 'transparent',
			borderRadius: 'full',
			border: '3px solid transparent',
			backgroundClip: 'content-box',
		},
		'*:hover::-webkit-scrollbar-thumb': {
			bg: 'border.emphasized',
			backgroundClip: 'content-box',
		},
	},
});

export const config = {
	initialColorMode: 'light' as const,
	useSystemColorMode: false,
};

export { colors };
