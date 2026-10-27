'use client';

import { FC, useEffect, useState } from 'react';
import { Badge, Box, Button, Field, Flex, Input, SegmentGroup, Skeleton, Table, Text } from '@chakra-ui/react';
import { Layers, Search, Trash2 } from 'lucide-react';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton } from '..';
import { styles } from '../config';
import { EmptyState, Panel } from '../cl';
import { toaster } from '@/components/ui/toaster';
import { useUpdateByIdMutation } from '../store/services/commonApi';
import {
	useApplyStoreAdjustmentMutation,
	useGetStoreProductStockQuery,
	useLazyGetStoreCatalogueQuery,
	useSetStoreStockMutation,
	useStoreTransferActionMutation,
	useSyncStoreVariantsMutation,
} from '../store/services/commerceApi';
import type { CommerceView, StoreItem } from '../store/services/commerceApi';
import { help } from './sections';

/**
 * Stock in the panel (backend docs/ecommerce EC-05): a product's stock by
 * variant and outlet (counted or corrected per cell), the item picker the
 * store's pages share, and the item lines of a stock adjustment or transfer
 * with their actions — Apply, Send, Receive, Cancel. Stock itself only moves
 * through these; the plain forms show it read-only.
 */

const errorText = (r: any) => r?.error?.data?.message || 'Something went wrong — try again.';
const routesOf = (store: CommerceView, ...keys: string[]) => keys.map(k => store.installed[k]?.route).filter(Boolean) as string[];

/* ------------------------------------------------------- set stock dialog */

const SetStockDialog: FC<{
	open: boolean;
	onClose: () => void;
	store: CommerceView;
	variant: { _id: string; label: string };
	outlet: { _id: string; name: string };
	onHand: number;
}> = ({ open, onClose, store, variant, outlet, onHand }) => {
	const [mode, setMode] = useState<'count' | 'change'>('count');
	const [value, setValue] = useState('');
	const [note, setNote] = useState('');
	const [save, saving] = useSetStoreStockMutation();
	useEffect(() => {
		if (open) {
			setMode('count');
			setValue(String(onHand));
			setNote('');
		}
	}, [open]);
	const submit = async () => {
		const n = Number(value);
		if (value === '' || !Number.isFinite(n)) return;
		const res: any = await save({
			variant: variant._id,
			outlet: outlet._id,
			...(mode === 'count' ? { onHand: n, reason: onHand === 0 ? 'opening' : 'count' } : { change: n, reason: 'adjustment' }),
			note,
			routes: routesOf(store, 'product', 'variant', 'stock', 'movement'),
		});
		if ('error' in res) return toaster.create({ type: 'error', title: errorText(res) });
		toaster.create({ type: 'success', title: `${variant.label} at ${outlet.name}: ${res.data.after ?? onHand}` });
		onClose();
	};
	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='sm'
			forceModal>
			<DialogHeader description={`${outlet.name} has ${onHand}. Every change is kept in Stock movements.`}>{variant.label}</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<Flex
					direction='column'
					gap={3}>
					<SegmentGroup.Root
						size='sm'
						value={mode}
						onValueChange={d => {
							setMode((d.value as any) || 'count');
							setValue(d.value === 'count' ? String(onHand) : '');
						}}
						w='fit-content'>
						<SegmentGroup.Indicator />
						<SegmentGroup.Items
							items={[
								{ value: 'count', label: 'Counted' },
								{ value: 'change', label: 'Add or take away' },
							]}
						/>
					</SegmentGroup.Root>
					<Field.Root>
						<Field.Label fontSize='13px'>{mode === 'count' ? 'How many are there' : 'How many (− to take away)'}</Field.Label>
						<Input
							size='sm'
							type='number'
							autoFocus
							value={value}
							onChange={e => setValue(e.target.value)}
							onKeyDown={e => e.key === 'Enter' && submit()}
						/>
					</Field.Root>
					<Field.Root>
						<Field.Label fontSize='13px'>Note</Field.Label>
						<Input
							size='sm'
							value={note}
							placeholder='Opening stock, found in the back…'
							onChange={e => setNote(e.target.value)}
						/>
					</Field.Root>
				</Flex>
			</DialogBody>
			<DialogFooter>
				<DiscardButton onClick={onClose}>Cancel</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					loading={saving.isLoading}
					onClick={submit}>
					Save
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

/* -------------------------------------------------------- product stock */

/** A product's page: its variants × outlets, each figure clickable to count or correct it. */
export const ProductStock: FC<{ id: string; store: CommerceView }> = ({ id, store }) => {
	const { data, isLoading } = useGetStoreProductStockQuery(id);
	const [sync, syncing] = useSyncStoreVariantsMutation();
	const [cell, setCell] = useState<{ variant: { _id: string; label: string }; outlet: { _id: string; name: string }; onHand: number } | null>(null);
	const variations = store.answers.products.variations;
	if (isLoading || !data) return <Skeleton h='160px' />;
	const rows = data.variants;
	return (
		<Panel
			title='Stock by outlet'
			subtitle='Click a figure to count it or correct it. Sales, returns and transfers change it on their own.'
			actions={
				variations && (
					<Button
						size='xs'
						variant='outline'
						loading={syncing.isLoading}
						onClick={async () => {
							const res: any = await sync({ id, route: store.installed.product?.route || 'products' });
							toaster.create('error' in res ? { type: 'error', title: errorText(res) } : { type: 'success', title: 'Variants made from the options' });
						}}>
						<Layers size={13} />
						Make variants from options
					</Button>
				)
			}
			flush>
			{!rows.length ? (
				<EmptyState
					title='No variants yet'
					description={variations ? 'Add options (Size: S, M, L) to the product and save — or make them here.' : 'Save the product once and its item appears here.'}
				/>
			) : (
				<Box overflowX='auto'>
					<Table.Root size='sm'>
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeader>Item</Table.ColumnHeader>
								<Table.ColumnHeader>SKU</Table.ColumnHeader>
								{data.outlets.map(o => (
									<Table.ColumnHeader
										key={o._id}
										textAlign='end'>
										{o.name}
									</Table.ColumnHeader>
								))}
								<Table.ColumnHeader textAlign='end'>Total</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{rows.map(v => {
								const label = v.isDefault ? 'This product' : v.title;
								return (
									<Table.Row
										key={v._id}
										opacity={v.active ? 1 : 0.5}>
										<Table.Cell>
											<Flex
												align='center'
												gap={2}>
												{label}
												{!v.active && <Badge size='sm'>Not sold</Badge>}
											</Flex>
										</Table.Cell>
										<Table.Cell
											fontFamily='mono'
											fontSize='12px'
											color='fg.muted'>
											{v.sku || '—'}
										</Table.Cell>
										{data.outlets.map(o => {
											const s = v.stock[o._id] || { onHand: 0, reorderPoint: null };
											const low = s.reorderPoint !== null && s.onHand <= s.reorderPoint;
											return (
												<Table.Cell
													key={o._id}
													textAlign='end'>
													<Button
														size='xs'
														variant='ghost'
														fontFamily='mono'
														color={s.onHand < 0 || low ? 'red.fg' : undefined}
														onClick={() => setCell({ variant: { _id: v._id, label }, outlet: { _id: o._id, name: o.name }, onHand: s.onHand })}>
														{s.onHand}
													</Button>
												</Table.Cell>
											);
										})}
										<Table.Cell
											textAlign='end'
											fontFamily='mono'
											fontWeight='600'>
											{v.total}
										</Table.Cell>
									</Table.Row>
								);
							})}
						</Table.Body>
					</Table.Root>
				</Box>
			)}
			{cell && (
				<SetStockDialog
					open={!!cell}
					onClose={() => setCell(null)}
					store={store}
					{...cell}
				/>
			)}
		</Panel>
	);
};

/* ----------------------------------------------------------- item picker */

/** Search the catalogue by name, SKU or barcode and pick a variant. `outlet` shows its stock. */
export const ItemPicker: FC<{ onPick: (item: StoreItem) => void; outlet?: string; placeholder?: string }> = ({ onPick, outlet, placeholder = 'Find an item by name, SKU or barcode' }) => {
	const [q, setQ] = useState('');
	const [load, { data, isFetching }] = useLazyGetStoreCatalogueQuery();
	useEffect(() => {
		const t = setTimeout(() => q.trim() && load({ q: q.trim(), outlet, limit: 20 }), 250);
		return () => clearTimeout(t);
	}, [q, outlet]);
	// A product found by one variant's code or title shows just the variants that match; found by its name, all of them.
	const term = q.trim().toLowerCase();
	const items = term
		? (data?.doc || []).flatMap(p => {
				const hits = p.variants.filter(v => [v.name, v.sku, v.barcode].some(x => x.toLowerCase().includes(term)));
				return hits.length ? hits : p.variants;
		  })
		: [];
	return (
		<Box>
			<Flex
				align='center'
				gap={2}
				borderWidth='1px'
				borderColor='border'
				borderRadius='md'
				px={2.5}>
				<Search size={14} />
				<Input
					size='sm'
					border='none'
					px={0}
					_focusVisible={{ outline: 'none' }}
					value={q}
					placeholder={placeholder}
					onChange={e => setQ(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter' && items.length === 1) {
							onPick(items[0]);
							setQ('');
						}
					}}
				/>
			</Flex>
			{q.trim() && (
				// In the page's flow, not floating: panels clip what overflows them.
				<Box
					mt={1}
					maxH='280px'
					overflowY='auto'
					bg='bg.panel'
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'>
					{!items.length ? (
						<Text
							p={3}
							{...help}
							mt={0}>
							{isFetching ? 'Looking…' : 'Nothing matches'}
						</Text>
					) : (
						items.map(it => (
							<Flex
								key={it.variant}
								asChild
								w='full'
								justify='space-between'
								gap={3}
								px={3}
								py={2}
								textAlign='left'
								_hover={{ bg: 'bg.muted' }}
								onClick={() => {
									onPick(it);
									setQ('');
								}}>
								<button type='button'>
									<Box minW={0}>
										<Text
											fontSize='13px'
											truncate>
											{it.name}
										</Text>
										<Text
											fontSize='11px'
											color='fg.muted'
											fontFamily='mono'>
											{[it.sku, it.barcode].filter(Boolean).join(' · ') || '—'}
										</Text>
									</Box>
									{it.onHand !== null && it.trackStock && (
										<Text
											fontSize='12px'
											fontFamily='mono'
											color={it.onHand > 0 ? 'fg.muted' : 'red.fg'}>
											{it.onHand} here
										</Text>
									)}
								</button>
							</Flex>
						))
					)}
				</Box>
			)}
		</Box>
	);
};

/* --------------------------------------------- adjustment / transfer lines */

type Line = { variant: string; label: string; sku?: string; change?: number | null; counted?: number | null; quantity?: number | null };

/**
 * A stock adjustment's or transfer's items: picked from the catalogue, with a
 * count / change (adjustment) or a quantity (transfer). Saved onto the record
 * while it's a draft; then its actions move the stock.
 */
export const StockLines: FC<{ kind: 'adjustment' | 'transfer'; record: any; store: CommerceView }> = ({ kind, record, store }) => {
	const route = store.installed[kind]?.route || '';
	const draft = record?.status === 'draft' || !record?.status;
	const [lines, setLines] = useState<Line[]>([]);
	const [update, updating] = useUpdateByIdMutation();
	const [apply, applying] = useApplyStoreAdjustmentMutation();
	const [act, acting] = useStoreTransferActionMutation();
	useEffect(() => setLines((record?.lines || []).map((l: any) => ({ ...l }))), [JSON.stringify(record?.lines)]);
	const outlet = kind === 'adjustment' ? record?.outlet?._id || record?.outlet : record?.from?._id || record?.from;
	const changed = JSON.stringify(lines) !== JSON.stringify(record?.lines || []);
	const routes = routesOf(store, kind, 'stock', 'movement', 'product', 'variant');

	const saveLines = async () => {
		const res: any = await update({ path: route, id: record._id, body: { lines } });
		if ('error' in res) toaster.create({ type: 'error', title: errorText(res) });
		return !('error' in res);
	};
	const run = async (what: 'apply' | 'send' | 'receive' | 'cancel') => {
		if (changed && draft && !(await saveLines())) return;
		const res: any = what === 'apply' ? await apply({ id: record._id, routes }) : await act({ id: record._id, action: what, routes });
		toaster.create(
			'error' in res
				? { type: 'error', title: errorText(res) }
				: { type: 'success', title: { apply: 'Applied — stock updated', send: 'Sent — taken out of stock', receive: 'Received — added to stock', cancel: 'Cancelled' }[what] }
		);
	};
	const num = (v: any) => (v === '' || v === null || v === undefined ? null : Number(v));

	return (
		<Panel
			title='Items'
			subtitle={
				kind === 'adjustment'
					? 'For each item, what was counted — or how many to add or take away (− for damaged or lost). Apply moves the stock once.'
					: 'What goes from one outlet to the other. Sending takes it out of the first; receiving adds it to the second.'
			}
			actions={
				<Flex gap={2}>
					{draft && changed && (
						<Button
							size='xs'
							variant='outline'
							loading={updating.isLoading}
							onClick={saveLines}>
							Save items
						</Button>
					)}
					{kind === 'adjustment' && draft && (
						<Button
							size='xs'
							loading={applying.isLoading}
							disabled={!lines.length}
							onClick={() => run('apply')}>
							Apply
						</Button>
					)}
					{kind === 'transfer' && draft && (
						<Button
							size='xs'
							loading={acting.isLoading}
							disabled={!lines.length}
							onClick={() => run('send')}>
							Send
						</Button>
					)}
					{kind === 'transfer' && record?.status === 'sent' && (
						<Button
							size='xs'
							loading={acting.isLoading}
							onClick={() => run('receive')}>
							Receive
						</Button>
					)}
					{kind === 'transfer' && (record?.status === 'sent' || draft) && (
						<Button
							size='xs'
							variant='ghost'
							loading={acting.isLoading}
							onClick={() => run('cancel')}>
							Cancel transfer
						</Button>
					)}
				</Flex>
			}>
			<Flex
				direction='column'
				gap={2}
				p={4}>
				{draft && (
					<ItemPicker
						outlet={outlet}
						onPick={it =>
							setLines(ls =>
								ls.some(l => l.variant === it.variant)
									? ls
									: [...ls, { variant: it.variant, label: it.name, sku: it.sku, ...(kind === 'transfer' ? { quantity: 1 } : { counted: it.onHand ?? 0 }) }]
							)
						}
					/>
				)}
				{!lines.length && <Text {...help}>No items yet{draft ? ' — find them above' : ''}.</Text>}
				{lines.map((l, i) => (
					<Flex
						key={l.variant}
						align='center'
						gap={3}
						py={1.5}
						borderBottomWidth='1px'
						borderColor='border.muted'>
						<Box
							flex='1'
							minW={0}>
							<Text
								fontSize='13px'
								truncate>
								{l.label}
							</Text>
							{l.sku && (
								<Text
									fontSize='11px'
									fontFamily='mono'
									color='fg.muted'>
									{l.sku}
								</Text>
							)}
						</Box>
						{kind === 'adjustment' ? (
							<>
								<Field.Root w='110px'>
									<Field.Label fontSize='11px'>Counted</Field.Label>
									<Input
										size='xs'
										type='number'
										disabled={!draft}
										value={l.counted ?? ''}
										onChange={e => setLines(ls => ls.map((x, j) => (j === i ? { ...x, counted: num(e.target.value), ...(e.target.value !== '' && { change: null }) } : x)))}
									/>
								</Field.Root>
								<Field.Root w='110px'>
									<Field.Label fontSize='11px'>or change</Field.Label>
									<Input
										size='xs'
										type='number'
										disabled={!draft}
										value={l.change ?? ''}
										onChange={e => setLines(ls => ls.map((x, j) => (j === i ? { ...x, change: num(e.target.value), ...(e.target.value !== '' && { counted: null }) } : x)))}
									/>
								</Field.Root>
							</>
						) : (
							<Field.Root w='110px'>
								<Field.Label fontSize='11px'>Quantity</Field.Label>
								<Input
									size='xs'
									type='number'
									min={1}
									disabled={!draft}
									value={l.quantity ?? ''}
									onChange={e => setLines(ls => ls.map((x, j) => (j === i ? { ...x, quantity: num(e.target.value) } : x)))}
								/>
							</Field.Root>
						)}
						{draft && (
							<Button
								size='xs'
								variant='ghost'
								aria-label='Remove'
								onClick={() => setLines(ls => ls.filter((_, j) => j !== i))}>
								<Trash2 size={13} />
							</Button>
						)}
					</Flex>
				))}
			</Flex>
		</Panel>
	);
};
