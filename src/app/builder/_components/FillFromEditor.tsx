'use client';

import { FC, useMemo, useState } from 'react';
import { Box, Flex, Grid, Input, Switch, Text } from '@chakra-ui/react';
import { useGetBuilderRouteQuery, useGetConfigQuery } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { FieldInfo, checkFormula } from '@/components/library/functions/formula';
import { DocLink } from './ui';
import ConditionsEditor, { Match, TabCondition } from './ConditionsEditor';
import { ModelField } from './filterTypes';

/**
 * Autofill, a setting on any field (settings `schema.fillFrom`, the model
 * builder's `fillFrom`; docs/autofill AF-11): a copy of a field of the record
 * picked in another field of the same form — an order's customer phone, or a
 * formula over the picked record's numbers (`total - paid`). The field keeps
 * its own kind. The form fills it when the record is picked and it stays
 * editable; `readonly` makes it the server's: set on every save, kept in step
 * with the source, never typed. `when` + `match` limit it to a case (Delivery
 * is Home, or the customer's Type is Wholesale); a read-only one is cleared and
 * stays locked while they don't hold. Off until the switch is turned on — most
 * fields are just typed in.
 */

export type PickerField = { key: string; title?: string; picker?: string };

/** What the field stores, as far as an autofill cares (backend `fillShapeOf`). */
export type Holds = 'text' | 'number' | 'date' | 'boolean' | 'choice' | 'link';

export type FillFromValue = { from: string; formula: string; readonly?: boolean; when?: { field: string; op: string; value?: any }[]; match?: Match };

type Props = {
	fieldKey: string;
	fillFrom?: FillFromValue;
	/** The record's fields; the ones with `picker` (their linked route) can be filled from. */
	formFields: PickerField[];
	/** This record's own fields, for the conditions. */
	thisFields?: ModelField[];
	disabled?: boolean;
	/** What the field stores — a note when the source differs. */
	holds?: Holds;
	onChange: (fillFrom: FillFromValue | undefined) => void;
};

const FORMULA = '__formula__';
const SENSITIVE = /pass(word)?|token|secret|api_?key|apikey|private|otp|salt|hash/i;
/** A condition's field prefix for the picked record's own fields (backend `SOURCE_PREFIX`). */
export const SOURCE_PREFIX = '@.';

/** The kind of value a field of the linked page holds, from its config type. */
const kindOfType = (t?: string): Holds =>
	t === 'number' || t === 'formula' || t === 'rollup' || t === 'slider'
		? 'number'
		: t === 'date' || t === 'date-only' || t === 'dateformula'
		? 'date'
		: t === 'checkbox' || t === 'switch' || t === 'boolean'
		? 'boolean'
		: t === 'select' || t === 'select-tag' || t === 'tag'
		? 'choice'
		: t === 'data-menu' || t === 'data-select' || t === 'nested-data-menu'
		? 'link'
		: 'text';

/** Does a copy of `source` fit a field storing `holds`? Unknown fits. */
const fits = (holds: Holds | undefined, source?: Holds) => {
	if (!holds || !source) return true;
	if (holds === 'text') return source !== 'boolean' && source !== 'link';
	if (holds === 'choice') return source === 'text' || source === 'choice';
	return holds === source;
};

const HOLDS_TEXT: Record<Holds, string> = { text: 'text', number: 'a number', date: 'a date', boolean: 'a yes/no', choice: 'one of its choices', link: 'a link' };

const FillFromEditor: FC<Props> = ({ fieldKey, fillFrom, formFields, thisFields = [], disabled, holds, onChange }) => {
	const [open, setOpen] = useState(!!fillFrom);
	const on = open || !!fillFrom;
	const pickers = formFields.filter(f => f.picker && f.key !== fieldKey);
	const from = fillFrom?.from || '';
	const route = pickers.find(p => p.key === from)?.picker || '';
	const { data } = useGetConfigQuery(route, { skip: !route });
	const linked = Object.entries<any>(data?.schema || {})
		.filter(([k]) => k !== '_id' && !SENSITIVE.test(k))
		.map(([key, s]) => ({ key, label: s?.label || key, numeric: s?.type === 'number' || s?.type === 'formula', kind: kindOfType(s?.type) }));
	// The picked record's own fields, for the conditions (`@.type`).
	const { data: built } = useGetBuilderRouteQuery(route, { skip: !route });
	const fromLabel = pickers.find(p => p.key === from)?.title || from;
	const sourceFields: ModelField[] = useMemo(
		() =>
			((built?.fields || []) as ModelField[])
				.filter(f => !['_id', '__v'].includes(f.key) && !f.key.includes('.') && !SENSITIVE.test(f.key))
				.map(f => ({ ...f, key: `${SOURCE_PREFIX}${f.key}`, label: `${fromLabel} › ${f.key}` })),
		[built, fromLabel]
	);
	const hereFields: ModelField[] = useMemo(
		() => thisFields.filter(f => f.key !== fieldKey && !['_id', '__v'].includes(f.key) && !f.key.includes('.')).map(f => ({ ...f, label: f.label || f.key })),
		[thisFields, fieldKey]
	);
	const formula = fillFrom?.formula || '';
	const isField = linked.some(l => l.key === formula);
	const mode = !formula ? '' : isField ? formula : FORMULA;
	const info: FieldInfo[] = linked.map(l => ({ key: l.key, label: l.label, numeric: l.numeric }));
	const check = mode === FORMULA && formula.trim() ? checkFormula(formula, info) : null;

	const sourceKind: Holds | undefined = mode === FORMULA ? 'number' : linked.find(l => l.key === formula)?.kind;
	const mismatch = !!holds && !!sourceKind && !!formula && !fits(holds, sourceKind) && (!check || check.ok);
	const readonly = !!fillFrom?.readonly;
	const set = (patch: Partial<FillFromValue>) => from && onChange({ ...(fillFrom as FillFromValue), ...patch });

	const toggle = (
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
			gap={3}>
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
						onChange={(v: string) => onChange(v ? { from: v, formula: '', ...(fillFrom?.readonly && { readonly: true }), ...(fillFrom?.when?.length && { when: fillFrom.when, match: fillFrom.match }) } : undefined)}>
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
							onChange={(v: string) => set({ formula: v === FORMULA ? (isField ? formula : '') : v })}>
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
						onChange={e => set({ formula: e.target.value })}
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
					{readonly ? 'Nobody can type in it.' : 'It stays editable for this record; saved records keep what they hold.'}
				</Text>
			)}
			{mismatch && (
				<Text
					fontSize='xs'
					color='orange.fg'>
					It copies {HOLDS_TEXT[sourceKind!]}, but this field stores {HOLDS_TEXT[holds!]} — pick a field of the same kind, or change this field’s kind.
				</Text>
			)}
			{from && (
				<>
					<Box>
						<Text
							fontSize='xs'
							fontWeight='600'
							mb={1.5}>
							Only when
						</Text>
						<ConditionsEditor
							fields={[...hereFields, ...sourceFields]}
							where={(fillFrom?.when || []) as TabCondition[]}
							disabled={disabled}
							onChange={w => set({ when: w.length ? w : undefined, ...(w.length < 2 && { match: undefined }) })}
							match={fillFrom?.match}
							onMatch={m => set({ match: m === 'any' ? 'any' : undefined })}
							hint={`Autofill only while these hold. Test this record’s fields (Delivery is Home) or the ${fromLabel.toLowerCase()}’s (${fromLabel} › type is Wholesale).`}
							emptyHint='Always: it fills whenever a record is picked.'
						/>
					</Box>
					<Switch.Root
						size='sm'
						checked={readonly}
						disabled={disabled}
						onCheckedChange={e => set({ readonly: e.checked ? true : undefined })}>
						<Switch.HiddenInput />
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
						<Switch.Label fontSize='xs'>Read-only — nobody types it, the server keeps it in step</Switch.Label>
					</Switch.Root>
					{readonly && (
						<Text
							fontSize='xs'
							color='fg.muted'>
							Set from the picked record on every save, and it changes when that record’s field changes. {fillFrom?.when?.length ? 'While the conditions don’t hold it is cleared and stays locked. ' : ''}
							Required and “Can be changed later” don’t apply.
						</Text>
					)}
				</>
			)}
			<DocLink section='models-autofill' />
		</Flex>
	);
};

export default FillFromEditor;
