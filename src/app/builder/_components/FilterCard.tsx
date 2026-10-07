'use client';

import { DragEvent, FC, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, IconButton, Input, Text } from '@chakra-ui/react';
import { AlertTriangle, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { radius, VInput, VSelect, useGetBuilderModelFieldsQuery } from '@/components/library';
import {
	CATEGORIES,
	EditableFilter,
	FILTER_TYPES,
	ModelField,
	defaultQueryKey,
	hasOptions,
	suggestFilter,
	typeLabel,
} from './filterTypes';

type DragProps = {
	onDragStart: (e: DragEvent) => void;
	onDragOver: (e: DragEvent) => void;
	onDrop: (e: DragEvent) => void;
	onDragEnd: () => void;
};

type FilterCardProps = {
	filter: EditableFilter;
	index: number;
	fields: ModelField[];
	models: string[];
	isEditing: boolean;
	isDragging: boolean;
	isDropTarget: boolean;
	error?: string;
	warning?: string;
	drag: DragProps;
	onEdit: () => void;
	onDone: () => void;
	onDelete: () => void;
	onChange: (next: EditableFilter) => void;
};

const ICON = { size: 14, strokeWidth: 1.75 };

/** One line of the collapsed card: a muted label and a monospace value. */
const Detail: FC<{ label: string; value?: string }> = ({ label, value }) =>
	value ? (
		<Flex
			gap={2}
			fontSize='xs'
			minW={0}>
			<Text
				color='fg.muted'
				flexShrink={0}
				whiteSpace='nowrap'
				w='56px'>
				{label}
			</Text>
			<Text
				fontFamily='mono'
				truncate
				title={value}>
				{value}
			</Text>
		</Flex>
	) : null;

const optionSummary = (f: EditableFilter) => {
	if (!hasOptions(f.type)) return undefined;
	if (f.category === 'model') return `${f.model || '?'} · ${f.key || 'name'}`;
	if (f.category === 'distinct') return `distinct ${f.key || f.name}`;
	const n = f.options?.length || 0;
	return `${n} listed`;
};

/**
 * A filter chip as a card. Collapsed, it reads as the chip it will become —
 * label, type, and where it looks — and can be dragged. Expanded, it is the
 * whole configuration a settings file could hold for it, edited in place
 * rather than in a modal so the surrounding order stays in view.
 */
const FilterCard: FC<FilterCardProps> = ({
	filter,
	index,
	fields,
	models,
	isEditing,
	isDragging,
	isDropTarget,
	error,
	warning,
	drag,
	onEdit,
	onDone,
	onDelete,
	onChange,
}) => {
	const set = (patch: Partial<EditableFilter>) => onChange({ ...filter, ...patch });
	// Kept as typed: rebuilding the text from the parsed array would eat the
	// comma the moment it's typed, and a second role could never be entered.
	const [rolesText, setRolesText] = useState((filter.roles || []).join(', '));
	const category = filter.category || 'default';

	const { data: refModel } = useGetBuilderModelFieldsQuery(filter.model as string, {
		skip: !isEditing || category !== 'model' || !filter.model,
	});

	// A card is keyed off a real schema path. One saved before a field was
	// renamed or removed still has to show its current value rather than an
	// empty select, so it's listed — flagged — alongside the real ones.
	const fieldKnown = !filter.name || fields.some(f => f.key === filter.name);

	const pickField = (key: string) => {
		const field = fields.find(f => f.key === key);
		if (!field) return set({ name: key });
		// Only a card that has nothing configured yet is filled in from the
		// field. Re-pointing a configured card keeps its choices, and just
		// follows the query key along if it was still the default one.
		if (!filter.name) {
			const suggestion = suggestFilter(field);
			const type = suggestion.type || filter.type;
			return set({ ...suggestion, type, field: defaultQueryKey(key, type) });
		}
		const followKey = !filter.field || filter.field === defaultQueryKey(filter.name, filter.type);
		set({ name: key, ...(followKey && { field: defaultQueryKey(key, filter.type) }) });
	};

	const pickType = (type: any) => {
		const followKey = !filter.field || filter.field === defaultQueryKey(filter.name, filter.type);
		set({ type, ...(followKey && filter.name && { field: defaultQueryKey(filter.name, type) }) });
	};

	const setOption = (i: number, patch: any) =>
		set({ options: (filter.options || []).map((o, j) => (j === i ? { ...o, ...patch } : o)) });

	const border = error ? 'red.500' : isDropTarget ? 'fg' : isEditing ? 'border.emphasized' : 'border';

	return (
		<Box
			// Dragging is only offered on a collapsed card: in an open one the
			// user is selecting text in inputs, which a draggable ancestor hijacks.
			draggable={!isEditing}
			{...(!isEditing && drag)}
			gridColumn={isEditing ? '1 / -1' : undefined}
			borderWidth='1px'
			borderColor={border}
			borderStyle={isDropTarget ? 'dashed' : 'solid'}
			borderRadius={radius.CONTAINER}
			bg='bg.panel'
			opacity={isDragging ? 0.4 : 1}
			transition='opacity 120ms, border-color 120ms'
			overflow='hidden'>
			<Flex
				align='center'
				gap={2}
				px={3}
				py={2.5}
				borderBottomWidth={isEditing ? '1px' : 0}
				borderColor='border.muted'>
				{!isEditing && (
					<Flex
						color='fg.subtle'
						cursor='grab'
						_active={{ cursor: 'grabbing' }}
						aria-label='Drag to reorder'
						title='Drag to reorder'>
						<GripVertical {...ICON} />
					</Flex>
				)}
				<Text
					fontSize='xs'
					color='fg.subtle'
					fontFamily='mono'
					w='18px'>
					{index + 1}
				</Text>
				<Text
					fontSize='sm'
					fontWeight='600'
					truncate
					flex='1'
					minW={0}>
					{filter.label || filter.name || 'New filter'}
				</Text>
				<Badge
					size='sm'
					variant='subtle'
					flexShrink={0}>
					{typeLabel(filter.type)}
				</Badge>
				{isEditing ? (
					<Button
						size='xs'
						variant='outline'
						onClick={onDone}>
						Done
					</Button>
				) : (
					<IconButton
						size='xs'
						variant='ghost'
						aria-label='Edit filter'
						onClick={onEdit}>
						<Pencil {...ICON} />
					</IconButton>
				)}
				<IconButton
					size='xs'
					variant='ghost'
					aria-label='Delete filter'
					color='red.500'
					_dark={{ color: 'red.300' }}
					onClick={onDelete}>
					<Trash2 {...ICON} />
				</IconButton>
			</Flex>

			{!isEditing && (
				<Flex
					direction='column'
					gap={1}
					px={3}
					pb={3}
					// Grip + gap + index + gap: the details start under the label.
					pl='60px'>
					<Detail
						label='Field'
						value={filter.name}
					/>
					<Detail
						label='Query'
						value={filter.field || filter.name}
					/>
					<Detail
						label='Options'
						value={optionSummary(filter)}
					/>
					<Detail
						label='Roles'
						value={filter.roles?.join(', ')}
					/>
				</Flex>
			)}

			{isEditing && (
				<Flex
					direction='column'
					gap={4}
					p={4}>
					<Grid
						templateColumns={{ base: '1fr', md: '1fr 1fr' }}
						gap={4}>
						<VSelect
							label='Field'
							isRequired
							name='name'
							value={filter.name}
							placeholder='Pick a field of this table'
							helper={fieldKnown ? 'Only fields on this table can be filtered' : 'Not a field on this table any more'}
							onChange={(e: any) => pickField(e.target.value)}>
							{!fieldKnown && <option value={filter.name}>{`${filter.name} (missing)`}</option>}
							{fields.map(f => (
								<option
									key={f.key}
									value={f.key}>
									{`${f.key} · ${f.ref ? `→ ${f.ref}` : f.instance}`}
								</option>
							))}
						</VSelect>
						<VSelect
							label='Type'
							isRequired
							name='type'
							value={filter.type}
							helper={FILTER_TYPES.find(t => t.value === filter.type)?.hint}
							onChange={(e: any) => pickType(e.target.value)}>
							{FILTER_TYPES.map(t => (
								<option
									key={t.value}
									value={t.value}>
									{t.label}
								</option>
							))}
						</VSelect>
						<VInput
							label='Label'
							value={filter.label || ''}
							placeholder='Shown on the chip'
							onChange={e => set({ label: e.target.value })}
						/>
						<VInput
							label='Title'
							value={filter.title || ''}
							placeholder='Heading inside the dropdown'
							onChange={e => set({ title: e.target.value })}
						/>
					</Grid>

					{hasOptions(filter.type) && (
						<Flex
							direction='column'
							gap={3}
							p={3}
							borderWidth='1px'
							borderColor='border.muted'
							borderRadius={radius.CONTAINER}>
							<VSelect
								label='Options come from'
								name='category'
								value={category}
								helper={CATEGORIES.find(c => c.value === category)?.hint}
								onChange={(e: any) => set({ category: e.target.value || 'default' })}>
								{CATEGORIES.map(c => (
									<option
										key={c.value}
										value={c.value}>
										{c.label}
									</option>
								))}
							</VSelect>

							{category === 'model' && (
								<Grid
									templateColumns={{ base: '1fr', md: '1fr 1fr' }}
									gap={4}>
									<VSelect
										label='Model'
										isRequired
										name='model'
										value={filter.model || ''}
										placeholder='Pick a model'
										onChange={(e: any) => set({ model: e.target.value, key: filter.key || 'name' })}>
										{models.map(m => (
											<option
												key={m}
												value={m}>
												{m}
											</option>
										))}
									</VSelect>
									<VSelect
										label='Label field'
										name='key'
										value={filter.key || 'name'}
										helper='Which field of that model names each option'
										onChange={(e: any) => set({ key: e.target.value })}>
										{/* The current value stays listed even before the model's fields load. */}
										{!(refModel?.fields || []).some((f: ModelField) => f.key === (filter.key || 'name')) && (
											<option value={filter.key || 'name'}>{filter.key || 'name'}</option>
										)}
										{(refModel?.fields || []).map((f: ModelField) => (
											<option
												key={f.key}
												value={f.key}>
												{f.key}
											</option>
										))}
									</VSelect>
								</Grid>
							)}

							{category === 'distinct' && (
								<VSelect
									label='Distinct values of'
									name='key'
									value={filter.key || filter.name}
									helper='Every value this field currently holds becomes an option'
									onChange={(e: any) => set({ key: e.target.value })}>
									{fields.map(f => (
										<option
											key={f.key}
											value={f.key}>
											{f.key}
										</option>
									))}
								</VSelect>
							)}

							{category === 'default' && (
								<Flex
									direction='column'
									gap={2}>
									<Text
										fontSize='xs'
										fontWeight='600'>
										Options
									</Text>
									{(filter.options || []).map((o, i) => (
										<Flex
											key={i}
											gap={2}
											align='center'>
											<Input
												size='sm'
												placeholder='Value (sent in the query)'
												value={o.value ?? ''}
												onChange={e => setOption(i, { value: e.target.value })}
											/>
											<Input
												size='sm'
												placeholder='Label (shown)'
												value={o.label ?? ''}
												onChange={e => setOption(i, { label: e.target.value })}
											/>
											<IconButton
												size='xs'
												variant='ghost'
												aria-label='Remove option'
												onClick={() => set({ options: (filter.options || []).filter((_, j) => j !== i) })}>
												<X {...ICON} />
											</IconButton>
										</Flex>
									))}
									<Box>
										<Button
											size='xs'
											variant='outline'
											onClick={() => set({ options: [...(filter.options || []), { value: '', label: '' }] })}>
											<Plus {...ICON} />
											Add option
										</Button>
									</Box>
								</Flex>
							)}
						</Flex>
					)}

					<Grid
						templateColumns={{ base: '1fr', md: '1fr 1fr' }}
						gap={4}>
						<VInput
							label='Visible to roles'
							value={rolesText}
							placeholder='Everyone'
							helper='Comma separated, e.g. admin. Empty shows it to every role.'
							onChange={e => {
								setRolesText(e.target.value);
								set({
									roles: e.target.value
										.split(',')
										.map(r => r.trim())
										.filter(Boolean),
								});
							}}
						/>
						<VInput
							label='Query key'
							value={filter.field || ''}
							placeholder={filter.name ? defaultQueryKey(filter.name, filter.type) : 'Follows the field'}
							helper='The URL parameter this chip writes. Leave as is unless the API expects another name.'
							onChange={e => set({ field: e.target.value.trim() })}
						/>
					</Grid>
				</Flex>
			)}

			{(error || warning) && (
				<Flex
					align='center'
					gap={1.5}
					px={3}
					py={1.5}
					fontSize='xs'
					bg={error ? 'red.subtle' : 'orange.subtle'}
					color={error ? 'red.fg' : 'orange.fg'}>
					<AlertTriangle size={12} />
					{error || warning}
				</Flex>
			)}
		</Box>
	);
};

export default FilterCard;
