'use client';
import { FC, useContext } from 'react';
import { Box, Flex, Skeleton, Text, TextProps } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

import { useAppDispatch, useAppSelector, navigate, IconNameOptions } from '../..';
import { LucideIcon } from '../../icon';
import { SectionToneContext } from './sidebar-components/SidebarSection';

type SidebarItemProps = {
	children: string;
	href?: string;
	path: string;
	/**
	 * Shown only on top-level rows (`withIcon`) — Dashboard and the like, which
	 * sit level with the category headings and carry a glyph as they do. Rows
	 * inside a category are plain labels under its icon.
	 */
	icon?: IconNameOptions;
	withIcon?: boolean;
	sx?: any;
	isLoading?: boolean;
};

/**
 * The row geometry, shared with SidebarSection so everything lines up:
 * headings and top-level rows put their icon `ROW_INSET_PX` in, and their
 * label `ICON_GAP_PX` after it; a nested row's fill starts `RAIL_GAP_PX`
 * past the rail, and its padding puts the label under the heading text.
 */
export const ICON_SIZE_PX = 16;
export const ROW_INSET_PX = 8;
export const ICON_GAP_PX = 10;
export const RAIL_GAP_PX = 6;
/** Where the rail sits: under the middle of the heading's icon. */
export const RAIL_X_PX = ROW_INSET_PX + ICON_SIZE_PX / 2;
const LABEL_X_PX = ROW_INSET_PX + ICON_SIZE_PX + ICON_GAP_PX;
const NESTED_PAD_PX = LABEL_X_PX - (RAIL_X_PX + 1 + RAIL_GAP_PX);
const ICON_SIZE = ICON_SIZE_PX;

// Older item icons use the admin's own icon names; the sidebar draws Lucide
// outlines so they match the category glyphs. Anything else is taken to be a
// Lucide name already (the sidebar builder stores those).
const LUCIDE_NAME: Record<string, string> = {
	dashboard: 'layout-dashboard',
	analytics: 'chart-line',
	clicks: 'mouse-pointer-click',
};

const SidebarItem: FC<SidebarItemProps> = ({ href, children, path, icon, withIcon = false, isLoading = false }) => {
	const { selected } = useAppSelector((state: any) => state.route);

	const dispatch = useAppDispatch();

	const router = useRouter();

	const changeRoute = (e: any): void => {
		if (!href) return;
		e.preventDefault();
		router.push(href);
		dispatch(navigate({ selected: path }));
	};

	const isSelected = selected === path;
	const tone = useContext(SectionToneContext);

	return (
		<Flex
			onClick={changeRoute}
			{...containerCss(isLoading, isSelected, withIcon)}>
			{isLoading ? (
				<Skeleton
					height={2}
					w='full'
					borderRadius={SKELETON_BORDER_RADIUS}
				/>
			) : (
				<>
					{withIcon && (
						// Fixed box, so the label lines up with the headings even if a
						// name has no Lucide icon and nothing draws.
						<Box {...iconCss}>
							{icon ? (
								<LucideIcon
									name={LUCIDE_NAME[String(icon)] || String(icon)}
									size={ICON_SIZE}
								/>
							) : null}
						</Box>
					)}
					<Text {...bodyTextCss(isSelected)}>{children}</Text>
					{/* The current page: a dot in its section's colour. */}
					{isSelected && tone ? (
						<Box
							ml='auto'
							flexShrink={0}
							boxSize='6px'
							borderRadius='full'
							bg={tone.solid}
						/>
					) : null}
				</>
			)}
		</Flex>
	);
};

const bodyTextCss = (isSelected?: boolean): TextProps => ({
	color: 'inherit',
	fontSize: { base: '15px', md: '14px' },
	fontWeight: isSelected ? '400' : '300',
	lineHeight: '1.3',
	lineClamp: 1,
});

const iconCss: any = {
	flexShrink: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	boxSize: `${ICON_SIZE_PX}px`,
	color: 'sidebar.bodyText.light',
	_dark: { color: 'sidebar.bodyText.dark' },
	opacity: 0.85,
};

// The current page sits on the panel colour with a hairline and a soft
// shadow — the website's pill cards — rather than a grey fill.
const SELECTED_SHADOW = '0 1px 2px rgb(16 24 40 / 0.05), 0 4px 12px -6px rgb(16 24 40 / 0.12)';

/**
 * A flat rounded row: a faint wash on hover, a soft grey fill for the current
 * page. Top-level rows start at the heading's inset with their icon; rows in a
 * category start just past the rail, their labels level with the heading text
 * (SidebarSection's RAIL_* constants set that up).
 */
const containerCss = (isLoading: boolean, isSelected: boolean, withIcon: boolean): any => ({
	alignItems: 'center',
	gap: `${ICON_GAP_PX}px`,
	pl: withIcon ? `${ROW_INSET_PX}px` : `${NESTED_PAD_PX}px`,
	pr: 2,
	h: { base: 10, md: '32px' },
	borderRadius: '10px',
	cursor: 'pointer',
	userSelect: 'none',
	transition: 'background-color .12s ease, color .12s ease',
	borderWidth: '1px',
	borderColor: isSelected ? 'border' : 'transparent',
	boxShadow: isSelected ? SELECTED_SHADOW : 'none',
	bg: isSelected ? 'bg.panel' : 'transparent',
	color: isSelected ? 'sidebar.bodyText.selectedLight' : 'sidebar.bodyText.light',
	_hover: isLoading || isSelected ? {} : { bg: 'sidebar.itemHover.light', color: 'sidebar.bodyText.selectedLight' },
	_dark: {
		boxShadow: 'none',
		bg: isSelected ? 'bg.panel' : 'transparent',
		color: isSelected ? 'sidebar.bodyText.selectedDark' : 'sidebar.bodyText.dark',
		_hover: isLoading || isSelected ? {} : { bg: 'sidebar.itemHover.dark', color: 'sidebar.bodyText.selectedDark' },
	},
});

const SKELETON_BORDER_RADIUS = '90px';

export default SidebarItem;
