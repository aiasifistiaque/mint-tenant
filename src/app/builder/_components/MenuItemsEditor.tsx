'use client';

import { DragEvent, FC, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, IconButton, Input, Text, Textarea } from '@chakra-ui/react';
import { AlertTriangle, ChevronDown, ChevronRight, GripVertical, Lock, LockOpen, Plus, Trash2, X } from 'lucide-react';
import { radius, useGetBuilderRouteQuery, useGetBuilderRoutesQuery, useGetPdfTemplatesQuery } from '@/components/library';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import { KEY_TYPES, MenuItem, MenuType, Param, Preset, validateMenu } from './menuTypes';
import { TableField } from './TableColumnsEditor';
import { Dropdown } from '@/components/library/cl';
import ConditionsEditor, { conditionsText } from './ConditionsEditor';
import { ModelField } from './filterTypes';
import { SettingsField } from './SettingsEditor';

type Props = {
	items: MenuItem[];
	types: MenuType[];
	fields: TableField[];
	onChange: (items: MenuItem[]) => void;
	addLabel?: string;
	/**
	 * The row menu only: this page's model fields, for "Show only when" on
	 * every item (a bill's "Add payment" while it isn't paid), and its route —
	 * an add-related item fills in the new record's link back to it.
	 */
	conditionFields?: ModelField[];
	route?: string;
	/** "Bill" — how this page's record is named in the "Filled in" rows. */
	recordName?: string;
};

const ICON = { size: 14, strokeWidth: 1.75 };

const Label: FC<{ children: any; hint?: string }> = ({ children, hint }) => (
	<Box mb={1.5}>
		<Text
			fontSize='xs'
			fontWeight='600'>
			{children}
		</Text>
		{hint && (
			<Text
				fontSize='11px'
				color='fg.muted'>
				{hint}
			</Text>
		)}
	</Box>
);

const Select: FC<{ value: string; onChange: (v: string) => void; children: any; placeholder?: string }> = ({
	value,
	onChange,
	children,
	placeholder,
}) => (
	<Dropdown
		value={value}
		placeholder={placeholder}
		onChange={onChange}>
		{children}
	</Dropdown>
);

/**
 * A JSON value edited as text: kept as typed while it doesn't parse, so a
 * half-written object isn't thrown away; committed once it does.
 */
const JsonInput: FC<{ value: any; onChange: (v: any) => void }> = ({ value, onChange }) => {
	const [text, setText] = useState(value === undefined ? '' : JSON.stringify(value, null, 2));
	const [bad, setBad] = useState(false);
	return (
		<>
			<Textarea
				size='sm'
				fontFamily='mono'
				fontSize='xs'
				rows={3}
				value={text}
				placeholder='{ "status": "archived" }'
				onChange={e => {
					setText(e.target.value);
					if (!e.target.value.trim()) {
						setBad(false);
						return onChange(undefined);
					}
					try {
						onChange(JSON.parse(e.target.value));
						setBad(false);
					} catch {
						setBad(true);
					}
				}}
			/>
			{bad && (
				<Text
					fontSize='11px'
					color='red.fg'>
					Not valid JSON yet — the last valid value is kept.
				</Text>
			)}
		</>
	);
};

/** A page's settings fields as the builder shows them (draft first). */
const settingsOf = (data: any): SettingsField[] =>
	(data?.settings?.draft ?? data?.settings?.data)?.fields || data?.code?.settings?.fields || [];
const fieldLabel = (f?: SettingsField) => f?.schema?.label || f?.title || f?.key || '';

/** Another page of the panel; picking one fills in its link back to this page. */
/** Download PDF: one of this page's PDF templates, or its default (backend docs/pdf-templates). */
const PdfTemplateInput: FC<{ item: MenuItem; route?: string; set: (patch: any) => void }> = ({ item, route, set }) => {
	const { data, isLoading } = useGetPdfTemplatesQuery({ route }, { skip: !route });
	const templates: any[] = data?.templates || [];
	if (!isLoading && !templates.length)
		return (
			<Text
				fontSize='xs'
				color='fg.muted'>
				This page has no PDF template yet —{' '}
				<a
					href={projectHref('/pdf-templates')}
					target='_blank'
					rel='noopener noreferrer'
					style={{ textDecoration: 'underline' }}>
					make one under PDF templates
				</a>
				. The option stays hidden until it has.
			</Text>
		);
	return (
		<Dropdown
			size='sm'
			value={(item as any).template || ''}
			onChange={v => set({ template: v || undefined })}>
			<option value=''>The page’s default</option>
			{templates.map(t => (
				<option
					key={t._id}
					value={t._id}>
					{t.name}
					{t.isDefault ? ' (default now)' : ''}
				</option>
			))}
		</Dropdown>
	);
};

const RouteInput: FC<{ item: MenuItem; route?: string; set: (patch: any) => void }> = ({ item, route, set }) => {
	const { data: all } = useGetBuilderRoutesQuery();
	const [picked, setPicked] = useState<string | null>(null);
	const { data: target, isFetching } = useGetBuilderRouteQuery(picked as string, { skip: !picked });
	const pages = useMemo(
		() =>
			(all?.doc || [])
				.filter((r: any) => r.kind !== 'custom' && r.model && r.route !== route)
				.sort((a: any, b: any) => String(a.title || a.route).localeCompare(String(b.title || b.route))),
		[all, route]
	);
	// Once the picked page loads: its fields that pick this page start the list, locked.
	useEffect(() => {
		if (!picked || isFetching || !target) return;
		const links = settingsOf(target).filter(f => route && f.schema?.model === route);
		if (links.length && item.route === picked && !(item.presets || []).length)
			set({ presets: links.map(f => ({ field: f.key, from: '_id', lock: true })) });
		setPicked(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [picked, isFetching, target]);
	return (
		<Dropdown
			value={item.route || ''}
			placeholder='Pick a page'
			onChange={(v: string) => {
				set({ route: v, presets: [] });
				setPicked(v);
			}}>
			{pages.map((r: any) => (
				<option
					key={r.route}
					value={r.route}>
					{r.title || r.route} ({r.route})
				</option>
			))}
		</Dropdown>
	);
};

const VALUE = '__value';

/** The new record's fields filled from this row — or a fixed value — each optionally locked. */
const PresetsInput: FC<{ item: MenuItem; fields: TableField[]; recordName: string; set: (patch: any) => void }> = ({
	item,
	fields,
	recordName,
	set,
}) => {
	const { data: target, isFetching } = useGetBuilderRouteQuery(item.route as string, { skip: !item.route });
	const targetFields = useMemo(() => settingsOf(target).filter(f => f.schema?.type !== 'formula' && !f.rollup), [target]);
	const presets: Preset[] = Array.isArray(item.presets) ? item.presets : [];
	const setPresets = (next: Preset[]) => set({ presets: next.length ? next : undefined });
	const setOne = (i: number, patch: Partial<Preset>) => setPresets(presets.map((p, j) => (j === i ? { ...p, ...patch } : p)));
	if (!item.route)
		return (
			<Text
				fontSize='xs'
				color='fg.muted'>
				Pick the page first.
			</Text>
		);
	return (
		<Flex
			direction='column'
			gap={1.5}>
			{isFetching && !targetFields.length && (
				<Text
					fontSize='xs'
					color='fg.muted'>
					Loading its fields…
				</Text>
			)}
			{presets.map((p, i) => {
				const tf = targetFields.find(f => f.key === p.field);
				const yesNo = tf?.type === 'boolean' || ['checkbox', 'switch'].includes(tf?.schema?.type);
				const options: any[] = yesNo
					? [
							{ value: 'true', label: 'Yes' },
							{ value: 'false', label: 'No' },
					  ]
					: Array.isArray(tf?.schema?.options)
					? tf!.schema.options
					: [];
				return (
					<Flex
						key={i}
						gap={2}
						align='center'
						wrap={{ base: 'wrap', md: 'nowrap' }}>
						<Box
							flex='1'
							minW='140px'>
							<Dropdown
								size='xs'
								value={p.field || ''}
								placeholder='Field'
								onChange={(v: string) => setOne(i, { field: v })}>
								{targetFields.map(f => (
									<option
										key={f.key}
										value={f.key}>
										{fieldLabel(f)}
									</option>
								))}
							</Dropdown>
						</Box>
						<Text
							fontSize='xs'
							color='fg.muted'>
							←
						</Text>
						<Box
							flex='1'
							minW='140px'>
							<Dropdown
								size='xs'
								value={p.from === undefined ? VALUE : p.from}
								onChange={(v: string) => setOne(i, v === VALUE ? { from: undefined, value: '' } : { from: v, value: undefined })}>
								<option value='_id'>{`This ${recordName}`}</option>
								{fields.map(f => (
									<option
										key={f.key}
										value={f.key}>
										{`${recordName}’s ${f.label}`}
									</option>
								))}
								<option value={VALUE}>A value</option>
							</Dropdown>
						</Box>
						{p.from === undefined && (
							<Box
								flex='1'
								minW='120px'>
								{options.length ? (
									<Dropdown
										size='xs'
										value={p.value === undefined ? '' : String(p.value)}
										placeholder='Pick'
										onChange={(v: string) => setOne(i, { value: yesNo ? v === 'true' : v })}>
										{options.map((o: any) => {
											const v = typeof o === 'object' ? o.value : o;
											return (
												<option
													key={String(v)}
													value={v}>
													{typeof o === 'object' ? o.label ?? v : o}
												</option>
											);
										})}
									</Dropdown>
								) : (
									<Input
										size='xs'
										placeholder='Value'
										value={p.value ?? ''}
										onChange={e => setOne(i, { value: tf?.type === 'number' && e.target.value !== '' && !isNaN(Number(e.target.value)) ? Number(e.target.value) : e.target.value })}
									/>
								)}
							</Box>
						)}
						<IconButton
							size='xs'
							variant={p.lock ? 'subtle' : 'ghost'}
							aria-label={p.lock ? 'Locked — click to let it be changed' : 'Can be changed — click to lock'}
							title={p.lock ? 'Locked: shown, can’t be changed' : 'Can be changed in the form'}
							onClick={() => setOne(i, { lock: !p.lock || undefined })}>
							{p.lock ? <Lock {...ICON} /> : <LockOpen {...ICON} />}
						</IconButton>
						<IconButton
							size='xs'
							variant='ghost'
							aria-label='Remove this field'
							onClick={() => setPresets(presets.filter((_, j) => j !== i))}>
							<X {...ICON} />
						</IconButton>
					</Flex>
				);
			})}
			<Box>
				<Button
					size='xs'
					variant='outline'
					onClick={() => setPresets([...presets, { field: '', from: '_id' }])}>
					<Plus {...ICON} />
					Fill in a field
				</Button>
			</Box>
		</Flex>
	);
};

const ParamInput: FC<{
	param: Param;
	item: MenuItem;
	fields: TableField[];
	set: (patch: any) => void;
	route?: string;
	recordName: string;
}> = ({ param, item, fields, set, route, recordName }) => {
	const value = item[param.name];
	switch (param.kind) {
		case 'fieldValue': {
			const f = fields.find(x => x.key === item.key);
			if (!f)
				return (
					<Text
						fontSize='xs'
						color='fg.muted'>
						Pick the field first.
					</Text>
				);
			const yesNo = f.type === 'boolean' || ['checkbox', 'switch'].includes(f.input || '');
			const options: any[] = yesNo
				? [
						{ value: 'true', label: 'Yes' },
						{ value: 'false', label: 'No' },
				  ]
				: Array.isArray(f.options)
				? f.options
				: [];
			// The labels go with the item, for the confirmation it asks by default.
			const setValue = (v: any, valueLabel: string) => set({ [param.name]: v, fieldLabel: f.label, valueLabel });
			if (options.length)
				return (
					<Select
						value={value === undefined ? '' : String(value)}
						placeholder='Pick a value'
						onChange={v => {
							const o = options.find((x: any) => String(typeof x === 'object' ? x.value : x) === v);
							setValue(yesNo ? v === 'true' : v, String(typeof o === 'object' ? o.label ?? o.value : o ?? v));
						}}>
						{options.map((o: any) => {
							const v = typeof o === 'object' ? o.value : o;
							return (
								<option
									key={String(v)}
									value={String(v)}>
									{typeof o === 'object' ? o.label ?? v : o}
								</option>
							);
						})}
					</Select>
				);
			return (
				<Input
					size='sm'
					value={value ?? ''}
					onChange={e => {
						const t = e.target.value;
						const v = f.type === 'number' && t !== '' && !isNaN(Number(t)) ? Number(t) : t;
						setValue(v, t);
					}}
				/>
			);
		}
		case 'route':
			return (
				<RouteInput
					item={item}
					route={route}
					set={set}
				/>
			);
		case 'pdfTemplate':
			return (
				<PdfTemplateInput
					item={item}
					route={route}
					set={set}
				/>
			);
		case 'presets':
			return (
				<PresetsInput
					item={item}
					fields={fields}
					recordName={recordName}
					set={set}
				/>
			);
		case 'text':
			return (
				<Input
					size='sm'
					value={value || ''}
					onChange={e => set({ [param.name]: e.target.value })}
				/>
			);
		case 'field':
			return (
				<Select
					value={value || ''}
					placeholder='Pick a field'
					// Set a field: a new field's value is picked again.
					onChange={v => set({ [param.name]: v, ...(item.type === 'set-field' && v !== value && { value: undefined, fieldLabel: undefined, valueLabel: undefined }) })}>
					{fields.map(f => (
						<option
							key={f.key}
							value={f.key}>
							{f.label} ({f.key})
						</option>
					))}
				</Select>
			);
		case 'keyType':
			return (
				<Select
					value={value || ''}
					placeholder='Pick an input'
					onChange={v => set({ [param.name]: v })}>
					{KEY_TYPES.map(k => (
						<option
							key={k.value}
							value={k.value}>
							{k.label}
						</option>
					))}
				</Select>
			);
		case 'fields': {
			const selected: string[] = value || [];
			return (
				<Flex
					flexWrap='wrap'
					gap={1.5}>
					{fields.map(f => {
						const on = selected.includes(f.key);
						return (
							<Button
								key={f.key}
								size='2xs'
								variant={on ? 'solid' : 'outline'}
								onClick={() =>
									set({ [param.name]: on ? selected.filter(k => k !== f.key) : [...selected, f.key] })
								}>
								{f.label}
							</Button>
						);
					})}
				</Flex>
			);
		}
		case 'options': {
			const options: { value: any; label: string }[] = value || [];
			const setOptions = (next: any[]) => set({ [param.name]: next });
			return (
				<Flex
					direction='column'
					gap={1.5}>
					{options.map((o, i) => (
						<Flex
							key={i}
							gap={2}>
							<Input
								size='sm'
								placeholder='Value'
								value={o.value ?? ''}
								onChange={e => setOptions(options.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
							/>
							<Input
								size='sm'
								placeholder='Label'
								value={o.label ?? ''}
								onChange={e => setOptions(options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
							/>
							<IconButton
								size='xs'
								variant='ghost'
								aria-label='Remove option'
								onClick={() => setOptions(options.filter((_, j) => j !== i))}>
								<X {...ICON} />
							</IconButton>
						</Flex>
					))}
					<Box>
						<Button
							size='xs'
							variant='outline'
							onClick={() => setOptions([...options, { value: '', label: '' }])}>
							<Plus {...ICON} />
							Add option
						</Button>
					</Box>
				</Flex>
			);
		}
		case 'json':
			return (
				<JsonInput
					value={value}
					onChange={v => set({ [param.name]: v })}
				/>
			);
		case 'prompt': {
			const p = value || {};
			const setP = (patch: any) => {
				const next = { ...p, ...patch };
				// All three empty means no confirmation at all.
				set({ [param.name]: next.title || next.body || next.btnText ? next : undefined });
			};
			return (
				<Grid
					templateColumns={{ base: '1fr', md: '1fr 2fr 1fr' }}
					gap={2}>
					<Input
						size='sm'
						placeholder='Title'
						value={p.title || ''}
						onChange={e => setP({ title: e.target.value })}
					/>
					<Input
						size='sm'
						placeholder='What will happen'
						value={p.body || ''}
						onChange={e => setP({ body: e.target.value })}
					/>
					<Input
						size='sm'
						placeholder='Button text'
						value={p.btnText || ''}
						onChange={e => setP({ btnText: e.target.value })}
					/>
				</Grid>
			);
		}
		default:
			return null;
	}
};

/**
 * An ordered list of menu items — the row menu or the bulk-select menu.
 * Rows are dragged to reorder; a row expands to show the parameters its type
 * reads, and nothing else.
 */
const MenuItemsEditor: FC<Props> = ({ items, types, fields, onChange, addLabel = 'Add item', conditionFields, route, recordName = 'record' }) => {
	const [open, setOpen] = useState<number | null>(null);
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);
	const errors = validateMenu(items, types);

	const setItem = (i: number, patch: any) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));

	const changeType = (i: number, type: string) => {
		const def = types.find(t => t.value === type);
		const current = items[i];
		// Keep only the title (and when it shows): the old type's parameters mean nothing to the new one.
		const title = current.title && current.title !== types.find(t => t.value === current.type)?.label ? current.title : def?.label;
		const { showIf, showMatch } = current;
		onChange(items.map((it, j) => (j === i ? { type, title, ...(showIf?.length && { showIf, showMatch }) } : it)));
		if (def?.params?.length) setOpen(i);
	};

	const drop = (index: number) => {
		if (dragIndex !== null && dragIndex !== index) {
			const next = [...items];
			const [moved] = next.splice(dragIndex, 1);
			next.splice(index, 0, moved);
			onChange(next);
			setOpen(null);
		}
		setDragIndex(null);
		setOverIndex(null);
	};

	return (
		<Flex
			direction='column'
			gap={2}>
			{items.length === 0 && (
				<Text
					fontSize='xs'
					color='fg.muted'>
					No items.
				</Text>
			)}
			{items.map((item, i) => {
				const type = types.find(t => t.value === item.type);
				const isOpen = open === i;
				const isTarget = dragIndex !== null && overIndex === i && dragIndex !== i;
				return (
					<Box
						key={i}
						draggable={!isOpen}
						onDragStart={(e: DragEvent) => {
							setDragIndex(i);
							e.dataTransfer.effectAllowed = 'move';
							e.dataTransfer.setData('text/plain', String(i));
						}}
						onDragOver={(e: DragEvent) => {
							e.preventDefault();
							if (overIndex !== i) setOverIndex(i);
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
						data-menu-invalid={errors[i] ? '' : undefined}
						borderColor={errors[i] ? 'red.500' : isTarget ? 'fg' : 'border'}
						borderRadius={radius.CONTAINER}
						bg='bg.panel'
						opacity={dragIndex === i ? 0.4 : 1}>
						<Flex
							align='center'
							gap={2}
							px={2.5}
							py={1.5}>
							<Flex
								color='fg.subtle'
								cursor='grab'
								title='Drag to reorder'>
								<GripVertical {...ICON} />
							</Flex>
							<Text
								fontSize='xs'
								color='fg.subtle'
								fontFamily='mono'
								w='16px'>
								{i + 1}
							</Text>
							<Input
								size='xs'
								flex='1'
								minW='120px'
								value={item.title || ''}
								placeholder='Title'
								onChange={e => setItem(i, { title: e.target.value })}
							/>
							{type ? (
								<Box w='200px'>
									<Select
										value={item.type}
										onChange={v => changeType(i, v)}>
										{types.map(t => (
											<option
												key={t.value}
												value={t.value}>
												{t.label}
											</option>
										))}
									</Select>
								</Box>
							) : (
								<Badge
									variant='outline'
									title='Not editable here — kept exactly as it is'>
									{item.type}
								</Badge>
							)}
							{(!!type?.params?.length || (!!conditionFields && !!type)) && (
								<IconButton
									size='xs'
									variant='ghost'
									aria-label={isOpen ? 'Hide options' : 'Show options'}
									onClick={() => setOpen(isOpen ? null : i)}>
									{isOpen ? <ChevronDown {...ICON} /> : <ChevronRight {...ICON} />}
								</IconButton>
							)}
							<IconButton
								size='xs'
								variant='ghost'
								aria-label='Remove item'
								color='red.500'
								_dark={{ color: 'red.300' }}
								onClick={() => {
									onChange(items.filter((_, j) => j !== i));
									setOpen(null);
								}}>
								<Trash2 {...ICON} />
							</IconButton>
						</Flex>

						{type && (
							<Text
								px={2.5}
								pb={isOpen ? 0 : 1.5}
								pl='52px'
								fontSize='11px'
								color='fg.muted'>
								{type.hint}
								{!isOpen && item.showIf?.length ? ` · Only when ${conditionsText(item.showIf, item.showMatch)}` : ''}
							</Text>
						)}

						{isOpen && (type?.params || conditionFields) && (
							<Flex
								direction='column'
								gap={3}
								p={3}
								pl='52px'>
								{(type?.params || []).map(p => (
									<Box key={p.name}>
										<Label hint={p.hint}>
											{p.label}
											{p.required ? ' *' : ''}
										</Label>
										<ParamInput
											param={p}
											item={item}
											fields={fields}
											set={patch => setItem(i, patch)}
											route={route}
											recordName={recordName}
										/>
									</Box>
								))}
								{conditionFields && type && (
									<Box>
										<Label hint='Hides this option on rows that don’t match — it doesn’t stop a save; a Linked Relationships rule does that.'>
											Show only when
										</Label>
										<ConditionsEditor
											fields={conditionFields}
											where={item.showIf || []}
											onChange={w => setItem(i, { showIf: w.length ? w : undefined, ...(!w.length && { showMatch: undefined }) })}
											match={item.showMatch}
											onMatch={m => setItem(i, { showMatch: m === 'any' ? 'any' : undefined })}
											hint='Only on rows where these hold'
											emptyHint='On every row'
										/>
									</Box>
								)}
							</Flex>
						)}

						{errors[i] && (
							<Flex
								align='center'
								gap={1.5}
								px={2.5}
								py={1}
								fontSize='xs'
								bg='red.subtle'
								color='red.fg'>
								<AlertTriangle size={12} />
								{errors[i]}
							</Flex>
						)}
					</Box>
				);
			})}
			<Box>
				<Button
					size='xs'
					variant='outline'
					onClick={() => {
						onChange([...items, { type: types[0].value, title: types[0].label }]);
						setOpen(types[0].params?.length ? items.length : null);
					}}>
					<Plus {...ICON} />
					{addLabel}
				</Button>
			</Box>
		</Flex>
	);
};

export default MenuItemsEditor;
