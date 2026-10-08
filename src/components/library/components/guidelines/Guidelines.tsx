'use client';

import { FC, ReactNode } from 'react';
import { Box, Button, CloseButton, Dialog, Drawer, Flex, Portal, Text } from '@chakra-ui/react';
import { BookOpen } from 'lucide-react';
import { styles } from '../../config';
import { useIsMobile } from '../../hooks';
import SheetContent from '../table/table-components/menu-modals/SheetContent';

/**
 * A page's user guidelines: plain-words rules for the people using it — "A
 * void invoice can't be reversed", "Bills are locked once paid". Written in
 * the page builder beside the settings (config `route.guidelines`), read from
 * the table's ⋯ menu and from the edit form. A centred dialog on a desktop, a
 * bottom sheet on a phone.
 */

export type Guideline = { title: string; text?: string };
export type Guidelines = { title?: string; items?: Guideline[] };

export const DEFAULT_GUIDELINES_TITLE = 'User guidelines';

/** The guidelines worth showing: at least one with a title. */
export const guidelinesOf = (g?: Guidelines): { title: string; items: Guideline[] } | null => {
	const items = (g?.items || []).filter(i => i?.title?.trim() || i?.text?.trim());
	return items.length ? { title: g?.title?.trim() || DEFAULT_GUIDELINES_TITLE, items } : null;
};

/** "View user guidelines" — the title as the menu's words, a leading capital softened (an acronym kept). */
export const viewLabel = (title: string) =>
	`View ${/^[A-Z][a-z]/.test(title) ? title[0].toLowerCase() + title.slice(1) : title}`;

const List: FC<{ items: Guideline[] }> = ({ items }) => (
	<Flex
		as='ol'
		direction='column'
		gap={0}
		listStyleType='none'
		m={0}
		p={0}>
		{items.map((g, i) => (
			<Flex
				as='li'
				key={i}
				gap={3}
				py={3}
				borderTopWidth={i ? '1px' : 0}
				borderColor='border'>
				<Flex
					flexShrink={0}
					align='center'
					justify='center'
					w='22px'
					h='22px'
					mt='1px'
					borderRadius='full'
					bg='bg.muted'
					fontSize='11px'
					fontWeight='700'
					color='fg.muted'>
					{i + 1}
				</Flex>
				<Box
					minW={0}
					flex='1'>
					{g.title && (
						<Text
							fontSize='sm'
							fontWeight='600'
							wordBreak='break-word'>
							{g.title}
						</Text>
					)}
					{g.text && (
						<Text
							fontSize='sm'
							color='fg.muted'
							mt={g.title ? 0.5 : 0}
							whiteSpace='pre-line'
							wordBreak='break-word'>
							{g.text}
						</Text>
					)}
				</Box>
			</Flex>
		))}
	</Flex>
);

const Heading: FC<{ title: string; count: number }> = ({ title, count }) => (
	<Flex
		align='center'
		gap={2.5}
		minW={0}>
		<Flex
			flexShrink={0}
			align='center'
			justify='center'
			w='28px'
			h='28px'
			borderRadius='md'
			bg='bg.muted'
			color='fg.muted'>
			<BookOpen size={15} />
		</Flex>
		<Box minW={0}>
			<Text
				fontSize='md'
				fontWeight='600'
				lineClamp={1}>
				{title}
			</Text>
			<Text
				fontSize='xs'
				color='fg.muted'>
				{count === 1 ? '1 guideline' : `${count} guidelines`}
			</Text>
		</Box>
	</Flex>
);

/** The guidelines, opened: a dialog, or a bottom sheet on a phone. */
export const GuidelinesDialog: FC<{ open: boolean; onClose: () => void; guidelines?: Guidelines }> = ({
	open,
	onClose,
	guidelines,
}) => {
	const isMobile = useIsMobile();
	const g = guidelinesOf(guidelines);
	if (!g) return null;
	const onOpenChange = (e: { open: boolean }) => !e.open && onClose();

	if (isMobile)
		return (
			<Drawer.Root
				lazyMount
				unmountOnExit
				preventScroll
				placement='bottom'
				open={open}
				onOpenChange={onOpenChange}>
				<Portal>
					<Drawer.Backdrop />
					<Drawer.Positioner>
						<SheetContent {...(styles.DRAWER as any)}>
							<Drawer.Header
								px={5}
								pt={1}
								pb={2}>
								<Heading
									title={g.title}
									count={g.items.length}
								/>
							</Drawer.Header>
							<Drawer.Body
								px={5}
								pt={0}
								pb='calc(24px + env(safe-area-inset-bottom))'
								overflowY='auto'
								userSelect='text'>
								<List items={g.items} />
							</Drawer.Body>
						</SheetContent>
					</Drawer.Positioner>
				</Portal>
			</Drawer.Root>
		);

	return (
		<Dialog.Root
			lazyMount
			unmountOnExit
			open={open}
			size='md'
			placement='center'
			scrollBehavior='inside'
			onOpenChange={onOpenChange}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content {...(styles.MODAL as any)}>
						<Dialog.Header
							px={5}
							pt={5}
							pb={2}>
							<Heading
								title={g.title}
								count={g.items.length}
							/>
						</Dialog.Header>
						<Dialog.CloseTrigger
							asChild
							top={4}
							right={4}>
							<CloseButton size='sm' />
						</Dialog.CloseTrigger>
						<Dialog.Body
							px={5}
							pt={0}
							pb={5}>
							<List items={g.items} />
						</Dialog.Body>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

/** A quiet "View user guidelines" link — the edit form's header. */
export const GuidelinesLink: FC<{ guidelines?: Guidelines; onOpen: () => void; children?: ReactNode }> = ({
	guidelines,
	onOpen,
	children,
}) => {
	const g = guidelinesOf(guidelines);
	if (!g) return null;
	return (
		<Button
			type='button'
			variant='plain'
			size='xs'
			h='auto'
			minW={0}
			px={0}
			gap={1.5}
			fontWeight='500'
			color='accent.fg'
			_hover={{ textDecoration: 'underline' }}
			onClick={onOpen}>
			<BookOpen size={13} />
			{children || viewLabel(g.title)}
		</Button>
	);
};
