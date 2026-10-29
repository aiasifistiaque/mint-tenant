'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Checkbox, Flex, Input, Text, Textarea } from '@chakra-ui/react';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton } from '../..';
import { Button } from '@chakra-ui/react';
import { Dropdown } from '../../cl';
import { moneyFor } from '../pos/receipt';

/**
 * Taking items back (backend docs/ecommerce EC-08): how many of each line, why,
 * whether it's fit to sell again (it goes back to the outlet's stock), and how
 * the refund is given. The store works the refund out and never gives back more
 * than was paid.
 */

type Line = { name: string; quantity: number; returned?: number; unitPrice?: number; total?: number };
type Row = { qty: string; reason: string; damaged: boolean };

const REASONS = [
	{ value: 'changed-mind', label: 'Changed their mind' },
	{ value: 'wrong-size', label: 'Wrong size / not right' },
	{ value: 'damaged', label: 'Arrived damaged' },
	{ value: 'not-as-described', label: 'Not as described' },
	{ value: 'other', label: 'Something else' },
];

export const ReturnDialog: FC<{
	open: boolean;
	onClose: () => void;
	items: Line[];
	currency: string;
	paid: number;
	methods: string[];
	busy: boolean;
	onReturn: (body: { lines: { line: number; quantity: number; reason: string; condition: string; restock: boolean }[]; refundMethod: string; note?: string }) => void;
}> = ({ open, onClose, items, currency, paid, methods, busy, onReturn }) => {
	const m = moneyFor(currency);
	const [rows, setRows] = useState<Record<number, Row>>({});
	const [refundMethod, setRefundMethod] = useState('original');
	const [note, setNote] = useState('');
	useEffect(() => {
		if (open) {
			setRows({});
			setRefundMethod(methods.includes('original') ? 'original' : methods[0] || 'cash');
			setNote('');
		}
	}, [open]);
	const left = (it: Line) => Math.max(0, (Number(it.quantity) || 0) - (Number(it.returned) || 0));
	const row = (i: number): Row => rows[i] || { qty: '', reason: 'changed-mind', damaged: false };
	const set = (i: number, patch: Partial<Row>) => setRows(r => ({ ...r, [i]: { ...row(i), ...patch } }));
	const chosen = items.map((it, i) => ({ it, i, q: Math.min(left(it), Math.max(0, Math.floor(Number(row(i).qty) || 0))) })).filter(x => x.q > 0);
	const worth = chosen.reduce((s, x) => s + x.q * ((Number(x.it.total) || 0) / Math.max(1, Number(x.it.quantity) || 1)), 0);
	const refund = Math.min(worth, Math.max(0, paid));
	const labels: Record<string, string> = { original: 'The way it was paid', cash: 'Cash', 'store-credit': 'Store credit' };

	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='lg'
			forceModal>
			<DialogHeader description='Choose what is coming back. What is fit to sell again goes back into stock.'>Return items</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<Flex
					direction='column'
					gap={3}>
					{items.map((it, i) =>
						left(it) > 0 ? (
							<Box
								key={i}
								borderWidth='1px'
								borderRadius='md'
								p={3}>
								<Flex
									justify='space-between'
									gap={3}
									align='center'>
									<Box minW={0}>
										<Text
											fontWeight='600'
											fontSize='14px'>
											{it.name}
										</Text>
										<Text
											fontSize='12px'
											color='fg.muted'>
											{left(it)} of {it.quantity} can come back · {m((Number(it.total) || 0) / Math.max(1, Number(it.quantity) || 1))} each
										</Text>
									</Box>
									<Input
										w='80px'
										size='sm'
										type='number'
										min={0}
										max={left(it)}
										placeholder='0'
										value={row(i).qty}
										onChange={e => set(i, { qty: e.target.value })}
									/>
								</Flex>
								{Number(row(i).qty) > 0 && (
									<Flex
										gap={3}
										mt={3}
										wrap='wrap'
										align='center'>
										<Box w='220px'>
											<Dropdown
												size='sm'
												value={row(i).reason}
												onChange={v => set(i, { reason: v })}
												items={REASONS}
											/>
										</Box>
										<Checkbox.Root
											checked={row(i).damaged}
											onCheckedChange={e => set(i, { damaged: !!e.checked })}>
											<Checkbox.HiddenInput />
											<Checkbox.Control />
											<Checkbox.Label>Damaged — don’t put back in stock</Checkbox.Label>
										</Checkbox.Root>
									</Flex>
								)}
							</Box>
						) : null
					)}
				</Flex>
				<Flex
					mt={4}
					gap={3}
					align='center'
					wrap='wrap'>
					<Text
						fontSize='14px'
						fontWeight='500'>
						Refund
					</Text>
					<Box w='240px'>
						<Dropdown
							size='sm'
							value={refundMethod}
							onChange={setRefundMethod}
							items={methods.map(v => ({ value: v, label: labels[v] || v }))}
						/>
					</Box>
					<Text
						fontSize='14px'
						color='fg.muted'>
						{chosen.length ? (refund > 0 ? `${m(refund)} goes back` : 'Nothing was paid yet — the order just owes less') : 'Pick items above'}
					</Text>
				</Flex>
				<Textarea
					mt={3}
					size='sm'
					placeholder='Note (optional)'
					value={note}
					onChange={e => setNote(e.target.value)}
				/>
			</DialogBody>
			<DialogFooter>
				<DiscardButton onClick={onClose}>Cancel</DiscardButton>
				<Button
					loading={busy}
					disabled={!chosen.length}
					onClick={() =>
						onReturn({
							lines: chosen.map(x => ({ line: x.i, quantity: x.q, reason: row(x.i).reason, condition: row(x.i).damaged ? 'damaged' : 'sellable', restock: !row(x.i).damaged })),
							refundMethod,
							note: note.trim() || undefined,
						})
					}>
					Return {chosen.reduce((s, x) => s + x.q, 0) || ''} item{chosen.reduce((s, x) => s + x.q, 0) === 1 ? '' : 's'}
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

export default ReturnDialog;
