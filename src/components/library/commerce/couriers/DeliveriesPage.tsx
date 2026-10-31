'use client';

import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Checkbox, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Search, Wallet } from 'lucide-react';
import { ConsoleTabs, DataTable, Dropdown, EmptyState, ErrorState, PageHeader, Panel, StatTile, TableSkeleton, dateTime } from '../../cl';
import type { Column } from '../../cl';
import { PromptDialog } from '../..';
import { projectHref } from '../../config/lib/constants/panel';
import { toaster } from '@/components/ui/toaster';
import { useGetStoreDeliveriesQuery, useSettleStoreDeliveriesMutation } from '../../store/services/courierApi';
import type { DeliveryView, StoreDelivery } from '../../store/services/courierApi';
import type { CommerceView } from '../../store/services/commerceApi';
import GuideLink from '../../tenant/GuideLink';
import { moneyFor } from '../pos/receipt';
import { storeRoutes } from '../orders/common';
import { DeliveryBadge } from './common';

/**
 * The store's Deliveries page (backend docs/couriers CR-07): every parcel sent
 * to a courier, by where it is — booking problems, waiting for pickup, on the
 * way, delivered, coming back — with the cash couriers hold for the store, and
 * parcels from couriers that don't report payouts marked paid out by hand.
 */

const VIEWS: { value: DeliveryView; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'problems', label: 'Not sent' },
	{ value: 'pickup', label: 'Waiting for pickup' },
	{ value: 'moving', label: 'On the way' },
	{ value: 'delivered', label: 'Delivered' },
	{ value: 'returning', label: 'Coming back' },
	{ value: 'returned', label: 'Returned' },
	{ value: 'cancelled', label: 'Cancelled' },
];
const LIMIT = 25;
const NAMES: Record<string, string> = { steadfast: 'Steadfast', pathao: 'Pathao', redx: 'RedX', manual: 'Manual' };

const DeliveriesPage: FC<{ store: CommerceView }> = ({ store }) => {
	const router = useRouter();
	const m = moneyFor(store.answers.store.currency);
	const routes = storeRoutes(store);
	const [view, setView] = useState<DeliveryView>('all');
	const [courier, setCourier] = useState('');
	const [typed, setTyped] = useState('');
	const [q, setQ] = useState('');
	const [page, setPage] = useState(1);
	const [picked, setPicked] = useState<string[]>([]);
	const [askSettle, setAskSettle] = useState(false);
	const [ref, setRef] = useState('');
	useEffect(() => {
		const t = setTimeout(() => setQ(typed.trim()), 300);
		return () => clearTimeout(t);
	}, [typed]);
	useEffect(() => {
		setPage(1);
		setPicked([]);
	}, [view, q, courier]);
	const { data, isLoading, isFetching, error, refetch } = useGetStoreDeliveriesQuery({ view, q, courier, page, limit: LIMIT });
	const [settle, settling] = useSettleStoreDeliveriesMutation();

	const settleable = (d: StoreDelivery) => ['delivered', 'partly-delivered'].includes(d.status) && !d.settled;
	const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
	const columns: Column<StoreDelivery>[] = [
		{
			key: 'pick',
			label: '',
			render: d =>
				settleable(d) ? (
					<Box onClick={e => e.stopPropagation()}>
						<Checkbox.Root
							size='sm'
							checked={picked.includes(d._id)}
							onCheckedChange={() => toggle(d._id)}>
							<Checkbox.HiddenInput />
							<Checkbox.Control />
						</Checkbox.Root>
					</Box>
				) : null,
		},
		{
			key: 'code',
			label: 'Delivery',
			render: d => (
				<Text
					fontWeight='600'
					fontFamily='mono'
					fontSize='13px'>
					{d.code}
				</Text>
			),
		},
		{ key: 'order', label: 'Order', render: d => <Text fontFamily='mono'>{d.orderCode || '—'}</Text> },
		{ key: 'courier', label: 'Courier', render: d => d.courierName },
		{
			key: 'to',
			label: 'To',
			render: d => (
				<Box>
					<Text>{d.recipient?.name}</Text>
					<Text
						fontSize='12px'
						color='fg.muted'>
						{d.recipient?.phone}
					</Text>
				</Box>
			),
		},
		{ key: 'tracking', label: 'Tracking', render: d => <Text fontFamily='mono'>{d.trackingCode || '—'}</Text> },
		{ key: 'cod', label: 'Cash to collect', numeric: true, render: d => m(d.cod) },
		{ key: 'collected', label: 'Collected', numeric: true, render: d => (Number(d.collected) ? m(d.collected) : '—') },
		{
			key: 'status',
			label: 'Status',
			render: d => (
				<Flex
					gap={1}
					wrap='wrap'>
					<DeliveryBadge
						status={d.status}
						label={d.statusLabel}
					/>
					{d.settled && <DeliveryBadge status='delivered' label='Paid out' />}
				</Flex>
			),
		},
		{ key: 'updated', label: 'Last update', render: d => <Text color='fg.muted'>{dateTime(d.lastEventAt || d.createdAt)}</Text> },
	];
	const total = data?.total ?? 0;
	const from = total ? (page - 1) * LIMIT + 1 : 0;
	const to = Math.min(total, page * LIMIT);
	const cash = data?.cashWithCouriers;

	return (
		<Box>
			<PageHeader
				breadcrumbs={[{ href: projectHref('/store/orders'), title: 'Orders' }]}
				title='Deliveries'
				meta='Parcels sent to couriers — where each one is, and the cash they collected for you.'
				actions={<GuideLink section='store-deliveries' />}
			/>
			{cash && (
				<Flex
					gap={3}
					mb={4}
					wrap='wrap'>
					<Box flex='1 1 200px'>
						<StatTile
							label='Cash with couriers'
							value={m(cash.total)}
							hint='Delivered, not paid out to you yet'
						/>
					</Box>
					{cash.byCourier.map(c => (
						<Box
							key={c.courier}
							flex='1 1 160px'>
							<StatTile
								label={NAMES[c.courier] || c.courier}
								value={m(c.amount)}
								hint={`${c.deliveries} parcel${c.deliveries === 1 ? '' : 's'}`}
							/>
						</Box>
					))}
				</Flex>
			)}
			<ConsoleTabs
				tabs={VIEWS.map(v => ({ value: v.value, label: data?.views ? `${v.label} · ${data.views[v.value] ?? 0}` : v.label }))}
				value={view}
				onChange={v => setView(v as DeliveryView)}>
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
									placeholder='Delivery, invoice, tracking or phone'
									value={typed}
									onChange={e => setTyped(e.target.value)}
								/>
							</Flex>
							<Box w='170px'>
								<Dropdown
									size='sm'
									value={courier}
									onChange={setCourier}
									items={[{ value: '', label: 'Every courier' }, ...Object.entries(NAMES).map(([value, label]) => ({ value, label }))]}
								/>
							</Box>
						</Flex>
					}
					actions={
						picked.length ? (
							<Button
								size='sm'
								onClick={() => setAskSettle(true)}>
								<Wallet size={14} /> Mark {picked.length} paid out
							</Button>
						) : undefined
					}>
					{isLoading ? (
						<Box p={4}>
							<TableSkeleton
								rows={6}
								cols={7}
							/>
						</Box>
					) : error ? (
						<ErrorState
							error={error as any}
							onRetry={refetch}
						/>
					) : !data?.doc.length ? (
						<EmptyState
							title={q || view !== 'all' || courier ? 'No deliveries match' : 'No deliveries yet'}
							description={q || view !== 'all' || courier ? 'Try another filter or search.' : 'Send an order to a courier from its page — the parcel shows up here and follows itself.'}
						/>
					) : (
						<Box opacity={isFetching ? 0.6 : 1}>
							<DataTable
								columns={columns}
								rows={data.doc}
								rowKey={d => d._id}
								onRowClick={d => router.push(projectHref(`/store/orders/${d.order}`))}
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
			<PromptDialog
				open={askSettle}
				onClose={() => setAskSettle(false)}
				onConfirm={async () => {
					try {
						const r = await settle({ deliveries: picked, ref: ref.trim() || undefined, routes }).unwrap();
						toaster.success({ title: `${r.settled} marked paid out` });
						setPicked([]);
						setRef('');
						setAskSettle(false);
					} catch (e: any) {
						toaster.error({ title: e?.data?.message || 'Couldn’t mark them' });
					}
				}}
				tone='default'
				title={`Mark ${picked.length} paid out?`}
				description='Once the courier has paid their cash to you. They leave “Cash with couriers”.'
				confirmLabel='Mark paid out'
				loading={settling.isLoading}>
				<Input
					mt={3}
					size='sm'
					placeholder='Payout reference (optional)'
					value={ref}
					onChange={e => setRef(e.target.value)}
				/>
			</PromptDialog>
		</Box>
	);
};

export default DeliveriesPage;
