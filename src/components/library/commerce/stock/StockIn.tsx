'use client';

import { FC, useState } from 'react';
import { Box, Button, Field, Flex, IconButton, Input, Skeleton, Text, Textarea } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dropdown } from '../../cl';
import { VDataMenu, radius, useGetAllQuery } from '../..';
import { toaster } from '@/components/ui/toaster';
import { projectHref } from '../../config/lib/constants/panel';
import { useGetStoreProductStockQuery, useReceiveStoreStockMutation } from '../../store/services/commerceApi';

/**
 * Add stock (backend docs/ecommerce): items received into one outlet on a day.
 * Each line picks a product; a product with variations then asks which
 * variant (only that product's own), a simple product needs no more. Lines
 * add up as many as needed; the store records one Stock in entry and puts
 * every item into the outlet's stock.
 */

type Line = { key: number; product: string; variant: string; quantity: string };

const today = () => new Date().toISOString().slice(0, 10);
const errText = (e: any) => e?.data?.message || e?.message || 'Something went wrong';
let seq = 0;
const blank = (): Line => ({ key: ++seq, product: '', variant: '', quantity: '' });

const LineRow: FC<{ line: Line; outlet: string; index: number; onChange: (patch: Partial<Line>) => void; onRemove?: () => void }> = ({ line, outlet, index, onChange, onRemove }) => {
	const { data } = useGetStoreProductStockQuery(line.product, { skip: !line.product });
	// Only this product's own variants — and only when it has any (a simple product has just its default).
	const variants = (data?.variants || []).filter(v => !v.isDefault && v.active);
	const chosen = data?.variants.find(v => v._id === line.variant);
	const onHand = chosen?.stock?.[outlet]?.onHand ?? (!variants.length ? data?.variants.find(v => v.isDefault)?.stock?.[outlet]?.onHand : undefined);
	return (
		<Box
			borderWidth='1px'
			borderColor='border'
			borderRadius={radius.CONTAINER}
			bg='bg.panel'
			p={3}>
			<Flex
				justify='space-between'
				align='center'
				mb={2}>
				<Text
					fontSize='12px'
					fontWeight='600'
					color='fg.muted'>
					Item {index + 1}
				</Text>
				{onRemove && (
					<IconButton
						aria-label='Remove this item'
						size='xs'
						variant='ghost'
						onClick={onRemove}>
						<Trash2 size={14} />
					</IconButton>
				)}
			</Flex>
			<Flex
				direction='column'
				gap={3}>
				<VDataMenu
					label='Product'
					model='products'
					name='product'
					value={line.product}
					unselect={false}
					onChange={(e: any) => onChange({ product: e.target.value || '', variant: '' })}
				/>
				{!!line.product && variants.length > 0 && (
					<Field.Root>
						<Field.Label fontSize='13px'>Variant</Field.Label>
						<Dropdown
							size='sm'
							value={line.variant}
							placeholder='Choose a variant'
							onChange={v => onChange({ variant: v })}
							items={variants.map(v => ({ value: v._id, label: v.title }))}
						/>
					</Field.Root>
				)}
				<Field.Root>
					<Field.Label fontSize='13px'>Quantity</Field.Label>
					<Input
						size='sm'
						type='number'
						inputMode='numeric'
						min={1}
						step={1}
						placeholder='How many came in'
						value={line.quantity}
						onChange={e => onChange({ quantity: e.target.value })}
					/>
					{onHand !== undefined && (
						<Field.HelperText fontSize='12px'>
							{onHand} here now{Number(line.quantity) > 0 ? ` → ${onHand + Number(line.quantity)} after` : ''}
						</Field.HelperText>
					)}
				</Field.Root>
			</Flex>
		</Box>
	);
};

const StockIn: FC = () => {
	const router = useRouter();
	const { data: outlets, isLoading } = useGetAllQuery({ path: 'outlets', limit: '100', sort: 'name' });
	const [receive, receiving] = useReceiveStoreStockMutation();
	const [outlet, setOutlet] = useState('');
	const [date, setDate] = useState(today());
	const [note, setNote] = useState('');
	const [lines, setLines] = useState<Line[]>(() => [blank()]);
	const list: any[] = (outlets?.doc || []).filter((o: any) => o.active !== false);
	// The first outlet, until another is picked.
	const outletId = outlet || list[0]?._id || '';

	const patch = (key: number, p: Partial<Line>) => setLines(ls => ls.map(l => (l.key === key ? { ...l, ...p } : l)));
	const ready = !!outletId && !!date && lines.length > 0 && lines.every(l => l.product && Number(l.quantity) > 0 && Number.isInteger(Number(l.quantity)));

	const save = async () => {
		try {
			const r = await receive({ outlet: outletId, date, ...(note.trim() && { note: note.trim() }), lines: lines.map(l => ({ product: l.product, ...(l.variant && { variant: l.variant }), quantity: Number(l.quantity) })) }).unwrap();
			toaster.create({ type: 'success', title: `${r.units} unit${r.units === 1 ? '' : 's'} added — ${r.code}` });
			setLines([blank()]);
			setNote('');
			router.push(projectHref('/stock-in'));
		} catch (e) {
			toaster.error({ title: errText(e) });
		}
	};

	if (isLoading) return <Skeleton h='320px' />;
	return (
		<Flex
			direction='column'
			gap={4}
			w='full'
			maxW='760px'
			mx='auto'>
			<Box>
				<Text
					fontSize='18px'
					fontWeight='600'>
					Add stock
				</Text>
				<Text
					fontSize='13px'
					color='fg.muted'>
					Stock that came in — pick the outlet and the day, then each item and how many. It goes straight into the outlet’s stock.
				</Text>
			</Box>
			<Flex
				gap={3}
				direction={{ base: 'column', md: 'row' }}>
				<Field.Root flex={1}>
					<Field.Label fontSize='13px'>Outlet</Field.Label>
					<Dropdown
						size='sm'
						value={outletId}
						onChange={setOutlet}
						items={list.map((o: any) => ({ value: o._id, label: o.name }))}
					/>
				</Field.Root>
				<Field.Root flex={1}>
					<Field.Label fontSize='13px'>Stock-in date</Field.Label>
					<Input
						size='sm'
						type='date'
						max={today()}
						value={date}
						onChange={e => setDate(e.target.value)}
					/>
				</Field.Root>
			</Flex>
			{lines.map((l, i) => (
				<LineRow
					key={l.key}
					line={l}
					index={i}
					outlet={outletId}
					onChange={p => patch(l.key, p)}
					onRemove={lines.length > 1 ? () => setLines(ls => ls.filter(x => x.key !== l.key)) : undefined}
				/>
			))}
			<Button
				size='sm'
				variant='outline'
				alignSelf='flex-start'
				onClick={() => setLines(ls => [...ls, blank()])}>
				<Plus size={14} /> Add another item
			</Button>
			<Field.Root>
				<Field.Label fontSize='13px'>Note (optional)</Field.Label>
				<Textarea
					size='sm'
					rows={2}
					placeholder='Supplier, invoice number…'
					value={note}
					onChange={e => setNote(e.target.value)}
				/>
			</Field.Root>
			<Flex justify='flex-end'>
				<Button
					size='sm'
					disabled={!ready}
					loading={receiving.isLoading}
					onClick={save}>
					Add {lines.length > 1 ? `${lines.length} items to` : ''} stock
				</Button>
			</Flex>
		</Flex>
	);
};

export default StockIn;
