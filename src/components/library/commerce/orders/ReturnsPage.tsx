'use client';

import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { ConsoleTabs, DataTable, EmptyState, ErrorState, PageHeader, Panel, TableSkeleton, dateTime } from '../../cl';
import type { Column } from '../../cl';
import { projectHref } from '../../config/lib/constants/panel';
import { useGetStoreReturnsQuery } from '../../store/services/commerceApi';
import type { CommerceView, StoreReturnRow, StoreReturnView } from '../../store/services/commerceApi';
import GuideLink from '../../tenant/GuideLink';
import { moneyFor } from '../pos/receipt';
import { ReturnBadge } from './common';

/**
 * The store's Returns page (backend docs/ecommerce EC-09): items brought back,
 * newest first, by where they are in the flow — requested, approved,
 * received, refunded — with search by return, order or customer.
 */

const VIEWS: { value: StoreReturnView; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'open', label: 'Open' },
	{ value: 'refunded', label: 'Refunded' },
	{ value: 'rejected', label: 'Rejected' },
];
const LIMIT = 25;

const ReturnsPage: FC<{ store: CommerceView }> = ({ store }) => {
	const router = useRouter();
	const m = moneyFor(store.answers.store.currency);
	const [view, setView] = useState<StoreReturnView>('all');
	const [typed, setTyped] = useState('');
	const [q, setQ] = useState('');
	const [page, setPage] = useState(1);
	useEffect(() => {
		const t = setTimeout(() => setQ(typed.trim()), 300);
		return () => clearTimeout(t);
	}, [typed]);
	useEffect(() => setPage(1), [view, q]);

	const on = !!store.installed.return && store.answers.returns.allowed;
	const { data, isLoading, isFetching, error, refetch } = useGetStoreReturnsQuery({ view, q, page, limit: LIMIT }, { skip: !on });

	const header = (
		<PageHeader
			breadcrumbs={[{ href: projectHref('/store/orders'), title: 'Orders' }]}
			title='Returns'
			meta='Items brought back — all of an order or part of it — and what was refunded.'
			actions={<GuideLink section='store-returns-page' />}
		/>
	);
	if (!on)
		return (
			<Box>
				{header}
				<EmptyState
					title='Returns are switched off'
					description='Turn them on in Store settings → Returns to take items back and refund them.'
				/>
			</Box>
		);

	const columns: Column<StoreReturnRow>[] = [
		{
			key: 'code',
			label: 'Return',
			render: r => (
				<Text
					fontWeight='600'
					fontFamily='mono'
					fontSize='13px'>
					{r.code}
				</Text>
			),
		},
		{ key: 'date', label: 'Date', render: r => <Text color='fg.muted'>{dateTime(r.createdAt)}</Text> },
		{ key: 'order', label: 'Order', render: r => <Text fontFamily='mono'>{r.orderInfo?.code || '—'}</Text> },
		{ key: 'customer', label: 'Customer', render: r => r.customerInfo?.name || <Text color='fg.subtle'>Walk-in</Text> },
		{ key: 'items', label: 'Items', numeric: true, render: r => r.itemCount },
		{ key: 'due', label: 'Refund due', numeric: true, render: r => m(r.refundDue) },
		{ key: 'refunded', label: 'Refunded', numeric: true, render: r => <Text fontWeight='600'>{m(r.refunded)}</Text> },
		{ key: 'status', label: 'Status', render: r => <ReturnBadge value={r.status} /> },
	];
	const total = data?.total ?? 0;
	const from = total ? (page - 1) * LIMIT + 1 : 0;
	const to = Math.min(total, page * LIMIT);

	return (
		<Box>
			{header}
			<ConsoleTabs
				tabs={VIEWS.map(v => ({ value: v.value, label: data?.views ? `${v.label} · ${data.views[v.value] ?? 0}` : v.label }))}
				value={view}
				onChange={v => setView(v as StoreReturnView)}>
				<Panel
					flush
					title={
						<Flex
							align='center'
							gap={2}
							borderWidth='1px'
							borderRadius='md'
							px={2}
							h='32px'
							w={{ base: 'full', md: '280px' }}>
							<Search
								size={14}
								color='var(--chakra-colors-fg-muted)'
							/>
							<Input
								size='sm'
								border='none'
								px={0}
								_focusVisible={{ outline: 'none' }}
								placeholder='Return, order or customer'
								value={typed}
								onChange={e => setTyped(e.target.value)}
							/>
						</Flex>
					}>
					{isLoading ? (
						<Box p={4}>
							<TableSkeleton
								rows={6}
								cols={6}
							/>
						</Box>
					) : error ? (
						<ErrorState
							error={error as any}
							onRetry={refetch}
						/>
					) : !data?.doc.length ? (
						<EmptyState
							title={q || view !== 'all' ? 'No returns match' : 'No returns yet'}
							description={q || view !== 'all' ? 'Try another filter or search.' : 'When items come back from an order, the return shows up here.'}
						/>
					) : (
						<Box opacity={isFetching ? 0.6 : 1}>
							<DataTable
								columns={columns}
								rows={data.doc}
								rowKey={r => r._id}
								onRowClick={r => router.push(projectHref(`/store/returns/${r._id}`))}
							/>
						</Box>
					)}
					{total > LIMIT && (
						<Flex
							justify='space-between'
							align='center'
							px={4}
							py={3}
							borderTopWidth='1px'>
							<Text
								fontSize='13px'
								color='fg.muted'>
								{from}–{to} of {total}
							</Text>
							<Flex gap={1}>
								<IconButton
									size='xs'
									variant='outline'
									aria-label='Newer'
									disabled={page <= 1}
									onClick={() => setPage(p => p - 1)}>
									<ChevronLeft size={14} />
								</IconButton>
								<IconButton
									size='xs'
									variant='outline'
									aria-label='Older'
									disabled={to >= total}
									onClick={() => setPage(p => p + 1)}>
									<ChevronRight size={14} />
								</IconButton>
							</Flex>
						</Flex>
					)}
				</Panel>
			</ConsoleTabs>
		</Box>
	);
};

export default ReturnsPage;
