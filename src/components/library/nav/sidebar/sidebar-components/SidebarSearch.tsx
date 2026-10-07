'use client';
import { FC, RefObject } from 'react';
import { Box, Flex, Input } from '@chakra-ui/react';
import { Icon } from '../../../icon';
import { padding, radius } from '../../../config';

// A focus ring rather than a border colour change: in dark mode the shared
// `field.focusRing` is near-white (#d4d4d4), which on a transparent field over
// pure black reads as a lit outline instead of a focused input.
const FOCUS_RING_DARK = 'rgba(255, 255, 255, 0.09)';

type SidebarSearchProps = {
	value: string;
	onChange: (value: string) => void;
	inputRef: RefObject<HTMLInputElement | null>;
};

/**
 * Filters the sidebar in place instead of opening the command-palette
 * (`SearchMenu`) modal — that one is still reachable from the navbar for a
 * global jump-to-anywhere search, this one narrows what's already on screen.
 */
const SidebarSearch: FC<SidebarSearchProps> = ({ value, onChange, inputRef }) => (
	<Box {...stickyWrapCss}>
		<Flex {...containerCss}>
			<Icon
				name='search'
				size={14}
				color='inherit'
			/>
			<Input
				ref={inputRef}
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder='Find'
				{...inputCss}
			/>
			{value ? (
				<Box
					as='button'
					type='button'
					aria-label='Clear search'
					onClick={() => onChange('')}
					{...kbdCss}
					cursor='pointer'>
					<Icon
						name='close'
						size={11}
						color='inherit'
					/>
				</Box>
			) : (
				<Box {...kbdCss}>F</Box>
			)}
		</Flex>
	</Box>
);

// Pinned below the fixed sidebar header, and glass across its whole box to
// match it: rows scrolling up pass behind a translucent, blurred fill rather
// than behind a solid one. The fill must stay translucent for the blur to have
// anything to work on, and opaque enough that row text does not read through it
// — 0.55 is the line where motion still shows but words do not.
//
// `top` stays 0 even though the field has to clear the 56px header: the offset
// resolves against the scroll container's *content* box, and SidebarBody's
// `pt` has already moved that down by NAV_HEIGHT. A `top: NAV_HEIGHT` here
// double-counts it and parks the wrapper 56px lower than it pins.
//
// The 16px that drops the field level with the main column is this wrapper's
// own `pt`, not more body padding, for the same reason: body padding sits above
// the sticky box, and rows scrolling past would show through that band.
const stickyWrapCss: any = {
	position: 'sticky',
	top: 0,
	zIndex: 1,
	pt: padding.SIDEBAR_SEARCH_TOP,
	pb: 3,
	bg: 'sidebar.headerBlur.light',
	backdropFilter: 'blur(16px)',
	_dark: { bg: 'sidebar.headerBlur.dark' },
};

// Light mode keeps the standard field styling (white pill, bordered).
//
// Dark mode keeps the same `field.*` border tokens as every other input in the
// admin, but drops the fill entirely: any opaque surface here is either
// `field.bg` (#0a0a0a — the selected sidebar item's surface, so the field and
// the active nav pill became the same object) or something lighter, which made
// the field the brightest thing in the sidebar. Transparent lets it sit on the
// sidebar's own black and read as chrome rather than as a slab; the sticky
// wrapper behind it is what keeps scrolled rows from showing through.
const containerCss: any = {
	align: 'center',
	w: 'full',
	gap: 2,
	h: '32px',
	px: 2.5,
	borderRadius: radius.INPUT,
	borderWidth: '1px',
	borderColor: 'field.border',
	bgColor: 'field.bg',
	color: 'fg.muted',
	transition: 'border-color .12s ease, box-shadow .12s ease',
	_hover: { borderColor: 'field.borderHover' },
	_focusWithin: { borderColor: 'field.focusRing' },
	_dark: {
		bgColor: 'transparent',
		_focusWithin: {
			borderColor: 'border.emphasized',
			boxShadow: `0 0 0 3px ${FOCUS_RING_DARK}`,
		},
	},
};

const inputCss: any = {
	variant: 'unstyled',
	flex: 1,
	h: 'full',
	// The pill owns the surface; the input must not paint one of its own over it.
	bg: 'transparent',
	// Chakra's default `md` input size still carries its own horizontal
	// padding even with variant='unstyled' — left in, it doubled up with the
	// pill's own `px`, pushing the placeholder far from the search icon.
	px: 0,
	fontSize: '13px',
	fontWeight: '500',
	color: 'sidebar.bodyText.selectedLight',
	_dark: { color: 'sidebar.bodyText.selectedDark' },
	_placeholder: { color: 'field.placeholder', fontWeight: '400' },
};

// Hairline only, on the same `field.*` tokens as the pill around it — a filled
// badge was the one opaque patch left in an otherwise transparent field.
const kbdCss: any = {
	flexShrink: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minW: '18px',
	h: '18px',
	px: 1,
	borderRadius: '5px',
	borderWidth: '1px',
	borderColor: 'field.border',
	fontSize: '11px',
	fontWeight: '500',
	lineHeight: '1',
	color: 'fg.muted',
	bg: 'transparent',
	transition: 'color .12s ease, border-color .12s ease',
	_hover: { color: 'fg', borderColor: 'field.borderHover' },
};

export default SidebarSearch;
