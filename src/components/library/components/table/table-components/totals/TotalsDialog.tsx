'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, Flex, Grid, IconButton, Portal, Skeleton, Text } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import AlertDialogContent from '../../../../modals/modal-components/AlertContent';
import AlertDialogHeader from '../../../../modals/modal-components/AlertDialogHeader';
import ModalFooter from '../../../../modals/modal-components/CustomModalFooter';
import Dropdown from '../../../../cl/Dropdown';
import { useGetSchemaQuery } from '../../../../store/services/commonApi';
import { TotalItem, TotalOp, useGetTotalsQuery } from '../../../../store/services/totalsApi';
import { currency } from '../../../../config/lib/constants/constants';

/** A preset calculation, set in the route builder (route.totals.items). */
export type TotalsPreset = { label?: string; field?: string; op: TotalOp; format?: 'number' | 'money' };
/** `route.totals` in a route's config. */
export type TotalsConfig = {
	/** The selection bar button. Default "View total" (with presets) or "Calculate". */
	title?: string;
	items?: TotalsPreset[];
	/** Let admins total other fields too. Default true. */
	calculate?: boolean;
};

/** "Total amount", "Average hours", "Rows", "Rows with a discount". */
export const defaultTotalLabel = (op: TotalOp, fieldLabel?: string) =>
	op === 'count'
		? fieldLabel
			? `Rows with ${fieldLabel.toLowerCase()}`
			: 'Rows'
		: `${OP_LABEL[op]} ${(fieldLabel || '').toLowerCase()}`;

export const OP_LABEL: Record<TotalOp, string> = {
	sum: 'Total',
	avg: 'Average',
	min: 'Lowest',
	max: 'Highest',
	count: 'Count',
};
const OPS: TotalOp[] = ['sum', 'avg', 'min', 'max', 'count'];
const MONEY_TYPES = ['price', 'profit'];

const plain = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatValue = (v: number | null | undefined, format: 'number' | 'money') =>
	v === null || v === undefined ? '—' : format === 'money' ? `${currency.symbol} ${money.format(v)}` : plain.format(v);

type Props = {
	open: boolean;
	onClose: () => void;
	path: string;
	ids: string[];
	config?: TotalsConfig;
};

const storageKey = (path: string) => `emint_totals_${path}`;

/**
 * "View total" for the rows ticked in a table: the route's preset
 * calculations (set in the route builder's Table tab), and a Calculate list
 * where the admin picks any number field and Total / Average / Lowest /
 * Highest / Count. Worked out on the server across every selected row, on
 * any page (backend getTotals). The admin's own picks are remembered per
 * route in this browser.
 */
const TotalsDialog: FC<Props> = ({ open, onClose, path, ids, config }) => {
	const presets = (config?.items || []).filter(p => p?.op && (p.op === 'count' || p.field));
	const canCalculate = config?.calculate !== false;
	const title = config?.title || (presets.length ? 'View total' : 'Calculate');

	const { data: schema } = useGetSchemaQuery(path, { skip: !open || !path });
	const labelOf = (key?: string | null) => (key ? schema?.[key]?.label || key : 'Rows');
	const formatOf = (key?: string | null, fixed?: 'number' | 'money'): 'number' | 'money' =>
		fixed || (key && MONEY_TYPES.includes(schema?.[key]?.type) ? 'money' : 'number');

	const presetQuery = useGetTotalsQuery(
		{ path, ids, items: presets.map(p => ({ field: p.field, op: p.op })) },
		{ skip: !open || !path || !ids.length }
	);
	const fields = presetQuery.data?.fields || [];

	// The admin's own calculations, remembered per route.
	const [picks, setPicks] = useState<TotalItem[]>([]);
	useEffect(() => {
		if (!open) return;
		try {
			const saved = JSON.parse(window.localStorage.getItem(storageKey(path)) || '[]');
			setPicks(Array.isArray(saved) ? saved : []);
		} catch {
			setPicks([]);
		}
	}, [open, path]);
	const savePicks = (next: TotalItem[]) => {
		setPicks(next);
		try {
			window.localStorage.setItem(storageKey(path), JSON.stringify(next));
		} catch {
			// Remembering is a convenience.
		}
	};

	// Nothing preset and nothing remembered: start with one calculation ready.
	useEffect(() => {
		if (open && canCalculate && !presets.length && !picks.length && fields.length) setPicks([{ field: fields[0], op: 'sum' }]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, fields.length]);

	// Only picks the server can answer: a known number field, or a row count.
	const ready = useMemo(
		() => picks.filter(p => p.op === 'count' || (p.field && fields.includes(p.field))),
		[picks, fields]
	);
	const pickQuery = useGetTotalsQuery(
		{ path, ids, items: ready },
		{ skip: !open || !path || !ids.length || !ready.length || !presetQuery.data }
	);
	const pickValue = (p: TotalItem) => {
		const i = ready.indexOf(p);
		return i < 0 ? undefined : pickQuery.data?.results?.[i]?.value;
	};

	const records = presetQuery.data?.records;
	const error: any = presetQuery.error;

	return (
		<Dialog.Root
			lazyMount
			unmountOnExit
			open={open}
			size='md'
			placement='center'
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent>
						<AlertDialogHeader>{title}</AlertDialogHeader>
						<Dialog.Body
							px={5}
							pt={1}
							pb={5}>
							<Text
								fontSize='sm'
								color='fg.muted'
								mb={4}>
								{error
									? error?.status === 404
										? 'Totals aren’t available for this list.'
										: error?.data?.message || 'Couldn’t work out the totals.'
									: records === undefined
										? `Across ${ids.length} selected row${ids.length === 1 ? '' : 's'}…`
										: `Across ${records} selected row${records === 1 ? '' : 's'}${records < ids.length ? ` (${ids.length - records} you can’t see aren’t counted)` : ''}.`}
							</Text>

							{presets.length > 0 && !error && (
								<Box
									borderWidth='1px'
									borderColor='border'
									borderRadius='lg'
									overflow='hidden'
									mb={canCalculate ? 5 : 0}>
									{presets.map((p, i) => (
										<Flex
											key={i}
											align='center'
											justify='space-between'
											gap={4}
											px={4}
											py={3}
											borderTopWidth={i ? '1px' : 0}
											borderColor='border.muted'>
											<Text
												fontSize='sm'
												color='fg.muted'>
												{p.label || defaultTotalLabel(p.op, p.field ? labelOf(p.field) : undefined)}
											</Text>
											<Skeleton loading={presetQuery.isFetching && !presetQuery.data}>
												<Text
													fontSize='lg'
													fontWeight='600'
													fontVariantNumeric='tabular-nums'>
													{formatValue(presetQuery.data?.results?.[i]?.value, formatOf(p.field, p.format))}
												</Text>
											</Skeleton>
										</Flex>
									))}
								</Box>
							)}

							{canCalculate && !error && (
								<Box>
									<Text
										fontSize='xs'
										fontWeight='600'
										textTransform='uppercase'
										letterSpacing='0.04em'
										color='fg.muted'
										mb={2}>
										Calculate
									</Text>
									{presetQuery.data && !fields.length ? (
										<Text
											fontSize='sm'
											color='fg.muted'>
											This list has no number fields to total.
										</Text>
									) : (
										<Flex
											direction='column'
											gap={2}>
											{picks.map((p, i) => {
												const value = pickValue(p);
												return (
													<Grid
														key={i}
														templateColumns='minmax(0, 1fr) 110px minmax(90px, auto) 28px'
														alignItems='center'
														gap={2}>
														<Dropdown
															size='sm'
															placeholder='Field'
															value={p.op === 'count' && !p.field ? '__rows' : p.field || ''}
															onChange={v =>
																savePicks(picks.map((x, j) => (j === i ? { ...x, field: v === '__rows' ? undefined : v } : x)))
															}>
															{p.op === 'count' && <option value='__rows'>Rows</option>}
															{fields.map(f => (
																<option
																	key={f}
																	value={f}>
																	{labelOf(f)}
																</option>
															))}
														</Dropdown>
														<Dropdown
															size='sm'
															value={p.op}
															onChange={v => savePicks(picks.map((x, j) => (j === i ? { ...x, op: v as TotalOp } : x)))}>
															{OPS.map(o => (
																<option
																	key={o}
																	value={o}>
																	{OP_LABEL[o]}
																</option>
															))}
														</Dropdown>
														<Text
															textAlign='right'
															fontWeight='600'
															fontVariantNumeric='tabular-nums'
															color={value === undefined ? 'fg.muted' : 'fg'}>
															{value === undefined
																? pickQuery.isFetching && ready.includes(p)
																	? '…'
																	: '—'
																: formatValue(value, formatOf(p.field))}
														</Text>
														<IconButton
															size='xs'
															variant='ghost'
															aria-label='Remove calculation'
															color='fg.muted'
															onClick={() => savePicks(picks.filter((_, j) => j !== i))}>
															<Trash2 size={14} />
														</IconButton>
													</Grid>
												);
											})}
											<Button
												alignSelf='flex-start'
												size='xs'
												variant='outline'
												disabled={!fields.length}
												onClick={() =>
													savePicks([...picks, { field: fields.find(f => !picks.some(p => p.field === f)) || fields[0], op: 'sum' }])
												}>
												<Plus size={14} />
												Add calculation
											</Button>
										</Flex>
									)}
								</Box>
							)}
						</Dialog.Body>
						<ModalFooter>
							<Button
								size='xs'
								h='28px'
								px={3}
								variant='outline'
								onClick={onClose}>
								Close
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default TotalsDialog;
