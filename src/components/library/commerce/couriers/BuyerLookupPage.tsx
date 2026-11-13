'use client';

import { FC, FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Flex, Input, Text } from '@chakra-ui/react';
import { RefreshCw, Search } from 'lucide-react';
import { DataTable, EmptyState, PageHeader, Panel, TableSkeleton, dateTime } from '../../cl';
import type { Column } from '../../cl';
import { projectHref } from '../../config/lib/constants/panel';
import GuideLink from '../../tenant/GuideLink';
import { useGetStoreBuyerLookupsQuery, useLazyGetStoreBuyerCheckQuery } from '../../store/services/courierApi';
import type { BuyerCheckAnswer, BuyerLookup } from '../../store/services/courierApi';
import type { CommerceView } from '../../store/services/commerceApi';
import { moneyFor } from '../pos/receipt';
import { FulfilmentBadge, OrderStatusBadge } from '../orders/common';
import { BuyerAnswer, BuyerBadge } from './BuyerCheck';
import { errText } from './CourierCards';

/**
 * Check a buyer (backend docs/couriers BUYER_CHECK.md §5, CR-23): type any phone number and see how often it takes
 * its parcels — the same answer as the order page's — with that number's orders in this store, and the store's
 * recent lookups below (who looked, from where). The address keeps the number (?phone=), so it can be linked to.
 */

const VIA: Record<string, string> = { lookup: 'Check a buyer', order: 'New order', send: 'Send to courier', mcp: 'AI (MCP)' };

const BuyerLookupPage: FC<{ store: CommerceView }> = ({ store }) => {
	const router = useRouter();
	const params = useSearchParams();
	const m = moneyFor(store.answers.store.currency);
	const [phone, setPhone] = useState(params.get('phone') || '');
	const [check, res] = useLazyGetStoreBuyerCheckQuery();
	const lookups = useGetStoreBuyerLookupsQuery();

	const run = (p: string, fresh = false) => {
		const v = p.trim();
		if (!v) return;
		setPhone(v);
		window.history.replaceState(null, '', `${window.location.pathname}?phone=${encodeURIComponent(v)}`);
		check({ phone: v, ...(fresh && { fresh: true }) });
	};
	useEffect(() => {
		const p = params.get('phone');
		if (p) run(p);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		run(phone);
	};

	const a: BuyerCheckAnswer | undefined = res.data;
	const orderColumns: Column<BuyerCheckAnswer['own']['recent'][number]>[] = [
		{ key: 'code', label: 'Order', render: o => <Text fontFamily='mono'>{o.code}</Text> },
		{ key: 'at', label: 'Placed', render: o => <Text color='fg.muted'>{dateTime(o.at)}</Text> },
		{ key: 'total', label: 'Total', numeric: true, render: o => m(o.total) },
		{
			key: 'state',
			label: 'Where it is',
			render: o => (
				<Flex
					gap={1}
					wrap='wrap'>
					{o.status === 'cancelled' ? <OrderStatusBadge value={o.status} /> : <FulfilmentBadge value={o.fulfilment} />}
				</Flex>
			),
		},
		{ key: 'courier', label: 'Courier', render: o => <Text textTransform='capitalize'>{o.courier || '—'}</Text> },
	];
	const lookupColumns: Column<BuyerLookup>[] = [
		{ key: 'phone', label: 'Phone', render: l => <Text fontFamily='mono'>{l.phone}</Text> },
		{
			key: 'level',
			label: 'Buyer',
			render: l => (
				<BuyerBadge
					level={l.level}
					rate={l.rate}
				/>
			),
		},
		{ key: 'parcels', label: 'Parcels', numeric: true, render: l => l.parcels },
		{
			key: 'by',
			label: 'Last looked up',
			render: l => (
				<Box>
					<Text>{l.last?.by || '—'}</Text>
					<Text
						fontSize='12px'
						color='fg.muted'>
						{l.last ? VIA[l.last.via] || l.last.via : ''}
					</Text>
				</Box>
			),
		},
		{ key: 'at', label: 'When', render: l => <Text color='fg.muted'>{dateTime(l.at)}</Text> },
	];

	return (
		<Box>
			<PageHeader
				breadcrumbs={[{ href: projectHref('/store/deliveries'), title: 'Deliveries' }]}
				title='Check a buyer'
				meta='Type a phone number to see how often it takes its parcels — from your couriers and your own orders.'
				actions={<GuideLink section='store-buyer-lookup' />}
			/>

			<Panel
				id='store-buyer-lookup'
				title='Phone number'>
				<form onSubmit={onSubmit}>
					<Flex
						gap={2}
						wrap='wrap'>
						<Input
							id='store-buyer-lookup-phone'
							flex='1 1 240px'
							maxW='360px'
							size='sm'
							type='tel'
							inputMode='tel'
							autoComplete='off'
							placeholder='01XXXXXXXXX'
							value={phone}
							onChange={e => setPhone(e.target.value)}
						/>
						<Button
							size='sm'
							type='submit'
							loading={res.isFetching}
							disabled={!phone.trim()}>
							<Search size={14} /> Check
						</Button>
					</Flex>
				</form>
				<Text
					mt={2}
					fontSize='12px'
					color='fg.muted'>
					Answers from the couriers are kept a day, so checking a number again today costs nothing. Check again asks them now. Every lookup is listed below with who did it.
				</Text>
				{res.error && (
					<Text
						mt={3}
						fontSize='13px'
						color='red.fg'>
						{errText(res.error)}
					</Text>
				)}
				{a && !res.error && (
					<Box
						id='store-buyer-lookup-answer'
						mt={4}
						pt={4}
						borderTopWidth='1px'>
						<Flex
							justify='space-between'
							align='center'
							mb={2}>
							<Text
								fontFamily='mono'
								fontWeight='600'>
								{a.phone}
							</Text>
							<Button
								size='xs'
								variant='outline'
								loading={res.isFetching}
								onClick={() => run(a.phone, true)}>
								<RefreshCw size={13} /> Check again
							</Button>
						</Flex>
						<BuyerAnswer a={a} />
					</Box>
				)}
			</Panel>

			{a && !res.error && (
				<Box mt={4}>
					<Panel
						id='store-buyer-lookup-orders'
						title={`This number’s orders in your store${a.own.orders > a.own.recent.length ? ` — the latest ${a.own.recent.length} of ${a.own.orders}` : ''}`}>
						{a.own.recent.length ? (
							<DataTable
								columns={orderColumns}
								rows={a.own.recent}
								rowKey={o => o.id}
								onRowClick={o => router.push(projectHref(`/store/orders/${o.id}`))}
							/>
						) : (
							<Text
								fontSize='13px'
								color='fg.muted'>
								No orders to this number yet.
							</Text>
						)}
					</Panel>
				</Box>
			)}

			<Box mt={4}>
				<Panel
					id='store-buyer-lookups'
					title='Recent lookups'>
					{lookups.isLoading ? (
						<TableSkeleton />
					) : lookups.data?.lookups.length ? (
						<DataTable
							columns={lookupColumns}
							rows={lookups.data.lookups}
							rowKey={l => l.phone}
							onRowClick={l => run(l.phone)}
						/>
					) : (
						<EmptyState
							title='No lookups yet'
							description='Numbers checked here, on new orders and in Send to courier show up here.'
						/>
					)}
				</Panel>
			</Box>
		</Box>
	);
};

export default BuyerLookupPage;
