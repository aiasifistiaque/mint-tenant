'use client';

import { FC } from 'react';
import { Box, Flex, Grid, Skeleton, Switch, Text, chakra } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { Panel } from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import { useGetPanelThemeQuery, useSetPanelThemeMutation } from '@/components/library/store/services/tenantApi';
import GuideLink from '@/components/library/tenant/GuideLink';
import { DEFAULT_THEME, THEMES, Theme } from '@/theme/palettes';

/**
 * The panel's theme (backend panelAdmins.router /theme): the look the
 * project's panel opens in for every login — colours, and for the full looks
 * (Classic, Console, Cosy) their own type, text size, corners and tables.
 * "Only this theme" switches the panel's own theme picker off.
 * The themes are the panel apps' own (src/theme/palettes.ts, the same file in
 * every app), so what's picked here is what the panel draws.
 */

const traits = (t: Theme) => {
	const l = t.look;
	if (!l) return 'Colours only · the standard type and tables';
	const lines = { grid: 'ruled tables', rows: 'lined rows', none: 'open rows' } as const;
	return [l.font?.family.split(',')[0].replace(/'/g, ''), l.text, l.table && `${l.table.density} ${lines[l.table.lines]}`, l.table?.striped && 'striped', l.corners && `${l.corners} corners`].filter(Boolean).join(' · ');
};

/** A miniature panel in the theme's light palette: sidebar, header bar, three table rows. */
const Mini: FC<{ t: Theme }> = ({ t }) => {
	const p = t.light;
	const r = t.look?.corners === 'square' ? '2px' : t.look?.corners === 'soft' ? '5px' : '8px';
	const rowH = t.look?.table?.density === 'compact' ? '6px' : t.look?.table?.density === 'roomy' ? '10px' : '8px';
	return (
		<Flex
			h='70px'
			overflow='hidden'
			borderWidth='1px'
			style={{ borderColor: p.border, background: p.page, borderRadius: r }}>
			<Box
				w='26%'
				style={{ background: p.sidebar }}
			/>
			<Flex
				direction='column'
				flex='1'
				p='7px'
				gap='3px'>
				<Box
					h='4px'
					w='40%'
					style={{ background: p.text, borderRadius: '2px' }}
				/>
				<Box
					mt='3px'
					overflow='hidden'
					style={{ background: p.surface, border: `1px solid ${p.borderMuted}`, borderRadius: r }}>
					{[0, 1, 2].map(i => (
						<Box
							key={i}
							h={rowH}
							style={{
								background: t.look?.table?.striped && i % 2 ? p.subtle : i === 0 && t.look?.table?.header === 'filled' ? p.muted : 'transparent',
								borderBottom: t.look?.table?.lines === 'none' || i === 2 ? 'none' : `1px solid ${p.borderMuted}`,
							}}
						/>
					))}
				</Box>
				<Box
					mt='auto'
					alignSelf='flex-end'
					h='7px'
					w='24px'
					style={{ background: p.accent, borderRadius: t.look?.corners === 'square' ? '1px' : '9999px' }}
				/>
			</Flex>
		</Flex>
	);
};

const PanelThemeCard: FC<{ appName: string }> = ({ appName }) => {
	const { data, isLoading, isError } = useGetPanelThemeQuery();
	const [save, { isLoading: saving }] = useSetPanelThemeMutation();
	const current = data?.theme || DEFAULT_THEME;

	const set = async (body: { theme?: string; locked?: boolean }) => {
		try {
			await save(body).unwrap();
		} catch (e: any) {
			toaster.create({ type: 'error', title: 'The panel theme wasn’t saved', description: e?.data?.message || 'Try again.' });
		}
	};

	return (
		<Panel
			id='panel-theme'
			title='Panel theme'
			subtitle={`The look ${appName} opens in for every login of this project. Full looks bring their own type, text size and tables, not just colours. Users see it the next time they open the panel.`}
			actions={<GuideLink section='panel-theme' />}>
			{isLoading ? (
				<Skeleton h='180px' />
			) : isError ? (
				<Text
					fontSize='13px'
					color='fg.muted'>
					The panel theme arrives with the next update of MINT.
				</Text>
			) : (
				<Flex
					direction='column'
					gap={4}>
					<Grid
						templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
						gap={3}>
						{THEMES.map(t => {
							const on = t.id === current;
							return (
								<chakra.button
									key={t.id}
									type='button'
									textAlign='left'
									p={2.5}
									borderRadius='12px'
									borderWidth={on ? '2px' : '1px'}
									borderColor={on ? 'fg' : 'border'}
									bg='bg.panel'
									cursor={saving ? 'progress' : 'pointer'}
									_hover={{ borderColor: on ? 'fg' : 'border.emphasized' }}
									aria-pressed={on}
									disabled={saving}
									onClick={() => !on && set({ theme: t.id })}>
									<Mini t={t} />
									<Flex
										align='center'
										gap={1.5}
										mt={2}>
										<Text
											fontSize='13px'
											fontWeight='600'>
											{t.name}
										</Text>
										{t.look && (
											<Text
												as='span'
												fontSize='10px'
												px={1.5}
												borderRadius='full'
												bg='bg.muted'
												color='fg.muted'>
												Full look
											</Text>
										)}
										{on && (
											<Box ml='auto'>
												<Check size={14} />
											</Box>
										)}
									</Flex>
									<Text
										fontSize='12px'
										color='fg.muted'
										mt={0.5}
										lineClamp={2}>
										{t.description}
									</Text>
									<Text
										fontSize='11px'
										color='fg.subtle'
										mt={1}>
										{traits(t)}
									</Text>
								</chakra.button>
							);
						})}
					</Grid>
					<Flex
						align='center'
						justify='space-between'
						gap={4}
						pt={3}
						borderTopWidth='1px'
						borderColor='border.muted'>
						<Box>
							<Text
								fontSize='13px'
								fontWeight='600'>
								Only this theme
							</Text>
							<Text
								fontSize='12px'
								color='fg.muted'>
								{data?.locked ? 'Everyone sees this theme; the panel’s theme picker is off.' : 'This is where everyone starts; each user can still pick another theme for themselves.'}
							</Text>
						</Box>
						<Switch.Root
							checked={!!data?.locked}
							disabled={saving}
							onCheckedChange={d => set({ locked: d.checked })}>
							<Switch.HiddenInput aria-label='Only this theme' />
							<Switch.Control />
						</Switch.Root>
					</Flex>
				</Flex>
			)}
		</Panel>
	);
};

export default PanelThemeCard;
