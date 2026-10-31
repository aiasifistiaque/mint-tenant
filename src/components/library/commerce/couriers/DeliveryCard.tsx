'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Input, Link, Text, Textarea } from '@chakra-ui/react';
import { Ban, PackageCheck, Printer, RefreshCw, Send, Undo2, Wallet } from 'lucide-react';
import { CopyValue, DetailRow, Dropdown, Panel, dateTime } from '../../cl';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton, PromptDialog } from '../..';
import GuideLink from '../../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import {
	useCancelStoreDeliveryMutation,
	useMoveStoreDeliveryMutation,
	useReceiveStoreDeliveryMutation,
	useRefreshStoreDeliveryMutation,
	useSettleStoreDeliveriesMutation,
} from '../../store/services/courierApi';
import type { StoreDelivery } from '../../store/services/courierApi';
import { moneyFor, printReceipt } from '../pos/receipt';
import { DeliveryBadge, ENDED, labelHtml } from './common';

/**
 * The order's delivery (backend docs/couriers CR-07): its current parcel —
 * courier, status, tracking, cash, the courier's timeline — and what can be
 * done with it: ask the courier (Refresh; also when the page opens), cancel,
 * print the label, move a manual courier's parcel on, take a returned parcel
 * back in, mark it paid out. Earlier parcels are listed under it.
 */

const errText = (e: any) => e?.data?.message || e?.message || 'Something went wrong';
const MOVES = [
	{ value: 'picked-up', label: 'Picked up' },
	{ value: 'in-transit', label: 'On the way' },
	{ value: 'out-for-delivery', label: 'Out for delivery' },
	{ value: 'delivered', label: 'Delivered' },
	{ value: 'partly-delivered', label: 'Partly delivered' },
	{ value: 'on-hold', label: 'On hold' },
	{ value: 'failed-attempt', label: 'Delivery attempt failed' },
	{ value: 'returning', label: 'Coming back' },
	{ value: 'returned', label: 'Returned' },
	{ value: 'lost', label: 'Lost' },
];
const FROM: Record<string, string> = { webhook: 'courier', sync: 'check', staff: '' };

type Item = { name: string; quantity: number; returned?: number };

export const DeliveryCard: FC<{
	deliveries: StoreDelivery[];
	items: Item[];
	currency: string;
	shop: string;
	orderCode: string;
	routes: string[];
	onSend: () => void;
	canSend: boolean;
}> = ({ deliveries, items, currency, shop, orderCode, routes, onSend, canSend }) => {
	const m = moneyFor(currency);
	const d = deliveries[0];
	const [refresh, refreshing] = useRefreshStoreDeliveryMutation();
	const [cancel, cancelling] = useCancelStoreDeliveryMutation();
	const [move, moving] = useMoveStoreDeliveryMutation();
	const [receive, receiving] = useReceiveStoreDeliveryMutation();
	const [settle, settling] = useSettleStoreDeliveriesMutation();
	const [dialog, setDialog] = useState<'' | 'cancel' | 'move' | 'receive' | 'settle'>('');
	const [reason, setReason] = useState('');
	const [to, setTo] = useState('picked-up');
	const [collected, setCollected] = useState('');
	const [note, setNote] = useState('');
	const [ref, setRef] = useState('');
	const [back, setBack] = useState<Record<number, { qty: string; damaged: boolean }>>({});

	const open = !!d && !ENDED.includes(d.status) && d.status !== 'error';
	const asksCourier = !!d?.consignment && d.courier !== 'manual';
	// Opening the order asks the courier where its parcel is, at most once a minute (CR12).
	const asked = useRef('');
	useEffect(() => {
		if (!d || !open || !asksCourier || asked.current === d._id) return;
		asked.current = d._id;
		if (!d.lastSyncedAt || Date.now() - new Date(d.lastSyncedAt).getTime() > 60000) refresh({ id: d._id, routes }).catch(() => undefined);
	}, [d?._id]);

	const run = async (p: Promise<any>, ok: string) => {
		try {
			await p;
			toaster.success({ title: ok });
			setDialog('');
			return true;
		} catch (e) {
			toaster.error({ title: errText(e) });
			return false;
		}
	};

	if (!d)
		return canSend ? (
			<Panel
				id='store-delivery-card'
				title='Courier'
				actions={<GuideLink section='store-delivery-card' />}>
				<Text
					fontSize='14px'
					color='fg.muted'
					mb={3}>
					Not sent to a courier yet.
				</Text>
				<Button
					size='sm'
					onClick={onSend}>
					<Send size={14} /> Send to courier
				</Button>
			</Panel>
		) : null;

	const left = (it: Item) => Math.max(0, (Number(it.quantity) || 0) - (Number(it.returned) || 0));
	const backLines = items.map((it, i) => ({ i, q: Math.min(left(it), Math.max(0, Math.floor(Number(back[i]?.qty) || 0))), damaged: !!back[i]?.damaged })).filter(x => x.q > 0);
	const canReceive = ['returning', 'returned', 'partly-delivered'].includes(d.status) && !d.events.some(e => e.courierStatus === 'received-back');
	const canSettle = ['delivered', 'partly-delivered'].includes(d.status) && !d.settled && ['redx', 'manual'].includes(d.courier);
	const print = () => printReceipt(labelHtml(d, { shop, orderCode, money: m }));

	return (
		<Panel
			id='store-delivery-card'
			title='Delivery'
			subtitle={`${d.courierName} · ${d.code}`}
			actions={<GuideLink section='store-delivery-card' />}>
			<Flex
				direction='column'
				gap={3}>
				<Flex
					gap={2}
					align='center'
					wrap='wrap'>
					<DeliveryBadge
						status={d.status}
						label={d.statusLabel}
					/>
					{d.settled && <DeliveryBadge status='delivered' label='Paid out' />}
				</Flex>
				{d.courierMessage && d.courierMessage !== d.statusLabel && <Text fontSize='13px'>{d.courierMessage}</Text>}
				{d.error && (
					<Text
						fontSize='13px'
						color='red.fg'>
						{d.error}
					</Text>
				)}
				<Box>
					{d.trackingCode && (
						<DetailRow
							label='Tracking'
							value={
								<Flex
									gap={2}
									align='center'
									wrap='wrap'>
									<CopyValue value={d.trackingCode} />
									{d.trackingUrl && (
										<Link
											href={d.trackingUrl}
											target='_blank'
											rel='noreferrer'
											color='blue.fg'
											fontSize='13px'>
											Track ↗
										</Link>
									)}
								</Flex>
							}
						/>
					)}
					<DetailRow
						label='Cash to collect'
						value={m(d.cod)}
					/>
					{Number(d.collected) > 0 && (
						<DetailRow
							label='Collected'
							value={m(d.collected)}
						/>
					)}
					{Number(d.charge) > 0 && (
						<DetailRow
							label='Delivery charge'
							value={m(d.charge)}
						/>
					)}
					{d.payoutRef && (
						<DetailRow
							label='Paid out'
							value={d.payoutRef}
						/>
					)}
				</Box>

				<Flex
					gap={2}
					wrap='wrap'>
					{asksCourier && !ENDED.includes(d.status) && (
						<Button
							size='xs'
							variant='outline'
							loading={refreshing.isLoading}
							onClick={() => run(refresh({ id: d._id, routes }).unwrap(), 'Asked the courier')}>
							<RefreshCw size={13} /> Refresh
						</Button>
					)}
					{d.courier === 'manual' && !['returned', 'cancelled', 'lost'].includes(d.status) && (
						<Button
							size='xs'
							variant='outline'
							onClick={() => setDialog('move')}>
							<PackageCheck size={13} /> Update status
						</Button>
					)}
					{(d.consignment || d.trackingCode) && (
						<Button
							size='xs'
							variant='outline'
							onClick={print}>
							<Printer size={13} /> Label
						</Button>
					)}
					{canReceive && (
						<Button
							size='xs'
							variant='outline'
							onClick={() => setDialog('receive')}>
							<Undo2 size={13} /> Receive returned parcel
						</Button>
					)}
					{canSettle && (
						<Button
							size='xs'
							variant='outline'
							onClick={() => setDialog('settle')}>
							<Wallet size={13} /> Mark paid out
						</Button>
					)}
					{(open || d.status === 'error' || d.status === 'booking') && (
						<Button
							size='xs'
							variant='ghost'
							colorPalette='red'
							onClick={() => setDialog('cancel')}>
							<Ban size={13} /> Cancel
						</Button>
					)}
					{canSend && (
						<Button
							size='xs'
							onClick={onSend}>
							<Send size={13} /> {d.status === 'error' ? 'Try again' : 'Send again'}
						</Button>
					)}
				</Flex>

				<Box
					borderTopWidth='1px'
					pt={3}>
					<Text
						fontSize='13px'
						fontWeight='600'
						mb={2}>
						Timeline
					</Text>
					<Flex
						direction='column'
						gap={2}>
						{[...d.events].reverse().map((e, i) => (
							<Box
								key={i}
								fontSize='13px'>
								<Text>{e.message || e.courierStatus || e.status}</Text>
								<Text
									fontSize='12px'
									color='fg.muted'>
									{[dateTime(e.at), e.by || FROM[e.source]].filter(Boolean).join(' · ')}
								</Text>
							</Box>
						))}
					</Flex>
				</Box>
				{deliveries.length > 1 && (
					<Box
						borderTopWidth='1px'
						pt={3}>
						<Text
							fontSize='13px'
							fontWeight='600'
							mb={2}>
							Earlier
						</Text>
						{deliveries.slice(1).map(x => (
							<Flex
								key={x._id}
								justify='space-between'
								fontSize='13px'
								py={1}
								gap={2}>
								<Text>
									{x.code} · {x.courierName}
								</Text>
								<DeliveryBadge
									status={x.status}
									label={x.statusLabel}
								/>
							</Flex>
						))}
					</Box>
				)}
			</Flex>

			<PromptDialog
				open={dialog === 'cancel'}
				onClose={() => setDialog('')}
				onConfirm={() => run(cancel({ id: d._id, reason: reason.trim() || undefined, routes }).unwrap(), d.consignment ? `${d.courierName} is asked to stop it` : 'Cancelled')}
				tone='danger'
				title={`Cancel ${d.code}?`}
				description={
					!d.consignment
						? 'It was never booked with the courier — it’s just marked cancelled here.'
						: d.courier === 'steadfast'
						? 'Steadfast is asked to bring it back (a return request). The status changes when Steadfast confirms.'
						: d.courier === 'pathao'
						? 'Pathao can’t be cancelled from Mint — cancel it in the Pathao panel, then press Refresh.'
						: `${d.courierName} is asked to cancel it. The status changes when ${d.courierName} confirms.`
				}
				confirmLabel='Cancel it'
				cancelLabel='Keep it'
				loading={cancelling.isLoading}>
				<Textarea
					mt={3}
					size='sm'
					placeholder='Why? (sent to the courier)'
					value={reason}
					onChange={e => setReason(e.target.value)}
				/>
			</PromptDialog>

			<PromptDialog
				open={dialog === 'settle'}
				onClose={() => setDialog('')}
				onConfirm={() => run(settle({ deliveries: [d._id], ref: ref.trim() || undefined, routes }).unwrap(), 'Marked paid out')}
				tone='default'
				title={`${d.courierName} paid out ${d.code}?`}
				description='Mark it once the courier has paid this parcel’s cash to you. It leaves “Cash with couriers”.'
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

			<Dialog
				isOpen={dialog === 'move'}
				onClose={() => setDialog('')}
				size='md'
				forceModal>
				<DialogHeader description={`${d.courierName} has no API — move the parcel on as they tell you. The order follows.`}>Update status</DialogHeader>
				<DialogCloseButton />
				<DialogBody>
					<Flex
						direction='column'
						gap={3}>
						<Dropdown
							size='sm'
							value={to}
							onChange={setTo}
							items={MOVES}
						/>
						{(to === 'delivered' || to === 'partly-delivered') && (
							<Box>
								<Text
									fontSize='13px'
									mb={1}>
									Cash collected
								</Text>
								<Input
									size='sm'
									type='number'
									min={0}
									placeholder={String(d.cod)}
									value={collected}
									onChange={e => setCollected(e.target.value)}
								/>
							</Box>
						)}
						<Textarea
							size='sm'
							placeholder='Note (optional)'
							value={note}
							onChange={e => setNote(e.target.value)}
						/>
					</Flex>
				</DialogBody>
				<DialogFooter>
					<DiscardButton onClick={() => setDialog('')}>Cancel</DiscardButton>
					<Button
						loading={moving.isLoading}
						onClick={() =>
							run(move({ id: d._id, to, ...(collected !== '' && { collected: Number(collected) }), note: note.trim() || undefined, routes }).unwrap(), 'Status updated').then(ok => ok && (setNote(''), setCollected('')))
						}>
						Update
					</Button>
				</DialogFooter>
			</Dialog>

			<Dialog
				isOpen={dialog === 'receive'}
				onClose={() => setDialog('')}
				size='md'
				forceModal>
				<DialogHeader description={Number(d.cod) > 0 ? 'What came back goes into stock (unless damaged). Nothing is refunded — it was never paid.' : 'What came back goes into stock (unless damaged), and the order is refunded for it.'}>
					Receive returned parcel
				</DialogHeader>
				<DialogCloseButton />
				<DialogBody>
					<Flex
						direction='column'
						gap={2}>
						{items.map((it, i) =>
							left(it) > 0 ? (
								<Flex
									key={i}
									gap={3}
									align='center'
									justify='space-between'
									borderWidth='1px'
									borderRadius='md'
									p={2}>
									<Box minW={0}>
										<Text
											fontSize='14px'
											fontWeight='500'>
											{it.name}
										</Text>
										<Text
											fontSize='12px'
											color='fg.muted'>
											{left(it)} can come back
										</Text>
									</Box>
									<Flex
										gap={2}
										align='center'>
										<Button
											size='xs'
											variant={back[i]?.damaged ? 'solid' : 'outline'}
											colorPalette={back[i]?.damaged ? 'red' : undefined}
											onClick={() => setBack(b => ({ ...b, [i]: { qty: b[i]?.qty || '', damaged: !b[i]?.damaged } }))}>
											Damaged
										</Button>
										<Input
											w='70px'
											size='sm'
											type='number'
											min={0}
											max={left(it)}
											placeholder='0'
											value={back[i]?.qty || ''}
											onChange={e => setBack(b => ({ ...b, [i]: { qty: e.target.value, damaged: !!b[i]?.damaged } }))}
										/>
									</Flex>
								</Flex>
							) : null
						)}
						<Button
							size='xs'
							variant='ghost'
							alignSelf='flex-start'
							onClick={() => setBack(Object.fromEntries(items.map((it, i) => [i, { qty: String(left(it)), damaged: false }])))}>
							All of it came back
						</Button>
					</Flex>
				</DialogBody>
				<DialogFooter>
					<DiscardButton onClick={() => setDialog('')}>Cancel</DiscardButton>
					<Button
						loading={receiving.isLoading}
						disabled={!backLines.length}
						onClick={() =>
							run(
								receive({ id: d._id, lines: backLines.map(x => ({ line: x.i, quantity: x.q, condition: x.damaged ? 'damaged' : 'sellable', restock: !x.damaged })), routes }).unwrap(),
								'Received back — stock updated'
							)
						}>
						Receive {backLines.reduce((s, x) => s + x.q, 0) || ''}
					</Button>
				</DialogFooter>
			</Dialog>
		</Panel>
	);
};

export default DeliveryCard;
