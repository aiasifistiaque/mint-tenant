'use client';

import { Flex, Text } from '@chakra-ui/react';
import Panel from './Panel';
import DataTable, { Column } from './DataTable';
import { EmptyState, TableSkeleton } from './States';

/**
 * One resource panel, with the three states that matter rather than two.
 *
 * *Has items* and *has none* are the obvious pair. The third — **not available
 * on this plan** — is the one the account this was built against actually hits,
 * and rendering it as an error or as an empty table would both lie: an error
 * implies something broke, and an empty table implies the account has none.
 */
export const ResourceSection = ({
	title,
	section,
	columns,
	rowKey,
	emptyText,
}: {
	title: string;
	section: any;
	columns: Column<any>[];
	rowKey: (row: any) => string;
	emptyText: string;
}) => (
	<Panel
		title={title}
		flush={!!section?.items?.length}>
		{!section ? (
			<TableSkeleton rows={3} />
		) : !section.available ? (
			<Flex
				direction='column'
				gap={1}
				px={4}
				py={6}>
				<Text
					fontSize='13px'
					fontWeight='600'>
					{section.planRestricted ? 'Not available on this plan' : 'Could not be read'}
				</Text>
				<Text
					fontSize='xs'
					color='fg.muted'>
					{section.note}
				</Text>
			</Flex>
		) : !section.items.length ? (
			<EmptyState
				title={emptyText}
				description='Nothing on this account uses it yet.'
			/>
		) : (
			<DataTable<any>
				columns={columns}
				rows={section.items}
				rowKey={rowKey}
			/>
		)}
	</Panel>
);

export default ResourceSection;
