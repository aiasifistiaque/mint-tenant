'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Field, Flex, Heading, Input, SegmentGroup, Skeleton, Text } from '@chakra-ui/react';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton } from '../..';
import { styles } from '../../config';
import { DetailRow, Panel } from '../../cl';
import { toaster } from '@/components/ui/toaster';
import { useCloseStoreShiftMutation, useGetStoreShiftQuery, useOpenStoreShiftMutation, useStoreShiftCashMutation } from '../../store/services/commerceApi';
import { help } from '../sections';
import { moneyFor } from './receipt';

/**
 * A register's shift on the POS (backend docs/ecommerce EC13): opened with the
 * cash in the drawer before the first sale, cash taken in or out during it,
 * closed with a count — the store works out what should be there.
 */

const errorText = (r: any) => r?.error?.data?.message || 'Something went wrong — try again.';

export const OpenShift: FC<{ register: { _id: string; name: string }; currency: string }> = ({ register, currency }) => {
	const [float, setFloat] = useState('');
	const [open, opening] = useOpenStoreShiftMutation();
	const submit = async () => {
		const res: any = await open({ register: register._id, openingFloat: Number(float) || 0 });
		if ('error' in res) toaster.create({ type: 'error', title: errorText(res) });
	};
	return (
		<Flex
			flex={1}
			align='center'
			justify='center'
			p={4}>
			<Panel
				w='full'
				maxW='380px'>
				<Heading
					size='md'
					mb={1}>
					Open a shift on {register.name}
				</Heading>
				<Text {...help}>Count the cash in the drawer before the first sale. It’s checked against what the shift takes when you close it.</Text>
				<Field.Root mt={4}>
					<Field.Label fontSize='13px'>Cash in the drawer ({currency})</Field.Label>
					<Input
						size='sm'
						type='number'
						min={0}
						autoFocus
						value={float}
						placeholder='0'
						onChange={e => setFloat(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && submit()}
					/>
				</Field.Root>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					mt={4}
					w='full'
					loading={opening.isLoading}
					onClick={submit}>
					Open shift
				</Button>
			</Panel>
		</Flex>
	);
};

/** The open shift: what it has taken, cash in / out, and closing it with a count. */
export const ShiftDialog: FC<{ open: boolean; onClose: () => void; shiftId: string; currency: string }> = ({ open, onClose, shiftId, currency }) => {
	const m = moneyFor(currency);
	const { data, isLoading } = useGetStoreShiftQuery(shiftId, { skip: !open });
	const [mode, setMode] = useState<'summary' | 'cash' | 'close'>('summary');
	const [type, setType] = useState<'in' | 'out'>('out');
	const [amount, setAmount] = useState('');
	const [reason, setReason] = useState('');
	const [counted, setCounted] = useState('');
	const [cash, cashing] = useStoreShiftCashMutation();
	const [close, closing] = useCloseStoreShiftMutation();
	const [closed, setClosed] = useState<{ expected: number; counted: number; difference: number } | null>(null);
	useEffect(() => {
		if (open) {
			setMode('summary');
			setAmount('');
			setReason('');
			setCounted('');
			setClosed(null);
		}
	}, [open]);

	const submitCash = async () => {
		if (!(Number(amount) > 0)) return;
		const res: any = await cash({ id: shiftId, type, amount: Number(amount), reason });
		if ('error' in res) return toaster.create({ type: 'error', title: errorText(res) });
		toaster.create({ type: 'success', title: `Cash ${type}: ${m(Number(amount))}` });
		setMode('summary');
		setAmount('');
		setReason('');
	};
	const submitClose = async () => {
		if (counted === '' || !(Number(counted) >= 0)) return;
		const res: any = await close({ id: shiftId, countedCash: Number(counted) });
		if ('error' in res) return toaster.create({ type: 'error', title: errorText(res) });
		const s = res.data.shift;
		setClosed({ expected: s.expectedCash, counted: s.countedCash, difference: s.difference });
	};
	const finish = () => {
		setClosed(null);
		onClose();
	};

	const s = data;
	return (
		<Dialog
			isOpen={open}
			onClose={closed ? finish : onClose}
			size='sm'
			forceModal>
			<DialogHeader description={s ? `Opened by ${s.shift.openedBy} at ${new Date(s.shift.openedAt).toLocaleTimeString()}` : undefined}>
				{closed ? 'Shift closed' : mode === 'close' ? 'Close the shift' : mode === 'cash' ? 'Cash in or out' : 'This shift'}
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				{isLoading || !s ? (
					<Skeleton h='140px' />
				) : closed ? (
					<Box>
						<DetailRow label='Expected in the drawer' value={m(closed.expected)} />
						<DetailRow label='Counted' value={m(closed.counted)} />
						<DetailRow
							label={closed.difference < 0 ? 'Short' : closed.difference > 0 ? 'Over' : 'Difference'}
							value={
								<Text
									fontWeight='600'
									color={closed.difference < 0 ? 'red.fg' : closed.difference > 0 ? 'orange.fg' : 'green.fg'}>
									{closed.difference ? m(Math.abs(closed.difference)) : 'None — it adds up'}
								</Text>
							}
						/>
					</Box>
				) : mode === 'cash' ? (
					<Flex
						direction='column'
						gap={3}>
						<SegmentGroup.Root
							size='sm'
							value={type}
							onValueChange={d => setType((d.value as any) || 'out')}
							w='fit-content'>
							<SegmentGroup.Indicator />
							<SegmentGroup.Items
								items={[
									{ value: 'out', label: 'Take cash out' },
									{ value: 'in', label: 'Put cash in' },
								]}
							/>
						</SegmentGroup.Root>
						<Field.Root>
							<Field.Label fontSize='13px'>How much ({currency})</Field.Label>
							<Input
								size='sm'
								type='number'
								min={0}
								autoFocus
								value={amount}
								onChange={e => setAmount(e.target.value)}
							/>
						</Field.Root>
						<Field.Root>
							<Field.Label fontSize='13px'>Why</Field.Label>
							<Input
								size='sm'
								value={reason}
								placeholder={type === 'out' ? 'Paid the delivery man, bank drop…' : 'More change from the safe…'}
								onChange={e => setReason(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && submitCash()}
							/>
						</Field.Root>
					</Flex>
				) : mode === 'close' ? (
					<Flex
						direction='column'
						gap={2}>
						<Text {...help}>Count the cash in the drawer. You’ll see if it’s over or short; the totals are kept on the shift.</Text>
						<Field.Root mt={2}>
							<Field.Label fontSize='13px'>Cash counted ({currency})</Field.Label>
							<Input
								size='sm'
								type='number'
								min={0}
								autoFocus
								value={counted}
								onChange={e => setCounted(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && submitClose()}
							/>
						</Field.Root>
					</Flex>
				) : (
					<Box>
						<DetailRow label='Opening cash' value={m(s.shift.openingFloat)} />
						{s.totals.map(t => (
							<DetailRow
								key={t.method}
								label={t.label}
								value={`${m(t.sales)}${t.refunds ? ` (−${m(t.refunds)} refunded)` : ''}`}
							/>
						))}
						{!!s.cashIn && <DetailRow label='Cash put in' value={m(s.cashIn)} />}
						{!!s.cashOut && <DetailRow label='Cash taken out' value={m(s.cashOut)} />}
						<DetailRow
							label='Should be in the drawer'
							value={<Text fontWeight='600'>{m(s.expectedCash)}</Text>}
						/>
						<DetailRow label='Sales' value={s.sales} />
					</Box>
				)}
			</DialogBody>
			<DialogFooter>
				{closed ? (
					<Button
						{...(styles.MODAL_BUTTON as any)}
						onClick={finish}>
						Done
					</Button>
				) : mode === 'summary' ? (
					<>
						<DiscardButton onClick={() => setMode('cash')}>Cash in / out</DiscardButton>
						<Button
							{...(styles.MODAL_BUTTON as any)}
							onClick={() => setMode('close')}>
							Close shift
						</Button>
					</>
				) : (
					<>
						<DiscardButton onClick={() => setMode('summary')}>Back</DiscardButton>
						<Button
							{...(styles.MODAL_BUTTON as any)}
							loading={cashing.isLoading || closing.isLoading}
							onClick={mode === 'cash' ? submitCash : submitClose}>
							{mode === 'cash' ? 'Save' : 'Close shift'}
						</Button>
					</>
				)}
			</DialogFooter>
		</Dialog>
	);
};
