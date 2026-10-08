'use client';

import { DragEvent, FC, memo, useMemo, useRef, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, IconButton, Input, Switch, Text, Textarea } from '@chakra-ui/react';
import {
	Calculator,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	GripVertical,
	Link2,
	ListTree,
	Lock,
	Plus,
	RotateCcw,
	Search,
	Sigma,
	SlidersHorizontal,
	Trash2,
} from 'lucide-react';
import { inputDataOptions, radius } from '@/components/library';
import { TABLE_CELLS } from '@/components/library/fields/registry/tableCells';
import { ModelField } from './filterTypes';
import { Dropdown } from '@/components/library/cl';
import { FieldInfo, checkFormula } from '@/components/library/functions/formula';
import FormulaModal from './FormulaModal';
import ConditionsEditor from './ConditionsEditor';
import TagColorsEditor, { hasChoices } from './TagColorsEditor';
import RollupEditor, { rollupText } from './RollupEditor';
import SectionFieldsModal from '@/app/model-builder/_components/SectionFieldsModal';
import { dataModelOf, editableSection, isSectionInput, sectionFormulaInfo, withSection } from './sectionDataModel';
import LinkedRecordsEditor, { RECORD_INPUTS } from './LinkedRecordsEditor';
import { INPUTS } from './inputTypes';
import { DATA_TYPE_LABEL, InputIcon, LIMITED_INPUTS, RULES, cellLabel, inputLabel, inputOf } from './settingsMeta';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';

/**
 * A route's settings file, field by field — the same properties the file
 * holds, in the same order. These drive the admin API once published:
 * `edit` is which fields a PUT may change, `required`/`min`/`max`/`type` are
 * the validators, `sort`/`search` what the table can sort and search on,
 * `exclude` what's never returned, `populate` what's joined in.
 *
 * The rules the server enforces are mirrored here so they can't be tripped
 * by accident: sensitive fields can't be loosened, access-control routes are
 * read-only.
 */

export type SettingsField = { key: string; [prop: string]: any };

// Same list the server validates against (library/controllers/builder/validate.ts).
const DATA_TYPES = [
	'string',
	'email',
	'uri',
	'date',
	'text',
	'number',
	'boolean',
	'object',
	'array',
	'array-string',
	'array-number',
	'array-object',
	'date-only',
	'tag',
	'mixed',
	'profit',
];

/**
 * Form inputs by name, grouped (INPUTS, ./inputTypes) — with the data type each
 * stores, so picking an input keeps the validator in step (an image list is an
 * array of strings). Inputs not listed there still appear, under "Other", by
 * their id.
 */
const INPUT_GROUPS = [...new Set(INPUTS.map(i => i.group))];
// (Not `rollup`: it's set up from "Add a field from linked records", with where its value comes from.)
const OTHER_INPUTS = inputDataOptions.filter((t: string) => t !== 'rollup' && !INPUTS.some(i => i.value === t));

/**
 * The input list for a Dropdown: named groups, then the rest by id. A plain
 * function, not a component: Dropdown reads its <option>/<optgroup> children
 * directly, and can't see inside a component's render.
 */
const inputOptions = (current?: string) => (
	<>
		{INPUT_GROUPS.map(g => (
			<optgroup
				key={g}
				label={g}>
				{INPUTS.filter(i => i.group === g).map(i => (
					<option
						key={i.value}
						value={i.value}>
						{i.label}
					</option>
				))}
			</optgroup>
		))}
		<optgroup label='Other'>
			{OTHER_INPUTS.map((t: string) => (
				<option
					key={t}
					value={t}>
					{t}
				</option>
			))}
			{current && !inputDataOptions.includes(current) && <option value={current}>{current}</option>}
		</optgroup>
	</>
);

/**
 * System fields (backend validate.ts, lockedKeys / withSystemFields): when a
 * record was created, and on an access-restricted model its owner, privacy
 * and access list. They're generated and read-only — shown exactly as the
 * code generates them, whatever a draft holds, and put back that way by the
 * server on save.
 */
const ACCESS_FIELD_KEYS = ['privacy', 'access', 'addedBy'];
const SYSTEM_HINT: Record<string, string> = {
	createdAt: 'Set when the record is created.',
	addedBy: 'The record’s owner — whoever created it.',
	privacy: 'Only me, private or public — access control reads it.',
	access: 'Who a private record is shared with — access control reads it.',
};

// Same as the server's: these fields can be tightened, never loosened.
const SENSITIVE = /pass(word)?|token|secret|api_?key|apikey|private|otp|salt|hash/i;

const ICON = { size: 14, strokeWidth: 1.75 };

type Props = {
	fields: SettingsField[];
	/** This route's model name — a field worked out from linked records reads the routes linking to it. */
	model?: string;
	codeFields: SettingsField[];
	modelFields: ModelField[];
	readOnly?: boolean;
	onChange: (fields: SettingsField[]) => void;
};

const Small: FC<{ children: any }> = ({ children }) => (
	<Text
		fontSize='xs'
		fontWeight='600'
		mb={1.5}>
		{children}
	</Text>
);

/** `schema` as JSON — every presentation option, including ones without a control here. */
const SchemaJson: FC<{ value: any; onChange: (v: any) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => {
	const [text, setText] = useState(JSON.stringify(value || {}, null, 2));
	const [bad, setBad] = useState(false);
	return (
		<>
			<Textarea
				size='sm'
				fontFamily='mono'
				fontSize='xs'
				rows={6}
				value={text}
				disabled={disabled}
				onChange={e => {
					setText(e.target.value);
					try {
						const parsed = JSON.parse(e.target.value || '{}');
						if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
							onChange(parsed);
							setBad(false);
						} else setBad(true);
					} catch {
						setBad(true);
					}
				}}
			/>
			{bad && (
				<Text
					fontSize='11px'
					color='red.fg'>
					Not a valid JSON object yet — the last valid value is kept.
				</Text>
			)}
		</>
	);
};

/** What a row changes — stable across renders, so an untouched row doesn't re-render. */
type RowActions = {
	set: (key: string, patch: any) => void;
	setSchema: (key: string, patch: any) => void;
	pickInput: (key: string, input: string) => void;
	pickType: (key: string, type: string) => void;
	reset: (key: string, code: SettingsField) => void;
	remove: (key: string) => void;
	/** A rollup's API name (it's new, so nothing else uses it yet). */
	rename: (key: string, next: string) => void;
	toggle: (key: string) => void;
	editFormula: (key: string) => void;
	editSection: (key: string) => void;
	dragStart: (index: number) => void;
	dragOver: (index: number) => void;
	drop: (index: number) => void;
	dragEnd: () => void;
};

/** Would turning `prop` to `value` loosen a sensitive field beyond its code? */
const unsafe = (f: SettingsField, code: SettingsField | undefined, prop: string, value: boolean) => {
	if (!SENSITIVE.test(f.key)) return false;
	const c: SettingsField = code || { key: f.key };
	if (prop === 'edit' || prop === 'search') return value && !c[prop];
	if (prop === 'exclude') return !value && !!c.exclude;
	return false;
};

type RowProps = {
	f: SettingsField;
	index: number;
	/** The field as the settings file has it, if it does. */
	code?: SettingsField;
	isOpen: boolean;
	isTarget: boolean;
	dragging: boolean;
	system: boolean;
	link?: string;
	readOnly?: boolean;
	/** The model stores a number here, so `formula` is offered. */
	modelNumber: boolean;
	/** A formula field's button: its text, tooltip, and whether the formula checks out. */
	formulaLabel?: string;
	formulaTitle?: string;
	formulaOk?: boolean;
	/** Remounts the JSON editor when a control changes `schema`. */
	schemaRev: number;
	/** Every field's key and title — what a record picker's conditions can read. */
	formFields: { key: string; title?: string }[];
	/** The model's fields with their types and choices — what "Locked when" can test. */
	lockFields: ModelField[];
	/** This route's model — a rollup's records are the ones linking to it. */
	model?: string;
	actions: RowActions;
};

/** Where a rule can't be changed, why — or nothing when it can. */
const ruleLock = (f: SettingsField, code: SettingsField | undefined, prop: string, system: boolean) => {
	const on = !!f[prop];
	if (system) return 'Fixed: this field is filled in by the system';
	if (f.rollup && prop !== 'exclude') return 'Worked out from linked records when read — never typed, stored, searched or sorted';
	if (f.schema?.type === 'formula' && (prop === 'edit' || prop === 'required')) return 'A calculated field is worked out, never typed';
	if (unsafe(f, code, prop, !on)) return 'Not allowed on a field holding a secret — it can only be made stricter';
	return '';
};

const Switchy: FC<{ on: boolean; disabled?: boolean; label: string; title?: string; onClick: () => void }> = ({
	on,
	disabled,
	label,
	title,
	onClick,
}) => (
	<Switch.Root
		size='sm'
		checked={on}
		disabled={disabled}
		title={title}
		onCheckedChange={onClick}>
		<Switch.HiddenInput />
		<Switch.Control>
			<Switch.Thumb />
		</Switch.Control>
		<Switch.Label fontSize='xs'>{label}</Switch.Label>
	</Switch.Root>
);

/** A heading inside a field's details. */
const Group: FC<{ title: string; hint?: string; children: any }> = ({ title, hint, children }) => (
	<Box>
		<Text
			fontSize='xs'
			fontWeight='600'
			color='fg.muted'
			textTransform='uppercase'
			letterSpacing='0.06em'
			mb={hint ? 0.5 : 2.5}>
			{title}
		</Text>
		{hint && (
			<Text
				fontSize='xs'
				color='fg.muted'
				mb={2.5}>
				{hint}
			</Text>
		)}
		{children}
	</Box>
);

/** The column widths the header row and the rows share. */
const COLS = { name: '220px', input: '190px' };

/**
 * One settings field. Memoized: a settings list is 20–40 of these, each with
 * dropdowns, and re-rendering them all on every keystroke or toggle is what
 * made the Settings tab (and the formula window on it) slow.
 *
 * The row is what people change most — the name, how it's asked for, Required
 * and Can be changed later — with the other rules that are on as chips; More
 * opens the rest in groups, the technical parts under Advanced.
 */
const FieldRow = memo(function FieldRow({
	f,
	index,
	code,
	isOpen,
	isTarget,
	dragging,
	system,
	link,
	readOnly,
	modelNumber,
	formulaLabel,
	formulaTitle,
	formulaOk,
	schemaRev,
	formFields,
	lockFields,
	model,
	actions,
}: RowProps) {
	const [advanced, setAdvanced] = useState(false);
	const sensitive = SENSITIVE.test(f.key);
	const changed = !code || JSON.stringify(code) !== JSON.stringify(f);
	const formula = formulaLabel === undefined ? null : { ok: formulaOk, label: formulaLabel, title: formulaTitle };
	const input = formula ? 'formula' : inputOf(f);
	const locked = readOnly || system;
	// Off goes back to however the settings file says it — explicit false or
	// absent — so on-then-off isn't a change.
	const flip = (prop: string) =>
		actions.set(f.key, { [prop]: !f[prop] ? true : code && prop in code ? code[prop] && false : undefined });
	const extraRules = RULES.filter(r => !r.inline && f[r.prop]);
	const isNumber = f.type === 'number' || formula;
	const hasLimits = !formula && LIMITED_INPUTS.includes(input) && ['string', 'text', 'email', 'uri', 'number'].includes(f.type || 'string');

	return (
		<Box
			draggable={!isOpen && !readOnly && !system}
			onDragStart={(e: DragEvent) => {
				actions.dragStart(index);
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', f.key);
			}}
			onDragOver={(e: DragEvent) => {
				e.preventDefault();
				actions.dragOver(index);
			}}
			onDrop={(e: DragEvent) => {
				e.preventDefault();
				actions.drop(index);
			}}
			onDragEnd={actions.dragEnd}
			borderWidth='1px'
			borderStyle={isTarget ? 'dashed' : 'solid'}
			borderColor={isTarget ? 'fg' : 'border'}
			borderRadius={radius.CONTAINER}
			bg={system ? 'bg.subtle' : 'bg.panel'}
			opacity={dragging ? 0.4 : 1}>
			<Flex
				align='center'
				gap={2}
				px={2.5}
				py={2}
				flexWrap='wrap'>
				{!readOnly && (
					<Flex
						color='fg.subtle'
						cursor={system ? 'default' : 'grab'}
						visibility={system ? 'hidden' : undefined}
						title='Drag to reorder'>
						<GripVertical {...ICON} />
					</Flex>
				)}
				<Box title={inputLabel(input)}>
					<InputIcon input={input} />
				</Box>

				{/* The name people see, with the API name under it. */}
				<Box
					w={COLS.name}
					minW={0}>
					{locked ? (
						<Text
							fontSize='sm'
							fontWeight='500'
							truncate>
							{f.title || f.key}
						</Text>
					) : (
						<Input
							size='xs'
							value={f.title || ''}
							placeholder={f.key}
							title='The field’s name, as people see it'
							onChange={e => actions.set(f.key, { title: e.target.value })}
						/>
					)}
					<Flex
						align='center'
						gap={1.5}
						mt={0.5}
						px={0.5}
						minW={0}>
						{(sensitive || system) && (
							<Flex
								color={system ? 'fg.muted' : 'orange.fg'}
								title={system ? `Filled in by the system, read only. ${SYSTEM_HINT[f.key] || ''}` : 'Holds a secret: its rules can be made stricter, never looser'}>
								<Lock size={10} />
							</Flex>
						)}
						<Text
							fontSize='11px'
							fontFamily='mono'
							color='fg.subtle'
							truncate
							title={`API name: ${f.key}`}>
							{f.key}
						</Text>
						{system && (
							<Badge
								size='xs'
								variant='outline'
								title={SYSTEM_HINT[f.key]}>
								automatic
							</Badge>
						)}
						{changed && !system && (
							<Badge
								size='xs'
								colorPalette='blue'
								variant='subtle'
								title={code ? 'Changed from how it started' : 'Added here'}>
								{code ? 'changed' : 'new'}
							</Badge>
						)}
					</Flex>
				</Box>

				{/* How it's asked for: the input — or, calculated, its formula; or the fixed link of a system field. */}
				<Box w={COLS.input}>
					{link ? (
						<Flex
							h={8}
							align='center'
							gap={1.5}
							px={2.5}
							borderWidth='1px'
							borderRadius='md'
							bg='bg.muted'
							fontSize='xs'
							title={`Links to the ${link} model — fixed: access control checks the signed-in ${link.toLowerCase()}`}>
							<Link2 size={12} />
							<Text truncate>
								Linked to <b>{link}</b>
							</Text>
						</Flex>
					) : f.rollup ? (
						<Button
							size='xs'
							variant='outline'
							w='full'
							justifyContent='flex-start'
							borderColor={f.rollup.from ? undefined : 'red.solid'}
							color={f.rollup.from ? undefined : 'red.fg'}
							title={rollupText(f.rollup)}
							onClick={() => !isOpen && actions.toggle(f.key)}>
							<Sigma size={12} />
							<Text
								as='span'
								truncate>
								{rollupText(f.rollup)}
							</Text>
						</Button>
					) : formula ? (
						<Button
							size='xs'
							variant='outline'
							w='full'
							justifyContent='flex-start'
							disabled={readOnly}
							borderColor={formula.ok ? undefined : 'red.solid'}
							color={formula.ok ? undefined : 'red.fg'}
							title={formula.title}
							onClick={() => actions.editFormula(f.key)}>
							<Calculator size={12} />
							<Text
								as='span'
								fontFamily='mono'
								truncate>
								{formula.label}
							</Text>
						</Button>
					) : (
						<Dropdown
							size='xs'
							disabled={locked}
							title={system ? 'Fixed on a system field' : 'How people fill it in — also how the table and record page show it'}
							value={f.schema?.type || ''}
							onChange={v => actions.pickInput(f.key, v)}>
							<option value=''>{`${inputLabel(inputOf({ type: f.type }))} (automatic)`}</option>
							{inputOptions(f.schema?.type)}
						</Dropdown>
					)}
				</Box>

				{isSectionInput(f.schema?.type) && (
					// A section's own fields: opens the section field builder.
					<Button
						size='xs'
						variant='outline'
						maxW='240px'
						justifyContent='flex-start'
						disabled={locked}
						title='Choose the section’s fields'
						onClick={() => actions.editSection(f.key)}>
						<ListTree size={12} />
						<Text
							as='span'
							truncate>
							{dataModelOf(f).length
								? `${dataModelOf(f).length} fields: ${dataModelOf(f)
										.map((x: any) => x.label || x.name)
										.join(', ')}`
								: 'Choose fields'}
						</Text>
					</Button>
				)}

				{/* The two rules people change most, as switches; the others that are on, as chips. */}
				<Flex
					gap={4}
					rowGap={2}
					align='center'
					flexWrap='wrap'
					flex='1'
					minW={0}>
					{RULES.filter(r => r.inline).map(r => {
						const why = ruleLock(f, code, r.prop, system);
						return (
							<Switchy
								key={r.prop}
								on={!!f[r.prop]}
								disabled={readOnly || !!why}
								label={r.label}
								title={why || r.hint}
								onClick={() => flip(r.prop)}
							/>
						);
					})}
					{extraRules.map(r => (
						<Badge
							key={r.prop}
							size='sm'
							colorPalette={r.palette}
							variant='subtle'
							cursor='pointer'
							title={`${r.hint} — click to change`}
							onClick={() => !isOpen && actions.toggle(f.key)}>
							{r.label}
						</Badge>
					))}
				</Flex>

				<Flex
					gap={1}
					ml='auto'>
					<Button
						size='xs'
						variant={isOpen ? 'subtle' : 'ghost'}
						aria-expanded={isOpen}
						title='All rules, how it looks, limits and advanced settings'
						onClick={() => actions.toggle(f.key)}>
						{isOpen ? <ChevronUp {...ICON} /> : <SlidersHorizontal {...ICON} />}
						{isOpen ? 'Less' : 'More'}
					</Button>
					{!readOnly && !system && (
						<IconButton
							size='xs'
							variant='ghost'
							aria-label={`Remove ${f.key}`}
							title='Remove: the server stops checking, editing and returning it. The stored values stay.'
							color='red.500'
							_dark={{ color: 'red.300' }}
							onClick={() => actions.remove(f.key)}>
							<Trash2 {...ICON} />
						</IconButton>
					)}
				</Flex>
			</Flex>

			{isOpen && (
				<Flex
					direction='column'
					gap={5}
					p={4}
					pl={{ md: readOnly ? 12 : 16 }}
					borderTopWidth='1px'
					borderColor='border.muted'>
					{f.rollup && (
						<Group
							title='Worked out from linked records'
							hint='A value from the records linking to this one — a client’s due payment from its bills.'>
							<RollupEditor
								fieldKey={f.key}
								rollup={f.rollup}
								model={model}
								taken={formFields.map(x => x.key).filter(k => k !== f.key)}
								disabled={locked}
								onChange={(rollup, display) =>
									actions.set(f.key, {
										rollup,
										type: display === 'date' ? 'date' : 'number',
										schema: { ...(f.schema || {}), type: 'rollup', tableType: display, viewType: display },
									})
								}
								onRename={next => actions.rename(f.key, next)}
							/>
						</Group>
					)}

					<Group
						title='Rules'
						hint={system ? 'This field is filled in by the system, so its rules are fixed.' : 'What the server checks and allows for this field.'}>
						<Grid
							templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
							gap={3}>
							{RULES.map(r => {
								const why = ruleLock(f, code, r.prop, system);
								return (
									<Flex
										key={r.prop}
										gap={3}
										align='flex-start'
										p={2.5}
										borderWidth='1px'
										borderColor={f[r.prop] ? `${r.palette}.muted` : 'border.muted'}
										bg={f[r.prop] ? `${r.palette}.subtle` : undefined}
										borderRadius='md'>
										<Switch.Root
											size='sm'
											mt={0.5}
											checked={!!f[r.prop]}
											disabled={readOnly || !!why}
											onCheckedChange={() => flip(r.prop)}>
											<Switch.HiddenInput />
											<Switch.Control>
												<Switch.Thumb />
											</Switch.Control>
										</Switch.Root>
										<Box minW={0}>
											<Text
												fontSize='sm'
												fontWeight='500'>
												{r.label}
											</Text>
											<Text
												fontSize='xs'
												color={why ? 'orange.fg' : 'fg.muted'}>
												{why || r.hint}
											</Text>
										</Box>
									</Flex>
								);
							})}
						</Grid>
					</Group>

					{!system && !formula && !f.rollup && (
						<Group
							title='Locked when'
							hint={
								f.edit
									? 'It can be changed until the record meets these — then it keeps its value. A bill’s status: “status is one of void, paid” — or two conditions with “Any of these”.'
									: 'Only matters while “Can be changed later” is on — now it can’t be changed at all.'
							}>
							<ConditionsEditor
								fields={lockFields}
								where={f.lockWhen || []}
								disabled={locked}
								onChange={w => actions.set(f.key, { lockWhen: w.length ? w : undefined, ...(w.length < 2 && { lockMatch: undefined }) })}
								match={f.lockMatch}
								onMatch={m => actions.set(f.key, { lockMatch: m === 'any' ? 'any' : undefined })}
								hint='Checked against the record as it’s saved, so the change that sets it to paid goes through and every change after it is refused. The edit form shows it locked.'
								emptyHint='Never locked: it can always be changed (while “Can be changed later” is on).'
							/>
						</Group>
					)}

					<Group title='How it looks'>
						<Grid
							templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
							gap={3}>
							<Box>
								<Small>Label on the form and record page</Small>
								<Input
									size='sm'
									value={f.schema?.label || ''}
									placeholder={f.title || f.key}
									disabled={locked}
									onChange={e => actions.setSchema(f.key, { label: e.target.value || undefined })}
								/>
							</Box>
							<Box>
								<Small>Shown in the table as</Small>
								<Dropdown
									size='sm'
									disabled={locked}
									value={f.schema?.tableType || ''}
									onChange={v => actions.setSchema(f.key, { tableType: v || undefined })}>
									<option value=''>Same as the form</option>
									{Object.keys(TABLE_CELLS).map(t => (
										<option
											key={t}
											value={t}>
											{cellLabel(t)}
										</option>
									))}
									{f.schema?.tableType && !(f.schema.tableType in TABLE_CELLS) && (
										<option value={f.schema.tableType}>{cellLabel(f.schema.tableType)}</option>
									)}
								</Dropdown>
							</Box>
							<Box>
								<Small>Column in the table</Small>
								<Switchy
									on={!!f.schema?.default}
									disabled={locked}
									label={f.schema?.default ? 'Shown from the start' : 'Hidden until someone adds it'}
									onClick={() =>
										actions.setSchema(f.key, {
											default: !f.schema?.default ? true : code?.schema && 'default' in code.schema ? false : undefined,
										})
									}
								/>
							</Box>
						</Grid>
						{hasChoices(f.schema, lockFields.find(m => m.key === f.key)?.enum, f.type === 'boolean') && (
							<Box mt={4}>
								<Small>Colours</Small>
								<TagColorsEditor
									schema={f.schema}
									enumValues={lockFields.find(m => m.key === f.key)?.enum}
									isBoolean={f.type === 'boolean'}
									disabled={locked}
									onChange={patch => actions.setSchema(f.key, patch)}
								/>
							</Box>
						)}
					</Group>

					{hasLimits && (
						<Group
							title={isNumber ? 'Limits' : 'Length'}
							hint={isNumber ? 'The lowest and highest value allowed.' : 'The fewest and most characters allowed.'}>
							<Grid
								templateColumns={{ base: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }}
								gap={3}>
								<Box>
									<Small>{isNumber ? 'Lowest' : 'Fewest'}</Small>
									<Input
										size='sm'
										type='number'
										placeholder='No limit'
										value={f.min ?? ''}
										disabled={locked}
										onChange={e => actions.set(f.key, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
									/>
								</Box>
								<Box>
									<Small>{isNumber ? 'Highest' : 'Most'}</Small>
									<Input
										size='sm'
										type='number'
										placeholder='No limit'
										value={f.max ?? ''}
										disabled={locked}
										onChange={e => actions.set(f.key, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
									/>
								</Box>
							</Grid>
						</Group>
					)}

					{RECORD_INPUTS.includes(f.schema?.type) && (
						<Group title='Picking a linked record'>
							<LinkedRecordsEditor
								schema={f.schema}
								formFields={formFields}
								fieldKey={f.key}
								disabled={locked}
								onChange={patch => actions.setSchema(f.key, patch)}
							/>
						</Group>
					)}

					<Box>
						<Button
							size='xs'
							variant='ghost'
							px={1}
							color='fg.muted'
							aria-expanded={advanced}
							onClick={() => setAdvanced(a => !a)}>
							{advanced ? <ChevronDown {...ICON} /> : <ChevronRight {...ICON} />}
							Advanced — how it’s stored, linked details, raw settings
						</Button>
						{advanced && (
							<Flex
								direction='column'
								gap={4}
								mt={3}
								pl={3}
								borderLeftWidth='2px'
								borderColor='border.muted'>
								<Grid
									templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
									gap={3}>
									<Box>
										<Small>Stored as</Small>
										<Dropdown
											size='sm'
											disabled={locked}
											title='How the value is stored and checked. Calculated: a number worked out from other number fields'
											value={f.schema?.type === 'formula' ? 'formula' : f.type || 'string'}
											onChange={v => actions.pickType(f.key, v)}>
											{DATA_TYPES.map(t => (
												<option
													key={t}
													value={t}>
													{DATA_TYPE_LABEL[t] || t}
												</option>
											))}
											{/* Offered where the model stores a number — a formula's result has to fit. */}
											{(f.type === 'number' || f.schema?.type === 'formula' || modelNumber) && (
												<option value='formula'>{DATA_TYPE_LABEL.formula}</option>
											)}
										</Dropdown>
									</Box>
									<Box>
										<Small>Linked record: field to load</Small>
										<Input
											size='sm'
											value={typeof f.populate === 'object' ? f.populate?.path || '' : f.populate || ''}
											placeholder='Not loaded'
											disabled={locked}
											onChange={e =>
												actions.set(f.key, {
													populate: e.target.value
														? { ...(typeof f.populate === 'object' ? f.populate : {}), path: e.target.value }
														: undefined,
												})
											}
										/>
									</Box>
									<Box>
										<Small>Linked record: what to load</Small>
										<Input
											size='sm'
											value={typeof f.populate === 'object' ? f.populate?.select || '' : ''}
											placeholder='name email'
											disabled={locked || !f.populate}
											onChange={e =>
												actions.set(f.key, {
													populate: {
														...(typeof f.populate === 'object' ? f.populate : { path: f.populate }),
														select: e.target.value || undefined,
													},
												})
											}
										/>
									</Box>
								</Grid>
								<Box>
									<Small>Every display option, as raw settings (JSON)</Small>
									<SchemaJson
										key={`${f.key}-${schemaRev}`}
										value={f.schema}
										disabled={locked}
										onChange={schema => actions.set(f.key, { schema })}
									/>
								</Box>
								{code && changed && !readOnly && (
									<Box>
										<Button
											size='xs'
											variant='outline'
											onClick={() => {
												actions.reset(f.key, code);
											}}>
											<RotateCcw size={14} />
											{IS_TENANT_PANEL ? 'Put this field back as it started' : 'Back to the settings file for this field'}
										</Button>
									</Box>
								)}
							</Flex>
						)}
					</Box>
				</Flex>
			)}
		</Box>
	);
});

const SettingsEditor: FC<Props> = ({ fields, codeFields, model, modelFields, readOnly, onChange }) => {
	const [open, setOpen] = useState<string | null>(null);
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);
	const [adding, setAdding] = useState('');
	// Find a field: a long list narrowed by name or API name. Rows keep their real index, so dragging still works.
	const [query, setQuery] = useState('');
	// Remounts the JSON editor when a control changes `schema`, so it shows the new value.
	const [schemaRev, setSchemaRev] = useState(0);

	const codeByKey = new Map(codeFields.map(f => [f.key, f]));
	// Stable while keys and titles don't change, so memoized rows don't re-render.
	const formFieldsKey = fields.map(f => `${f.key}\u0000${f.title || ''}`).join('\u0001');
	const formFields = useMemo(
		() => fields.map(f => ({ key: f.key, title: f.title })),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[formFieldsKey]
	);
	const modelByKey = new Map(modelFields.map(f => [f.key, f]));
	// What a field's "Locked when" can test: the model's own fields (stable, for the memoized rows).
	const lockFields = useMemo(
		() => modelFields.filter(f => !['_id', '__v'].includes(f.key) && !f.key.includes('.')),
		[modelFields]
	);
	const restricted = ACCESS_FIELD_KEYS.every(k => modelByKey.has(k));
	/** Generated and read-only. */
	const locked = new Set(
		[...(modelByKey.has('createdAt') ? ['createdAt'] : []), ...(restricted ? ACCESS_FIELD_KEYS : [])].filter(k => codeByKey.has(k))
	);
	/** What's shown: system fields as generated (a missing one too, at the end — the server adds it back on save). */
	const shown: SettingsField[] = [
		...fields.map(f => (locked.has(f.key) ? codeByKey.get(f.key)! : f)),
		...[...locked].filter(k => !fields.some(f => f.key === k)).map(k => codeByKey.get(k)!),
	];
	/** The model a system field links to — shown, not chosen. */
	const linkOf = (key: string) => (locked.has(key) ? modelByKey.get(key)?.ref : undefined);
	const present = new Set(fields.map(f => f.key));
	// A field can be added if the model has it, or the code file declares it.
	const addable = [
		...modelFields.map(f => f.key),
		...codeFields.map(f => f.key),
	].filter((k, i, all) => !present.has(k) && !locked.has(k) && k !== '_id' && all.indexOf(k) === i);

	const set = (key: string, patch: any) =>
		onChange(fields.map(f => (f.key === key ? clean({ ...f, ...patch }) : f)));
	const setSchema = (key: string, patch: any) => {
		const f = fields.find(x => x.key === key)!;
		set(key, { schema: clean({ ...(f.schema || {}), ...patch }) });
		setSchemaRev(r => r + 1);
	};

	/** A new input, and the data type it stores when that differs — images are a list, a checkbox a boolean. */
	const pickInput = (key: string, input: string) => {
		const f = fields.find(x => x.key === key)!;
		const data = INPUTS.find(i => i.value === input)?.data;
		if (input === 'formula') {
			// Calculated, never typed: a number, not editable, not required.
			set(key, {
				type: 'number',
				edit: undefined,
				required: undefined,
				schema: clean({ ...(f.schema || {}), type: 'formula', formula: f.schema?.formula || '', tableType: 'number', viewType: 'number' }),
			});
			setSchemaRev(r => r + 1);
			setFormulaFor(key);
			return;
		}
		if (isSectionInput(input)) {
			// A section starts from its fields as they are (a list's row fields
			// carry over between the two), or the preset; the builder opens on it.
			const from = { ...f, schema: { ...(f.schema || {}), type: input } };
			const { formula: _f, ...next }: any = withSection(from, editableSection(f.schema?.type ? f : from).fields as any);
			set(key, {
				schema: clean({ ...next, ...(f.schema?.type === 'formula' && { tableType: undefined, viewType: undefined }) }),
				...(data && data !== f.type && { type: data }),
			});
			setSchemaRev(r => r + 1);
			setSectionFor(key);
			return;
		}
		const { formula: _dropped, ...schema } = f.schema || {};
		set(key, {
			schema: clean({
				...schema,
				type: input || undefined,
				// The number cells a formula set, not a choice of their own.
				...(f.schema?.type === 'formula' && { tableType: undefined, viewType: undefined }),
			}),
			...(data && data !== f.type && { type: data }),
		});
		setSchemaRev(r => r + 1);
	};

	/** A data type; `formula` makes it a calculated number, and any other type undoes that. */
	const pickType = (key: string, type: string) => {
		const f = fields.find(x => x.key === key)!;
		if (type === 'formula') return pickInput(key, 'formula');
		if (f.schema?.type !== 'formula') return set(key, { type });
		const { formula: _dropped, type: _input, tableType: _t, viewType: _v, ...schema } = f.schema || {};
		set(key, { type, schema: clean(schema) });
		setSchemaRev(r => r + 1);
	};

	// Formula fields: what a formula may use, and which field's formula is being edited.
	const [formulaFor, setFormulaFor] = useState<string | null>(null);
	const formulaInfo: FieldInfo[] = shown.flatMap((f): FieldInfo[] => {
		// A list is used through sum() / avg() / count(); a section's values as `billing.fee`.
		const inside = sectionFormulaInfo(f);
		if (inside.some(x => x.list)) return inside;
		return [
			{
				key: f.key,
				label: f.title,
				numeric: f.type === 'number' || f.schema?.type === 'formula' || modelByKey.get(f.key)?.instance === 'Number',
				...(f.schema?.type === 'formula' && { formula: f.schema?.formula }),
			},
			...inside,
		];
	});
	const formulaField = formulaFor ? fields.find(f => f.key === formulaFor) : undefined;

	// Section fields: which one's own fields are being chosen, and what the model stores under it.
	const [sectionFor, setSectionFor] = useState<string | null>(null);
	const sectionField = sectionFor ? fields.find(f => f.key === sectionFor) : undefined;
	const sectionEditable = useMemo(() => (sectionField ? editableSection(sectionField) : undefined), [sectionField]);
	const sectionStored = useMemo(() => {
		if (!sectionFor) return undefined;
		const subs = modelFields
			.filter(m => m.key.startsWith(`${sectionFor}.`))
			.map(m => ({ key: m.key.slice(sectionFor.length + 1), instance: m.instance }))
			.filter(m => !m.key.includes('.'));
		// Only when the model fixes them (a sub-schema); a free-form value can hold any.
		return subs.length ? subs : undefined;
	}, [sectionFor, modelFields]);

	const drop = (index: number) => {
		if (dragIndex !== null && dragIndex !== index) {
			const next = [...fields];
			const [moved] = next.splice(dragIndex, 1);
			next.splice(index, 0, moved);
			onChange(next);
		}
		setDragIndex(null);
		setOverIndex(null);
	};

	// The rows get one actions object for good: it reads the latest render's
	// handlers through a ref, so memoized rows never see a stale `fields`.
	const latest = useRef({ set, setSchema, pickInput, pickType, drop, fields, onChange });
	latest.current = { set, setSchema, pickInput, pickType, drop, fields, onChange };
	const actions = useMemo<RowActions>(
		() => ({
			set: (key, patch) => latest.current.set(key, patch),
			setSchema: (key, patch) => latest.current.setSchema(key, patch),
			pickInput: (key, input) => latest.current.pickInput(key, input),
			pickType: (key, type) => latest.current.pickType(key, type),
			reset: (key, code) => {
				latest.current.set(key, code);
				setSchemaRev(r => r + 1);
			},
			remove: key => latest.current.onChange(latest.current.fields.filter(x => x.key !== key)),
			rename: (key, next) => {
				latest.current.onChange(latest.current.fields.map(x => (x.key === key ? { ...x, key: next } : x)));
				setOpen(next);
			},
			toggle: key => setOpen(o => (o === key ? null : key)),
			editFormula: key => setFormulaFor(key),
			editSection: key => setSectionFor(key),
			dragStart: index => setDragIndex(index),
			dragOver: index => setOverIndex(o => (o === index ? o : index)),
			drop: index => latest.current.drop(index),
			dragEnd: () => {
				setDragIndex(null);
				setOverIndex(null);
			},
		}),
		[]
	);


	return (
		<Flex
			direction='column'
			gap={2}>
			<Flex
				align='center'
				justify='space-between'
				gap={3}
				flexWrap='wrap'
				mb={1}>
				<Text
					fontSize='xs'
					color='fg.muted'>
					{shown.length} fields · {shown.filter(f => f.required).length} required · {shown.filter(f => f.edit).length} can be
					changed later
				</Text>
				<Flex
					align='center'
					gap={2}
					w={{ base: 'full', md: '260px' }}
					px={2.5}
					h={8}
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'
					bg='bg.panel'>
					<Search
						size={13}
						strokeWidth={1.75}
					/>
					<Input
						size='xs'
						variant='flushed'
						border='none'
						px={0}
						placeholder='Find a field…'
						value={query}
						onChange={e => setQuery(e.target.value)}
					/>
				</Flex>
			</Flex>

			<Flex
				display={{ base: 'none', md: 'flex' }}
				gap={2}
				px={2.5}
				fontSize='xs'
				color='fg.muted'>
				{/* The grip and the input's picture. */}
				<Box w={readOnly ? '28px' : '50px'} />
				<Text w={COLS.name}>Field</Text>
				<Text w={COLS.input}>Asked as</Text>
				<Text>Rules</Text>
			</Flex>

			{shown.map((f, i) => {
				const q = query.trim().toLowerCase();
				if (q && ![f.key, f.title, f.schema?.label].some(v => String(v || '').toLowerCase().includes(q))) return null;
				const isFormula = f.schema?.type === 'formula';
				const check = isFormula ? checkFormula(f.schema?.formula || '', formulaInfo, f.key) : null;
				const empty = !String(f.schema?.formula || '').trim();
				const isOpen = open === f.key;
				return (
					<FieldRow
						key={f.key}
						f={f}
						index={i}
						code={codeByKey.get(f.key)}
						isOpen={isOpen}
						isTarget={dragIndex !== null && overIndex === i && dragIndex !== i}
						dragging={dragIndex === i}
						system={locked.has(f.key)}
						link={linkOf(f.key)}
						readOnly={readOnly}
						modelNumber={modelByKey.get(f.key)?.instance === 'Number'}
						formulaLabel={check ? (empty ? 'Set formula' : `= ${check.formatted || f.schema.formula}`) : undefined}
						formulaTitle={
							check ? (check.ok ? 'Edit the formula' : empty ? 'Set the formula' : check.errors.map(e => e.message).join('; ')) : undefined
						}
						formulaOk={check?.ok}
						schemaRev={isOpen ? schemaRev : 0}
						formFields={formFields}
						lockFields={lockFields}
						model={model}
						actions={actions}
					/>
				);
			})}

			{query.trim() &&
				!shown.some(f => [f.key, f.title, f.schema?.label].some(v => String(v || '').toLowerCase().includes(query.trim().toLowerCase()))) && (
					<Text
						fontSize='sm'
						color='fg.muted'
						py={2}>
						No field matches “{query.trim()}”.
					</Text>
				)}

			{!readOnly && (
				<Flex
					gap={2}
					align='center'
					flexWrap='wrap'>
					<Button
						size='sm'
						variant='outline'
						title='A value worked out from the records linking to this one — a client’s due payment from its bills'
						onClick={() => {
							let key = 'fromLinked';
							for (let n = 2; present.has(key) || modelByKey.has(key); n++) key = `fromLinked${n}`;
							onChange([
								...fields,
								{
									key,
									title: 'New calculated field',
									type: 'number',
									schema: { type: 'rollup', tableType: 'number', viewType: 'number' },
									rollup: { from: '', via: '', op: 'count' },
								},
							]);
							setOpen(key);
						}}>
						<Sigma {...ICON} />
						Add a field from linked records
					</Button>
					<Text
						fontSize='xs'
						color='fg.muted'>
						A total, count, average, smallest or largest of linked records — a client’s due payment from its bills.
					</Text>
				</Flex>
			)}

			{!readOnly && addable.length > 0 && (
				<Flex
					gap={2}
					align='center'>
					<Dropdown
						size='sm'
						w='260px'
						value={adding}
						onChange={v => setAdding(v)}>
						<option value=''>Add one of the model’s other fields…</option>
						{addable.map(k => (
							<option
								key={k}
								value={k}>
								{k}
							</option>
						))}
					</Dropdown>
					<Button
						size='sm'
						variant='outline'
						disabled={!adding}
						onClick={() => {
							const code = codeByKey.get(adding);
							const model = modelFields.find(m => m.key === adding);
							// From the settings file if it declares it; otherwise a plain
							// read-only-ish field typed from the model.
							const field: SettingsField = code || {
								key: adding,
								title: adding.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase()),
								type: modelTypeToData(model?.instance),
							};
							onChange([...fields, field]);
							setOpen(adding);
							setAdding('');
						}}>
						<Plus {...ICON} />
						Add field
					</Button>
				</Flex>
			)}

			<SectionFieldsModal
				isOpen={!!sectionField}
				onClose={() => setSectionFor(null)}
				field={sectionEditable}
				stored={sectionStored}
				onSave={({ fields: sub, addLabel }) => {
					if (sectionField) {
						set(sectionField.key, { schema: clean(withSection(sectionField, (sub || []) as any, addLabel)) });
						setSchemaRev(r => r + 1);
					}
					setSectionFor(null);
				}}
			/>

			<FormulaModal
				isOpen={!!formulaField}
				onClose={() => setFormulaFor(null)}
				fieldKey={formulaField?.key || ''}
				fieldTitle={formulaField?.title}
				formula={formulaField?.schema?.formula || ''}
				fields={formulaInfo}
				onSave={formula => {
					if (formulaField) setSchema(formulaField.key, { formula });
					setFormulaFor(null);
				}}
			/>
		</Flex>
	);
};

/** Drops undefined values so an untouched property doesn't read as a change. */
const clean = (o: any) => {
	const out: any = {};
	for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
	return out;
};

const modelTypeToData = (instance?: string) => {
	switch (instance) {
		case 'Number':
		case 'Decimal128':
			return 'number';
		case 'Boolean':
			return 'boolean';
		case 'Date':
			return 'date';
		case 'Array':
			return 'array';
		case 'Mixed':
			return 'object';
		default:
			return 'string';
	}
};

export default SettingsEditor;
