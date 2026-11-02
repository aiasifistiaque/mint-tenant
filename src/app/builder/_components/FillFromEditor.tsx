'use client';

import { FC, useState } from 'react';
import { Box, Flex, Grid, Input, Switch, Text } from '@chakra-ui/react';
import { useGetConfigQuery } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { FieldInfo, checkFormula } from '@/components/library/functions/formula';
import { DocLink } from './ui';

/**
 * "Filled in from a linked record" (settings `schema.fillFrom`): a payment's
 * amount from the bill picked on the same form — one of the bill's fields, or
 * a formula over them (`total - paid`). The form fills it when a bill is
 * picked and it stays editable; on create the server fills it when it was
 * left empty (linkedFill.function). Off until its switch is turned on — most
 * fields are just typed in.
 */

export type PickerField = { key: string; title?: string; picker?: string };

type Props = {
	fieldKey: string;
	fillFrom?: { from: string; formula: string };
	/** The record's fields; the ones with `picker` (their linked route) can be filled from. */
	formFields: PickerField[];
	disabled?: boolean;
	/** Autofill types: it always copies, so there is no switch. `holds` is what the field stores — a note when the source differs. */
	always?: boolean;
	holds?: 'text' | 'number' | 'date' | 'boolean';
	/** `kind`: what the field it picked holds, when it changed (a formula is a number) — the model builder keeps it as what the Autofill holds. */
	onChange: (fillFrom: { from: string; formula: string } | undefined, kind?: 'text' | 'number' | 'date' | 'boolean') => void;
};

const FORMULA = '__formula__';
const SENSITIVE = /pass(word)?|token|secret|api_?key|apikey|private|otp|salt|hash/i;

/** The kind of value a field of the linked page holds, from its config type. */
const kindOfType = (t?: string): 'text' | 'number' | 'date' | 'boolean' =>
	t === 'number' || t === 'formula' || t === 'rollup' || t === 'slider'
		? 'number'
		: t === 'date' || t === 'date-only' || t === 'dateformula'
		? 'date'
		: t === 'checkbox' || t === 'switch' || t === 'boolean'
		? 'boolean'
		: 'text';

const FillFromEditor: FC<Props> = ({ fieldKey, fillFrom, formFields, disabled, always, holds, onChange }) => {
	const [open, setOpen] = useState(!!fillFrom);
	const on = always || open || !!fillFrom;
	const pickers = formFields.filter(f => f.picker && f.key !== fieldKey);
	const from = fillFrom?.from || '';
	const route = pickers.find(p => p.key === from)?.picker || '';
	const { data } = useGetConfigQuery(route, { skip: !route });
	const linked = Object.entries<any>(data?.schema || {})
		.filter(([k]) => k !== '_id' && !SENSITIVE.test(k))
		.map(([key, s]) => ({ key, label: s?.label || key, numeric: s?.type === 'number' || s?.type === 'formula', kind: kindOfType(s?.type) }));
	const formula = fillFrom?.formula || '';
	const isField = linked.some(l => l.key === formula);
	const mode = !formula ? '' : isField ? formula : FORMULA;
	const info: FieldInfo[] = linked.map(l => ({ key: l.key, label: l.label, numeric: l.numeric }));
	const check = mode === FORMULA && formula.trim() ? checkFormula(formula, info) : null;
	const fromLabel = pickers.find(p => p.key === from)?.title || from;

	const sourceKind = mode === FORMULA ? 'number' : linked.find(l => l.key === formula)?.kind;
	const mismatch = !!holds && !!sourceKind && !!formula && sourceKind !== holds && (!check || check.ok);

	const toggle = always ? null : (
		<Switch.Root
			size='sm'
			checked={on}
			disabled={disabled}
			onCheckedChange={e => {
				setOpen(e.checked);
				if (!e.checked) onChange(undefined);
			}}>
			<Switch.HiddenInput />
			<Switch.Control>
				<Switch.Thumb />
			</Switch.Control>
			<Switch.Label fontSize='xs'>Fill this from a linked record</Switch.Label>
		</Switch.Root>
	);

	if (!on) return toggle;

	if (!pickers.length)
		return (
			<Flex
				direction='column'
				gap={2}>
				{toggle}
				<Text
					fontSize='xs'
					color='fg.muted'>
					This record has no field that picks another record — add one (a bill, a client) to fill this from it.
				</Text>
			</Flex>
		);

	return (
		<Flex
			direction='column'
			gap={2}>
			{toggle}
			<Grid
				templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
				gap={3}>
				<Box>
					<Text
						fontSize='xs'
						fontWeight='600'
						mb={1.5}>
						When this is picked
					</Text>
					<Dropdown
						size='sm'
						disabled={disabled}
						value={from}
						placeholder='Nothing — typed in'
						onChange={(v: string) => onChange(v ? { from: v, formula: '' } : undefined)}>
						<option value=''>Nothing — typed in</option>
						{pickers.map(p => (
							<option
								key={p.key}
								value={p.key}>
								{p.title || p.key}
							</option>
						))}
					</Dropdown>
				</Box>
				{from && (
					<Box>
						<Text
							fontSize='xs'
							fontWeight='600'
							mb={1.5}>
							Fill it with
						</Text>
						<Dropdown
							size='sm'
							disabled={disabled}
							value={mode}
							placeholder='Pick a field of it'
							onChange={(v: string) => onChange({ from, formula: v === FORMULA ? (isField ? formula : '') : v }, v === FORMULA ? 'number' : linked.find(l => l.key === v)?.kind)}>
							{linked.map(l => (
								<option
									key={l.key}
									value={l.key}>
									{`Its ${l.label}`}
								</option>
							))}
							<option value={FORMULA}>A formula over its fields…</option>
						</Dropdown>
					</Box>
				)}
			</Grid>
			{from && mode === FORMULA && (
				<Box>
					<Input
						size='sm'
						fontFamily='mono'
						disabled={disabled}
						placeholder='total - paid'
						value={formula}
						onChange={e => onChange({ from, formula: e.target.value }, 'number')}
					/>
					<Text
						fontSize='11px'
						mt={1}
						color={check && !check.ok ? 'red.fg' : 'fg.muted'}>
						{check && !check.ok
							? check.errors[0]?.message
							: `Uses ${fromLabel}’s number fields: ${linked.filter(l => l.numeric).map(l => l.key).join(', ') || 'none'} — with + - * / ( ), round, min, max.`}
					</Text>
				</Box>
			)}
			{from && formula && (!check || check.ok) && (
				<Text
					fontSize='xs'
					color='fg.muted'>
					Picking a {fromLabel.toLowerCase()} fills this with{' '}
					{isField ? `its ${linked.find(l => l.key === formula)?.label}` : <code>{formula}</code>}.{' '}
					{always ? '' : 'It stays editable; saved records keep what they hold.'}
				</Text>
			)}
			{always && <DocLink section='models-autofill' />}
			{mismatch && (
				<Text
					fontSize='xs'
					color='orange.fg'>
					It copies {sourceKind === 'text' ? 'text' : `a ${sourceKind}`}, but this field stores {holds === 'text' ? 'text' : `a ${holds}`} — pick a field of the same kind, or change the data type.
				</Text>
			)}
		</Flex>
	);
};

export default FillFromEditor;
