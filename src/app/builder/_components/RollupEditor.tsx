'use client';

import { FC } from 'react';
import { Box, Flex, Grid, Input, Text } from '@chakra-ui/react';
import { useGetBuilderBacklinksQuery, useGetBuilderModelFieldsQuery } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import ConditionsEditor, { conditionsText, Match, TabCondition } from './ConditionsEditor';
import { ModelField } from './filterTypes';

/**
 * A settings field worked out from linked records (settings `rollup`): a
 * client's due payment is the sum of its bills' amount where status is due.
 * Worked out on the server whenever records are read (rollups.function.ts) —
 * never stored or typed — so it is always current, can go in the table, the
 * record page and the form (shown, not asked), but can't be sorted on.
 */

export type Rollup = { from: string; via: string; value?: string; op: RollupOp; where?: TabCondition[]; match?: Match };
export type RollupOp = 'count' | 'sum' | 'avg' | 'min' | 'max';

export const ROLLUP_OPS: { value: RollupOp; label: string; verb: string }[] = [
	{ value: 'count', label: 'Count them', verb: 'Number of' },
	{ value: 'sum', label: 'Add up a field', verb: 'Total' },
	{ value: 'avg', label: 'Average of a field', verb: 'Average' },
	{ value: 'min', label: 'Smallest value', verb: 'Smallest' },
	{ value: 'max', label: 'Largest value', verb: 'Largest' },
];

/** "Total amount of bills, where status is due" — the row's button and the summary. */
export const rollupText = (r?: Partial<Rollup>) => {
	if (!r?.from) return 'Pick the linked records';
	const op = ROLLUP_OPS.find(o => o.value === r.op) || ROLLUP_OPS[0];
	const what = r.op === 'count' || !r.op ? `${op.verb} ${r.from}` : `${op.verb} ${r.value || '…'} of ${r.from}`;
	const where = conditionsText(r.where, r.match);
	return where ? `${what}, where ${where}` : what;
};

const usable = (f: ModelField) => !['_id', '__v'].includes(f.key) && !f.key.includes('.');

type Props = {
	fieldKey: string;
	rollup: Partial<Rollup>;
	/** This route's model: the routes linking to it are where the records come from. */
	model?: string;
	/** Settings keys already taken — a new name can't reuse one. */
	taken: string[];
	disabled?: boolean;
	onChange: (rollup: Rollup, display: 'number' | 'date') => void;
	onRename: (key: string) => void;
};

const Label: FC<{ children: any }> = ({ children }) => (
	<Text
		fontSize='xs'
		fontWeight='600'
		mb={1.5}>
		{children}
	</Text>
);

const RollupEditor: FC<Props> = ({ fieldKey, rollup, model, taken, disabled, onChange, onRename }) => {
	const { data: backlinks } = useGetBuilderBacklinksQuery(model as string, { skip: !model });
	const sources = (backlinks?.doc || []).flatMap(l => l.fields.map(f => ({ route: l.route, model: l.model, via: f })));
	const source = sources.find(s => s.route === rollup.from && s.via === rollup.via);
	const { data } = useGetBuilderModelFieldsQuery(source?.model as string, { skip: !source?.model });
	const fields: ModelField[] = (data?.fields || []).filter(usable);
	const op = rollup.op || 'count';
	const valueChoices = fields.filter(f => f.instance === 'Number' || ((op === 'min' || op === 'max') && f.instance === 'Date'));

	const set = (patch: Partial<Rollup>) => {
		const next = { op, ...rollup, ...patch } as Rollup;
		if (next.op === 'count') delete next.value;
		if (!next.where?.length) delete next.where;
		if (!next.where || next.where.length < 2 || next.match !== 'any') delete next.match;
		const valueField = fields.find(f => f.key === next.value);
		onChange(next, valueField?.instance === 'Date' ? 'date' : 'number');
	};

	const badKey = !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldKey);

	return (
		<Flex
			direction='column'
			gap={4}>
			<Grid
				templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
				gap={3}>
				<Box>
					<Label>From</Label>
					<Dropdown
						size='sm'
						disabled={disabled}
						placeholder={sources.length ? 'Records linked to this one' : 'Nothing links here yet'}
						value={rollup.from ? `${rollup.from}|${rollup.via}` : ''}
						onChange={(v: string) => {
							const [from, via] = v.split('|');
							// Another model: its fields and conditions no longer apply.
							set({ from, via, value: undefined, where: undefined });
						}}>
						{sources.map(s => (
							<option
								key={`${s.route}|${s.via}`}
								value={`${s.route}|${s.via}`}>
								{`${s.route} whose ${s.via} is this record`}
							</option>
						))}
					</Dropdown>
				</Box>
				<Box>
					<Label>Work out</Label>
					<Dropdown
						size='sm'
						disabled={disabled || !rollup.from}
						value={op}
						onChange={(v: string) => set({ op: v as RollupOp })}>
						{ROLLUP_OPS.map(o => (
							<option
								key={o.value}
								value={o.value}>
								{o.label}
							</option>
						))}
					</Dropdown>
				</Box>
				{op !== 'count' && (
					<Box>
						<Label>Of the field</Label>
						<Dropdown
							size='sm'
							disabled={disabled || !rollup.from}
							placeholder={valueChoices.length ? 'Pick a field' : 'No number fields'}
							value={rollup.value || ''}
							onChange={(v: string) => set({ value: v })}>
							{valueChoices.map(f => (
								<option
									key={f.key}
									value={f.key}>
									{f.key}
								</option>
							))}
						</Dropdown>
					</Box>
				)}
			</Grid>

			{rollup.from && (
				<Box>
					<Label>Only the linked records where</Label>
					<ConditionsEditor
						fields={fields}
						where={rollup.where || []}
						disabled={disabled}
						onChange={w => set({ where: w })}
						match={rollup.match}
						onMatch={m => set({ match: m })}
						hint='Only records meeting every condition count — the due bills, not all of them.'
						emptyHint='Every linked record counts. Add a condition for “due bills only” (status is due).'
					/>
				</Box>
			)}

			<Grid
				templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
				gap={3}>
				<Box>
					<Label>API name</Label>
					<Input
						size='sm'
						fontFamily='mono'
						value={fieldKey}
						disabled={disabled}
						borderColor={badKey ? 'red.solid' : undefined}
						onChange={e => {
							const next = e.target.value.replace(/\s+/g, '');
							if (next && !taken.includes(next)) onRename(next);
						}}
					/>
					{badKey && (
						<Text
							fontSize='11px'
							color='red.fg'
							mt={1}>
							Letters, digits and _, starting with a letter.
						</Text>
					)}
				</Box>
				<Box gridColumn={{ md: 'span 2' }}>
					<Label>Reads as</Label>
					<Text
						fontSize='sm'
						color={rollup.from ? 'fg' : 'fg.muted'}>
						{rollupText(rollup)}
					</Text>
					<Text
						fontSize='xs'
						color='fg.muted'
						mt={1}>
						Worked out whenever records are read, so it’s always current. Add it to the table, the record page or
						the form in the page builder; it can’t be typed, sorted or searched.
					</Text>
				</Box>
			</Grid>
		</Flex>
	);
};

export default RollupEditor;
