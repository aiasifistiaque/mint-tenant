'use client';

import { ReactNode } from 'react';
import { Box, Flex, Table } from '@chakra-ui/react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

export type Column<T> = {
	key: string;
	label: ReactNode;
	/** Right-align every numeric column so digits line up down the page. */
	numeric?: boolean;
	width?: string;
	/** Makes the header a sort control. The caller owns the actual sorting —
	 *  this only reports the click and renders the indicator. */
	sortable?: boolean;
	render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
	columns: Column<T>[];
	rows: T[];
	rowKey: (row: T) => string;
	onRowClick?: (row: T) => void;
	/** Trailing borderless cell for a `⋯` menu. */
	rowActions?: (row: T) => ReactNode;
	sortKey?: string;
	sortDir?: SortDir;
	onSort?: (key: string) => void;
};

/**
 * Horizontal rules only — no vertical borders, no zebra striping.
 *
 * Column separators and alternating fills are both crutches for rows that are
 * too tall and too loose. Consistent alignment and one hairline between rows
 * does the same job without turning the table into a grid of boxes.
 */
const DataTable = <T,>({
	columns,
	rows,
	rowKey,
	onRowClick,
	rowActions,
	sortKey,
	sortDir = 'asc',
	onSort,
}: DataTableProps<T>) => (
	<Box
		overflowX='auto'
		w='full'>
		<Table.Root
			size='sm'
			variant='line'>
			<Table.Header>
				<Table.Row bg='transparent'>
					{columns.map(column => {
						const active = column.sortable && sortKey === column.key;
						const clickable = column.sortable && !!onSort;

						return (
							<Table.ColumnHeader
								key={column.key}
								w={column.width}
								textAlign={column.numeric ? 'right' : 'left'}
								fontSize='11px'
								fontWeight='500'
								letterSpacing='0.04em'
								textTransform='uppercase'
								color={active ? 'fg' : 'fg.muted'}
								borderColor='border.muted'
								whiteSpace='nowrap'
								cursor={clickable ? 'pointer' : undefined}
								userSelect={clickable ? 'none' : undefined}
								transition='color 120ms'
								_hover={clickable ? { color: 'fg' } : undefined}
								aria-sort={
									active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
								}
								onClick={clickable ? () => onSort!(column.key) : undefined}>
								<Flex
									align='center'
									gap={1}
									justify={column.numeric ? 'flex-end' : 'flex-start'}>
									{column.label}
									{clickable && (
										<Box
											lineHeight={0}
											// The neutral arrows stay dim until the column is the
											// active one, so the header reads as a label first and a
											// control second.
											color={active ? 'fg' : 'fg.subtle'}>
											{!active ? (
												<ChevronsUpDown size={12} />
											) : sortDir === 'asc' ? (
												<ChevronUp size={12} />
											) : (
												<ChevronDown size={12} />
											)}
										</Box>
									)}
								</Flex>
							</Table.ColumnHeader>
						);
					})}
					{rowActions && (
						<Table.ColumnHeader
							w='48px'
							borderColor='border.muted'
						/>
					)}
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{rows.map(row => (
					<Table.Row
						key={rowKey(row)}
						bg='transparent'
						cursor={onRowClick ? 'pointer' : undefined}
						transition='background 120ms'
						_hover={{ bg: 'bg.subtle' }}
						onClick={onRowClick ? () => onRowClick(row) : undefined}>
						{columns.map(column => (
							<Table.Cell
								key={column.key}
								textAlign={column.numeric ? 'right' : 'left'}
								fontSize='13px'
								borderColor='border.muted'
								maxW='320px'
								truncate>
								{column.render(row)}
							</Table.Cell>
						))}
						{rowActions && (
							<Table.Cell
								borderColor='border.muted'
								textAlign='right'
								// The menu is its own control; clicking it must not also
								// trigger the row's navigation.
								onClick={event => event.stopPropagation()}>
								{rowActions(row)}
							</Table.Cell>
						)}
					</Table.Row>
				))}
			</Table.Body>
		</Table.Root>
	</Box>
);

export default DataTable;
