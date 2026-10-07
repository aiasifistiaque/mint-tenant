'use client';

import { DragEvent, FC, ReactNode, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, IconButton, Input, Switch, Text } from '@chakra-ui/react';
import { AlertTriangle, Calculator, ChevronDown, ListTree, ChevronRight, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { radius } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import {
	ARRAY_KINDS,
	ENUM_KINDS,
	EditableField,
	FieldError,
	FieldKind,
	KINDS,
	KIND_GROUPS,
	NEEDS_OPTIONS,
	NO_DEFAULT_KINDS,
	REFERENCE_KINDS,
	SECTION_KINDS,
	SELF,
	canBeUnique,
	formulaFieldsOf,
	hasLength,
	hasOptions,
	newUid,
	sectionPreset,
	toKey,
} from './modelKinds';
import SectionFieldsModal from './SectionFieldsModal';
import FormulaModal from '@/app/builder/_components/FormulaModal';
import { checkFormula } from '@/components/library/functions/formula';

/**
 * The model's fields, in order — the order they take in the generated form,
 * table and detail page. Each row is the essentials (label, key, kind, what
 * it links to, required); the chevron opens the rest.
 *
 * On a model that already has records, a changed kind or a removed field is
 * flagged: the data stays in the records, but a new kind may not read it.
 */

export type LinkTarget = { name: string; route: string; title?: string; display: string; built: boolean };

type Props = {
	fields: EditableField[];
	onChange: (fields: EditableField[]) => void;
	/** Problems by field uid, each naming the input it's about — shown under that input, which turns red. */
	errors: Record<string, FieldError>;
	targets: LinkTarget[];
	/** The model being edited — "this model" in link pickers. */
	selfName?: string;
	/** Kinds as saved, by key — to flag a kind change on a model with records. */
	savedKinds?: Record<string, FieldKind>;
	hasRecords?: boolean;
	/** The kinds offered — all by default; a section's own fields get SUB_KINDS. */
	kinds?: FieldKind[];
	/** A section's own fields: no table, index or search options. */
	sub?: boolean;
	/** A fixed set of fields (a feature's changed fields): no "Add field". */
	fixed?: boolean;
};

const ICON = { size: 14, strokeWidth: 1.75 };

/** The height of an xs input: row items that aren't inputs sit in a box this tall, so they stay level when a message opens under an input. */
const CELL = { align: 'center', minH: 8 } as const;

/** Red, for the input a problem is about. */
const invalidCss = (on: boolean) => (on ? { borderColor: 'red.500', 'aria-invalid': true as const, _hover: { borderColor: 'red.500' } } : {});

const FieldMessage: FC<{ children: ReactNode }> = ({ children }) => (
	<Text
		fontSize='xs'
		color='red.fg'
		mt={1}
		lineHeight='1.3'>
		{children}
	</Text>
);

/** An allowed value that's part of the problem: blank, listed twice, or not a number on a number field. */
const badOption = (f: EditableField, value: string) => {
	const v = (value || '').trim();
	if (!v) return true;
	if ((f.options || []).filter(o => (o.value || '').trim() === v).length > 1) return true;
	return f.kind === 'number' && !Number.isFinite(Number(v));
};

/** Where a problem found in the details panel is, for the note under a closed row. */
const DETAIL_LABEL: Record<string, string> = { options: 'Allowed values', default: 'Default', range: 'Min / max' };

const Small: FC<{ children: ReactNode }> = ({ children }) => (
	<Text
		fontSize='xs'
		fontWeight='600'
		mb={1.5}>
		{children}
	</Text>
);

const Check: FC<{ label: string; hint?: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }> = ({
	label,
	hint,
	checked,
	disabled,
	onChange,
}) => (
	<Switch.Root
		size='sm'
		checked={checked}
		disabled={disabled}
		onCheckedChange={e => onChange(e.checked)}
		title={hint}>
		<Switch.HiddenInput />
		<Switch.Control>
			<Switch.Thumb />
		</Switch.Control>
		<Switch.Label fontSize='xs'>{label}</Switch.Label>
	</Switch.Root>
);

const num = (v: string) => (v === '' ? null : Number(v));

/** A list default as text: "a, b, c". */
const listText = (v: any) => (Array.isArray(v) ? v.join(', ') : '');
const fromListText = (v: string) =>
	v
		.split(',')
		.map(x => x.trim())
		.filter(Boolean);

/** How a default reads in the collapsed row. */
const defaultSummary = (f: EditableField) => {
	const d = f.default;
	if (d === undefined || d === null || d === '' || (Array.isArray(d) && !d.length)) return '';
	if (f.kind === 'boolean') return d === true ? 'Yes' : '';
	if (f.kind === 'date') return d === 'now' ? 'when created' : String(d);
	const label = (v: any) => f.options?.find(o => o.value === String(v))?.label || String(v);
	return Array.isArray(d) ? d.map(label).join(', ') : label(d);
};

/** The default value control — shaped by the field's kind and allowed values. */
const DefaultInput: FC<{ f: EditableField; onChange: (v: any) => void; invalid?: boolean }> = ({ f, onChange, invalid }) => {
	const bad = invalidCss(!!invalid);
	const values = (f.options || []).filter(o => o.value?.trim());
	const isList = ARRAY_KINDS.includes(f.kind);

	if (f.kind === 'boolean')
		return (
			<Dropdown
				value={f.default === true ? 'true' : 'false'}
				onChange={v => onChange(v === 'true')}>
				<option value='false'>No</option>
				<option value='true'>Yes</option>
			</Dropdown>
		);
	if (f.kind === 'date') {
		const mode = f.default === 'now' ? 'now' : f.default ? 'date' : '';
		return (
			<Flex gap={2}>
				<Dropdown
					value={mode}
					onChange={v => onChange(v === 'now' ? 'now' : v === 'date' ? new Date().toISOString().slice(0, 10) : undefined)}>
					<option value=''>None</option>
					<option value='now'>When the record is created</option>
					<option value='date'>A date</option>
				</Dropdown>
				{mode === 'date' && (
					<Input
						size='sm'
						type='date'
						value={String(f.default).slice(0, 10)}
						onChange={e => onChange(e.target.value || undefined)}
					/>
				)}
			</Flex>
		);
	}
	if (values.length && isList) {
		const picked: string[] = Array.isArray(f.default) ? f.default : [];
		return (
			<Flex
				gap={1}
				flexWrap='wrap'>
				{values.map(o => {
					const on = picked.includes(o.value);
					return (
						<Button
							key={o.value}
							size='2xs'
							{...(invalid && picked.includes(o.value) && { colorPalette: 'red' })}
							variant={on ? 'solid' : 'outline'}
							onClick={() => onChange(on ? picked.filter(x => x !== o.value) : [...picked, o.value])}>
							{o.label || o.value}
						</Button>
					);
				})}
			</Flex>
		);
	}
	if (values.length)
		return (
			<Dropdown
				invalid={invalid}
				value={f.default === undefined || f.default === null ? '' : String(f.default)}
				onChange={v => onChange(v === '' ? undefined : f.kind === 'number' ? Number(v) : v)}>
				<option value=''>None</option>
				{values.map(o => (
					<option
						key={o.value}
						value={o.value}>
						{o.label || o.value}
					</option>
				))}
			</Dropdown>
		);
	if (isList)
		return (
			<Input
				size='sm'
				{...bad}
				placeholder={f.kind === 'tags' ? 'new, featured' : 'Addresses, separated by commas'}
				value={listText(f.default)}
				onChange={e => onChange(fromListText(e.target.value))}
			/>
		);
	if (f.kind === 'number')
		return (
			<Input
				size='sm'
				type='number'
				{...bad}
				value={f.default ?? ''}
				onChange={e => onChange(num(e.target.value) ?? undefined)}
			/>
		);
	if (f.kind === 'color')
		return (
			<Flex gap={2}>
				<Input
					size='sm'
					type='color'
					w='44px'
					p={1}
					value={f.default || '#000000'}
					onChange={e => onChange(e.target.value)}
				/>
				<Input
					size='sm'
					fontFamily='mono'
					placeholder='None'
					value={f.default ?? ''}
					onChange={e => onChange(e.target.value || undefined)}
				/>
			</Flex>
		);
	return (
		<Input
			size='sm'
			{...bad}
			placeholder={['image', 'file', 'video'].includes(f.kind) ? 'An address, or none' : 'None'}
			value={f.default ?? ''}
			onChange={e => onChange(e.target.value)}
		/>
	);
};

/**
 * The options of an Options field, typed straight into its row: Enter (or a
 * comma) adds one, × takes it away, Backspace in the empty input removes the
 * last. Labels are set in the row's details.
 */
const OptionsInput: FC<{
	id: string;
	field: EditableField;
	invalid?: boolean;
	onChange: (options: { value: string; label?: string }[]) => void;
	several: boolean;
	onSeveralChange: (on: boolean) => void;
}> = ({ id, field, invalid, onChange, several, onSeveralChange }) => {
	const [text, setText] = useState('');
	const options = (field.options || []).filter(o => o.value?.trim());
	const add = (raw: string) => {
		const values = raw
			.split(',')
			.map(v => v.trim())
			.filter(Boolean)
			.filter((v, i, all) => all.indexOf(v) === i && !options.some(o => o.value === v));
		if (values.length) onChange([...options, ...values.map(value => ({ value, label: '' }))]);
		setText('');
	};
	return (
		<Flex
			align='center'
			gap={3}
			flexWrap='wrap'>
			<Flex
				align='center'
				gap={1.5}
				flexWrap='wrap'
				flex='1'
				minW='240px'
				minH={8}
				px={2}
				py={1}
				borderWidth='1px'
				borderRadius='md'
				borderColor={invalid ? 'red.500' : 'border'}
				_focusWithin={{ borderColor: invalid ? 'red.500' : 'fg.muted' }}
				onClick={() => document.getElementById(id)?.focus()}>
				{options.map(o => (
					<Badge
						key={o.value}
						size='sm'
						variant='subtle'
						gap={1}>
						{o.label || o.value}
						<Box
							as='button'
							aria-label={`Remove ${o.value}`}
							lineHeight='1'
							opacity={0.6}
							_hover={{ opacity: 1 }}
							onClick={(e: any) => {
								e.stopPropagation();
								onChange(options.filter(x => x.value !== o.value));
							}}>
							<X size={11} />
						</Box>
					</Badge>
				))}
				<Input
					id={id}
					size='2xs'
					variant='flushed'
					border='none'
					flex='1'
					minW='140px'
					px={1}
					fontSize='xs'
					placeholder={options.length ? 'Add another…' : 'Type an option, press Enter'}
					value={text}
					onChange={e => (e.target.value.includes(',') ? add(e.target.value) : setText(e.target.value))}
					onBlur={() => text.trim() && add(text)}
					onKeyDown={e => {
						if (e.key === 'Enter') {
							e.preventDefault();
							add(text);
						} else if (e.key === 'Backspace' && !text && options.length) onChange(options.slice(0, -1));
					}}
				/>
			</Flex>
			<Check
				label='Allow several'
				hint='People can pick more than one'
				checked={several}
				onChange={onSeveralChange}
			/>
		</Flex>
	);
};

const FieldsEditor: FC<Props> = ({ fields, onChange, errors, targets, selfName, savedKinds = {}, hasRecords, kinds, sub, fixed }) => {
	// The section whose fields are being edited.
	const [sectionFor, setSectionFor] = useState<string | null>(null);
	const sectionField = sectionFor ? fields.find(f => f.uid === sectionFor) : undefined;
	const [open, setOpen] = useState<string | null>(null);
	// The formula field whose formula is being written.
	const [formulaFor, setFormulaFor] = useState<string | null>(null);
	const formulaField = formulaFor ? fields.find(f => f.uid === formulaFor) : undefined;
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);

	const set = (uid: string, patch: Partial<EditableField>) =>
		onChange(fields.map(f => (f.uid === uid ? { ...f, ...patch } : f)));

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

	const changeKind = (f: EditableField, kind: FieldKind) => {
		if (kind === f.kind) return;
		const toOptions = NEEDS_OPTIONS.includes(kind) && !NEEDS_OPTIONS.includes(f.kind);
		// A default of the old shape (one value vs a list) wouldn't fit the new kind — except between
		// one and several options, where a single default becomes a list of one and back.
		const between = NEEDS_OPTIONS.includes(kind) && NEEDS_OPTIONS.includes(f.kind);
		const keepDefault =
			ARRAY_KINDS.includes(kind) === ARRAY_KINDS.includes(f.kind) && kind !== 'date' && f.kind !== 'date';
		const d = f.default;
		const nextDefault = between
			? kind === 'multiselect'
				? d === undefined || d === '' ? undefined : [d]
				: Array.isArray(d) ? d[0] : d
			: !keepDefault || NO_DEFAULT_KINDS.includes(kind) || kind === 'boolean' || f.kind === 'boolean'
			? undefined
			: d;
		set(f.uid, {
			kind,
			...(!ENUM_KINDS.includes(kind) && { options: undefined }),
			...(!canBeUnique(kind) && { unique: false }),
			// A formula is calculated: never required, no default.
			...(kind === 'formula' && { required: false }),
			default: kind === 'formula' || SECTION_KINDS.includes(kind) ? undefined : nextDefault,
			// A section starts from a preset, changed in its field builder; between the two section kinds its fields stay.
			...(SECTION_KINDS.includes(kind)
				? {
						fields: f.fields?.length ? f.fields : sectionPreset(kind),
						required: false,
						// A section's values don't fit a table cell; a list shows its row count.
						...(kind === 'section' && { showInTable: false }),
				  }
				: { fields: undefined, addLabel: undefined }),
		});
		// Choosing a section opens its field builder.
		if (SECTION_KINDS.includes(kind)) setSectionFor(f.uid);
		// Choosing Formula opens the formula window.
		if (kind === 'formula') setFormulaFor(f.uid);
		// Choosing Options opens the input to type them in.
		if (toOptions) setTimeout(() => document.getElementById(`options-${f.uid}`)?.focus(), 0);
	};

	const add = () => {
		const uid = newUid();
		onChange([...fields, { uid, key: '', label: '', kind: 'text', showInTable: true }]);
		setOpen(null);
		// Focus lands on the new row's label once it renders.
		setTimeout(() => document.getElementById(`label-${uid}`)?.focus(), 0);
	};

	const linkOptions = [
		...(selfName !== undefined ? [{ value: SELF, label: `This model${selfName ? ` (${selfName})` : ''}` }] : []),
		...targets
			.filter(t => t.name !== selfName)
			.map(t => ({ value: t.name, label: `${t.title || t.name} · ${t.name}${t.built ? ' (built)' : ''}` })),
	];

	return (
		<Flex
			direction='column'
			gap={2}>
			{fields.length === 0 && (
				<Text
					fontSize='sm'
					color='fg.muted'>
					No fields yet. A model needs at least one.
				</Text>
			)}

			{fields.map((f, i) => {
				const isOpen = open === f.uid;
				const isTarget = dragIndex !== null && overIndex === i && dragIndex !== i;
				const error = errors[f.uid];
				const kindChanged = hasRecords && savedKinds[f.key] && savedKinds[f.key] !== f.kind;
				const isRef = REFERENCE_KINDS.includes(f.kind);

				return (
					<Box
						key={f.uid}
						draggable={!isOpen}
						onDragStart={(e: DragEvent) => {
							setDragIndex(i);
							e.dataTransfer.effectAllowed = 'move';
						}}
						onDragOver={(e: DragEvent) => {
							e.preventDefault();
							setOverIndex(i);
						}}
						onDrop={(e: DragEvent) => {
							e.preventDefault();
							drop(i);
						}}
						onDragEnd={() => {
							setDragIndex(null);
							setOverIndex(null);
						}}
						borderWidth='1px'
						borderStyle={isTarget ? 'dashed' : 'solid'}
						borderColor={isTarget ? 'fg' : 'border'}
						borderRadius={radius.CONTAINER}
						bg='bg.panel'
						opacity={dragIndex === i ? 0.4 : 1}>
						<Flex
							align='flex-start'
							gap={2}
							px={2.5}
							py={1.5}
							flexWrap='wrap'>
							<Flex
								{...CELL}
								color='fg.subtle'
								cursor='grab'
								title='Drag to reorder'>
								<GripVertical {...ICON} />
							</Flex>
							<Input
								id={`label-${f.uid}`}
								size='xs'
								w='170px'
								placeholder='Label, e.g. Due date'
								value={f.label || ''}
								onChange={e => {
									const label = e.target.value;
									set(f.uid, { label, ...(!f.keyTouched && { key: toKey(label) }) });
								}}
							/>
							<Box w='140px'>
								<Input
									size='xs'
									fontFamily='mono'
									placeholder='key'
									title='The field’s name in the database and the API'
									value={f.key}
									{...invalidCss(error?.on === 'key')}
									onChange={e => set(f.uid, { key: e.target.value.replace(/\s/g, ''), keyTouched: true })}
								/>
								{error?.on === 'key' && <FieldMessage>{error.message}</FieldMessage>}
							</Box>
							<Dropdown
								size='xs'
								w='150px'
								// Options for one and for several are one entry; the switch beside it picks.
								value={f.kind === 'multiselect' ? 'select' : f.kind}
								onChange={v => changeKind(f, v as FieldKind)}>
								{KIND_GROUPS.filter(g => KINDS.some(k => k.group === g && (!kinds || kinds.includes(k.value)))).map(g => (
									<optgroup
										key={g}
										label={g}>
										{KINDS.filter(k => k.group === g && !k.hidden && (!kinds || kinds.includes(k.value))).map(k => (
											<option
												key={k.value}
												value={k.value}>
												{k.label}
											</option>
										))}
									</optgroup>
								))}
							</Dropdown>
							{isRef && (
								<Box w='220px'>
									<Dropdown
										size='xs'
										placeholder='Links to…'
										invalid={error?.on === 'ref'}
										value={f.ref === selfName && selfName ? SELF : f.ref || ''}
										onChange={v => set(f.uid, { ref: v })}>
										{linkOptions.map(o => (
											<option
												key={o.value}
												value={o.value}>
												{o.label}
											</option>
										))}
									</Dropdown>
									{error?.on === 'ref' && <FieldMessage>{error.message}</FieldMessage>}
								</Box>
							)}
							{SECTION_KINDS.includes(f.kind) ? (
								<Box maxW='280px'>
									<Button
										size='xs'
										variant='outline'
										borderColor={error?.on === 'fields' ? 'red.solid' : undefined}
										color={error?.on === 'fields' ? 'red.fg' : undefined}
										title='Choose the section’s fields'
										onClick={() => setSectionFor(f.uid)}>
										<ListTree size={12} />
										<Text
											as='span'
											truncate>
											{f.fields?.length
												? `${f.fields.length} field${f.fields.length === 1 ? '' : 's'}: ${f.fields
														.map(x => x.label || x.key)
														.join(', ')}`
												: 'Choose fields'}
										</Text>
									</Button>
									{error?.on === 'fields' && <FieldMessage>{error.message}</FieldMessage>}
								</Box>
							) : f.kind === 'formula' ? (
								<Box maxW='280px'>
									{(() => {
										const c = f.formula?.trim() ? checkFormula(f.formula, formulaFieldsOf(fields), f.key) : null;
										return (
											<Button
												size='xs'
												variant='outline'
												maxW='280px'
												borderColor={error?.on === 'formula' ? 'red.solid' : undefined}
												color={error?.on === 'formula' ? 'red.fg' : undefined}
												title='Write the formula'
												onClick={() => setFormulaFor(f.uid)}>
												<Calculator size={12} />
												<Text
													as='span'
													fontFamily='mono'
													truncate>
													{c ? `= ${c.formatted || f.formula}` : 'Set formula'}
												</Text>
											</Button>
										);
									})()}
									{error?.on === 'formula' && <FieldMessage>{error.message}</FieldMessage>}
								</Box>
							) : (
								<Flex {...CELL}>
									<Check
										label='Required'
										checked={!!f.required}
										onChange={v => set(f.uid, { required: v })}
									/>
								</Flex>
							)}
							<Flex
								{...CELL}
								gap={2}
								flexWrap='wrap'>
							{hasOptions(f) && !NEEDS_OPTIONS.includes(f.kind) && (
								<Badge
									size='xs'
									variant='subtle'
									cursor='pointer'
									title={(f.options || []).map(o => o.value).filter(Boolean).join(', ')}
									onClick={() => setOpen(f.uid)}>
									{(f.options || []).filter(o => o.value).length} allowed values
								</Badge>
							)}
							{defaultSummary(f) && (
								<Badge
									size='xs'
									variant='subtle'
									cursor='pointer'
									maxW='180px'
									truncate
									onClick={() => setOpen(f.uid)}>
									default: {defaultSummary(f)}
								</Badge>
							)}
							{kindChanged && (
								<Badge
									size='xs'
									colorPalette='orange'
									variant='subtle'
									title='Existing records keep their old values; the new kind may not be able to read them'>
									<AlertTriangle size={11} />
									was {KINDS.find(k => k.value === savedKinds[f.key])?.label}
								</Badge>
							)}
							</Flex>
							<Flex
								{...CELL}
								ml='auto'
								gap={1}>
								<IconButton
									size='xs'
									variant='ghost'
									aria-label={isOpen ? 'Fewer options' : 'More options'}
									onClick={() => setOpen(isOpen ? null : f.uid)}>
									{isOpen ? <ChevronDown {...ICON} /> : <ChevronRight {...ICON} />}
								</IconButton>
								<IconButton
									size='xs'
									variant='ghost'
									aria-label='Remove field'
									title={
										hasRecords && savedKinds[f.key]
											? 'Remove the field. Its values stay in existing records but are no longer shown or returned.'
											: 'Remove the field'
									}
									onClick={() => onChange(fields.filter(x => x.uid !== f.uid))}>
									<Trash2 {...ICON} />
								</IconButton>
							</Flex>
							{NEEDS_OPTIONS.includes(f.kind) && (
								<Box
									w='full'
									pl='22px'>
									<OptionsInput
										id={`options-${f.uid}`}
										field={f}
										invalid={error?.on === 'options'}
										onChange={options => set(f.uid, { options })}
										several={f.kind === 'multiselect'}
										onSeveralChange={on => changeKind(f, on ? 'multiselect' : 'select')}
									/>
									{error?.on === 'options' && <FieldMessage>{error.message}</FieldMessage>}
								</Box>
							)}
						</Flex>

						{!isOpen && error && DETAIL_LABEL[error.on] && !(error.on === 'options' && NEEDS_OPTIONS.includes(f.kind)) && (
							<Text
								as='button'
								fontSize='xs'
								color='red.fg'
								px={2.5}
								pb={2}
								ml='32px'
								textAlign='left'
								onClick={() => setOpen(f.uid)}>
								{DETAIL_LABEL[error.on]}: {error.message} — <u>show</u>
							</Text>
						)}

						{isOpen && (
							<Box
								px={4}
								pb={4}
								pt={2}
								borderTopWidth='1px'
								borderColor='border.muted'>
								<Text
									fontSize='xs'
									color='fg.muted'
									mb={3}>
									{KINDS.find(k => k.value === f.kind)?.hint}
								</Text>
								{!sub && (
								<Flex
									gap={5}
									flexWrap='wrap'
									mb={4}>
									<Check
										label='Show in the table'
										checked={f.showInTable !== false}
										onChange={v => set(f.uid, { showInTable: v })}
									/>
									{canBeUnique(f.kind) && (
										<Check
											label='Unique'
											hint='No two records can share a value'
											checked={!!f.unique}
											onChange={v => set(f.uid, { unique: v })}
										/>
									)}
									{!f.unique && f.kind !== 'boolean' && f.kind !== 'password' && (
										<Check
											label='Index'
											hint='Faster filtering and sorting on large collections'
											checked={!!f.index}
											onChange={v => set(f.uid, { index: v })}
										/>
									)}
									{['text', 'textarea', 'editor', 'email', 'url', 'select', 'tags'].includes(f.kind) && (
										<Check
											label='Searchable'
											hint='The table’s search box matches it'
											checked={f.searchable ?? ['text', 'email', 'select', 'tags'].includes(f.kind)}
											onChange={v => set(f.uid, { searchable: v })}
										/>
									)}
								</Flex>
								)}

								<Grid
									templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
									gap={3}>
									{(f.kind === 'number' || hasLength(f.kind)) && (
										<>
											<Box>
												<Small>{f.kind === 'number' ? 'Minimum' : 'Minimum length'}</Small>
												<Input
													size='sm'
													type='number'
													value={f.min ?? ''}
													{...invalidCss(error?.on === 'range')}
													onChange={e => set(f.uid, { min: num(e.target.value) })}
												/>
											</Box>
											<Box>
												<Small>{f.kind === 'number' ? 'Maximum' : 'Maximum length'}</Small>
												<Input
													size='sm'
													type='number'
													value={f.max ?? ''}
													{...invalidCss(error?.on === 'range')}
													onChange={e => set(f.uid, { max: num(e.target.value) })}
												/>
												{error?.on === 'range' && <FieldMessage>{error.message}</FieldMessage>}
											</Box>
										</>
									)}
									{!NO_DEFAULT_KINDS.includes(f.kind) && (
										<Box gridColumn={ARRAY_KINDS.includes(f.kind) ? { md: 'span 3' } : undefined}>
											<Small>Default</Small>
											<DefaultInput
												f={f}
												invalid={error?.on === 'default'}
												onChange={v => set(f.uid, { default: v })}
											/>
											{error?.on === 'default' && <FieldMessage>{error.message}</FieldMessage>}
										</Box>
									)}
									<Box gridColumn={{ md: 'span 3' }}>
										<Small>Help text</Small>
										<Input
											size='sm'
											placeholder='Shown under the input in the form'
											value={f.helper || ''}
											onChange={e => set(f.uid, { helper: e.target.value })}
										/>
									</Box>
								</Grid>

								{ENUM_KINDS.includes(f.kind) && (
									<Box mt={4}>
										<Small>{NEEDS_OPTIONS.includes(f.kind) ? 'Options and their labels' : 'Allowed values (enum)'}</Small>
										<Text
											fontSize='xs'
											color='fg.muted'
											mb={2}>
											{NEEDS_OPTIONS.includes(f.kind)
												? 'The value is what’s stored; the label, if any, is what people see.'
												: 'Optional. With any, the field only takes these values and the form offers them as a list.'}
										</Text>
										<Flex
											direction='column'
											gap={1.5}>
											{(f.options || []).map((o, oi) => (
												<Flex
													key={oi}
													gap={2}
													align='center'>
													<Input
														size='xs'
														w='180px'
														fontFamily='mono'
														placeholder={f.kind === 'number' ? '1' : 'value'}
														type={f.kind === 'number' ? 'number' : 'text'}
														value={o.value}
														{...invalidCss(error?.on === 'options' && badOption(f, o.value))}
														onChange={e =>
															set(f.uid, {
																options: (f.options || []).map((x, xi) =>
																	xi === oi ? { ...x, value: e.target.value.trim() } : x
																),
															})
														}
													/>
													<Input
														size='xs'
														w='220px'
														placeholder='Label (optional)'
														value={o.label || ''}
														onChange={e =>
															set(f.uid, {
																options: (f.options || []).map((x, xi) => (xi === oi ? { ...x, label: e.target.value } : x)),
															})
														}
													/>
													<IconButton
														size='xs'
														variant='ghost'
														aria-label='Remove option'
														onClick={() => set(f.uid, { options: (f.options || []).filter((_, xi) => xi !== oi) })}>
														<X {...ICON} />
													</IconButton>
												</Flex>
											))}
											<Box>
												<Button
													size='xs'
													variant='ghost'
													onClick={() => set(f.uid, { options: [...(f.options || []), { value: '', label: '' }] })}>
													<Plus {...ICON} />
													Allowed value
												</Button>
											</Box>
										</Flex>
										{error?.on === 'options' && !NEEDS_OPTIONS.includes(f.kind) && <FieldMessage>{error.message}</FieldMessage>}
									</Box>
								)}
							</Box>
						)}
					</Box>
				);
			})}

			<Box display={fixed ? 'none' : undefined}>
				<Button
					size='xs'
					variant='outline'
					onClick={add}>
					<Plus {...ICON} />
					Add field
				</Button>
			</Box>

			<SectionFieldsModal
				isOpen={!!sectionField}
				onClose={() => setSectionFor(null)}
				field={sectionField}
				onSave={patch => {
					if (sectionField) set(sectionField.uid, patch);
					setSectionFor(null);
				}}
			/>

			<FormulaModal
				isOpen={!!formulaField}
				onClose={() => setFormulaFor(null)}
				fieldKey={formulaField?.key || ''}
				fieldTitle={formulaField?.label || formulaField?.key}
				formula={formulaField?.formula || ''}
				fields={formulaFieldsOf(fields)}
				onSave={formula => {
					if (formulaField) set(formulaField.uid, { formula });
					setFormulaFor(null);
				}}
			/>
		</Flex>
	);
};

export default FieldsEditor;
