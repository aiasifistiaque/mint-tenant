'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, Input, Text, Textarea } from '@chakra-ui/react';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton } from '../..';
import { Dropdown } from '../../cl';
import GuideLink from '../../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useGetStoreSendPrefillQuery, useSendStoreOrdersMutation } from '../../store/services/courierApi';

/**
 * Send several orders at once (backend docs/couriers CR-12): one courier, each
 * order through the same checks as on its page. Steadfast books them in one
 * call; Pathao and RedX use the areas picked for each address before. What
 * didn't go stays selected with its reason.
 */
export const BulkSend: FC<{ open: boolean; onClose: () => void; orders: { _id: string; code: string }[]; routes: string[]; onDone: (failed: string[]) => void }> = ({ open, onClose, orders: picked, routes, onDone }) => {
	// The orders as they were when it opened: the table's selection changes once they're sent.
	const [orders, setOrders] = useState(picked);
	const { data } = useGetStoreSendPrefillQuery(orders[0]?._id || '', { skip: !open || !orders.length });
	const [sendMany, sending] = useSendStoreOrdersMutation();
	const [courier, setCourier] = useState('');
	const [weight, setWeight] = useState('');
	const [note, setNote] = useState('');
	const [results, setResults] = useState<{ order: string; ok: boolean; error?: string; delivery?: string }[] | null>(null);
	useEffect(() => {
		if (open) {
			setOrders(picked);
			setResults(null);
			setNote('');
			setWeight('');
		}
	}, [open]);
	useEffect(() => {
		if (data && !courier) setCourier(data.couriers.find(c => c.id !== 'manual')?.id || '');
	}, [data]);
	const list = (data?.couriers || []).filter(c => c.id !== 'manual');
	const code = (id: string) => orders.find(o => o._id === id)?.code || id.slice(-6);

	const submit = async () => {
		try {
			const r = await sendMany({ orders: orders.map(o => o._id), courier, ...(weight && { weight: Number(weight) }), ...(note.trim() && { note: note.trim() }), routes }).unwrap();
			setResults(r.results);
			toaster.create({ type: r.failed ? 'warning' : 'success', title: `${r.sent} sent${r.failed ? `, ${r.failed} not sent` : ''}` });
			onDone(r.results.filter(x => !x.ok).map(x => x.order));
		} catch (e: any) {
			toaster.error({ title: e?.data?.message || 'Couldn’t send them' });
		}
	};

	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='md'
			forceModal>
			<DialogHeader description='Each order is checked as on its own page; what can’t go stays selected with the reason.'>
				Send {orders.length} order{orders.length === 1 ? '' : 's'} to a courier
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				{results ? (
					<Flex
						direction='column'
						gap={1}
						fontSize='13px'>
						{results.map(x => (
							<Flex
								key={x.order}
								gap={2}
								justify='space-between'>
								<Text fontFamily='mono'>{code(x.order)}</Text>
								<Text
									color={x.ok ? 'green.fg' : 'red.fg'}
									textAlign='right'>
									{x.ok ? `Sent — ${x.delivery}` : x.error}
								</Text>
							</Flex>
						))}
					</Flex>
				) : !list.length ? (
					<Text fontSize='14px'>Connect a courier in Delivery settings first.</Text>
				) : (
					<Flex
						direction='column'
						gap={3}>
						<Box>
							<Text
								fontSize='13px'
								fontWeight='500'
								mb={1}>
								Courier
							</Text>
							<Dropdown
								size='sm'
								value={courier}
								onChange={setCourier}
								items={list.map(c => ({ value: c.id, label: c.name }))}
							/>
						</Box>
						<Box>
							<Text
								fontSize='13px'
								fontWeight='500'
								mb={1}>
								Weight (kg) — empty: each courier’s default
							</Text>
							<Input
								size='sm'
								type='number'
								min={0}
								step={0.1}
								value={weight}
								onChange={e => setWeight(e.target.value)}
							/>
						</Box>
						<Textarea
							size='sm'
							placeholder='Note to the courier, for every parcel (optional)'
							value={note}
							onChange={e => setNote(e.target.value)}
						/>
						<Text
							fontSize='12px'
							color='fg.muted'>
							Cash to collect is what each order still owes.{courier === 'redx' || courier === 'pathao' ? ' Orders from an address you haven’t sent to before need their area picked once — send those from their own page.' : ''}
						</Text>
					</Flex>
				)}
			</DialogBody>
			<DialogFooter>
				<GuideLink section='store-send-to-courier' />
				<DiscardButton onClick={onClose}>{results ? 'Close' : 'Cancel'}</DiscardButton>
				{!results && list.length > 0 && (
					<Button
						loading={sending.isLoading}
						disabled={!courier}
						onClick={submit}>
						Send {orders.length}
					</Button>
				)}
			</DialogFooter>
		</Dialog>
	);
};

export default BulkSend;
