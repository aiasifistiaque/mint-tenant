'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton } from '../..';
import { styles } from '../../config';
import type { StorePaymentInput, StoreTender } from '../../store/services/commerceApi';
import { help } from '../sections';
import { moneyFor } from './receipt';

/**
 * Taking the money (backend docs/ecommerce EC9): one or more ways to pay; cash
 * takes what's handed over and gives change, the rest can't be more than
 * what's left. The store checks it all again when the sale goes through.
 */

type Row = { method: string; label: string; cash: boolean; amount: string; reference: string };

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;

export const PayDialog: FC<{
	open: boolean;
	onClose: () => void;
	total: number;
	currency: string;
	tenders: StoreTender[];
	/** The customer's store credit, when there's a customer. */
	credit: number | null;
	busy: boolean;
	onPay: (payments: StorePaymentInput[]) => void;
}> = ({ open, onClose, total, currency, tenders, credit, busy, onPay }) => {
	const m = moneyFor(currency);
	const [rows, setRows] = useState<Row[]>([]);
	const usable = tenders.filter(t => t.id !== 'store-credit' || (credit ?? 0) > 0);
	const num = (s: string) => (Number.isFinite(Number(s)) ? Number(s) : 0);
	const others = (except: number) => rows.reduce((s, r, i) => (i === except ? s : s + num(r.amount)), 0);
	const paying = rows.reduce((s, r) => s + num(r.amount), 0);
	const nonCash = rows.filter(r => !r.cash).reduce((s, r) => s + num(r.amount), 0);
	const left = Math.max(0, +(total - paying).toFixed(2));
	const change = rows.some(r => r.cash) ? Math.max(0, +(paying - total).toFixed(2)) : 0;
	const tooMuch = nonCash > total + 0.001 || rows.some(r => r.method === 'store-credit' && num(r.amount) > (credit ?? 0));
	const ready = rows.length > 0 && paying + 0.001 >= total && !tooMuch;

	const add = (t: StoreTender) => {
		const rest = Math.max(0, +(total - paying).toFixed(2));
		const amount = t.id === 'store-credit' ? Math.min(rest, credit ?? 0) : rest;
		setRows(rs => [...rs, { method: t.id, label: t.label, cash: !!t.cash, amount: amount ? String(amount) : '', reference: '' }]);
	};
	useEffect(() => {
		if (!open) return;
		// One way to pay: start with it, for the whole amount.
		const first = usable.find(t => t.cash) || usable[0];
		setRows(first ? [{ method: first.id, label: first.label, cash: !!first.cash, amount: String(total), reference: '' }] : []);
	}, [open]);

	const set = (i: number, patch: Partial<Row>) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
	const submit = () => ready && !busy && onPay(rows.filter(r => num(r.amount) > 0).map(r => ({ method: r.method, amount: num(r.amount), ...(r.cash ? { tendered: num(r.amount) } : { reference: r.reference.trim() }) })));

	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='md'
			forceModal>
			<DialogHeader description='Add each way the customer pays. Cash can be more than what’s due — the change is worked out.'>Pay {m(total)}</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<Flex
					gap={2}
					wrap='wrap'
					mb={4}>
					{usable.map(t => (
						<Button
							key={t.id}
							size='sm'
							variant='outline'
							onClick={() => add(t)}>
							+ {t.label}
							{t.id === 'store-credit' && credit !== null ? ` (${m(credit)})` : ''}
						</Button>
					))}
				</Flex>
				<Flex
					direction='column'
					gap={3}>
					{rows.map((r, i) => {
						const due = Math.max(0, +(total - others(i)).toFixed(2));
						return (
							<Box
								key={i}
								borderWidth='1px'
								borderColor='border'
								borderRadius='md'
								p={3}>
								<Flex
									align='center'
									justify='space-between'
									mb={2}>
									<Text
										fontWeight='600'
										fontSize='14px'>
										{r.label}
									</Text>
									<IconButton
										aria-label={`Remove ${r.label}`}
										size='xs'
										variant='ghost'
										onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}>
										<X size={14} />
									</IconButton>
								</Flex>
								<Flex
									gap={2}
									align='center'>
									<Input
										size='sm'
										type='number'
										min={0}
										aria-label={r.cash ? 'Cash handed over' : `${r.label} amount`}
										value={r.amount}
										autoFocus={i === rows.length - 1}
										onChange={e => set(i, { amount: e.target.value })}
										onKeyDown={e => e.key === 'Enter' && submit()}
									/>
									{!r.cash && (
										<Input
											size='sm'
											aria-label={`${r.label} reference`}
											placeholder={r.method === 'store-credit' ? 'Note (optional)' : 'Reference (slip, transaction id)'}
											value={r.reference}
											onChange={e => set(i, { reference: e.target.value })}
										/>
									)}
								</Flex>
								{r.cash && (
									<Flex
										gap={1.5}
										mt={2}
										wrap='wrap'>
										{[...new Set([due, roundUp(due, 10), roundUp(due, 100), roundUp(due, 500), roundUp(due, 1000)])]
											.filter(x => x > 0)
											.slice(0, 4)
											.map(x => (
												<Button
													key={x}
													size='xs'
													variant='subtle'
													onClick={() => set(i, { amount: String(x) })}>
													{x === due ? 'Exact' : m(x)}
												</Button>
											))}
									</Flex>
								)}
							</Box>
						);
					})}
				</Flex>
				<Box
					mt={4}
					fontSize='14px'>
					<Flex justify='space-between'>
						<Text color='fg.muted'>Paying</Text>
						<Text>{m(paying)}</Text>
					</Flex>
					{left > 0 && (
						<Flex justify='space-between'>
							<Text color='fg.muted'>Still to pay</Text>
							<Text color='red.fg'>{m(left)}</Text>
						</Flex>
					)}
					{change > 0 && (
						<Flex justify='space-between'>
							<Text fontWeight='600'>Change to give</Text>
							<Text fontWeight='600'>{m(change)}</Text>
						</Flex>
					)}
					{tooMuch && (
						<Text
							{...help}
							color='red.fg'>
							Only cash can be more than what’s due{credit !== null ? ', and store credit can’t be more than the customer has' : ''}.
						</Text>
					)}
				</Box>
			</DialogBody>
			<DialogFooter>
				<DiscardButton onClick={onClose}>Back</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					disabled={!ready}
					loading={busy}
					onClick={submit}>
					{change > 0 ? `Done — give ${m(change)} change` : 'Done'}
				</Button>
			</DialogFooter>
		</Dialog>
	);
};
