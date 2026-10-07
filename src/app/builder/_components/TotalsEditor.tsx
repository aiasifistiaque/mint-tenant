'use client';

import { FC } from 'react';
import { Box, Button, Flex, Grid, IconButton, Input, Text } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import type { TotalsConfig, TotalsPreset } from '@/components/library/components/table/table-components/totals/TotalsDialog';
import { OP_LABEL, defaultTotalLabel } from '@/components/library/components/table/table-components/totals/TotalsDialog';
import type { TotalOp } from '@/components/library/store/services/totalsApi';
import { TableField } from './TableColumnsEditor';
import { DocLink, FieldLabel, Toggle } from './ui';

type Props = {
	value?: TotalsConfig;
	onChange: (next: TotalsConfig | undefined) => void;
	fields: TableField[];
};

const ICON = { size: 14, strokeWidth: 1.75 };
const OPS: TotalOp[] = ['sum', 'avg', 'min', 'max', 'count'];
const ROWS = '__rows';

/**
 * The table's "View total" (route.totals): the button on the selection bar
 * and the calculations it shows for the ticked rows — e.g. Total amount,
 * Average amount — plus whether admins may total other number fields too.
 * Rendered in Bulk actions, since it only exists while rows are selected.
 */
const TotalsEditor: FC<Props> = ({ value, onChange, fields }) => {
	const totals: TotalsConfig = value || {};
	const items: TotalsPreset[] = totals.items || [];
	const numbers = fields.filter(f => f.type === 'number');
	const labelOf = (key?: string) => fields.find(f => f.key === key)?.label || key || '';

	/** Drops what's at its default, so an untouched route saves no `totals` at all. */
	const set = (patch: Partial<TotalsConfig>) => {
		const next: TotalsConfig = { ...totals, ...patch };
		if (!next.title) delete next.title;
		if (!next.items?.length) delete next.items;
		if (next.calculate !== false) delete next.calculate;
		onChange(Object.keys(next).length ? next : undefined);
	};
	const setItem = (i: number, patch: Partial<TotalsPreset>) =>
		set({
			items: items.map((it, j) => {
				if (j !== i) return it;
				const merged: any = { ...it, ...patch };
				for (const k of Object.keys(merged)) if (merged[k] === undefined || merged[k] === '') delete merged[k];
				return merged;
			}),
		});

	return (
		<Flex
			direction='column'
			gap={3}
			p={3}
			borderWidth='1px'
			borderColor='border.muted'
			borderRadius='md'
			bg='bg.subtle'>
			<Flex
				align='center'
				justify='space-between'
				gap={3}>
				<Box>
					<Text
						fontSize='sm'
						fontWeight='600'>
						Totals
					</Text>
					<Text
						fontSize='xs'
						color='fg.muted'>
						A button on the selection bar that shows these for the ticked rows — across pages, worked out on the server.
					</Text>
				</Box>
				<DocLink section='table-totals' />
			</Flex>

			<Box maxW='320px'>
				<FieldLabel>Button title</FieldLabel>
				<Input
					size='sm'
					placeholder={items.length ? 'View total' : 'Calculate'}
					value={totals.title || ''}
					onChange={e => set({ title: e.target.value })}
				/>
			</Box>

			<Box>
				<FieldLabel>Preset calculations</FieldLabel>
				{!numbers.length ? (
					<Text
						fontSize='xs'
						color='fg.muted'>
						This route has no number fields — only a row count can be preset.
					</Text>
				) : null}
				<Flex
					direction='column'
					gap={2}
					mt={1}>
					{items.map((it, i) => (
						<Grid
							key={i}
							templateColumns={{ base: '1fr 1fr', md: 'minmax(0, 1.4fr) minmax(0, 1fr) 120px 110px 28px' }}
							gap={2}
							alignItems='center'>
							<Input
								size='xs'
								placeholder={defaultTotalLabel(it.op, it.field ? labelOf(it.field) : undefined)}
								value={it.label || ''}
								onChange={e => setItem(i, { label: e.target.value })}
							/>
							<Dropdown
								size='xs'
								placeholder='Field'
								value={it.op === 'count' && !it.field ? ROWS : it.field || ''}
								onChange={v => setItem(i, { field: v === ROWS ? undefined : v })}>
								{it.op === 'count' && <option value={ROWS}>Rows</option>}
								{numbers.map(f => (
									<option
										key={f.key}
										value={f.key}>
										{f.label}
									</option>
								))}
								{it.field && !numbers.some(f => f.key === it.field) && <option value={it.field}>{it.field}</option>}
							</Dropdown>
							<Dropdown
								size='xs'
								value={it.op}
								onChange={v => setItem(i, { op: v as TotalOp })}>
								{OPS.map(o => (
									<option
										key={o}
										value={o}>
										{OP_LABEL[o]}
									</option>
								))}
							</Dropdown>
							<Dropdown
								size='xs'
								value={it.format || 'auto'}
								title='How the value is shown'
								onChange={v => setItem(i, { format: v === 'auto' ? undefined : (v as any) })}>
								<option value='auto'>Auto</option>
								<option value='number'>Number</option>
								<option value='money'>Money</option>
							</Dropdown>
							<IconButton
								size='xs'
								variant='ghost'
								aria-label='Remove calculation'
								color='red.500'
								_dark={{ color: 'red.300' }}
								onClick={() => set({ items: items.filter((_, j) => j !== i) })}>
								<Trash2 {...ICON} />
							</IconButton>
						</Grid>
					))}
				</Flex>
				<Button
					mt={2}
					size='xs'
					variant='outline'
					onClick={() =>
						set({
							items: [
								...items,
								numbers.length
									? { field: (numbers.find(f => !items.some(it => it.field === f.key)) || numbers[0]).key, op: 'sum' }
									: { op: 'count' },
							],
						})
					}>
					<Plus {...ICON} />
					Add calculation
				</Button>
			</Box>

			<Toggle
				label='Let admins calculate other fields'
				hint='A Calculate list in the same dialog, where any number field can be totalled, averaged, or its lowest and highest found.'
				checked={totals.calculate !== false}
				onChange={v => set({ calculate: v ? undefined : false })}
			/>
		</Flex>
	);
};

export default TotalsEditor;
