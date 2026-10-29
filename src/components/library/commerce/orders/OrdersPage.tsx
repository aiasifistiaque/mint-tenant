'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { ScanBarcode } from 'lucide-react';
import { ConsoleTabs, DataTable, EmptyState, ErrorState, PageHeader, Panel, TableSkeleton, dateTime } from '../../cl';
import { useAppDispatch, useAppSelector, useIsMobile, useTableUrlSync } from '../../hooks';
import { setCurrentPath, updateTable } from '../../store/slices/tableSlice';
import DynamicFilters from '../../dynamic-filters/DynamicFilters';
import FilterContainer from '../../components/table/table-components/tool-bar/table-toolbar/FIlterContainer';
import TableSearch from '../../components/table/table-components/tool-bar/table-toolbar/TableSearch';
import TableRefresh from '../../components/table/table-components/tool-bar/table-toolbar/TableRefresh';
import TableSearchContainer from '../../components/table/table-components/tool-bar/table-toolbar/TableSearchContainer';
import TableSettingsMenuContainer from '../../components/table/table-components/tool-bar/table-toolbar/TableSettingsMenuContainer';
import ResultContainer from '../../components/table/table-components/pagination/ResultContainer';
import type { Column } from '../../cl';
import { projectHref } from '../../config/lib/constants/panel';
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
	const dispatch = useAppDispatch();
	const isMobile = useIsMobile();
	// Filters, search and paging are the same ones every table uses (the table slice), so the
	// Order filters set in the builder, the search box and the pager behave as they do there.
	const { page, limit, search, filters } = useAppSelector((st: any) => st.table);
	const route = store.installed.order?.route || 'orders';
	const [view, setView] = useState<StoreOrderView>((params.get('view') as StoreOrderView) || 'all');
	useEffect(() => {
		dispatch(setCurrentPath(route));
	}, [route]);
	useTableUrlSync(route);

	const query = useMemo(() => {
		const f: Record<string, any> = {};
		for (const [k, v] of Object.entries(filters || {})) if (v !== '' && v != null && !(Array.isArray(v) && !v.length) && typeof v !== 'object') f[k] = v;
		for (const [k, v] of Object.entries(filters || {})) if (Array.isArray(v) && v.length) f[k] = v.join(',');
		return f;
	}, [filters]);
	const q = String(search || '').trim();
	const { data, isLoading, isFetching, error, refetch } = useGetStoreOrdersQuery({ ...query, view, q, page, limit, scope: website ? 'website' : 'pos' });
	const views = website ? WEBSITE_VIEWS : VIEWS;
	const open = (id: string) => router.push(projectHref(`/store/orders/${id}`));
	const changeView = (v: string) => {
		setView(v as StoreOrderView);
		dispatch(updateTable({ page: 1 }));
	};

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
	const filtered = !!(q || Object.keys(query).length);

	const card = (o: StoreOrderRow) => (
		<Box
			key={o._id}
			as='button'
			textAlign='left'
			w='full'
			p={4}
			borderWidth='1px'
			borderRadius='lg'
			bg='bg.panel'
			onClick={() => open(o._id)}>
			<Flex justify='space-between' align='baseline' gap={3}>
				<Text fontWeight='600' fontFamily='mono' fontSize='13px'>
					{o.code || o._id.slice(-6)}
				</Text>
				<Text fontWeight='600'>{m(o.total)}</Text>
			</Flex>
			<Text fontSize='12px' color='fg.muted'>
				{dateTime(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
			</Text>
			<Text mt={2} fontWeight='500'>
				{o.delivery?.name || o.customerInfo?.name || 'Walk-in'}
			</Text>
			<Text fontSize='12px' color='fg.muted' truncate>
				{[o.delivery?.phone || o.customerInfo?.phone, o.email].filter(Boolean).join(' · ') || '—'}
			</Text>
			{website ? (
				<Text mt={1} fontSize='13px' lineClamp={2}>
					{[o.delivery?.address, o.delivery?.landmark && `near ${o.delivery.landmark}`, o.delivery?.area].filter(Boolean).join(', ') || '—'}
					{o.slot ? ` · ${o.slot}` : ''}
				</Text>
			) : (
				<Text mt={1} fontSize='12px' color='fg.muted'>
					{[CHANNEL[o.channel] || o.channel, o.outletInfo?.name].filter(Boolean).join(' · ')}
				</Text>
			)}
			<Flex mt={3} gap={2} wrap='wrap' align='center'>
				{o.status === 'cancelled' ? <OrderStatusBadge value='cancelled' /> : <PaymentBadge value={o.paymentStatus} />}
				{o.status !== 'cancelled' && <FulfilmentBadge value={o.fulfilment} />}
				{website && (
					<Text fontSize='12px' color='fg.muted'>
						{o.paymentMethod === 'cod' || !o.paymentMethod ? 'Cash on delivery' : o.paymentMethod}
					</Text>
				)}
			</Flex>
		</Box>
	);

	return (
		<Box pb={{ base: 16, md: 14 }}>
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
				onChange={changeView}>
				<Box mb={3}>
					<TableSettingsMenuContainer>
						<FilterContainer>
							<DynamicFilters path={route} />
						</FilterContainer>
						<TableSearchContainer>
							<TableSearch />
							<TableRefresh />
						</TableSearchContainer>
					</TableSettingsMenuContainer>
				</Box>
				{isLoading ? (
					<Box p={isMobile ? 0 : 4}>
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
				) : isMobile ? (
					<Flex direction='column' gap={3} opacity={isFetching ? 0.6 : 1}>
						{data.doc.map(card)}
					</Flex>
				) : (
					<Panel flush>
						<Box opacity={isFetching ? 0.6 : 1}>
							<DataTable
								columns={website ? websiteColumns : columns}
								rows={data.doc}
								rowKey={o => o._id}
								onRowClick={o => open(o._id)}
							/>
						</Box>
					</Panel>
				)}
			</ConsoleTabs>
			<ResultContainer data={{ totalDocs: total, totalPages: Math.max(1, Math.ceil(total / (limit || 25))) }} />
		</Box>
	);
};

export default OrdersPage;
