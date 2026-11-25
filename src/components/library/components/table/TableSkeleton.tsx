import { FC } from 'react';
import { Box, Skeleton, Table } from '@chakra-ui/react';
import { theme } from '../..';
import RowContainerBase from './table-components/row-components/RowContainerBase';

const { TABLE } = theme;

// Uneven bar widths, cycled per column, so a loading table looks like data
// arriving rather than a block of identical grey rectangles.
const WIDTHS = ['72%', '48%', '86%', '38%', '62%', '54%'];

// A cell's text sits in a 20px line box; the bar reads as text rather than as a
// block at a little over half of it.
const BAR_HEIGHT = '12px';

type TableSkeletonProps = {
	col: number;
	row: number;
};

const TableSkeleton: FC<TableSkeletonProps> = ({ row, col }) => {
	return [...Array(row)].map((x, i) => (
		<Table.Row
			key={i}
			h={TABLE.row.height}
			bg='transparent'>
			{[...Array(col)].map((y, j) => (
				<Table.Cell
					key={j}
					// Mirrors CustomTd's own box — same responsive padding and the
					// same 160px cap — so the columns don't resize under the data
					// when it lands.
					maxW='160px'
					px={{ base: 0, md: TABLE.cell.paddingX }}
					py={TABLE.cell.paddingY}
					borderColor='table.innerBorder.light'
					_dark={{ borderColor: 'table.innerBorder.dark' }}>
					<Skeleton
						w={WIDTHS[(i + j) % WIDTHS.length]}
						h={BAR_HEIGHT}
						borderRadius='full'
					/>
				</Table.Cell>
			))}
		</Table.Row>
	));
};

/**
 * The header row while a table loads: one bar per skeleton column, in the
 * header's own cell box. Without it the header sat empty and then popped in
 * with its own skeleton titles once the config arrived — a second skeleton.
 */
export const TableHeaderSkeleton: FC<{ col: number }> = ({ col }) =>
	[...Array(col)].map((x, j) => (
		<Table.ColumnHeader
			key={j}
			bg='inherit'
			h={TABLE.head.height}
			py={TABLE.head.paddingY}
			px={{ base: 0, md: TABLE.cell.paddingX }}
			_light={{ borderColor: 'container.borderLight' }}
			_dark={{ borderColor: 'container.borderDark' }}>
			<Skeleton
				w={['40%', '56%', '32%', '48%', '36%'][j % 5]}
				h='10px'
				borderRadius='full'
			/>
		</Table.ColumnHeader>
	));

/**
 * Card view's loading state: placeholder cards in the real card shell
 * (RowContainerBase), wrapped the way TableRow wraps a card so they tile in the
 * same grid — rather than table-row bars laid out as if they were cards.
 */
export const CardSkeleton: FC<{ count?: number; fields?: number }> = ({ count = 6, fields = 4 }) =>
	[...Array(count)].map((x, i) => (
		<Table.Row
			key={i}
			border='none'
			data-card=''>
			<Table.Cell
				colSpan={100}
				p={0}
				border='none'>
				<RowContainerBase
					_active={{}}
					pointerEvents='none'>
					{[...Array(fields)].map((y, j) => (
						<Box key={j}>
							<Skeleton
								w='44%'
								h='8px'
								mb={2}
								borderRadius='full'
							/>
							<Skeleton
								w={WIDTHS[(i + j) % WIDTHS.length]}
								h={BAR_HEIGHT}
								borderRadius='full'
							/>
						</Box>
					))}
				</RowContainerBase>
			</Table.Cell>
		</Table.Row>
	));

export default TableSkeleton;
