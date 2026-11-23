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
