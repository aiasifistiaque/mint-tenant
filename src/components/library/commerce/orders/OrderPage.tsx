'use client';

import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Flex, Grid, Menu, Portal, Table, Text, Textarea } from '@chakra-ui/react';
import { Ban, ChevronDown, CreditCard, Printer, Truck, Undo2 } from 'lucide-react';
import { DetailRow, DetailSkeleton, EmptyState, ErrorState, PageHeader, Panel, dateTime } from '../../cl';
import { PromptDialog } from '../..';
import { projectHref } from '../../config/lib/constants/panel';
import { toaster } from '@/components/ui/toaster';
import { useCancelStoreOrderMutation, useFulfilStoreOrderMutation, useGetPosSetupQuery, useGetStoreOrderQuery, usePayStoreOrderMutation } from '../../store/services/commerceApi';
import type { CommerceView, StoreOrderDetail, StorePaymentInput } from '../../store/services/commerceApi';
import GuideLink from '../../tenant/GuideLink';
import { PayDialog } from '../pos/pay';
import { moneyFor, printReceipt, receiptHtml } from '../pos/receipt';
import { CHANNEL, FULFIL_NEXT, FulfilmentBadge, OrderStatusBadge, PaymentBadge, ReturnBadge, showValue, storeRoutes } from './common';

/**
 * An order's own page (backend docs/ecommerce EC19, EC-09): its lines with
 * returned quantities, the totals, customer and delivery, payments and refunds,
 * returns, stock movements, the fields people added, and a timeline — with
 * the actions the order allows (take payment, fulfil, cancel, print).
 * Return items and refunds come with the returns engine (EC-08).
 */

const errText = (e: any) => e?.data?.message || e?.message || 'Something went wrong';

const Money: FC<{ label: ReactNode; value: string; strong?: boolean; muted?: boolean }> = ({ label, value, strong, muted }) => (
	<Flex
		justify='space-between'
		py={1}
		fontSize={strong ? '15px' : '14px'}
		fontWeight={strong ? '700' : '400'}
		color={muted ? 'fg.muted' : undefined}>
		<Text>{label}</Text>
		<Text fontVariantNumeric='tabular-nums'>{value}</Text>
	</Flex>
);

type Event = { at: string; text: string; by?: string };

/** What happened to the order, oldest first, from its own records. */
const timelineOf = (d: StoreOrderDetail, m: (n: number) => string): Event[] => {
	const o = d.order;
	const ev: Event[] = [{ at: o.createdAt, text: `${o.channel === 'pos' ? 'Sold at the POS' : 'Order taken'}${d.outlet ? ` · ${d.outlet.name}` : ''}`, by: o.cashier }];
	for (const p of d.payments) ev.push({ at: p.createdAt, text: `${p.type === 'refund' ? 'Refunded' : 'Paid'} ${m(p.amount)} · ${p.methodLabel || p.method}${p.status !== 'completed' ? ` (${p.status})` : ''}`, by: p.by });
	for (const r of d.returns) ev.push({ at: r.createdAt, text: `Return ${r.code || ''} · ${r.status}`, by: r.by });
	if (o.completedAt) ev.push({ at: o.completedAt, text: 'Completed' });
	if (o.status === 'cancelled') ev.push({ at: (o as any).updatedAt || o.createdAt, text: 'Cancelled' });
	return ev.filter(e => e.at).sort((a, b) => +new Date(a.at) - +new Date(b.at));
};

const OrderPage: FC<{ id: string; store: CommerceView }> = ({ id, store }) => {
	const router = useRouter();
	const params = useSearchParams();
	const m = moneyFor(store.answers.store.currency);
	const routes = useMemo(() => storeRoutes(store), [store]);
	const { data, isLoading, error, refetch } = useGetStoreOrderQuery(id);
	const { data: setup } = useGetPosSetupQuery();
	const [pay, paying] = usePayStoreOrderMutation();
	const [fulfil, fulfilling] = useFulfilStoreOrderMutation();
	const [cancel, cancelling] = useCancelStoreOrderMutation();
	const [payOpen, setPayOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [reason, setReason] = useState('');

	// The Orders table's row actions open the page with the dialog up.
	useEffect(() => {
		const a = params.get('action');
		if (a === 'pay') setPayOpen(true);
		if (a === 'cancel') setCancelOpen(true);
	}, [params]);

	if (isLoading) return <DetailSkeleton rows={10} />;
	if (error || !data)
		return (error as any)?.status === 404 ? (
			<EmptyState
				title='Order not found'
				description='It may have been deleted.'
				action={<Button onClick={() => router.push(projectHref('/store/orders'))}>Back to Orders</Button>}
			/>
		) : (
			<ErrorState
				error={error as any}
				onRetry={refetch}
			/>
		);

	const d = data;
	const o = d.order;
	const cancelled = o.status === 'cancelled';
	const balance = Number(o.balance) || 0;
	const next = cancelled ? [] : FULFIL_NEXT[o.fulfilment || 'unfulfilled'] || [];
	const canCancel = !cancelled && !['shipped', 'delivered'].includes(o.fulfilment) && !(Number(o.returnedItems) > 0);
	const returnsOn = !!store.installed.return && (store.answers.returns.allowed || d.returns.length > 0);

	const run = async (p: Promise<any>, ok: string) => {
		try {
			await p;
			toaster.success({ title: ok });
			return true;
		} catch (e) {
			toaster.error({ title: errText(e) });
			return false;
		}
	};
	const onPay = async (payments: StorePaymentInput[]) => {
		if (await run(pay({ id, payments, routes }).unwrap(), 'Payment taken')) setPayOpen(false);
	};
	const onCancel = async () => {
		if (await run(cancel({ id, reason: reason.trim() || undefined, routes }).unwrap(), 'Order cancelled — stock and money went back')) setCancelOpen(false);
	};
	const print = () => setup && printReceipt(receiptHtml(d, setup));

	const address = o.delivery?.address || d.customer?.address;
	const timeline = timelineOf(d, m);

	return (
		<Box>
			<PageHeader
				breadcrumbs={[{ href: projectHref('/store/orders'), title: 'Orders' }]}
				title={`Order ${o.code || o._id.slice(-6)}`}
				badge={
					<Flex gap={1.5}>
						{cancelled ? <OrderStatusBadge value='cancelled' /> : <PaymentBadge value={o.paymentStatus} />}
						<FulfilmentBadge value={o.fulfilment} />
					</Flex>
				}
				meta={[dateTime(o.createdAt), CHANNEL[o.channel] || o.channel, d.outlet?.name, o.cashier && `by ${o.cashier}`].filter(Boolean).join(' · ')}
				actions={
					<Flex
						gap={2}
						wrap='wrap'
						align='center'>
						<GuideLink section='store-order' />
						<Button
							size='sm'
							variant='outline'
							onClick={print}
							disabled={!setup}>
							<Printer size={15} /> Print receipt
						</Button>
						{canCancel && (
							<Button
								size='sm'
								variant='outline'
								colorPalette='red'
								onClick={() => setCancelOpen(true)}>
								<Ban size={15} /> Cancel
							</Button>
						)}
						{returnsOn && !cancelled && (
							<Button
								size='sm'
								variant='outline'
								disabled
								title='Coming with the returns engine'>
								<Undo2 size={15} /> Return items
							</Button>
						)}
						{next.length > 0 && (
							<Menu.Root>
								<Menu.Trigger asChild>
									<Button
										size='sm'
										variant='outline'
										loading={fulfilling.isLoading}>
										<Truck size={15} /> Fulfil <ChevronDown size={14} />
									</Button>
								</Menu.Trigger>
								<Portal>
									<Menu.Positioner>
										<Menu.Content>
											{next.map(s => (
												<Menu.Item
													key={s.to}
													value={s.to}
													onClick={() => run(fulfil({ id, to: s.to, routes }).unwrap(), `Marked ${s.to}`)}>
													{s.label}
												</Menu.Item>
											))}
										</Menu.Content>
									</Menu.Positioner>
								</Portal>
							</Menu.Root>
						)}
						{!cancelled && balance > 0 && (
							<Button
								size='sm'
								onClick={() => setPayOpen(true)}>
								<CreditCard size={15} /> Take payment · {m(balance)}
							</Button>
						)}
					</Flex>
				}
			/>

			<Grid
				mt={2}
				templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 340px' }}
				gap={4}
				alignItems='start'>
				<Flex
					direction='column'
					gap={4}
					minW={0}>
					<Panel
						flush
						title='Items'
						subtitle={`${o.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)} item(s)`}>
						<Box overflowX='auto'>
							<Table.Root
								size='sm'
								variant='line'>
								<Table.Header>
									<Table.Row bg='transparent'>
										<Table.ColumnHeader>Item</Table.ColumnHeader>
										<Table.ColumnHeader textAlign='end'>Price</Table.ColumnHeader>
										<Table.ColumnHeader textAlign='end'>Qty</Table.ColumnHeader>
										<Table.ColumnHeader textAlign='end'>Discount</Table.ColumnHeader>
										<Table.ColumnHeader textAlign='end'>Total</Table.ColumnHeader>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{o.items.map((it, i) => (
										<Table.Row key={i}>
											<Table.Cell>
												<Text fontWeight='500'>{it.name}</Text>
												<Text
													fontSize='12px'
													color='fg.muted'>
													{[it.sku && `SKU ${it.sku}`, Number(it.returned) > 0 && `${it.returned} returned`].filter(Boolean).join(' · ') || ' '}
												</Text>
											</Table.Cell>
											<Table.Cell textAlign='end'>{m(it.unitPrice)}</Table.Cell>
											<Table.Cell textAlign='end'>{it.quantity}</Table.Cell>
											<Table.Cell
												textAlign='end'
												color='fg.muted'>
												{Number(it.discount) ? `− ${m(it.discount)}` : '—'}
											</Table.Cell>
											<Table.Cell
												textAlign='end'
												fontWeight='600'>
												{m(it.total)}
											</Table.Cell>
										</Table.Row>
									))}
								</Table.Body>
							</Table.Root>
						</Box>
						<Box
							px={4}
							py={3}
							borderTopWidth='1px'
							ml='auto'
							maxW='360px'>
							<Money
								label='Subtotal'
								value={m(o.subtotal)}
							/>
							{Number(o.discount) > 0 && (
								<Money
									muted
									label='Item discounts'
									value={`− ${m(o.discount - (Number(o.orderDiscount) || 0))}`}
								/>
							)}
							{Number(o.orderDiscount) > 0 && (
								<Money
									muted
									label={`Order discount${o.couponCode ? ` (${o.couponCode})` : ''}`}
									value={`− ${m(o.orderDiscount)}`}
								/>
							)}
							{Number(o.tax) > 0 && (
								<Money
									muted
									label='Tax'
									value={m(o.tax)}
								/>
							)}
							{Number(o.shipping) > 0 && (
								<Money
									muted
									label='Shipping'
									value={m(o.shipping)}
								/>
							)}
							<Money
								strong
								label='Total'
								value={m(o.total)}
							/>
							<Money
								label='Paid'
								value={m(o.paid)}
							/>
							{Number(o.refunded) > 0 && (
								<Money
									label='Refunded'
									value={`− ${m(o.refunded)}`}
								/>
							)}
							<Money
								strong
								label='Balance due'
								value={m(balance)}
							/>
						</Box>
					</Panel>

					<Panel
						flush
						title='Payments and refunds'>
						{d.payments.length ? (
							<Box overflowX='auto'>
								<Table.Root
									size='sm'
									variant='line'>
									<Table.Body>
										{d.payments.map(p => (
											<Table.Row key={p._id}>
												<Table.Cell>
													<Text fontWeight='500'>{p.type === 'refund' ? 'Refund' : 'Payment'}</Text>
													<Text
														fontSize='12px'
														color='fg.muted'>
														{[p.code, p.methodLabel || p.method, p.reference].filter(Boolean).join(' · ')}
													</Text>
												</Table.Cell>
												<Table.Cell color='fg.muted'>{dateTime(p.createdAt)}</Table.Cell>
												<Table.Cell color='fg.muted'>{p.by}</Table.Cell>
												<Table.Cell
													textAlign='end'
													fontWeight='600'
													color={p.type === 'refund' ? 'red.fg' : undefined}>
													{p.type === 'refund' ? '− ' : ''}
													{m(p.amount)}
													{p.change ? (
														<Text
															as='span'
															fontWeight='400'
															color='fg.muted'
															fontSize='12px'>
															{' '}
															(change {m(p.change)})
														</Text>
													) : null}
												</Table.Cell>
											</Table.Row>
										))}
									</Table.Body>
								</Table.Root>
							</Box>
						) : (
							<Text
								px={4}
								py={3}
								color='fg.muted'
								fontSize='14px'>
								Nothing paid yet.
							</Text>
						)}
					</Panel>

					{returnsOn && (
						<Panel
							flush
							title='Returns'>
							{d.returns.length ? (
								<Table.Root
									size='sm'
									variant='line'>
									<Table.Body>
										{d.returns.map((r: any) => (
											<Table.Row
												key={r._id}
												cursor='pointer'
												_hover={{ bg: 'bg.subtle' }}
												onClick={() => router.push(projectHref(`/store/returns/${r._id}`))}>
												<Table.Cell fontFamily='mono'>{r.code}</Table.Cell>
												<Table.Cell color='fg.muted'>{dateTime(r.createdAt)}</Table.Cell>
												<Table.Cell>
													<ReturnBadge value={r.status} />
												</Table.Cell>
												<Table.Cell textAlign='end'>{m(r.refundDue)}</Table.Cell>
											</Table.Row>
										))}
									</Table.Body>
								</Table.Root>
							) : (
								<Text
									px={4}
									py={3}
									color='fg.muted'
									fontSize='14px'>
									Nothing has come back.
								</Text>
							)}
						</Panel>
					)}

					<Panel
						flush
						title='Stock movements'>
						{d.movements.length ? (
							<Table.Root
								size='sm'
								variant='line'>
								<Table.Body>
									{d.movements.map((mv: any) => (
										<Table.Row key={mv._id}>
											<Table.Cell>{mv.label || 'Item'}</Table.Cell>
											<Table.Cell color='fg.muted'>{mv.reason}</Table.Cell>
											<Table.Cell color='fg.muted'>{dateTime(mv.createdAt)}</Table.Cell>
											<Table.Cell
												textAlign='end'
												fontWeight='600'
												color={Number(mv.change) < 0 ? 'red.fg' : 'green.fg'}>
												{Number(mv.change) > 0 ? '+' : ''}
												{mv.change}
											</Table.Cell>
										</Table.Row>
									))}
								</Table.Body>
							</Table.Root>
						) : (
							<Text
								px={4}
								py={3}
								color='fg.muted'
								fontSize='14px'>
								No stock moved for this order.
							</Text>
						)}
					</Panel>

					<Panel title='Timeline'>
						<Flex
							direction='column'
							gap={3}>
							{timeline.map((e, i) => (
								<Flex
									key={i}
									gap={3}>
									<Box
										mt='7px'
										w='8px'
										h='8px'
										borderRadius='full'
										bg={i === timeline.length - 1 ? 'fg' : 'border.emphasized'}
										flexShrink={0}
									/>
									<Box>
										<Text fontSize='14px'>{e.text}</Text>
										<Text
											fontSize='12px'
											color='fg.muted'>
											{[dateTime(e.at), e.by].filter(Boolean).join(' · ')}
										</Text>
									</Box>
								</Flex>
							))}
						</Flex>
					</Panel>
				</Flex>

				<Flex
					direction='column'
					gap={4}>
					<Panel title='Customer'>
						{d.customer ? (
							<Box fontSize='14px'>
								<Text fontWeight='600'>{d.customer.name}</Text>
								{d.customer.phone && <Text color='fg.muted'>{d.customer.phone}</Text>}
								{d.customer.email && <Text color='fg.muted'>{d.customer.email}</Text>}
								{d.customer.storeCredit ? <Text mt={2}>Store credit: {m(d.customer.storeCredit)}</Text> : null}
								{store.installed.customer && (
									<Button
										mt={3}
										size='xs'
										variant='outline'
										onClick={() => router.push(projectHref(`/view/${store.installed.customer.route}/${d.customer!._id}`))}>
										Open customer
									</Button>
								)}
							</Box>
						) : (
							<Text
								color='fg.muted'
								fontSize='14px'>
								Walk-in — no customer on this order.
							</Text>
						)}
					</Panel>

					{(o.delivery?.address || o.delivery?.name || address) && (
						<Panel title='Delivery'>
							<Box fontSize='14px'>
								{o.delivery?.name && <Text fontWeight='600'>{o.delivery.name}</Text>}
								{o.delivery?.phone && (
									<Text color='fg.muted'>
										<a href={`tel:${o.delivery.phone}`}>{o.delivery.phone}</a>
									</Text>
								)}
								{(o.delivery?.email || o.email) && (
									<Text color='fg.muted'>
										<a href={`mailto:${o.delivery?.email || o.email}`}>{o.delivery?.email || o.email}</a>
									</Text>
								)}
								{address && (
									<Text
										mt={2}
										whiteSpace='pre-line'>
										{address}
									</Text>
								)}
								{o.delivery?.landmark && <Text color='fg.muted'>Near {o.delivery.landmark}</Text>}
								{[o.delivery?.area, o.delivery?.city].filter(Boolean).length > 0 && <Text color='fg.muted'>{[o.delivery?.area, o.delivery?.city].filter(Boolean).join(', ')}</Text>}
								{o.slot && <Text mt={2}>Deliver: {o.slot}</Text>}
								{o.delivery?.rate && <Text mt={o.slot ? 0 : 2}>Shipping: {o.delivery.rate}</Text>}
								{address && (
									<Text mt={2}>
										<a
											href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([address, o.delivery?.area, o.delivery?.city].filter(Boolean).join(', '))}`}
											target='_blank'
											rel='noreferrer'>
											Open in Maps ↗
										</a>
									</Text>
								)}
							</Box>
						</Panel>
					)}

					{o.courier?.provider && (
						<Panel title='Courier'>
							<DetailRow
								label='Courier'
								value={o.courier.provider}
							/>
							<DetailRow
								label='Tracking'
								value={o.courier.tracking || o.courier.consignment || '—'}
							/>
							<DetailRow
								label='Status'
								value={o.courier.status || '—'}
							/>
						</Panel>
					)}

					<Panel title='Details'>
						<DetailRow
							label='Origin'
							value={CHANNEL[o.channel] || o.channel}
						/>
						<DetailRow
							label='Outlet'
							value={d.outlet?.name || '—'}
						/>
						<DetailRow
							label='Sold by'
							value={o.cashier || '—'}
						/>
						{o.completedAt && (
							<DetailRow
								label='Completed'
								value={dateTime(o.completedAt)}
							/>
						)}
						{o.note && (
							<DetailRow
								label='Note'
								value={<Text whiteSpace='pre-line'>{o.note}</Text>}
							/>
						)}
					</Panel>

					{!!d.extra?.length && (
						<Panel title='More details'>
							{d.extra.map(f => (
								<DetailRow
									key={f.key}
									label={f.label}
									value={showValue(f.value)}
								/>
							))}
						</Panel>
					)}
				</Flex>
			</Grid>

			{setup && (
				<PayDialog
					open={payOpen}
					onClose={() => setPayOpen(false)}
					total={balance}
					currency={store.answers.store.currency}
					tenders={setup.tenders}
					credit={d.customer ? Number(d.customer.storeCredit) || 0 : null}
					busy={paying.isLoading}
					onPay={onPay}
				/>
			)}
			<PromptDialog
				open={cancelOpen}
				onClose={() => setCancelOpen(false)}
				onConfirm={onCancel}
				tone='danger'
				title={`Cancel order ${o.code}?`}
				description='Its stock goes back to the outlet and what was paid is refunded the way it came. This can’t be undone.'
				confirmLabel='Cancel order'
				cancelLabel='Keep it'
				loading={cancelling.isLoading}>
				<Textarea
					mt={3}
					size='sm'
					placeholder='Why? (optional — kept in the order’s note)'
					value={reason}
					onChange={e => setReason(e.target.value)}
				/>
			</PromptDialog>
		</Box>
	);
};

export default OrderPage;
