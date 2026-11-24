'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, Grid, Skeleton, Switch, Text, chakra } from '@chakra-ui/react';
import { Check, Moon, Sun } from 'lucide-react';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton } from '..';
import { styles } from '../config';
import { toaster } from '@/components/ui/toaster';
import { useGetPanelThemeQuery, useSetPanelThemeMutation } from '../store/services/tenantApi';
import GuideLink from './GuideLink';
import { useWorkspace } from './useWorkspace';
import { DEFAULT_THEME, THEMES, Theme } from '@/theme/palettes';

/**
 * The panel's theme (backend panelAdmins.router /theme), opened from the
 * sidebar's Project → Panel theme: the look the project's panel opens in for
 * every login — colours, and for the full looks (Classic, Console, Cosy) their
 * own type, text size, corners and tables. Pick one on the left, see it drawn
 * on the right, then Use it. "Only this theme" switches the panel's own theme
 * picker off. The themes are the panel apps' own (src/theme/palettes.ts, the
 * same file in every app), so the preview is what the panel draws.
 */

const APP_NAME = { store: 'the commerce panel', seo: 'Mint SEO', panel: 'the panel app' } as const;

const radiusOf = (t: Theme, big = false) => {
	const c = t.look?.corners;
	if (c === 'square') return big ? '4px' : '2px';
	if (c === 'soft') return big ? '10px' : '6px';
	return big ? '16px' : '9999px';
};

/** The look's details, as label → value rows. */
const details = (t: Theme): [string, string][] => {
	const l = t.look;
	if (!l) return [['Look', 'Colours only — the standard type, text size and tables']];
	const lines = { grid: 'every cell ruled', rows: 'a line under each row', none: 'open rows' } as const;
	return [
		['Type', l.font ? l.font.family.split(',')[0].replace(/'/g, '') : 'The standard type'],
		...(t.headingFont ? [['Headings', t.headingFont.family.split(',')[0].replace(/'/g, '')] as [string, string]] : []),
		['Text size', l.text || '15px'],
		['Corners', l.corners ? { square: 'Square', soft: 'Soft', round: 'Round' }[l.corners] : 'Round'],
		...(l.table
			? [['Tables', `${l.table.density[0].toUpperCase()}${l.table.density.slice(1)} rows, ${lines[l.table.lines]}${l.table.striped ? ', striped' : ''}`] as [string, string]]
			: []),
	];
};

/** Loads a look's Google Fonts while it's previewed, so the preview shows its real type. */
const useFonts = (t: Theme) => {
	useEffect(() => {
		[t.look?.font?.href, t.headingFont?.href].filter(Boolean).forEach(href => {
			if (document.querySelector(`link[data-preview-font="${href}"]`)) return;
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = href as string;
			link.dataset.previewFont = href as string;
			document.head.appendChild(link);
		});
	}, [t]);
};

const ROWS = [
	['INV-1042', 'Rahim Traders', 'Paid', '12,400'],
	['INV-1041', 'Nadia Hossain', 'Due', '3,150'],
	['INV-1040', 'Blue Harbour Ltd', 'Paid', '48,900'],
	['INV-1039', 'Karim & Sons', 'Draft', '7,620'],
];

/** A panel page in the theme: sidebar with the current page, a heading, a field, a table and a button. */
export const Preview: FC<{ t: Theme; dark: boolean }> = ({ t, dark }) => {
	useFonts(t);
	const p = dark ? t.dark : t.light;
	const l = t.look;
	const font = l?.font?.family;
	const heading = t.headingFont?.family || font;
	const rowPad = l?.table?.density === 'compact' ? '4px' : l?.table?.density === 'roomy' ? '11px' : '7px';
	const lines = l?.table?.lines || 'rows';
	const header = l?.table?.header || 'caps';
	const cell = l?.table?.text || '12px';
	const label = l?.labels;

	return (
		<Flex
			h={{ base: '300px', md: '340px' }}
			overflow='hidden'
			// Its words take the theme's colours, not the panel's own light/dark text.
			css={{ '& p': { color: 'inherit' } }}
			borderWidth='1px'
			style={{ borderColor: p.border, background: p.page, borderRadius: radiusOf(t, true), fontFamily: font, color: p.text }}>
			{/* Sidebar */}
			<Flex
				direction='column'
				w='30%'
				minW='120px'
				p='12px 8px'
				gap='2px'
				display={{ base: 'none', sm: 'flex' }}
				style={{ background: p.sidebar }}>
				<Text
					fontSize='12px'
					fontWeight='600'
					mb='10px'
					px='6px'
					style={{ color: p.sidebarTextActive }}>
					Your project
				</Text>
				<Text
					fontSize='10px'
					px='6px'
					mb='2px'
					style={{ color: p.sidebarHeading }}>
					Sales
				</Text>
				<Box
					ml='9px'
					pl='6px'
					style={{ borderLeft: `1px solid ${p.sidebarRail}` }}>
					{['Orders', 'Invoices', 'Customers', 'Payments'].map(item => {
						const on = item === 'Invoices';
						return (
							<Text
								key={item}
								fontSize='11px'
								px='8px'
								py='4px'
								borderRadius='8px'
								style={{
									color: on ? p.sidebarTextActive : p.sidebarText,
									background: on ? `color-mix(in srgb, ${p.sidebarTextActive} 12%, ${p.sidebar})` : 'transparent',
									fontWeight: on ? 500 : 400,
								}}>
								{item}
							</Text>
						);
					})}
				</Box>
			</Flex>

			{/* Page */}
			<Flex
				direction='column'
				flex='1'
				minW={0}
				p='14px'
				gap='10px'>
				<Flex
					align='center'
					justify='space-between'
					gap={2}>
					<Text
						fontSize='15px'
						lineClamp={1}
						style={{
							fontFamily: heading,
							fontWeight: Number(t.headingFont?.weight || l?.headings?.weight || 300),
							textTransform: !l || l.headings?.uppercase ? 'uppercase' : 'none',
							letterSpacing: l?.headings?.spacing || (!l ? '0.04em' : undefined),
						}}>
						Invoices
					</Text>
					<Box
						as='span'
						fontSize='11px'
						px='10px'
						py='4px'
						flexShrink={0}
						style={{ background: p.accent, color: p.accentFg, borderRadius: radiusOf(t) }}>
						New invoice
					</Box>
				</Flex>

				<Box>
					<Text
						mb='3px'
						style={{
							fontFamily: label?.font || (!l ? 'ui-monospace, monospace' : font),
							fontSize: label?.size || '9px',
							textTransform: !l || label?.uppercase ? 'uppercase' : 'none',
							letterSpacing: label?.spacing || (!l ? '0.08em' : undefined),
							fontWeight: Number(label?.weight || 400),
							color: p.textMuted,
						}}>
						Search
					</Text>
					<Box
						h='26px'
						px='8px'
						fontSize='11px'
						display='flex'
						alignItems='center'
						style={{ background: p.surface, border: `1px solid ${p.border}`, borderRadius: radiusOf(t) === '9999px' ? '10px' : radiusOf(t), color: p.textMuted }}>
						Customer, number…
					</Box>
				</Box>

				<Box
					overflow='hidden'
					style={{ background: p.surface, border: `1px solid ${p.borderMuted}`, borderRadius: radiusOf(t, true) === '16px' ? '12px' : radiusOf(t, true) }}>
					<Grid
						templateColumns='1fr 1.6fr 0.8fr 0.9fr'
						style={{
							background: header === 'filled' ? p.muted : 'transparent',
							borderBottom: `1px solid ${p.borderMuted}`,
						}}>
						{['Number', 'Customer', 'Status', 'Total'].map((h, i) => (
							<Text
								key={h}
								px='8px'
								lineClamp={1}
								style={{
									padding: `${rowPad} 8px`,
									fontSize: header === 'caps' ? '9px' : cell,
									textTransform: header === 'caps' ? 'uppercase' : 'none',
									letterSpacing: header === 'caps' ? '0.08em' : undefined,
									color: p.textMuted,
									textAlign: i === 3 ? 'right' : 'left',
									borderLeft: lines === 'grid' && i ? `1px solid ${p.borderMuted}` : 'none',
								}}>
								{h}
							</Text>
						))}
					</Grid>
					{ROWS.map((r, ri) => (
						<Grid
							key={r[0]}
							templateColumns='1fr 1.6fr 0.8fr 0.9fr'
							style={{
								background: l?.table?.striped && ri % 2 ? p.subtle : 'transparent',
								borderBottom: lines === 'none' || ri === ROWS.length - 1 ? 'none' : `1px solid ${p.borderMuted}`,
							}}>
							{r.map((c, i) => (
								<Text
									key={i}
									lineClamp={1}
									style={{
										padding: `${rowPad} 8px`,
										fontSize: cell,
										fontWeight: Number(l?.weight || 300),
										textAlign: i === 3 ? 'right' : 'left',
										fontVariantNumeric: 'tabular-nums',
										borderLeft: lines === 'grid' && i ? `1px solid ${p.borderMuted}` : 'none',
									}}>
									{c}
								</Text>
							))}
						</Grid>
					))}
				</Box>
			</Flex>
		</Flex>
	);
};

/** One theme in the list: its colours as a strip, its name, and whether it's in use. */
export const ThemeRow: FC<{ t: Theme; picked: boolean; current: boolean; onPick: () => void }> = ({ t, picked, current, onPick }) => (
	<chakra.button
		type='button'
		textAlign='left'
		w='full'
		p={2}
		borderRadius='10px'
		borderWidth='1px'
		borderColor={picked ? 'fg' : 'transparent'}
		bg={picked ? 'bg.panel' : 'transparent'}
		_hover={{ bg: picked ? 'bg.panel' : 'bg.subtle' }}
		aria-pressed={picked}
		onClick={onPick}>
		<Flex
			align='center'
			gap={2.5}>
			<Flex
				flexShrink={0}
				h='26px'
				w='34px'
				overflow='hidden'
				borderRadius='6px'
				borderWidth='1px'
				borderColor='border'>
				<Box
					w='40%'
					style={{ background: t.light.sidebar }}
				/>
				<Flex
					flex='1'
					direction='column'
					justify='flex-end'
					p='3px'
					style={{ background: t.light.page }}>
					<Box
						h='5px'
						borderRadius='full'
						style={{ background: t.light.accent }}
					/>
				</Flex>
			</Flex>
			<Box
				minW={0}
				flex='1'>
				<Flex
					align='center'
					gap={1.5}>
					<Text
						fontSize='13px'
						fontWeight='600'
						lineClamp={1}>
						{t.name}
					</Text>
					{t.look && (
						<Text
							as='span'
							fontSize='10px'
							px={1.5}
							borderRadius='full'
							bg='bg.muted'
							color='fg.muted'
							flexShrink={0}>
							Full look
						</Text>
					)}
				</Flex>
				{current && (
					<Text
						fontSize='11px'
						color='fg.muted'>
						In use
					</Text>
				)}
			</Box>
			{current && <Check size={14} />}
		</Flex>
	</chakra.button>
);

const PanelThemeDialog: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
	const { project } = useWorkspace();
	const { data, isLoading, isError } = useGetPanelThemeQuery(undefined, { skip: !open });
	const [save, { isLoading: saving }] = useSetPanelThemeMutation();
	const current = data?.theme || DEFAULT_THEME;
	const appName = APP_NAME[project?.type === 'ecommerce' ? 'store' : project?.edition === 'seo' ? 'seo' : 'panel'];

	const [picked, setPicked] = useState(current);
	const [locked, setLocked] = useState(false);
	const [dark, setDark] = useState(false);

	// Each time it opens, start from what's saved.
	useEffect(() => {
		if (!open || !data) return;
		setPicked(data.theme || DEFAULT_THEME);
		setLocked(!!data.locked);
	}, [open, data]);

	const theme = THEMES.find(t => t.id === picked) || THEMES[0];
	const changed = !!data && (picked !== current || locked !== !!data.locked);

	const use = async () => {
		try {
			await save({ theme: picked, locked }).unwrap();
			toaster.create({ type: 'success', title: `${theme.name} is the panel’s theme.`, description: 'Users see it the next time they open the panel.' });
			onClose();
		} catch (e: any) {
			toaster.create({ type: 'error', title: 'The panel theme wasn’t saved', description: e?.data?.message || 'Try again.' });
		}
	};

	if (!open) return null;

	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='xl'>
			<DialogHeader description={`The look ${appName} opens in for every login of this project. Full looks bring their own type, text size and tables, not just colours.`}>
				<Flex
					align='center'
					gap={3}
					pr={8}>
					Panel theme
					<GuideLink section='panel-theme' />
				</Flex>
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				{isLoading ? (
					<Skeleton h='340px' />
				) : isError ? (
					<Text
						fontSize='13px'
						color='fg.muted'>
						The panel theme arrives with the next update of MINT.
					</Text>
				) : (
					<Grid
						templateColumns={{ base: '1fr', md: '200px 1fr' }}
						gap={4}>
						<Grid
							templateColumns={{ base: 'repeat(2, 1fr)', md: '1fr' }}
							gap={1}
							alignContent='start'
							p={1}
							borderRadius='12px'
							bg='bg.subtle'>
							{THEMES.map(t => (
								<ThemeRow
									key={t.id}
									t={t}
									picked={t.id === picked}
									current={t.id === current}
									onPick={() => setPicked(t.id)}
								/>
							))}
						</Grid>

						<Flex
							direction='column'
							gap={3}
							minW={0}>
							<Flex
								align='flex-start'
								justify='space-between'
								gap={3}>
								<Box>
									<Text
										fontSize='15px'
										fontWeight='600'>
										{theme.name}
									</Text>
									<Text
										fontSize='13px'
										color='fg.muted'>
										{theme.description}
									</Text>
								</Box>
								<Flex
									flexShrink={0}
									borderWidth='1px'
									borderColor='border'
									borderRadius='full'
									p='2px'>
									{[false, true].map(d => (
										<chakra.button
											key={String(d)}
											type='button'
											display='flex'
											alignItems='center'
											gap={1}
											px={2}
											h='24px'
											fontSize='12px'
											borderRadius='full'
											bg={dark === d ? 'bg.muted' : 'transparent'}
											color={dark === d ? 'fg' : 'fg.muted'}
											aria-pressed={dark === d}
											onClick={() => setDark(d)}>
											{d ? <Moon size={12} /> : <Sun size={12} />}
											{d ? 'Dark' : 'Light'}
										</chakra.button>
									))}
								</Flex>
							</Flex>

							<Preview
								t={theme}
								dark={dark}
							/>

							<Grid
								templateColumns='auto 1fr'
								columnGap={4}
								rowGap={1}
								fontSize='12px'>
								{details(theme).map(([k, v]) => (
									<Box
										key={k}
										display='contents'>
										<Text color='fg.muted'>{k}</Text>
										<Text>{v}</Text>
									</Box>
								))}
								<Text color='fg.muted'>Colours</Text>
								<Flex
									gap={1}
									align='center'>
									{(['accent', 'page', 'surface', 'sidebar', 'text'] as const).map(k => (
										<Box
											key={k}
											title={k}
											boxSize='14px'
											borderRadius='full'
											borderWidth='1px'
											borderColor='border'
											style={{ background: (dark ? theme.dark : theme.light)[k] }}
										/>
									))}
								</Flex>
							</Grid>
						</Flex>
					</Grid>
				)}
			</DialogBody>
			<DialogFooter>
				{!isLoading && !isError && (
					<Flex
						align='center'
						gap={2}
						mr='auto'
						title={locked ? 'Everyone sees this theme; the panel’s theme picker is off.' : 'Where everyone starts; each user can still pick another theme for themselves.'}>
						<Switch.Root
							size='sm'
							checked={locked}
							disabled={saving}
							onCheckedChange={d => setLocked(!!d.checked)}>
							<Switch.HiddenInput aria-label='Only this theme' />
							<Switch.Control />
						</Switch.Root>
						<Text fontSize='13px'>Only this theme</Text>
					</Flex>
				)}
				<DiscardButton onClick={onClose}>Cancel</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					loading={saving}
					disabled={!changed}
					onClick={use}>
					{picked === current ? 'Save' : `Use ${theme.name}`}
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

export default PanelThemeDialog;
