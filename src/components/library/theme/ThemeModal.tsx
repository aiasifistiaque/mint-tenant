'use client';

import { FC } from 'react';
import { Box, Button, chakra, Dialog, Flex, Grid, Link, Portal, SegmentGroup, Text } from '@chakra-ui/react';
import { Check, ExternalLink } from 'lucide-react';
import { useTheme } from 'next-themes';
import { radius } from '../config';
import { Palette, Theme, THEMES } from '@/theme/palettes';
import useAdminTheme from './useAdminTheme';
import ModalFooter from '../modals/modal-components/CustomModalFooter';
import { docsPath } from '../config/lib/constants/panel';

/** A link into the themes guide, opened beside the window rather than in place of it. */
const GuideLink: FC<{ section: string; label: string }> = ({ section, label }) => (
	<Link
		href={docsPath(`/docs/themes#${section}`)}
		target='_blank'
		rel='noopener noreferrer'
		display='inline-flex'
		alignItems='center'
		gap={1}
		fontSize='xs'
		fontWeight='400'
		color='fg.muted'
		flexShrink={0}
		_hover={{ color: 'fg', textDecoration: 'underline' }}>
		{label}
		<ExternalLink size={11} />
	</Link>
);

const MODES = [
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
	{ value: 'system', label: 'System' },
];

/**
 * A miniature admin screen in one palette: sidebar, page, a panel with a
 * primary button. Drawn with the palette's literal colours rather than
 * tokens, so every card shows its own theme whatever is active.
 */
const Mini: FC<{ p: Palette; label: string }> = ({ p, label }) => (
	<Box
		flex='1'
		minW={0}>
		<Flex
			h='78px'
			borderRadius='md'
			overflow='hidden'
			borderWidth='1px'
			style={{ borderColor: p.border, background: p.page }}>
			<Flex
				direction='column'
				gap='5px'
				w='30%'
				p='7px'
				style={{ background: p.sidebar, borderRight: `1px solid ${p.sidebarRail}` }}>
				<Box
					h='4px'
					w='70%'
					borderRadius='full'
					style={{ background: p.sidebarHeading }}
				/>
				<Box
					h='3px'
					w='85%'
					borderRadius='full'
					style={{ background: p.sidebarTextActive }}
				/>
				<Box
					h='3px'
					w='60%'
					borderRadius='full'
					opacity={0.6}
					style={{ background: p.sidebarText }}
				/>
				<Box
					h='3px'
					w='75%'
					borderRadius='full'
					opacity={0.6}
					style={{ background: p.sidebarText }}
				/>
			</Flex>
			<Box
				flex='1'
				p='7px'>
				<Box
					h='100%'
					borderRadius='sm'
					p='6px'
					style={{ background: p.surface, border: `1px solid ${p.borderMuted}` }}>
					<Box
						h='4px'
						w='55%'
						borderRadius='full'
						style={{ background: p.text }}
					/>
					<Box
						h='3px'
						w='80%'
						mt='5px'
						borderRadius='full'
						style={{ background: p.textMuted }}
						opacity={0.7}
					/>
					<Box
						h='10px'
						w='38%'
						mt='9px'
						borderRadius='3px'
						style={{ background: p.accent }}
					/>
				</Box>
			</Box>
		</Flex>
		<Text
			fontSize='11px'
			color='fg.muted'
			mt={1}
			textAlign='center'>
			{label}
		</Text>
	</Box>
);

const ThemeCard: FC<{ theme: Theme; selected: boolean; onSelect: () => void }> = ({ theme, selected, onSelect }) => (
	<chakra.button
		type='button'
		onClick={onSelect}
		aria-pressed={selected}
		textAlign='left'
		p={3}
		borderRadius={radius.CONTAINER}
		borderWidth={selected ? '2px' : '1px'}
		borderColor={selected ? 'fg' : 'border'}
		// Keeps the content from shifting by the extra border pixel when selected.
		m={selected ? 0 : '1px'}
		bg='bg.panel'
		cursor='pointer'
		transition='border-color 120ms'
		_hover={{ borderColor: selected ? 'fg' : 'border.emphasized' }}
		_focusVisible={{ outline: '2px solid', outlineColor: 'gray.focusRing', outlineOffset: '2px' }}>
		<Flex gap={2}>
			<Mini
				p={theme.light}
				label='Light'
			/>
			<Mini
				p={theme.dark}
				label='Dark'
			/>
		</Flex>
		<Flex
			align='center'
			justify='space-between'
			gap={2}
			mt={2}>
			<Box minW={0}>
				<Text
					fontSize='sm'
					fontWeight='600'
					// A theme with its own heading typeface shows its name in it.
					style={theme.headingFont ? { fontFamily: theme.headingFont.family } : undefined}>
					{theme.name}
				</Text>
				<Text
					fontSize='xs'
					color='fg.muted'
					truncate>
					{theme.description}
				</Text>
			</Box>
			{selected && (
				<Flex
					w='20px'
					h='20px'
					flexShrink={0}
					align='center'
					justify='center'
					borderRadius='full'
					bg='gray.solid'
					color='gray.contrast'>
					<Check size={12} />
				</Flex>
			)}
		</Flex>
	</chakra.button>
);

/**
 * The theme picker, opened from the user menu. A choice applies at once and
 * is saved to the admin's own record; Light / Dark / System is the same
 * per-browser switch as the navbar's toggle.
 */
const ThemeModal: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
	const { theme, setTheme } = useAdminTheme();
	const { theme: mode, setTheme: setMode } = useTheme();

	return (
		<Dialog.Root
			placement='center'
			size='xl'
			open={isOpen}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content
						borderRadius={radius.MODAL}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'>
						<Dialog.Header
							px={{ base: 4, md: 6 }}
							pt={{ base: 4, md: 5 }}
							pb={{ base: 3, md: 4 }}
							fontSize='16px'
							fontWeight='600'>
							<Flex
								w='full'
								align='flex-start'
								justify='space-between'
								gap={3}
								pr={6}>
								<Box>
									<Dialog.Title
										fontSize='md'
										fontWeight='600'>
										Themes
									</Dialog.Title>
									<Text
										fontSize='xs'
										color='fg.muted'
										fontWeight='400'
										mt={0.5}>
										Every theme has a light and a dark version. Your choice is saved to your account and follows you
										to any device.
									</Text>
								</Box>
								<GuideLink
									section='choose'
									label='Themes guide'
								/>
							</Flex>
						</Dialog.Header>

						<Dialog.Body
							px={{ base: 4, md: 6 }}
							pt={0}
							pb={{ base: 4, md: 5 }}>
							<Flex
								align='center'
								justify='space-between'
								gap={3}
								mb={4}
								flexWrap='wrap'>
								<Flex
									align='center'
									gap={2}>
									<Text
										fontSize='sm'
										fontWeight='500'>
										Mode
									</Text>
									<GuideLink
										section='modes'
										label='Light, dark or system?'
									/>
								</Flex>
								<SegmentGroup.Root
									size='sm'
									value={mode || 'system'}
									onValueChange={e => e.value && setMode(e.value)}>
									<SegmentGroup.Indicator />
									<SegmentGroup.Items items={MODES} />
								</SegmentGroup.Root>
							</Flex>

							<Grid
								templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
								gap={3}>
								{THEMES.map(t => (
									<ThemeCard
										key={t.id}
										theme={t}
										selected={theme === t.id}
										onSelect={() => setTheme(t.id)}
									/>
								))}
							</Grid>
						</Dialog.Body>

						<ModalFooter>
							<Flex
								w='full'
								justify='space-between'
								align='center'
								gap={3}>
								<Flex
									align='center'
									gap={3}
									flexWrap='wrap'>
									<Text
										fontSize='xs'
										color='fg.muted'>
										Mode is remembered per browser.
									</Text>
									<GuideLink
										section='saved'
										label='Where is it saved?'
									/>
								</Flex>
								<Button
									px={3}
									size='sm'
									onClick={onClose}>
									Done
								</Button>
							</Flex>
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default ThemeModal;
