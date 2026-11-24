'use client';

import { FC, useEffect } from 'react';
import { Box, Flex, Grid, Text, chakra } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { VColor } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { SiteConfig, SitePalette } from '@/components/library/store/services/tenantApi';
import { SettingCard, TextField, changed, useDraft, useSave } from './parts';

/**
 * Site setup → General → Theme: the site's whole colour palette and its two
 * fonts. A palette is nine roles, so a site's code (or the site builder) can
 * colour every part from it without guessing:
 *
 *   brand    primary · text on primary · secondary · accent
 *   surfaces background · surface · border
 *   text     text · muted text
 *
 * Start from a ready palette, then change any colour. The server keeps the
 * older primaryColor / secondaryColor / fontFamily in step for sites that
 * read only those (siteConfig.function saveSite).
 */

type Role = keyof SitePalette;

const ROLES: { key: Role; label: string; help: string }[] = [
	{ key: 'primary', label: 'Primary', help: 'Main buttons, links, highlights' },
	{ key: 'onPrimary', label: 'Text on primary', help: 'Words on a primary button' },
	{ key: 'secondary', label: 'Secondary', help: 'Second buttons, footer, badges' },
	{ key: 'accent', label: 'Accent', help: 'Sale tags, small pops of colour' },
	{ key: 'background', label: 'Background', help: 'Behind every page' },
	{ key: 'surface', label: 'Surface', help: 'Cards, header, panels' },
	{ key: 'border', label: 'Border', help: 'Lines and dividers' },
	{ key: 'text', label: 'Text', help: 'Headings and body text' },
	{ key: 'mutedText', label: 'Muted text', help: 'Captions, hints, dates' },
];

type Preset = { id: string; name: string; palette: SitePalette };

const P = (primary: string, onPrimary: string, secondary: string, accent: string, background: string, surface: string, border: string, text: string, mutedText: string): SitePalette => ({ primary, onPrimary, secondary, accent, background, surface, border, text, mutedText });

export const PALETTES: Preset[] = [
	{ id: 'mint', name: 'Mint', palette: P('#0f766e', '#ffffff', '#134e4a', '#f59e0b', '#ffffff', '#f4f7f6', '#e1e8e6', '#10201d', '#5b6b67') },
	{ id: 'midnight', name: 'Midnight', palette: P('#1e3a8a', '#ffffff', '#0f172a', '#38bdf8', '#ffffff', '#f4f6fb', '#dfe4ee', '#0f172a', '#5b6477') },
	{ id: 'ocean', name: 'Ocean', palette: P('#0369a1', '#ffffff', '#075985', '#22d3ee', '#f8fcff', '#eef6fb', '#d5e6f1', '#0b2533', '#557080') },
	{ id: 'forest', name: 'Forest', palette: P('#166534', '#ffffff', '#14532d', '#a3e635', '#fbfdf8', '#f1f6ec', '#dbe5d2', '#14231a', '#5b6b5f') },
	{ id: 'ember', name: 'Ember', palette: P('#c2410c', '#ffffff', '#431407', '#facc15', '#fffaf5', '#fff1e6', '#f1dcc8', '#2b1508', '#7a5a45') },
	{ id: 'rose', name: 'Rose', palette: P('#be185d', '#ffffff', '#500724', '#f9a8d4', '#fffbfc', '#fdf0f5', '#f3d6e2', '#2d0a18', '#7d5566') },
	{ id: 'royal', name: 'Royal', palette: P('#6d28d9', '#ffffff', '#2e1065', '#fbbf24', '#ffffff', '#f6f3fd', '#e3dcf3', '#1c1330', '#655d7a') },
	{ id: 'sand', name: 'Sand', palette: P('#8a5a2b', '#ffffff', '#3b2a1a', '#6b8f71', '#faf6ef', '#f2ebdf', '#e2d6c3', '#2a2118', '#75685a') },
	{ id: 'mono', name: 'Mono', palette: P('#111111', '#ffffff', '#3f3f46', '#ef4444', '#ffffff', '#f5f5f5', '#e5e5e5', '#111111', '#6b6b6b') },
	{ id: 'night', name: 'Night (dark)', palette: P('#a78bfa', '#160f2e', '#c4b5fd', '#f472b6', '#0d0b14', '#17141f', '#2a2536', '#ece9f5', '#a29cb6') },
	// Trending palettes from coolors.co/palettes/trending, matched to the nine roles (text and button colours checked for contrast).
	{ id: 'c-olive-garden-feast', name: 'Olive Garden Feast', palette: P('#a96121', '#ffffff', '#283618', '#606c38', '#fefae0', '#f3f0d6', '#e0dfc4', '#283618', '#6d7458') },
	{ id: 'c-fiery-ocean', name: 'Fiery Ocean', palette: P('#c1121f', '#ffffff', '#003049', '#669bbc', '#fdf0d5', '#f0e6ce', '#dad5c1', '#003049', '#567179') },
	{ id: 'c-refreshing-summer-fun', name: 'Refreshing Summer Fun', palette: P('#ffb703', '#023047', '#023047', '#219ebc', '#ffffff', '#f2f5f6', '#dce2e5', '#023047', '#5d7b8a') },
	{ id: 'c-dark-sunset', name: 'Dark Sunset', palette: P('#e09f3e', '#540b0e', '#540b0e', '#335c67', '#fff3b0', '#f6e7a8', '#e7d399', '#540b0e', '#915f49') },
	{ id: 'c-ocean-blue-serenity', name: 'Ocean Blue Serenity', palette: P('#00b4d8', '#03045e', '#03045e', '#03045e', '#caf0f8', '#c0e4f0', '#aecfe2', '#03045e', '#53629c') },
	{ id: 'c-golden-summer-fields', name: 'Golden Summer Fields', palette: P('#d4a373', '#5b3614', '#724319', '#cad182', '#fefae0', '#f6f0d6', '#e7dfc3', '#5b3614', '#896d4d') },
	{ id: 'c-bold-berry', name: 'Bold Berry', palette: P('#da627d', '#450920', '#450920', '#a53860', '#f9dbbd', '#f0d0b5', '#e0bea7', '#450920', '#865559') },
	{ id: 'c-summer-dream', name: 'Summer Dream', palette: P('#00afb9', '#003443', '#005a75', '#f07167', '#fdfcdc', '#f0f2d4', '#dae0c7', '#003443', '#567877') },
	{ id: 'c-black-and-gold-elegance', name: 'Black & Gold Elegance', palette: P('#fca311', '#000000', '#000000', '#14213d', '#ffffff', '#f2f2f2', '#dbdbdb', '#000000', '#666666') },
	{ id: 'c-earthy-forest-hues', name: 'Earthy Forest Hues', palette: P('#547b53', '#ffffff', '#2f463b', '#a3b18a', '#dad7cd', '#d1cec5', '#c0bfb5', '#1d2b24', '#565f57') },
	{ id: 'c-crimson-hues', name: 'Crimson Hues (dark)', palette: P('#c25e65', '#250902', '#d38b90', '#800e13', '#250902', '#321811', '#442b25', '#f3dfe0', '#a18987') },
	{ id: 'c-ocean-sunset', name: 'Ocean Sunset', palette: P('#ee9b00', '#001219', '#001219', '#0a9396', '#e9d8a6', '#ddce9f', '#c8bc92', '#001219', '#5d6151') },
	{ id: 'c-pastel-dreamland-adventure', name: 'Pastel Dreamland Adventure', palette: P('#a2d2ff', '#2d2830', '#483f4d', '#ffafcc', '#bde0fe', '#b6d7f4', '#a9c6e1', '#2d2830', '#59606e') },
	{ id: 'c-fiery-red-sunset', name: 'Fiery Red Sunset', palette: P('#ffba08', '#03071e', '#03071e', '#d00000', '#ffffff', '#f2f3f4', '#dcdcdf', '#03071e', '#686a78') },
	{ id: 'c-vivid-nightfall', name: 'Vivid Nightfall', palette: P('#7b2cbf', '#ffffff', '#10002b', '#e0aaff', '#ffffff', '#f3f2f4', '#dedbe1', '#10002b', '#706680') },
	{ id: 'c-leafy-green-garden', name: 'Leafy Green Garden', palette: P('#90a955', '#132a13', '#132a13', '#31572c', '#ecf39e', '#e1e997', '#ced78b', '#132a13', '#5d6e43') },
	{ id: 'c-vibrant-color-fiesta', name: 'Vibrant Color Fiesta', palette: P('#ff4d9a', '#34165e', '#6f30c9', '#3a86ff', '#ffffff', '#f5f3f7', '#e3dee8', '#34165e', '#816e9b') },
	{ id: 'c-soft-lavender', name: 'Soft Lavender', palette: P('#c9ada7', '#22223b', '#22223b', '#4a4e69', '#f2e9e4', '#e8dfdc', '#d5cdcc', '#22223b', '#696675') },
	{ id: 'c-autumn-harvest', name: 'Autumn Harvest', palette: P('#99582a', '#ffffff', '#432818', '#6f1d1b', '#ffe6a7', '#f6dda0', '#e5cb93', '#432818', '#7b6143') },
	{ id: 'c-sunny-beach-day', name: 'Sunny Beach Day', palette: P('#ee9a85', '#264653', '#264653', '#2a9d8f', '#ffffff', '#f4f6f6', '#e1e5e7', '#264653', '#637a83') },
	{ id: 'c-red-sunburst', name: 'Red Sunburst', palette: P('#ff7f51', '#4f000b', '#4f000b', '#720026', '#ffffff', '#f6f2f3', '#e6dbdd', '#4f000b', '#95666d') },
	{ id: 'c-soft-rainbow', name: 'Soft Rainbow', palette: P('#8eecf5', '#313b49', '#414e61', '#ffcfd2', '#fbf8cc', '#f1efc5', '#dfdeba', '#313b49', '#6a706d') },
	{ id: 'c-meadow-green', name: 'Meadow Green', palette: P('#147c9c', '#ffffff', '#174a71', '#b5e48c', '#d9ed92', '#cfe48f', '#bdd388', '#10334d', '#4c6b62') },
	{ id: 'c-fresh-greens', name: 'Fresh Greens', palette: P('#52b788', '#081c15', '#081c15', '#b7e4c7', '#d8f3dc', '#cee8d2', '#bbd5c0', '#081c15', '#576e61') },
	{ id: 'c-summer-ocean-breeze', name: 'Summer Ocean Breeze', palette: P('#db3643', '#ffffff', '#1d3557', '#457b9d', '#f1faee', '#e6f0e6', '#d3ded9', '#1d3557', '#617487') },
	{ id: 'c-golden-twilight', name: 'Golden Twilight', palette: P('#ffc300', '#000814', '#000814', '#003566', '#ffd60a', '#f2cc0b', '#dbb90b', '#000814', '#665a10') },
	{ id: 'c-golden-glow', name: 'Golden Glow', palette: P('#fa9500', '#322a04', '#514507', '#eb6424', '#ffdac6', '#f5d1bc', '#e2c1ab', '#322a04', '#746242') },
	{ id: 'c-deep-sea', name: 'Deep Sea', palette: P('#415a77', '#ffffff', '#0d1b2a', '#1b263b', '#e0e1dd', '#d5d7d4', '#c2c5c4', '#0d1b2a', '#59626b') },
	{ id: 'c-purple-raindrops', name: 'Purple Raindrops', palette: P('#de2178', '#ffffff', '#3a0ca3', '#4cc9f0', '#ffffff', '#f5f3fa', '#e3ddf2', '#3a0ca3', '#8163c4') },
	{ id: 'c-fresh-greens-2', name: 'Fresh Greens', palette: P('#bc4749', '#ffffff', '#2d5234', '#a7c957', '#f2e8cf', '#e7dec6', '#d3cdb6', '#16291a', '#616a57') },
	{ id: 'c-golden-summer-glow', name: 'Golden Summer Glow', palette: P('#fb816a', '#0d3b66', '#0d3b66', '#0d3b66', '#faf0ca', '#eee7c5', '#d9d7bc', '#0d3b66', '#547184') },
	{ id: 'c-ocean-breeze', name: 'Ocean Breeze', palette: P('#00b4d8', '#03045e', '#03045e', '#03045e', '#caf0f8', '#c0e4f0', '#aecfe2', '#03045e', '#53629c') },
	{ id: 'c-warm-neutral-tones', name: 'Warm Neutral Tones', palette: P('#7f4f24', '#ffffff', '#582f0e', '#a4ac86', '#ffffff', '#f7f5f3', '#e8e2dd', '#582f0e', '#8e715b') },
	{ id: 'c-warm-earth-tones', name: 'Warm Earth Tones', palette: P('#f46e4d', '#492525', '#562c2c', '#0e9594', '#f5dfbb', '#ecd6b4', '#ddc5a6', '#492525', '#7d5d52') },
	{ id: 'c-fiery-palette', name: 'Fiery Palette', palette: P('#fb8b24', '#5f0f40', '#5f0f40', '#0f4c5c', '#ffffff', '#f7f3f5', '#e9dde4', '#5f0f40', '#996584') },
	{ id: 'c-purple-rainy-day', name: 'Purple Rainy Day', palette: P('#9559b8', '#ffffff', '#6429aa', '#b8d0eb', '#b9faf8', '#b3eff2', '#a9dbe7', '#481d7b', '#6c63a3') },
	{ id: 'c-soft-pink-delight', name: 'Soft Pink Delight', palette: P('#ff8fab', '#552531', '#713242', '#ffc2d1', '#ffe5ec', '#f7dbe3', '#e7cad2', '#552531', '#885f69') },
	{ id: 'c-autumn-harvest-2', name: 'Autumn Harvest', palette: P('#9c6644', '#ffffff', '#5f402b', '#ddb892', '#ede0d4', '#e4d6cb', '#d3c5ba', '#332217', '#6e5f54') },
	{ id: 'c-summer-sunset', name: 'Summer Sunset', palette: P('#ff723f', '#003760', '#004e89', '#004e89', '#efefd0', '#e3e6ca', '#ced5c0', '#003760', '#486f82') },
	{ id: 'c-watermelon-sorbet', name: 'Watermelon Sorbet', palette: P('#06d6a0', '#052c39', '#073b4c', '#ef476f', '#ffd166', '#f3c964', '#dcba60', '#052c39', '#556147') },
	{ id: 'c-golden-meadow', name: 'Golden Meadow', palette: P('#fb6107', '#233000', '#334601', '#7cb518', '#f3de2c', '#e9d52a', '#d6c626', '#233000', '#61650e') },
	{ id: 'c-earthy-tones', name: 'Earthy Tones', palette: P('#adc178', '#2b231e', '#56463d', '#a98467', '#f0ead2', '#e6e0c9', '#d4ceb9', '#2b231e', '#6e675b') },
	{ id: 'c-earthy-tones-2', name: 'Earthy Tones', palette: P('#ffcb69', '#2b2d23', '#434536', '#d08c60', '#f1dca7', '#e7d3a0', '#d5c495', '#2b2d23', '#66624b') },
	{ id: 'c-light-steel', name: 'Light Steel', palette: P('#6c757d', '#ffffff', '#212529', '#adb5bd', '#f8f9fa', '#edeef0', '#dadbdd', '#212529', '#6e7275') },
	{ id: 'c-warm-neutrals', name: 'Warm Neutrals', palette: P('#cb997e', '#3b3b32', '#535347', '#a5a58d', '#fff1e6', '#f5e8dd', '#e4d8cd', '#3b3b32', '#726e64') },
	{ id: 'c-minimalist-elegance', name: 'Minimalist Elegance', palette: P('#ef8354', '#2d3142', '#2d3142', '#4f5d75', '#ffffff', '#f5f5f6', '#e2e2e5', '#2d3142', '#70737f') },
	{ id: 'c-pastel-rainbow', name: 'Pastel Rainbow', palette: P('#70d6ff', '#5c293b', '#803853', '#ff9770', '#e9ff70', '#e2f46d', '#d5e169', '#5c293b', '#866a4b') },
];

/** Google Fonts the picker offers; any other Google Font name can be typed. */
const FONTS: { name: string; kind: string }[] = [
	{ name: 'Inter', kind: 'Sans' },
	{ name: 'DM Sans', kind: 'Sans' },
	{ name: 'Poppins', kind: 'Sans' },
	{ name: 'Montserrat', kind: 'Sans' },
	{ name: 'Open Sans', kind: 'Sans' },
	{ name: 'Lato', kind: 'Sans' },
	{ name: 'Roboto', kind: 'Sans' },
	{ name: 'Source Sans 3', kind: 'Sans' },
	{ name: 'Nunito Sans', kind: 'Sans' },
	{ name: 'Nunito', kind: 'Rounded' },
	{ name: 'Outfit', kind: 'Sans' },
	{ name: 'Manrope', kind: 'Sans' },
	{ name: 'Space Grotesk', kind: 'Sans' },
	{ name: 'Jost', kind: 'Sans' },
	{ name: 'Work Sans', kind: 'Sans' },
	{ name: 'Oswald', kind: 'Condensed' },
	{ name: 'Bebas Neue', kind: 'Display' },
	{ name: 'Playfair Display', kind: 'Serif' },
	{ name: 'DM Serif Display', kind: 'Serif' },
	{ name: 'Cormorant Garamond', kind: 'Serif' },
	{ name: 'Lora', kind: 'Serif' },
	{ name: 'Merriweather', kind: 'Serif' },
	{ name: 'Libre Baskerville', kind: 'Serif' },
	{ name: 'Fraunces', kind: 'Serif' },
	{ name: 'Hind Siliguri', kind: 'Bangla' },
	{ name: 'Noto Sans Bengali', kind: 'Bangla' },
	{ name: 'Noto Serif Bengali', kind: 'Bangla' },
	{ name: 'JetBrains Mono', kind: 'Mono' },
];

/** Heading + body pairs that are known to sit well together. */
const PAIRS: [string, string][] = [
	['Inter', 'Inter'],
	['Playfair Display', 'Source Sans 3'],
	['DM Serif Display', 'DM Sans'],
	['Montserrat', 'Open Sans'],
	['Poppins', 'Lato'],
	['Space Grotesk', 'Inter'],
	['Lora', 'Roboto'],
	['Oswald', 'Roboto'],
	['Fraunces', 'Manrope'],
	['Hind Siliguri', 'Hind Siliguri'],
];

/* ------------------------------------------------------------ contrast */

const lum = (hex: string) => {
	const h = hex.replace('#', '');
	const full = h.length === 3 ? h.replace(/./g, c => c + c) : h.slice(0, 6);
	if (!/^[0-9a-f]{6}$/i.test(full)) return null;
	const [r, g, b] = [0, 2, 4].map(i => {
		const c = parseInt(full.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
	const x = lum(a);
	const y = lum(b);
	if (x === null || y === null) return null;
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** The pairs people read: AA wants 4.5:1 for text, 3:1 for captions and big button text. */
const CHECKS: { label: string; fg: Role; bg: Role; min: number }[] = [
	{ label: 'Text on background', fg: 'text', bg: 'background', min: 4.5 },
	{ label: 'Muted text on background', fg: 'mutedText', bg: 'background', min: 3 },
	{ label: 'Button text on primary', fg: 'onPrimary', bg: 'primary', min: 4.5 },
	{ label: 'Text on surface', fg: 'text', bg: 'surface', min: 4.5 },
];

/* --------------------------------------------------------------- fonts */

const fontHref = (names: string[]) => {
	const fams = Array.from(new Set(names.map(n => n.trim()).filter(Boolean)))
		.map(n => `family=${encodeURIComponent(n).replace(/%20/g, '+')}:wght@400;600;700`)
		.join('&');
	return fams ? `https://fonts.googleapis.com/css2?${fams}&display=swap` : '';
};

/** Loads the two fonts for the preview only (a stylesheet link, while this card is open). */
const usePreviewFonts = (heading: string, body: string) => {
	const href = fontHref([heading, body]);
	useEffect(() => {
		if (!href) return;
		const el = document.createElement('link');
		el.rel = 'stylesheet';
		el.href = href;
		document.head.appendChild(el);
		return () => el.remove();
	}, [href]);
};

const family = (name: string, fallback: string) => (name ? `'${name}', ${fallback}` : fallback);

const FontPick: FC<{ label: string; help: string; value: string; onChange: (v: string) => void }> = ({ label, help, value, onChange }) => {
	const listed = FONTS.some(f => f.name === value);
	const items = [...FONTS.map(f => ({ value: f.name, label: `${f.name} · ${f.kind}` })), ...(value && !listed ? [{ value, label: `${value} · typed` }] : [])];
	return (
		<Box>
			<Text
				fontSize='12px'
				fontWeight='600'
				mb={1}>
				{label}
			</Text>
			<Dropdown
				size='sm'
				value={value}
				placeholder='Pick a font'
				searchable
				onChange={onChange}
				items={items}
			/>
			<Box mt={2}>
				<TextField
					label='Or type a Google Font name'
					help={help}
					value={value}
					onChange={onChange}
					placeholder='e.g. Inter'
				/>
			</Box>
		</Box>
	);
};

/* ------------------------------------------------------------- preview */

const Preview: FC<{ p: SitePalette; heading: string; body: string; name: string }> = ({ p, heading, body, name }) => (
	<Box
		borderRadius='12px'
		overflow='hidden'
		borderWidth='1px'
		style={{ background: p.background, borderColor: p.border, fontFamily: family(body, 'system-ui, sans-serif'), color: p.text }}>
		<Flex
			align='center'
			justify='space-between'
			px={4}
			py={2.5}
			style={{ background: p.surface, borderBottom: `1px solid ${p.border}` }}>
			<Text
				as='span'
				fontWeight='700'
				fontSize='15px'
				style={{ fontFamily: family(heading, 'system-ui, sans-serif'), color: p.text }}>
				{name || 'Your site'}
			</Text>
			<Flex
				gap={4}
				fontSize='13px'>
				<Text
					as='span'
					fontSize='13px'
					style={{ color: p.text }}>
					Shop
				</Text>
				<Text
					as='span'
					fontSize='13px'
					style={{ color: p.primary }}>
					About
				</Text>
			</Flex>
		</Flex>
		<Box p={5}>
			<Text
				as='span'
				display='inline-block'
				fontSize='11px'
				fontWeight='700'
				px={2}
				py={0.5}
				borderRadius='full'
				mb={2}
				style={{ background: p.accent, color: p.secondary }}>
				New season
			</Text>
			<Text
				fontSize='24px'
				fontWeight='700'
				lineHeight='1.2'
				style={{ fontFamily: family(heading, 'system-ui, sans-serif'), color: p.text }}>
				Made for every day
			</Text>
			<Text
				fontSize='14px'
				mt={1.5}
				style={{ color: p.text, fontFamily: family(body, 'system-ui, sans-serif') }}>
				Body text in your body font, sitting on the page background.
			</Text>
			<Text
				fontSize='12px'
				mt={1}
				style={{ color: p.mutedText, fontFamily: family(body, 'system-ui, sans-serif') }}>
				Muted text for captions and dates · 24 November
			</Text>
			<Flex
				gap={2}
				mt={4}
				wrap='wrap'>
				<Box
					as='span'
					px={4}
					py={2}
					borderRadius='8px'
					fontSize='13px'
					fontWeight='600'
					style={{ background: p.primary, color: p.onPrimary }}>
					Shop now
				</Box>
				<Box
					as='span'
					px={4}
					py={2}
					borderRadius='8px'
					fontSize='13px'
					fontWeight='600'
					style={{ border: `1.5px solid ${p.secondary}`, color: p.secondary }}>
					Learn more
				</Box>
			</Flex>
			<Box
				mt={4}
				p={3}
				borderRadius='10px'
				style={{ background: p.surface, border: `1px solid ${p.border}` }}>
				<Text
					fontSize='13px'
					fontWeight='600'
					style={{ color: p.text, fontFamily: family(heading, 'system-ui, sans-serif') }}>
					A card on the surface colour
				</Text>
				<Text
					fontSize='12px'
					style={{ color: p.mutedText }}>
					With a border and muted text.
				</Text>
			</Box>
		</Box>
	</Box>
);

/* ---------------------------------------------------------------- card */

type Props = { config: SiteConfig; canBuild: boolean };

const SiteTheme: FC<Props> = ({ config, canBuild }) => {
	const saved = config.identity;
	const savedDraft = {
		palette: { ...PALETTES[0].palette, ...Object.fromEntries(Object.entries(saved.palette || {}).filter(([, v]) => v)) } as SitePalette,
		paletteName: saved.paletteName || '',
		headingFont: saved.headingFont || '',
		bodyFont: saved.bodyFont || saved.fontFamily || '',
	};
	const { draft, set, reset, dirty } = useDraft(savedDraft);
	const { save, saving, error } = useSave('Theme');
	usePreviewFonts(draft.headingFont, draft.bodyFont);

	const setColor = (key: Role, v: string) => set({ palette: { ...draft.palette, [key]: v }, paletteName: '' });

	return (
		<SettingCard
			id='site-theme'
			title='Theme'
			description='Your site’s colour palette and fonts. Start from a ready palette and change any colour; your site’s code (or the site builder) colours every part from these nine roles.'
			aside={<GuideLink section='site-theme' />}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ identity: changed(draft, savedDraft) as any })}>
			<Flex
				direction='column'
				gap={5}>
				{/* Ready palettes */}
				<Box>
					<Text
						fontSize='12px'
						fontWeight='600'
						mb={2}>
						Ready palettes
					</Text>
					<Grid
						templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }}
						gap={2}>
						{PALETTES.map(pr => {
							const on = draft.paletteName === pr.id;
							const q = pr.palette;
							return (
								<chakra.button
									key={pr.id}
									type='button'
									textAlign='left'
									p={2}
									borderRadius='10px'
									borderWidth={on ? '2px' : '1px'}
									borderColor={on ? 'fg' : 'border'}
									bg='bg.panel'
									disabled={!canBuild}
									_hover={{ borderColor: on ? 'fg' : 'border.emphasized' }}
									aria-pressed={on}
									onClick={() => set({ palette: { ...q }, paletteName: pr.id })}>
									<Flex
										h='34px'
										borderRadius='6px'
										overflow='hidden'
										style={{ background: q.background, border: `1px solid ${q.border}` }}>
										{[q.primary, q.secondary, q.accent, q.surface, q.text].map((c, i) => (
											<Box
												key={i}
												flex='1'
												style={{ background: c }}
											/>
										))}
									</Flex>
									<Flex
										align='center'
										mt={1.5}
										gap={1}>
										<Text
											fontSize='12px'
											fontWeight='600'>
											{pr.name}
										</Text>
										{on && (
											<Box ml='auto'>
												<Check size={13} />
											</Box>
										)}
									</Flex>
								</chakra.button>
							);
						})}
					</Grid>
					{!draft.paletteName && (
						<Text
							fontSize='12px'
							color='fg.muted'
							mt={2}>
							Your own palette. Pick a ready one to start again from it.
						</Text>
					)}
				</Box>

				<Grid
					templateColumns={{ base: '1fr', lg: '1.15fr 1fr' }}
					gap={6}>
					{/* The nine colours */}
					<Flex
						direction='column'
						gap={4}>
						{[
							['Brand', ['primary', 'onPrimary', 'secondary', 'accent']],
							['Surfaces', ['background', 'surface', 'border']],
							['Text', ['text', 'mutedText']],
						].map(([group, keys]) => (
							<Box key={group as string}>
								<Text
									fontSize='12px'
									fontWeight='600'
									color='fg.muted'
									mb={2}>
									{group as string}
								</Text>
								<Grid
									templateColumns={{ base: '1fr', sm: '1fr 1fr' }}
									gap={3}>
									{(keys as Role[]).map(k => {
										const role = ROLES.find(r => r.key === k)!;
										return (
											<Box key={k}>
												<VColor
													label={role.label}
													name={`palette-${k}`}
													value={draft.palette[k]}
													onChange={(e: any) => setColor(k, e.target.value)}
												/>
												<Text
													fontSize='11px'
													color='fg.muted'
													mt={0.5}>
													{role.help}
												</Text>
											</Box>
										);
									})}
								</Grid>
							</Box>
						))}
					</Flex>

					{/* Preview + readability */}
					<Flex
						direction='column'
						gap={3}>
						<Preview
							p={draft.palette}
							heading={draft.headingFont}
							body={draft.bodyFont}
							name={saved.siteName}
						/>
						<Box>
							<Text
								fontSize='12px'
								fontWeight='600'
								mb={1.5}>
								Easy to read?
							</Text>
							{CHECKS.map(c => {
								const r = ratio(draft.palette[c.fg], draft.palette[c.bg]);
								const ok = r !== null && r >= c.min;
								return (
									<Flex
										key={c.label}
										justify='space-between'
										fontSize='12px'
										py={0.5}>
										<Text
											fontSize='12px'
											color='fg.muted'>
											{c.label}
										</Text>
										<Text
											fontSize='12px'
											fontWeight='600'
											color={r === null ? 'fg.muted' : ok ? 'green.fg' : 'orange.fg'}>
											{r === null ? '—' : `${r.toFixed(1)}:1 ${ok ? 'Good' : `Low (aim for ${c.min}:1)`}`}
										</Text>
									</Flex>
								);
							})}
						</Box>
					</Flex>
				</Grid>

				{/* Fonts */}
				<Box>
					<Text
						fontSize='12px'
						fontWeight='600'
						mb={2}>
						Fonts
					</Text>
					<Flex
						gap={1.5}
						wrap='wrap'
						mb={3}>
						{PAIRS.map(([h, b]) => {
							const on = draft.headingFont === h && draft.bodyFont === b;
							return (
								<chakra.button
									key={`${h}-${b}`}
									type='button'
									fontSize='12px'
									px={2.5}
									py={1}
									borderRadius='full'
									borderWidth='1px'
									borderColor={on ? 'fg' : 'border'}
									bg={on ? 'bg.muted' : 'transparent'}
									disabled={!canBuild}
									onClick={() => set({ headingFont: h, bodyFont: b })}>
									{h === b ? h : `${h} + ${b}`}
								</chakra.button>
							);
						})}
					</Flex>
					<Grid
						templateColumns={{ base: '1fr', md: '1fr 1fr' }}
						gap={4}>
						<FontPick
							label='Primary font (headings)'
							help='Titles, headings and the site name'
							value={draft.headingFont}
							onChange={headingFont => set({ headingFont })}
						/>
						<FontPick
							label='Secondary font (body)'
							help='Paragraphs, buttons, menus and forms'
							value={draft.bodyFont}
							onChange={bodyFont => set({ bodyFont })}
						/>
					</Grid>
				</Box>
			</Flex>
		</SettingCard>
	);
};

export default SiteTheme;
