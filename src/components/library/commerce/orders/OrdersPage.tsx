'use client';

import { FC, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, ScanBarcode, Search } from 'lucide-react';
import { ConsoleTabs, DataTable, Dropdown, EmptyState, ErrorState, PageHeader, Panel, TableSkeleton, dateTime } from '../../cl';
import type { Column } from '../../cl';
import { projectHref } from '../../config/lib/constants/panel';
import { useGetAllQuery } from '../../store/services/commonApi';
import { useGetStoreOrdersQuery } from '../../store/services/commerceApi';
import type { CommerceView, StoreOrderRow, StoreOrderView } from '../../store/services/commerceApi';
import GuideLink from '../../tenant/GuideLink';
import { moneyFor } from '../pos/receipt';
import { CHANNEL, FulfilmentBadge, OrderStatusBadge, PaymentBadge } from './common';

/**
 * The store's Orders page (backend docs/ecommerce EC19, EC-09): every sale and
 * order, newest first, with quick filters and their counts, search by number,
 * customer or phone, and a row to open the order's own page.
 */

const VIEWS: { value: StoreOrderView; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'today', label: 'Today' },
	{ value: 'unpaid', label: 'Unpaid' },
	{ value: 'to-ship', label: 'To fulfil' },
	{ value: 'returns', label: 'With returns' },
	{ value: 'cancelled', label: 'Cancelled' },
];
const LIMIT = 25;

const WEBSITE_VIEWS: { value: StoreOrderView; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'new', label: 'New' },
	{ value: 'confirmed', label: 'To pack' },
	{ value: 'out', label: 'Out for delivery' },
	{ value: 'delivered', label: 'Delivered' },
	{ value: 'unpaid', label: 'Unpaid' },
	{ value: 'cancelled', label: 'Cancelled' },
];

/** `website`: the website orders' own table (address, area, time slot, payment); otherwise POS and phone orders. */
const OrdersPage: FC<{ store: CommerceView; website?: boolean }> = ({ store, website }) => {
	const router = useRouter();
	const params = useSearchParams();
	const m = moneyFor(store.answers.store.currency);
	const [view, setView] = useState<StoreOrderView>((params.get('view') as StoreOrderView) || 'all');
	const [typed, setTyped] = useState('');
	const [q, setQ] = useState('');
	const [channel, setChannel] = useState('');
	const [outlet, setOutlet] = useState('');
	const [page, setPage] = useState(1);

	// Search as you type, once the typing stops.
	useEffect(() => {
		const t = setTimeout(() => setQ(typed.trim()), 300);
		return () => clearTimeout(t);
	}, [typed]);
	useEffect(() => setPage(1), [view, q, channel, outlet]);

	const { data, isLoading, isFetching, error, refetch } = useGetStoreOrdersQuery({ view, q, channel, outlet, page, limit: LIMIT, scope: website ? 'website' : 'pos' });
	const views = website ? WEBSITE_VIEWS : VIEWS;
	const outletRoute = store.installed.outlet?.route;
	const { data: outlets } = useGetAllQuery({ path: outletRoute, limit: 50, sort: 'name' }, { skip: !outletRoute });
	const outletItems = [{ value: '', label: 'All outlets' }, ...((outlets?.doc || []) as any[]).map(o => ({ value: o._id, label: o.name }))];
	const open = (id: string) => router.push(projectHref(`/store/orders/${id}`));

	const websiteColumns: Column<StoreOrderRow>[] = [
		{
			key: 'code',
			label: 'Order',
			render: o => (
				<Box>
					<Text
						fontWeight='600'
						fontFamily='mono'
						fontSize='13px'>
						{o.code || o._id.slice(-6)}
					</Text>
					<Text
						fontSize='12px'
						color='fg.muted'>
						{dateTime(o.createdAt)}
					</Text>
				</Box>
			),
		},
		{
			key: 'customer',
			label: 'Customer',
			render: o => (
				<Box>
					<Text fontWeight='500'>{o.delivery?.name || o.customerInfo?.name || '—'}</Text>
					<Text
						fontSize='12px'
						color='fg.muted'>
						{[o.delivery?.phone, o.email].filter(Boolean).join(' · ')}
					</Text>
				</Box>
			),
		},
		{
			key: 'address',
			label: 'Deliver to',
			render: o => (
				<Box maxW='280px'>
					<Text
						lineClamp={2}
						fontSize='13px'>
						{[o.delivery?.address, o.delivery?.landmark && `near ${o.delivery.landmark}`].filter(Boolean).join(', ') || '—'}
					</Text>
					<Text
						fontSize='12px'
						color='fg.muted'>
						{[o.delivery?.area, o.slot].filter(Boolean).join(' · ')}
					</Text>
				</Box>
			),
		},
		{ key: 'items', label: 'Items', numeric: true, render: o => o.itemCount },
		{ key: 'total', label: 'Total', numeric: true, render: o => <Text fontWeight='600'>{m(o.total)}</Text> },
		{
			key: 'payment',
			label: 'Payment',
			render: o => (
				<Box>
					{o.status === 'cancelled' ? <OrderStatusBadge value='cancelled' /> : <PaymentBadge value={o.paymentStatus} />}
					<Text
						fontSize='12px'
						color='fg.muted'>
						{o.paymentMethod === 'cod' || !o.paymentMethod ? 'Cash on delivery' : o.paymentMethod}
					</Text>
				</Box>
			),
		},
		{ key: 'fulfilment', label: 'Status', render: o => (o.status === 'cancelled' ? <OrderStatusBadge value='cancelled' /> : <FulfilmentBadge value={o.fulfilment} />) },
	];

	const columns: Column<StoreOrderRow>[] = [
		{
			key: 'code',
			label: 'Order',
			render: o => (
				<Text
					fontWeight='600'
					fontFamily='mono'
					fontSize='13px'>
					{o.code || o._id.slice(-6)}
				</Text>
			),
		},
		{ key: 'date', label: 'Date', render: o => <Text color='fg.muted'>{dateTime(o.createdAt)}</Text> },
		{
			key: 'customer',
			label: 'Customer',
			render: o =>
				o.customerInfo ? (
					<Box>
						<Text>{o.customerInfo.name}</Text>
						{o.customerInfo.phone && (
							<Text
								fontSize='12px'
								color='fg.muted'>
								{o.customerInfo.phone}
							</Text>
						)}
					</Box>
				) : (
					<Text color='fg.subtle'>{o.delivery?.name || 'Walk-in'}</Text>
				),
		},
		{ key: 'channel', label: 'Channel', render: o => CHANNEL[o.channel] || o.channel },
		{ key: 'outlet', label: 'Outlet', render: o => o.outletInfo?.name || '—' },
		{ key: 'items', label: 'Items', numeric: true, render: o => o.itemCount },
		{ key: 'total', label: 'Total', numeric: true, render: o => <Text fontWeight='600'>{m(o.total)}</Text> },
		{
			key: 'payment',
			label: 'Payment',
			render: o => (o.status === 'cancelled' ? <OrderStatusBadge value='cancelled' /> : <PaymentBadge value={o.paymentStatus} />),
		},
		{ key: 'fulfilment', label: 'Fulfilment', render: o => <FulfilmentBadge value={o.fulfilment} /> },
	];

	const total = data?.total ?? 0;
	const from = total ? (page - 1) * LIMIT + 1 : 0;
	const to = Math.min(total, page * LIMIT);
	const filtered = !!(q || channel || outlet);

	return (
		<Box>
			<PageHeader
				breadcrumbs={[{ href: projectHref('/'), title: 'Store' }]}
				title={website ? 'Website orders' : 'Orders'}
				meta={website ? 'Orders placed on your website — who, where, when, how they pay and where each one is.' : 'Sales at the POS and orders taken by phone or by hand — payments, fulfilment and returns in one place.'}
				actions={
					<Flex
						gap={2}
						align='center'>
						<GuideLink section='store-orders' />
						{!website && (
							<Button
								size='sm'
								onClick={() => router.push(projectHref('/store/pos'))}>
								<ScanBarcode size={15} /> Open the POS
							</Button>
						)}
					</Flex>
				}
			/>
			<ConsoleTabs
				tabs={views.map(v => ({ value: v.value, label: data?.views ? `${v.label} · ${data.views[v.value] ?? 0}` : v.label }))}
				value={view}
				onChange={v => setView(v as StoreOrderView)}>
				<Panel
					flush
					title={
						<Flex
							gap={2}
							wrap='wrap'
							align='center'>
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
									placeholder={website ? 'Order number, name, phone, address or email' : 'Order number, customer or phone'}
									value={typed}
									onChange={e => setTyped(e.target.value)}
								/>
							</Flex>
							{!website && (
								<Box w='170px'>
									<Dropdown
										size='sm'
										value={channel}
										onChange={setChannel}
										items={[{ value: '', label: 'All origins' }, ...Object.entries(CHANNEL).filter(([value]) => value !== 'website').map(([value, label]) => ({ value, label }))]}
									/>
								</Box>
							)}
							{outletItems.length > 2 && (
								<Box w='170px'>
									<Dropdown
										size='sm'
										value={outlet}
										onChange={setOutlet}
										items={outletItems}
									/>
								</Box>
							)}
						</Flex>
					}>
					{isLoading ? (
						<Box p={4}>
							<TableSkeleton
								rows={8}
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
							title={filtered || view !== 'all' ? 'No orders match' : 'No orders yet'}
							description={filtered || view !== 'all' ? 'Try another filter or search.' : website ? 'Orders placed on your website show up here.' : 'Sales made at the POS and orders taken by phone show up here.'}
						/>
					) : (
						<Box opacity={isFetching ? 0.6 : 1}>
							<DataTable
								columns={website ? websiteColumns : columns}
								rows={data.doc}
								rowKey={o => o._id}
								onRowClick={o => open(o._id)}
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

export default OrdersPage;
