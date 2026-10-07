/**
 * The admin's colour themes. A theme is one palette for light mode and one
 * for dark mode; which of the two shows is still the navbar's light/dark
 * toggle. The chosen theme is stored per admin (`Admin.theme`) and applied by
 * applyTheme.ts, which maps these roles onto the Chakra tokens the admin
 * already uses.
 *
 * To add a theme, add an entry here — nothing else needs to know about it.
 * Keep ids stable: they're what admins have saved. An unknown id falls back
 * to the default.
 */

export type Palette = {
	/** Primary buttons, switches, focus rings. */
	accent: string;
	/** Text and icons on the accent. */
	accentFg: string;
	/** The page behind everything, and the navbar. */
	page: string;
	/** Panels, cards, tables, menus, dialogs and inputs. */
	surface: string;
	/** Faint fills: hovered rows, table headers, secondary buttons on hover. */
	subtle: string;
	/** A step stronger than subtle. */
	muted: string;
	border: string;
	/** Dividers inside a panel or table. */
	borderMuted: string;
	text: string;
	textMuted: string;
	sidebar: string;
	sidebarText: string;
	/** The current page's label, and the logo. */
	sidebarTextActive: string;
	/** Section headings. */
	sidebarHeading: string;
	/** The line down an open section. */
	sidebarRail: string;
};

export type Theme = {
	id: string;
	name: string;
	description: string;
	light: Palette;
	dark: Palette;
	/** The built-in look: nothing is overridden, the palettes only draw its preview. */
	builtIn?: boolean;
	/**
	 * A typeface for headings (page titles and Chakra's Heading) instead of the
	 * system font. `href` is a Google Fonts stylesheet, loaded only while the
	 * theme is on.
	 */
	headingFont?: { family: string; href: string; /** Weight for those headings, e.g. '400' for a light serif. */ weight?: string };
};

export const DEFAULT_THEME = 'default';

export const THEMES: Theme[] = [
	{
		// The built-in look: the MINT website's palette (mint-webpage
		// globals.css). colors.theme.ts and index.ts paint it into the tokens
		// themselves, so this entry only draws its preview — keep the two sites
		// in step.
		id: 'default',
		name: 'MINT',
		description: "The website's look — bright and light by day, neutral black at night.",
		builtIn: true,
		light: {
			accent: '#0d0d0d',
			accentFg: '#ffffff',
			page: '#fbfbfd',
			surface: '#ffffff',
			subtle: '#f4f5f9',
			muted: '#eceef4',
			border: '#e6e8ef',
			borderMuted: '#eceef4',
			text: '#0b0d14',
			textMuted: '#555b6e',
			sidebar: '#f6f7fa',
			sidebarText: '#555b6e',
			sidebarTextActive: '#0b0d14',
			sidebarHeading: '#9298a8',
			sidebarRail: '#e6e8ef',
		},
		dark: {
			// thinkcrypt.dev's neutral black, like the website — no blue tint.
			accent: '#faf8f1',
			accentFg: '#0d0d0d',
			page: '#0d0d0d',
			surface: '#1b1b1b',
			subtle: '#222222',
			muted: '#262626',
			border: '#2a2a2a',
			borderMuted: '#232323',
			text: '#faf8f1',
			textMuted: '#b3b0a7',
			sidebar: '#0a0a0a',
			sidebarText: '#b3b0a7',
			sidebarTextActive: '#faf8f1',
			sidebarHeading: '#75736d',
			sidebarRail: '#2a2a2a',
		},
	},
	{
		id: 'ocean',
		name: 'Ocean',
		description: 'Cool blues, calm and clear.',
		light: {
			accent: '#1d6fd8',
			accentFg: '#ffffff',
			page: '#f7fafc',
			surface: '#ffffff',
			subtle: '#f0f5fa',
			muted: '#e6eef6',
			border: '#d6e2ee',
			borderMuted: '#e6eef6',
			text: '#0f1b2d',
			textMuted: '#5b6b80',
			sidebar: '#eef4fa',
			sidebarText: '#3d5068',
			sidebarTextActive: '#0b3a6f',
			sidebarHeading: '#0f1b2d',
			sidebarRail: '#d0dcea',
		},
		dark: {
			accent: '#4d9bff',
			accentFg: '#06101f',
			page: '#0b1220',
			surface: '#101a2c',
			subtle: '#14203a',
			muted: '#1a2845',
			border: '#22324f',
			borderMuted: '#1a2845',
			text: '#e6edf7',
			textMuted: '#8da0bb',
			sidebar: '#080e1a',
			sidebarText: '#8da0bb',
			sidebarTextActive: '#ffffff',
			sidebarHeading: '#b8c6da',
			sidebarRail: '#1c2a44',
		},
	},
	{
		id: 'forest',
		name: 'Forest',
		description: 'Deep greens with a natural feel.',
		light: {
			accent: '#1f7a4d',
			accentFg: '#ffffff',
			page: '#f7faf7',
			surface: '#ffffff',
			subtle: '#eff5f0',
			muted: '#e3ede5',
			border: '#d3e0d6',
			borderMuted: '#e3ede5',
			text: '#13241a',
			textMuted: '#5a6e61',
			sidebar: '#edf4ee',
			sidebarText: '#3f5646',
			sidebarTextActive: '#14532d',
			sidebarHeading: '#13241a',
			sidebarRail: '#cfddd2',
		},
		dark: {
			accent: '#3fbf7f',
			accentFg: '#04120a',
			page: '#0c140f',
			surface: '#111c15',
			subtle: '#16241b',
			muted: '#1c2d22',
			border: '#26392c',
			borderMuted: '#1c2d22',
			text: '#e4efe7',
			textMuted: '#8fa597',
			sidebar: '#08100b',
			sidebarText: '#8fa597',
			sidebarTextActive: '#ffffff',
			sidebarHeading: '#b9cbbf',
			sidebarRail: '#1d2e23',
		},
	},
	{
		id: 'sunset',
		name: 'Sunset',
		description: 'Warm oranges and soft sand.',
		light: {
			accent: '#d9571a',
			accentFg: '#ffffff',
			page: '#fffaf6',
			surface: '#ffffff',
			subtle: '#fdf2ea',
			muted: '#f9e6d8',
			border: '#efd9c8',
			borderMuted: '#f6e7db',
			text: '#2b1a10',
			textMuted: '#7a6152',
			sidebar: '#fbf0e7',
			sidebarText: '#6b4f3e',
			sidebarTextActive: '#9a3412',
			sidebarHeading: '#2b1a10',
			sidebarRail: '#ecd6c4',
		},
		dark: {
			accent: '#ff8a3d',
			accentFg: '#1a0c03',
			page: '#17100b',
			surface: '#1f1610',
			subtle: '#281c14',
			muted: '#33241a',
			border: '#3f2d21',
			borderMuted: '#33241a',
			text: '#f5e9df',
			textMuted: '#b39a88',
			sidebar: '#110b07',
			sidebarText: '#b39a88',
			sidebarTextActive: '#ffffff',
			sidebarHeading: '#d8c3b3',
			sidebarRail: '#2e2118',
		},
	},
	{
		// Claude's current palette, read from claude.ai's own design tokens
		// (--cds-*): near-white surfaces and near-black in dark mode, warm grey
		// text, translucent borders and fills exactly as it uses them, and its
		// primary fill — black in light mode, white in dark — for primary
		// buttons. Headings in a serif at a light weight, as claude.ai sets
		// them; its serif is proprietary, Source Serif 4 is the closest open one.
		//   page = surface-1, panels = surface-2, sidebar = surface-0,
		//   subtle / muted = bg-neutral / bg-neutral-hover, border = border,
		//   text / muted text / headings = text-primary / -secondary / -muted.
		id: 'kiln',
		name: 'Kiln',
		description: 'Warm off-white and deep black, soft grey text and serif headings.',
		headingFont: {
			family: "'Source Serif 4', ui-serif, Georgia, Cambria, 'Times New Roman', serif",
			href: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300..700&display=swap',
			weight: '400',
		},
		light: {
			accent: '#0b0b0b',
			accentFg: '#ffffff',
			page: '#fcfcfb',
			surface: '#ffffff',
			subtle: '#0b0b0b0d',
			muted: '#0b0b0b1a',
			border: '#0b0b0b1a',
			borderMuted: '#0b0b0b1a',
			text: '#0b0b0b',
			textMuted: '#52514e',
			sidebar: '#f9f9f7',
			sidebarText: '#52514e',
			sidebarTextActive: '#0b0b0b',
			sidebarHeading: '#898781',
			sidebarRail: '#0b0b0b1a',
		},
		dark: {
			accent: '#ffffff',
			accentFg: '#0b0b0b',
			page: '#151515',
			surface: '#1a1a19',
			subtle: '#ffffff0d',
			muted: '#ffffff1a',
			border: '#ffffff1a',
			borderMuted: '#ffffff1a',
			text: '#f0efec',
			textMuted: '#c3c2b7',
			sidebar: '#0b0b0b',
			sidebarText: '#c3c2b7',
			sidebarTextActive: '#f0efec',
			sidebarHeading: '#898781',
			sidebarRail: '#ffffff1a',
		},
	},
	{
		id: 'violet',
		name: 'Violet',
		description: 'Rich purples, creative and bold.',
		light: {
			accent: '#7c3aed',
			accentFg: '#ffffff',
			page: '#faf8fd',
			surface: '#ffffff',
			subtle: '#f4f0fb',
			muted: '#ebe4f7',
			border: '#ddd3ef',
			borderMuted: '#ebe4f7',
			text: '#1e1530',
			textMuted: '#6a5f80',
			sidebar: '#f2edfa',
			sidebarText: '#4d4266',
			sidebarTextActive: '#5b21b6',
			sidebarHeading: '#1e1530',
			sidebarRail: '#dcd1ee',
		},
		dark: {
			accent: '#a78bfa',
			accentFg: '#140a2b',
			page: '#120e1b',
			surface: '#181224',
			subtle: '#1f182f',
			muted: '#271e3b',
			border: '#33284b',
			borderMuted: '#271e3b',
			text: '#ece6f7',
			textMuted: '#a194bb',
			sidebar: '#0c0913',
			sidebarText: '#a194bb',
			sidebarTextActive: '#ffffff',
			sidebarHeading: '#c9bde0',
			sidebarRail: '#251d37',
		},
	},
	{
		id: 'rose',
		name: 'Rose',
		description: 'Soft pinks with a crimson accent.',
		light: {
			accent: '#e11d48',
			accentFg: '#ffffff',
			page: '#fff8f9',
			surface: '#ffffff',
			subtle: '#fdf0f2',
			muted: '#fae3e8',
			border: '#f0d3da',
			borderMuted: '#f7e4e8',
			text: '#2a1318',
			textMuted: '#7c5d64',
			sidebar: '#fcedf0',
			sidebarText: '#6b4750',
			sidebarTextActive: '#9f1239',
			sidebarHeading: '#2a1318',
			sidebarRail: '#efd2d9',
		},
		dark: {
			accent: '#fb7185',
			accentFg: '#2a050d',
			page: '#170c0f',
			surface: '#1f1115',
			subtle: '#29161b',
			muted: '#341c23',
			border: '#42252d',
			borderMuted: '#341c23',
			text: '#f7e6ea',
			textMuted: '#b8939c',
			sidebar: '#10080a',
			sidebarText: '#b8939c',
			sidebarTextActive: '#ffffff',
			sidebarHeading: '#dcbcc4',
			sidebarRail: '#2f1a20',
		},
	},
	{
		id: 'graphite',
		name: 'Graphite',
		description: 'Cool slate greys, quiet and focused.',
		light: {
			accent: '#334155',
			accentFg: '#ffffff',
			page: '#f6f7f9',
			surface: '#ffffff',
			subtle: '#eef0f3',
			muted: '#e4e7ec',
			border: '#d5dae1',
			borderMuted: '#e4e7ec',
			text: '#151a21',
			textMuted: '#5f6875',
			sidebar: '#eceef2',
			sidebarText: '#444c58',
			sidebarTextActive: '#111827',
			sidebarHeading: '#151a21',
			sidebarRail: '#d3d8df',
		},
		dark: {
			accent: '#94a3b8',
			accentFg: '#0b0f14',
			page: '#111418',
			surface: '#171b21',
			subtle: '#1d222a',
			muted: '#242a33',
			border: '#2e3540',
			borderMuted: '#242a33',
			text: '#e6e9ee',
			textMuted: '#939aa6',
			sidebar: '#0c0e11',
			sidebarText: '#939aa6',
			sidebarTextActive: '#ffffff',
			sidebarHeading: '#c2c8d1',
			sidebarRail: '#222831',
		},
	},
];

export const themeById = (id?: string | null): Theme => THEMES.find(t => t.id === id) || THEMES[0];
