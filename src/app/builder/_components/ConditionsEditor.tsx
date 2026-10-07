'use client';

import { FC } from 'react';
import { Button, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { Plus, X } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import { ModelField } from './filterTypes';

/**
 * Conditions on a model's fields — a field, a test that fits it, a value —
 * all of which must hold. Used by a record page tab's "Show only" (list the
 * due bills) and a settings field's "Locked when" (a paid bill's status).
 * The server reads the same ops: viewDocument.controller (tabs) and
 * fieldLocks.function (locks).
 */

const ICON = { size: 14, strokeWidth: 1.75 };

export type TabCondition = { field: string; op: CondOp; value?: string };
export type CondOp = 'is' | 'not' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'empty' | 'filled';

/** The conditions offered for a field, by what it holds. */
const opsFor = (f?: ModelField): { value: CondOp; label: string }[] => {
	const base: { value: CondOp; label: string }[] = [
		{ value: 'is', label: 'is' },
		{ value: 'not', label: 'is not' },
	];
	const blank: { value: CondOp; label: string }[] = [
		{ value: 'empty', label: 'is empty' },
		{ value: 'filled', label: 'is not empty' },
	];
	if (!f) return [...base, ...blank];
	if (f.instance === 'Boolean') return base;
	if (f.instance === 'Number' || f.instance === 'Date')
		return [
			...base,
			{ value: 'gt', label: f.instance === 'Date' ? 'is after' : 'is more than' },
			{ value: 'gte', label: f.instance === 'Date' ? 'is on or after' : 'is at least' },
			{ value: 'lt', label: f.instance === 'Date' ? 'is before' : 'is less than' },
			{ value: 'lte', label: f.instance === 'Date' ? 'is on or before' : 'is at most' },
			...blank,
		];
	if (f.enum?.length) return [...base, { value: 'in', label: 'is one of' }, ...blank];
	if (f.ref) return [...base, ...blank];
	return [...base, { value: 'contains', label: 'contains' }, ...blank];
};

const OP_LABEL: Record<CondOp, string> = {
	is: 'is',
	not: 'is not',
	in: 'is one of',
	gt: 'is more than',
	gte: 'is at least',
	lt: 'is less than',
	lte: 'is at most',
	contains: 'contains',
	empty: 'is empty',
	filled: 'is not empty',
};

/** "status is due", for the tab's problems line. */
export const conditionText = (c: TabCondition) => {
	const op = OP_LABEL[c.op] || c.op;
	return ['empty', 'filled'].includes(c.op) ? `${c.field} ${op}` : `${c.field} ${op} ${c.value ?? ''}`.trim();
};

const ConditionValue: FC<{ field?: ModelField; cond: TabCondition; onChange: (v: string) => void }> = ({ field, cond, onChange }) => {
	if (['empty', 'filled'].includes(cond.op)) return null;
	if (field?.instance === 'Boolean')
		return (
			<Dropdown
				size='xs'
				w='110px'
				value={cond.value || ''}
				placeholder='Pick'
				onChange={(v: string) => onChange(v)}>
				<option value='true'>Yes</option>
				<option value='false'>No</option>
			</Dropdown>
		);
	if (field?.enum?.length && cond.op !== 'in')
		return (
			<Dropdown
				size='xs'
				w='160px'
				value={cond.value || ''}
				placeholder='Pick a value'
				onChange={(v: string) => onChange(v)}>
				{field.enum.map((e: any) => (
					<option
						key={String(e)}
						value={String(e)}>
						{String(e)}
					</option>
				))}
			</Dropdown>
		);
	return (
		<Input
			size='xs'
			w='180px'
			type={field?.instance === 'Date' ? 'date' : field?.instance === 'Number' ? 'number' : 'text'}
			placeholder={cond.op === 'in' ? 'due, overdue' : field?.ref ? 'Record id' : 'Value'}
			value={cond.value || ''}
			onChange={e => onChange(e.target.value)}
		/>
	);
};

/** "Show only": the tab's conditions, each a field, a test and a value. */
const ConditionsEditor: FC<{
	fields: ModelField[];
	where: TabCondition[];
	onChange: (w: TabCondition[]) => void;
	/** The line beside the add button: with conditions, and without. */
	hint: string;
	emptyHint: string;
	disabled?: boolean;
}> = ({ fields, where, onChange, hint, emptyHint, disabled }) => {
	const set = (i: number, c: TabCondition) => onChange(where.map((x, j) => (j === i ? c : x)));
	return (
		<Flex
			direction='column'
			gap={1.5}
			flex='1'
			minW={0}>
			{where.map((c, i) => {
				const field = fields.find(f => f.key === c.field);
				const ops = opsFor(field);
				return (
					<Flex
						key={i}
						align='center'
						gap={1.5}
						flexWrap='wrap'>
						{i > 0 && (
							<Text
								fontSize='11px'
								color='fg.muted'
								w='26px'>
								and
							</Text>
						)}
						<Dropdown
							size='xs'
							w='160px'
							value={c.field}
							placeholder='Field'
							onChange={(v: string) => {
								const f = fields.find(x => x.key === v);
								onChange(where.map((x, j) => (j === i ? { field: v, op: opsFor(f)[0].value } : x)));
							}}>
							{fields.map(f => (
								<option
									key={f.key}
									value={f.key}>
									{f.key}
								</option>
							))}
						</Dropdown>
						<Dropdown
							size='xs'
							w='140px'
							value={c.op}
							onChange={(v: string) => set(i, { ...c, op: v as CondOp })}>
							{ops.map(o => (
								<option
									key={o.value}
									value={o.value}>
									{o.label}
								</option>
							))}
						</Dropdown>
						<ConditionValue
							field={field}
							cond={c}
							onChange={v => set(i, { ...c, value: v || undefined })}
						/>
						<IconButton
							size='2xs'
							variant='ghost'
							aria-label='Remove condition'
							title='Remove'
							onClick={() => onChange(where.filter((_, j) => j !== i))}>
							<X {...ICON} />
						</IconButton>
					</Flex>
				);
			})}
			<Flex
				align='center'
				gap={2}
				flexWrap='wrap'>
				<Button
					size='2xs'
					variant='outline'
					disabled={disabled}
					onClick={() => onChange([...where, { field: '', op: 'is' }])}>
					<Plus {...ICON} />
					{where.length ? 'And…' : 'Add a condition'}
				</Button>
				<Text
					fontSize='11px'
					color='fg.muted'>
					{where.length ? hint : emptyHint}
				</Text>
			</Flex>
		</Flex>
	);
};

export default ConditionsEditor;
