import { Flex, FlexProps, Skeleton, Table, Tooltip } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { BsInfoCircle } from 'react-icons/bs';
import { useAppDispatch, useAppSelector, updateTable, theme } from '../..';
import { FC, ReactNode } from 'react';

const { TABLE } = theme;

const SORT_ICON_SIZE = 12;
const SORT_ICON_STROKE = 1.5;

export type TitleProps = FlexProps & {
	children: ReactNode;
	info?: string;
	sort?: string;
	ifItemsSelected?: boolean;
	isNumeric?: boolean;
	isLoading?: boolean;
	item?: any;
};

export const Title: FC<TitleProps> = ({
	children,
	sort,
	info,
	ifItemsSelected,
	isNumeric,
	item,
	isLoading = false,
	...props
}) => {
	const { sort: val } = useAppSelector(state => state.table);
	const dispatch = useAppDispatch();

	const isAsc = val == sort;
	const isDesc = val == `-${sort}`;
	const isSorted = isAsc || isDesc;

	// Chevrons, matching the Heroku console's tables — and the direction now
	// matches them too. This previously showed an *up* arrow for `-field`
	// (descending) and a *down* arrow for `field` (ascending), which is the
	// opposite of every other sort control in the app and of the convention
	// itself: A→Z points up.
	const icon = isAsc ? (
		<ChevronUp
			size={SORT_ICON_SIZE}
			strokeWidth={SORT_ICON_STROKE}
		/>
	) : isDesc ? (
		<ChevronDown
			size={SORT_ICON_SIZE}
			strokeWidth={SORT_ICON_STROKE}
		/>
	) : (
		<ChevronsUpDown
			size={SORT_ICON_SIZE}
			strokeWidth={SORT_ICON_STROKE}
		/>
	);

	const handleSort = (): any => {
		if (!sort) return;
		const sortVal: string = val == sort ? `-${sort}` : sort;
		dispatch(updateTable({ sort: sortVal, page: 1 }));
	};

	const body =
		Boolean(sort) && !ifItemsSelected ? (
			<Flex
				as={motion.div}
				align='center'
				gap={1.5}>
				{children}
				<Flex
					// Colour rather than opacity: a 0.35-alpha glyph over the header's
					// own muted grey came out almost invisible in dark mode.
					color={isSorted ? 'fg' : 'fg.subtle'}
					align='center'
					lineHeight={0}>
					{icon}
				</Flex>
			</Flex>
		) : (
			children
		);

	const tooltip = item?.tooltip && (
		<Tooltip.Root lazyMount>
			<Tooltip.Trigger asChild>
				<span>
					<BsInfoCircle />
				</span>
			</Tooltip.Trigger>
			<Tooltip.Positioner>
				<Tooltip.Content>{item?.tooltip}</Tooltip.Content>
			</Tooltip.Positioner>
		</Tooltip.Root>
	);

	return (
		<Table.ColumnHeader
			bg='inherit'
			h={TABLE.head.height}
			// Overrides the recipe's own column-header padding rather than
			// stacking on top of it — the inner Flex below carries the horizontal
			// padding instead.
			py={TABLE.head.paddingY}
			// px lives on the inner Flex, so the `th` must contribute none of its
			// own. Left to the recipe's default it stacked on top, indenting every
			// column label further than the values underneath it.
			px={0}
			_light={{ borderColor: 'container.borderLight' }}
			_dark={{
				bg: 'inherit',
				borderColor: 'container.borderDark',
			}}
			cursor={Boolean(sort) ? 'pointer' : 'default'}
			// Only sortable columns react to the pointer, so the affordance says
			// which headers actually do something.
			transition='color .15s ease'
			_hover={Boolean(sort) ? { color: 'text.light', _dark: { color: 'text.dark' } } : undefined}
			onClick={handleSort}
			userSelect='none'>
			<Flex
				px={{ base: 0, md: TABLE.cell.paddingX }}
				py={0}
				align='center'
				gap={1.5}
				fontSize={TABLE.head.fontSize}
				letterSpacing={TABLE.head.letterSpacing}
				textTransform='uppercase'
				fontWeight={TABLE.head.fontWeight}
				whiteSpace='nowrap'
				color='table.head.textLight'
				_dark={{
					color: 'table.head.textDark',
				}}
				{...props}>
				<Skeleton
					loading={isLoading}
					w='100%'>
					{body}
				</Skeleton>
				{tooltip}
			</Flex>
		</Table.ColumnHeader>
	);
};

export default Title;
