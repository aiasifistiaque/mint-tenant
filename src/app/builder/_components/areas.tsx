'use client';

import { FC, ReactNode } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import {
	ClipboardList,
	Eye,
	Filter,
	History,
	LayoutDashboard,
	ListChecks,
	LucideIcon,
	PanelTop,
	Table2,
} from 'lucide-react';
import { DocLink } from './ui';

/**
 * The parts of a page the route builder shapes, each with one colour, one
 * picture and a sentence in plain words. The colour follows the part wherever
 * it shows — its tab, its card on the overview, the banner on top of its tab
 * and the preview — so people learn "orange is the form" and can find it at a
 * glance instead of reading every grey panel.
 *
 * Chakra palettes, not hex: `<palette>.subtle / .fg / .solid` follow light and
 * dark mode and every colour theme.
 */

export type AreaKey = 'overview' | 'settings' | 'table' | 'filters' | 'form' | 'view' | 'source';

export type Area = {
	label: string;
	palette: string;
	icon: LucideIcon;
	/** One sentence: what changing this part changes. */
	description: string;
	/** The builder guide's section. */
	doc: string;
};

export const AREAS: Record<AreaKey, Area> = {
	overview: {
		label: 'Overview',
		palette: 'gray',
		icon: LayoutDashboard,
		description: 'Everything this page is made of, at a glance.',
		doc: 'routes-page',
	},
	settings: {
		label: 'Fields & rules',
		palette: 'blue',
		icon: ListChecks,
		description:
			'What each record stores and the rules for it: which fields are required, can be edited, sorted or searched, and how they’re typed in.',
		doc: 'settings',
	},
	table: {
		label: 'Table page',
		palette: 'teal',
		icon: Table2,
		description: 'The list of records: its title, buttons, columns, the ⋯ menu on every row and actions on selected rows.',
		doc: 'table',
	},
	filters: {
		label: 'Filters',
		palette: 'purple',
		icon: Filter,
		description: 'The filter buttons above the table, which narrow the list down — by status, date, customer…',
		doc: 'filters',
	},
	form: {
		label: 'Form',
		palette: 'orange',
		icon: ClipboardList,
		description: 'The form people fill in to add or edit a record: its sections, which fields sit side by side, and fields that only show when needed.',
		doc: 'form',
	},
	view: {
		label: 'Record page',
		palette: 'pink',
		icon: PanelTop,
		description: 'The page one record opens on: its sections of details, linked records and tabs of related lists.',
		doc: 'view',
	},
	source: {
		label: 'Versions',
		palette: 'cyan',
		icon: History,
		description: 'Every published version of this page. Load an older one to bring it back.',
		doc: 'source',
	},
};

/** Any icon as a tile in a palette — the same look as AreaIcon, for headings that aren't one of the areas. */
export const ToneIcon: FC<{ icon: LucideIcon; palette: string; size?: number }> = ({ icon: Icon, palette, size = 28 }) => (
	// A span: it sits inside panel titles, which are <p>.
	<Flex
		as='span'
		align='center'
		justify='center'
		flexShrink={0}
		w={`${size}px`}
		h={`${size}px`}
		borderRadius='lg'
		bg={`${palette}.subtle`}
		color={`${palette}.fg`}>
		<Icon
			size={Math.round(size * 0.5)}
			strokeWidth={1.75}
		/>
	</Flex>
);

/** A panel title with its coloured tile in front. */
export const ToneTitle: FC<{ icon: LucideIcon; palette: string; children: ReactNode }> = ({ icon, palette, children }) => (
	<Flex
		as='span'
		align='center'
		gap={2.5}>
		<ToneIcon
			icon={icon}
			palette={palette}
		/>
		{children}
	</Flex>
);

/** A tab label with a coloured icon — for tabs that aren't one of the areas. */
export const ToneTabLabel: FC<{ icon: LucideIcon; palette: string; children: ReactNode }> = ({ icon: Icon, palette, children }) => (
	<Flex
		align='center'
		gap={1.5}>
		<Box
			as='span'
			display='inline-flex'
			color={`${palette}.solid`}>
			<Icon
				size={14}
				strokeWidth={2}
			/>
		</Box>
		{children}
	</Flex>
);

/** The part's picture in its colour: a soft tile with the icon drawn in the tone. */
export const AreaIcon: FC<{ area: AreaKey; size?: number }> = ({ area, size = 32 }) => {
	const a = AREAS[area];
	const Icon = a.icon;
	return (
		<Flex
			align='center'
			justify='center'
			flexShrink={0}
			w={`${size}px`}
			h={`${size}px`}
			borderRadius='lg'
			bg={`${a.palette}.subtle`}
			color={`${a.palette}.fg`}>
			<Icon
				size={Math.round(size * 0.5)}
				strokeWidth={1.75}
			/>
		</Flex>
	);
};

/** A tab's label: its coloured icon and its name — the colour reads on the selected (inverted) pill too. */
export const AreaTabLabel: FC<{ area: AreaKey; label?: string; badge?: ReactNode }> = ({ area, label, badge }) => {
	const a = AREAS[area];
	const Icon = a.icon;
	return (
		<Flex
			align='center'
			gap={1.5}>
			<Box
				as='span'
				display='inline-flex'
				color={`${a.palette}.solid`}>
				<Icon
					size={14}
					strokeWidth={2}
				/>
			</Box>
			{label || a.label}
			{badge}
		</Flex>
	);
};

/**
 * The banner on top of a tab: the part's colour band, its picture, what it is
 * in a sentence, and Preview — so every tab starts by saying what it changes.
 */
export const AreaIntro: FC<{ area: AreaKey; onPreview?: () => void; children?: ReactNode; actions?: ReactNode }> = ({
	area,
	onPreview,
	children,
	actions,
}) => {
	const a = AREAS[area];
	return (
		<Flex
			align={{ base: 'flex-start', md: 'center' }}
			direction={{ base: 'column', md: 'row' }}
			gap={4}
			p={4}
			borderWidth='1px'
			borderColor={`${a.palette}.muted`}
			borderLeftWidth='4px'
			borderLeftColor={`${a.palette}.solid`}
			borderRadius='lg'
			bg={`${a.palette}.subtle`}>
			<Flex
				gap={3}
				align='flex-start'
				flex='1'
				minW={0}>
				<Flex
					align='center'
					justify='center'
					flexShrink={0}
					w='36px'
					h='36px'
					borderRadius='lg'
					bg='bg.panel'
					color={`${a.palette}.fg`}>
					<a.icon
						size={18}
						strokeWidth={1.75}
					/>
				</Flex>
				<Box minW={0}>
					<Text
						fontSize='sm'
						fontWeight='600'
						color={`${a.palette}.fg`}>
						{a.label}
					</Text>
					<Text
						fontSize='sm'
						color='fg.muted'>
						{a.description}
					</Text>
					{children}
				</Box>
			</Flex>
			<Flex
				gap={3}
				align='center'
				flexShrink={0}
				flexWrap='wrap'>
				{actions}
				<DocLink section={a.doc} />
				{onPreview && (
					<Button
						size='sm'
						variant='outline'
						bg='bg.panel'
						onClick={onPreview}>
						<Eye size={14} />
						Preview
					</Button>
				)}
			</Flex>
		</Flex>
	);
};
