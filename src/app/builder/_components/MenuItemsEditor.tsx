'use client';

import { DragEvent, FC, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, IconButton, Input, Text, Textarea } from '@chakra-ui/react';
import { AlertTriangle, ChevronDown, ChevronRight, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { radius } from '@/components/library';
import { KEY_TYPES, MenuItem, MenuType, Param, validateMenu } from './menuTypes';
import { TableField } from './TableColumnsEditor';
import { Dropdown } from '@/components/library/cl';

type Props = {
	items: MenuItem[];
	types: MenuType[];
	fields: TableField[];
	onChange: (items: MenuItem[]) => void;
	addLabel?: string;
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

const ParamInput: FC<{ param: Param; item: MenuItem; fields: TableField[]; set: (patch: any) => void }> = ({
	param,
	item,
	fields,
	set,
}) => {
	const value = item[param.name];
	switch (param.kind) {
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
					onChange={v => set({ [param.name]: v })}>
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
const MenuItemsEditor: FC<Props> = ({ items, types, fields, onChange, addLabel = 'Add item' }) => {
	const [open, setOpen] = useState<number | null>(null);
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);
	const errors = validateMenu(items, types);

	const setItem = (i: number, patch: any) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));

	const changeType = (i: number, type: string) => {
		const def = types.find(t => t.value === type);
		const current = items[i];
		// Keep only the title: the old type's parameters mean nothing to the new one.
		const title = current.title && current.title !== types.find(t => t.value === current.type)?.label ? current.title : def?.label;
		onChange(items.map((it, j) => (j === i ? { type, title } : it)));
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
							{!!type?.params?.length && (
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
							</Text>
						)}

						{isOpen && type?.params && (
							<Flex
								direction='column'
								gap={3}
								p={3}
								pl='52px'>
								{type.params.map(p => (
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
										/>
									</Box>
								))}
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
