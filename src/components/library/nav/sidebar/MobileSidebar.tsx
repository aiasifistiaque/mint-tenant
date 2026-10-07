'use client';
import { FC, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Box, chakra, Collapsible, Flex, Input, Skeleton, Stack, Text } from '@chakra-ui/react';
import { ChevronDown, Search, X } from 'lucide-react';

import { LucideIcon } from '../../icon';
import { navigate, useAppDispatch } from '../..';
import useSidebarNav, { NavItem, NavSection } from './useSidebarNav';

type Props = {
	/** Called after a link is tapped, so the drawer can close. */
	onNavigate?: () => void;
};

/**
 * The navigation inside the mobile drawer: a search that narrows the list,
 * then the same sections as the desktop sidebar, sized for a thumb — every
 * row and heading is at least 44px tall, the current page is filled in, and
 * the list opens scrolled to it.
 */
const MobileSidebar: FC<Props> = ({ onNavigate }) => {
	const nav = useSidebarNav();
	const dispatch = useAppDispatch();
	const listRef = useRef<HTMLDivElement>(null);

	// Opened deep in a long list, the drawer starts at the current page.
	useEffect(() => {
		if (nav.isLoading) return;
		const current = listRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
		current?.scrollIntoView({ block: 'center' });
	}, [nav.isLoading]);

	const go = (item: NavItem) => {
		dispatch(navigate({ selected: item.path }));
		onNavigate?.();
	};

	const row = (item: NavItem, key: string | number) => (
		<MobileNavRow
			key={key}
			item={item}
			isLoading={nav.isLoading}
			isSelected={!nav.isLoading && !!item.path && item.path === nav.selected}
			onSelect={() => go(item)}
		/>
	);

	return (
		<Flex
			direction='column'
			flex={1}
			minH={0}>
			<Box
				px={4}
				pt={3}
				pb={3}
				borderBottomWidth='1px'
				borderColor='sidebar.borderBottom.light'
				_dark={{ borderColor: 'sidebar.borderBottom.dark' }}>
				<Flex {...searchCss}>
					<Search
						size={16}
						strokeWidth={1.75}
					/>
					<Input
						value={nav.search}
						onChange={e => nav.setSearch(e.target.value)}
						placeholder='Find a page'
						aria-label='Find a page'
						enterKeyHint='search'
						autoComplete='off'
						{...searchInputCss}
					/>
					{nav.search ? (
						<chakra.button
							type='button'
							aria-label='Clear search'
							onClick={() => nav.setSearch('')}
							{...clearCss}>
							<X size={16} />
						</chakra.button>
					) : null}
				</Flex>
			</Box>

			<Box
				ref={listRef}
				flex={1}
				minH={0}
				overflowY='auto'
				overscrollBehavior='contain'
				px={3}
				pt={2}
				pb='calc(24px + env(safe-area-inset-bottom))'>
				{nav.lead.length ? <Stack gap={0.5}>{nav.lead.map(row)}</Stack> : null}

				{nav.sections.map(section => (
					<MobileNavSection
						key={section.title}
						section={section}
						isOpen={nav.isOpen(section)}
						hasActive={nav.isActive(section)}
						isLoading={nav.isLoading}
						onToggle={() => nav.toggle(section.title)}>
						{section.items.map((item, i) => row(item, `${section.title}-${i}`))}
					</MobileNavSection>
				))}

				{nav.isSearching && !nav.hasResults ? (
					<Text
						mt={8}
						px={4}
						textAlign='center'
						fontSize='sm'
						color='sidebar.bodyText.light'
						_dark={{ color: 'sidebar.bodyText.dark' }}>
						No page matches &ldquo;{nav.search}&rdquo;
					</Text>
				) : null}
			</Box>
		</Flex>
	);
};

const MobileNavRow: FC<{ item: NavItem; isLoading: boolean; isSelected: boolean; onSelect: () => void }> = ({
	item,
	isLoading,
	isSelected,
	onSelect,
}) => {
	if (isLoading)
		return (
			<Flex
				h='44px'
				align='center'
				px={3}>
				<Skeleton
					h='10px'
					w='60%'
					borderRadius='full'
				/>
			</Flex>
		);

	return (
		<Link
			href={item.href || '#'}
			onClick={onSelect}
			aria-current={isSelected ? 'page' : undefined}>
			<Flex {...rowCss(isSelected)}>
				<Text
					flex={1}
					minW={0}
					truncate>
					{item.title}
				</Text>
			</Flex>
		</Link>
	);
};

const MobileNavSection: FC<{
	section: NavSection;
	isOpen: boolean;
	hasActive: boolean;
	isLoading: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}> = ({ section, isOpen, hasActive, isLoading, onToggle, children }) => (
	<Collapsible.Root
		open={isOpen}
		mt={2}>
		{isLoading ? (
			<Flex
				h='44px'
				align='center'
				px={2}>
				<Skeleton
					h='12px'
					w='45%'
					borderRadius='full'
				/>
			</Flex>
		) : (
			<chakra.button
				type='button'
				onClick={onToggle}
				aria-expanded={isOpen}
				{...sectionHeadCss}>
				<Flex
					align='center'
					gap={2.5}
					minW={0}
					flex={1}>
					{section.icon ? (
						<Box
							display='flex'
							flexShrink={0}>
							<LucideIcon
								name={section.icon}
								size={18}
								color='currentColor'
							/>
						</Box>
					) : null}
					<Text
						fontSize='13px'
						fontWeight='700'
						textTransform='uppercase'
						letterSpacing='0.02em'
						textAlign='left'
						truncate>
						{section.title}
					</Text>
				</Flex>
				{!isOpen && hasActive ? (
					<Box
						w='6px'
						h='6px'
						borderRadius='full'
						flexShrink={0}
						bg='sidebar.bodyText.selectedLight'
						_dark={{ bg: 'sidebar.bodyText.selectedDark' }}
					/>
				) : null}
				<Box
					as={ChevronDown}
					boxSize='18px'
					flexShrink={0}
					opacity={0.6}
					transform={isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'}
					transition='transform .18s ease'
				/>
			</chakra.button>
		)}

		<Collapsible.Content>
			{/* The rail hangs from the centre of the 18px section icon. */}
			<Stack
				gap={0.5}
				ml='17px'
				pl={2}
				py={1}
				mb={1}
				borderLeftWidth='1px'
				borderColor='sidebar.rail.light'
				_dark={{ borderColor: 'sidebar.rail.dark' }}>
				{children}
			</Stack>
		</Collapsible.Content>
	</Collapsible.Root>
);

const TAP = { WebkitTapHighlightColor: 'transparent' };

const rowCss = (isSelected: boolean): any => ({
	align: 'center',
	minH: '44px',
	px: 3,
	borderRadius: 'md',
	borderWidth: '1px',
	fontSize: '15px',
	fontWeight: isSelected ? '600' : '500',
	userSelect: 'none',
	css: TAP,
	transition: 'background .12s ease',
	borderColor: isSelected ? 'sidebar.selectedItemBorder.light' : 'transparent',
	bg: isSelected ? 'sidebar.selectedItemBg.light' : 'transparent',
	color: isSelected ? 'sidebar.bodyText.selectedLight' : 'sidebar.bodyText.light',
	_active: { bg: 'sidebar.hoverLight' },
	_dark: {
		borderColor: isSelected ? 'sidebar.selectedItemBorder.dark' : 'transparent',
		bg: isSelected ? 'sidebar.selectedItemBg.dark' : 'transparent',
		color: isSelected ? 'sidebar.bodyText.selectedDark' : 'sidebar.bodyText.dark',
		_active: { bg: 'sidebar.hoverDark' },
	},
});

const sectionHeadCss: any = {
	display: 'flex',
	w: 'full',
	minH: '44px',
	alignItems: 'center',
	gap: 2,
	px: 2,
	borderRadius: 'md',
	cursor: 'pointer',
	userSelect: 'none',
	css: TAP,
	color: 'sidebar.bodyText.headingLight',
	_active: { bg: 'sidebar.hoverLight' },
	_dark: { color: 'sidebar.bodyText.headingDark', _active: { bg: 'sidebar.hoverDark' } },
};

const searchCss: any = {
	align: 'center',
	gap: 2,
	h: '42px',
	pl: 3,
	pr: 1,
	borderRadius: 'lg',
	borderWidth: '1px',
	borderColor: 'field.border',
	bg: 'field.bg',
	color: 'fg.muted',
	_focusWithin: { borderColor: 'field.focusRing' },
	_dark: { bg: 'transparent', _focusWithin: { borderColor: 'border.emphasized' } },
};

// 16px, or iOS zooms the page when the field is focused.
const searchInputCss: any = {
	variant: 'unstyled',
	flex: 1,
	h: 'full',
	px: 0,
	bg: 'transparent',
	fontSize: '16px',
	color: 'fg',
	_placeholder: { color: 'field.placeholder' },
};

const clearCss: any = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	boxSize: '34px',
	flexShrink: 0,
	borderRadius: 'md',
	color: 'fg.muted',
	cursor: 'pointer',
	css: TAP,
	_active: { bg: 'bg.muted' },
};

export default MobileSidebar;
