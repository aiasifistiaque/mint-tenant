'use client';

import { Flex, FlexProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

import { ChevronDown, X } from 'lucide-react';

import { radius, sizes } from '../..';

// Lucide defaults to a 2px stroke, which at 13px reads as a blob rather than a
// glyph. 1.5 keeps the icon fine enough to sit beside the label without
// out-weighing it.
const ICON_STROKE = 1.5;
const ICON_SIZE = 13;

type FilterProps = FlexProps & {
	children: ReactNode;
	isActive?: boolean;
	onCancel?: any;
};

/**
 * A filter chip. It used to be a dashed #ebebeb hairline over a transparent
 * background — on a near-white page that read as decoration, not as something
 * you could click, and the "active" state was only a shade away from it.
 *
 * Now the idle chip sits on its own panel surface with a solid border, the same
 * way the search field and refresh button do, and the active chip inverts so a
 * filter that's narrowing the table is unmistakable.
 *
 * Flat, with no shadow: the table it filters lost its drop shadow for a
 * hairline border, and a row of floating chips above a flat table reads as two
 * different design languages stacked on each other. The border and the fill do
 * the separating.
 *
 * Height comes from `SEARCH_BAR_HEIGHT`, the same token the search field and
 * refresh button use, so everything in the toolbar row is one height. Change
 * that token and the whole row moves together.
 */
const Filter: FC<FilterProps> = ({ children, isActive = false, onCancel, ...props }) => {
	// `field.border`/`field.borderHover` — the same tokens the search input and
	// every other field-styled control next to this chip already use. An
	// earlier pass tried `border.muted` (#ebebeb) and found it read as
	// decoration on a near-white page; the panel fill against the page
	// background does that contrast job, so the border itself just needs to
	// match its neighbours instead of standing out from them.
	const idle: FlexProps = {
		bg: 'bg.panel',
		borderColor: 'field.border',
		color: 'fg',
		_hover: {
			bg: 'bg.subtle',
			borderColor: 'field.borderHover',
		},
	};

	const active: FlexProps = {
		bg: 'bg.inverted',
		borderColor: 'bg.inverted',
		color: 'fg.inverted',
		_hover: { opacity: 0.88 },
	};

	return (
		<Flex
			userSelect='none'
			cursor='pointer'
			// Squared off, not a pill. `radius.FILTER` is the same 8px the table
			// frame and the buttons use, so the toolbar reads as one family
			// instead of pills floating above square chrome.
			borderRadius={radius.FILTER}
			borderWidth='1px'
			borderStyle='solid'
			fontWeight='600'
			transitionProperty='background-color, border-color, color, opacity'
			transitionDuration='120ms'
			_focusVisible={{
				outline: '2px solid',
				outlineColor: 'field.focusRing',
				outlineOffset: '1px',
			}}
			{...(isActive ? active : idle)}
			fontSize='12px'
			h={sizes.SEARCH_BAR_HEIGHT}
			px={2.5}
			gap={1.5}
			alignItems='center'
			display='inline-flex'
			{...props}>
			<Flex
				fontSize='12px'
				// One weight in both states, so an active chip does not shift width
				// as it toggles.
				fontWeight='600'
				whiteSpace='nowrap'>
				{children}
			</Flex>
			{!isActive && (
				// A chevron, not a settings glyph: every one of these opens a
				// dropdown, and the icon should say so. Trails the label the way a
				// select does, rather than leading it.
				<Flex
					align='center'
					color='fg.subtle'
					lineHeight={0}>
					<ChevronDown
						size={ICON_SIZE}
						strokeWidth={ICON_STROKE}
					/>
				</Flex>
			)}
			{isActive && (
				<Flex
					onClick={onCancel}
					align='center'
					lineHeight={0}
					opacity={0.7}
					transition='opacity 120ms'
					_hover={{ opacity: 1 }}>
					<X
						size={ICON_SIZE}
						strokeWidth={ICON_STROKE}
					/>
				</Flex>
			)}
		</Flex>
	);
};

export default Filter;
