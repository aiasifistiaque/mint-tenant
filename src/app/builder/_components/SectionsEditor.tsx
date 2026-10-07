'use client';

import { DragEvent, FC, ReactNode, useState } from 'react';
import { Box, Button, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { GripVertical, Link2, List, Plus, Trash2, X } from 'lucide-react';
import { radius, useGetBuilderModelFieldsQuery } from '@/components/library';
import { TableField } from './TableColumnsEditor';
import { ModelField } from './filterTypes';
import { Dropdown } from '@/components/library/cl';

/**
 * Sections of fields — the form layout (create / edit modals) or the view
 * layout (the record's detail page). Both are an ordered list of sections with
 * a title and description; they differ in what a section holds:
 *
 * - form: rows, each one field or several side by side;
 * - view: own fields, "fields of a linked record" (a reference, populated),
 *   and "related records" (another route's records that point here).
 *
 * Sections and the items inside them are dragged to reorder.
 */

type FormSection = { sectionTitle?: string; description?: string; fields: (string | string[])[] };
export type ViewItem =
	| string
	| { field: string; show: string[]; label?: string }
	| { related: string; foreignField: string; title?: string; columns: string[]; limit?: number };
type ViewSection = { title?: string; description?: string; columns?: number; fields: ViewItem[] };

type RouteOption = { route: string; model: string | null; title?: string | null };

type Props =
	| {
			mode: 'form';
			sections: FormSection[];
			onChange: (s: FormSection[]) => void;
			fields: TableField[];
	  }
	| {
			mode: 'view';
			sections: ViewSection[];
			onChange: (s: ViewSection[]) => void;
			fields: TableField[];
			modelFields: ModelField[];
			routes: RouteOption[];
			model: string;
	  };

const ICON = { size: 14, strokeWidth: 1.75 };

const Select: FC<{ value: string; onChange: (v: string) => void; children: ReactNode; placeholder?: string; w?: string }> = ({
	value,
	onChange,
	children,
	placeholder,
	w,
}) => (
	<Dropdown
		size='xs'
		w={w}
		value={value}
		placeholder={placeholder}
		onChange={onChange}>
		{children}
	</Dropdown>
);

const Chip: FC<{ label: string; onRemove?: () => void; muted?: boolean }> = ({ label, onRemove, muted }) => (
	<Flex
		align='center'
		gap={1}
		h='26px'
		pl={2}
		pr={onRemove ? 0.5 : 2}
		fontSize='xs'
		borderWidth='1px'
		borderColor={muted ? 'red.500' : 'border'}
		borderRadius={radius.CONTAINER}
		bg='bg.subtle'
		title={muted ? 'Not a field in this route’s settings' : undefined}>
		{label}
		{onRemove && (
			<Flex
				as='button'
				aria-label={`Remove ${label}`}
				onClick={onRemove}
				p={1}
				color='fg.muted'
				_hover={{ color: 'fg' }}>
				<X size={12} />
			</Flex>
		)}
	</Flex>
);

/** Fields of the record a reference points to, to show on the view. */
const RefItem: FC<{
	item: { field: string; show: string[]; label?: string };
	refModel?: string;
	onChange: (i: any) => void;
}> = ({ item, refModel, onChange }) => {
	const { data } = useGetBuilderModelFieldsQuery(refModel as string, { skip: !refModel });
	const options: ModelField[] = (data?.fields || []).filter((f: ModelField) => f.key !== '__v');
	return (
		<Flex
			direction='column'
			gap={2}
			flex='1'>
			<Flex
				gap={2}
				align='center'
				flexWrap='wrap'>
				<Link2 size={13} />
				<Text
					fontSize='xs'
					fontWeight='600'>
					Fields of {item.field}
					{refModel ? ` (${refModel})` : ''}
				</Text>
				<Input
					size='xs'
					w='180px'
					placeholder={`Label (default: ${item.field})`}
					value={item.label || ''}
					onChange={e => onChange({ ...item, label: e.target.value || undefined })}
				/>
			</Flex>
			<Flex
				gap={1}
				flexWrap='wrap'>
				{options.map(f => {
					const on = item.show.includes(f.key);
					return (
						<Button
							key={f.key}
							size='2xs'
							variant={on ? 'solid' : 'outline'}
							onClick={() => onChange({ ...item, show: on ? item.show.filter(k => k !== f.key) : [...item.show, f.key] })}>
							{f.key}
						</Button>
					);
				})}
			</Flex>
			{!item.show.length && (
				<Text
					fontSize='11px'
					color='red.fg'>
					Pick at least one field.
				</Text>
			)}
		</Flex>
	);
};

/** Another route's records that point at this one, as a small table. */
const RelatedItem: FC<{
	item: { related: string; foreignField: string; title?: string; columns: string[]; limit?: number };
	routes: RouteOption[];
	model: string;
	onChange: (i: any) => void;
}> = ({ item, routes, model, onChange }) => {
	const relatedModel = routes.find(r => r.route === item.related)?.model || undefined;
	const { data } = useGetBuilderModelFieldsQuery(relatedModel as string, { skip: !relatedModel });
	const fields: ModelField[] = (data?.fields || []).filter((f: ModelField) => f.key !== '__v');
	// Only fields that actually reference this route's model can link the two.
	const links = fields.filter(f => f.ref === model);
	return (
		<Flex
			direction='column'
			gap={2}
			flex='1'>
			<Flex
				gap={2}
				align='center'
				flexWrap='wrap'>
				<List size={13} />
				<Text
					fontSize='xs'
					fontWeight='600'>
					Related
				</Text>
				<Select
					w='200px'
					value={item.related}
					onChange={v => onChange({ ...item, related: v, foreignField: '', columns: [] })}>
					{routes.map(r => (
						<option
							key={r.route}
							value={r.route}>
							{r.title || r.route} ({r.route})
						</option>
					))}
				</Select>
				<Text
					fontSize='xs'
					color='fg.muted'>
					where
				</Text>
				<Select
					w='170px'
					value={item.foreignField}
					placeholder={links.length ? 'Pick the link field' : 'No field links here'}
					onChange={v => onChange({ ...item, foreignField: v })}>
					{links.map(f => (
						<option
							key={f.key}
							value={f.key}>
							{f.key}
						</option>
					))}
				</Select>
				<Text
					fontSize='xs'
					color='fg.muted'>
					is this record
				</Text>
			</Flex>
			<Flex
				gap={2}
				align='center'
				flexWrap='wrap'>
				<Input
					size='xs'
					w='200px'
					placeholder='Heading'
					value={item.title || ''}
					onChange={e => onChange({ ...item, title: e.target.value || undefined })}
				/>
				<Text
					fontSize='xs'
					color='fg.muted'>
					Show up to
				</Text>
				<Input
					size='xs'
					w='60px'
					type='number'
					min={1}
					max={50}
					value={item.limit ?? 10}
					onChange={e => onChange({ ...item, limit: Math.min(50, Math.max(1, Number(e.target.value) || 10)) })}
				/>
			</Flex>
			<Flex
				gap={1}
				flexWrap='wrap'>
				{fields
					.filter(f => f.key !== item.foreignField && f.key !== '_id')
					.map(f => {
						const on = item.columns.includes(f.key);
						return (
							<Button
								key={f.key}
								size='2xs'
								variant={on ? 'solid' : 'outline'}
								onClick={() =>
									onChange({ ...item, columns: on ? item.columns.filter(k => k !== f.key) : [...item.columns, f.key] })
								}>
								{f.key}
							</Button>
						);
					})}
			</Flex>
			{(!item.foreignField || !item.columns.length) && (
				<Text
					fontSize='11px'
					color='red.fg'>
					{!item.foreignField ? 'Pick the field that links the records.' : 'Pick at least one column.'}
				</Text>
			)}
		</Flex>
	);
};

const SectionsEditor: FC<Props> = props => {
	const { mode, fields } = props;
	const isForm = mode === 'form';
	const labelOf = (k: string) => fields.find(f => f.key === k)?.label || k;
	const known = (k: string) => fields.some(f => f.key === k);

	// One normalised shape for both modes: title, description, columns, items.
	const sections = (props.sections as any[]).map(s => ({
		title: isForm ? s.sectionTitle : s.title,
		description: s.description,
		columns: s.columns,
		items: s.fields || [],
	}));
	const emit = (next: typeof sections) =>
		(props.onChange as any)(
			next.map(s =>
				isForm
					? clean({ sectionTitle: s.title || '', description: s.description || undefined, fields: s.items })
					: clean({ title: s.title || '', description: s.description || undefined, columns: s.columns, fields: s.items })
			)
		);
	const setSection = (i: number, patch: any) => emit(sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
	const setItems = (i: number, items: any[]) => setSection(i, { items });

	const [drag, setDrag] = useState<null | { s: number; i?: number }>(null);
	const [over, setOver] = useState<null | { s: number; i?: number }>(null);

	const dropSection = (to: number) => {
		if (drag && drag.i === undefined && drag.s !== to) {
			const next = [...sections];
			const [m] = next.splice(drag.s, 1);
			next.splice(to, 0, m);
			emit(next);
		}
		setDrag(null);
		setOver(null);
	};
	const dropItem = (s: number, to: number) => {
		if (drag && drag.i !== undefined && drag.s === s && drag.i !== to) {
			const items = [...sections[s].items];
			const [m] = items.splice(drag.i, 1);
			items.splice(to, 0, m);
			setItems(s, items);
		}
		setDrag(null);
		setOver(null);
	};

	const placed = new Set<string>();
	sections.forEach(s =>
		s.items.forEach((it: any) => (Array.isArray(it) ? it : [it]).forEach((x: any) => typeof x === 'string' && placed.add(x)))
	);
	const unplaced = fields.filter(f => !placed.has(f.key));
	const refFields = !isForm ? (props as any).modelFields.filter((f: ModelField) => f.ref && !f.key.includes('.')) : [];

	return (
		<Flex
			direction='column'
			gap={3}>
			{sections.length === 0 && (
				<Text
					fontSize='xs'
					color='fg.muted'>
					No sections.
				</Text>
			)}
			{sections.map((section, si) => {
				const isTarget = drag?.i === undefined && over?.s === si && drag && drag.s !== si;
				return (
					<Box
						key={si}
						onDragOver={(e: DragEvent) => {
							if (drag?.i !== undefined) return;
							e.preventDefault();
							setOver({ s: si });
						}}
						onDrop={(e: DragEvent) => {
							if (drag?.i !== undefined) return;
							e.preventDefault();
							dropSection(si);
						}}
						borderWidth='1px'
						borderStyle={isTarget ? 'dashed' : 'solid'}
						borderColor={isTarget ? 'fg' : 'border'}
						borderRadius={radius.CONTAINER}
						bg='bg.panel'
						opacity={drag?.s === si && drag.i === undefined ? 0.4 : 1}>
						<Flex
							align='center'
							gap={2}
							px={3}
							py={2}
							borderBottomWidth='1px'
							borderColor='border.muted'
							flexWrap='wrap'>
							<Flex
								draggable
								onDragStart={(e: DragEvent) => {
									setDrag({ s: si });
									e.dataTransfer.setData('text/plain', `s${si}`);
								}}
								onDragEnd={() => {
									setDrag(null);
									setOver(null);
								}}
								color='fg.subtle'
								cursor='grab'
								title='Drag the section'>
								<GripVertical {...ICON} />
							</Flex>
							<Input
								size='xs'
								w='220px'
								fontWeight='600'
								placeholder='Section title'
								value={section.title || ''}
								onChange={e => setSection(si, { title: e.target.value })}
							/>
							<Input
								size='xs'
								flex='1'
								minW='180px'
								placeholder='Description (optional)'
								value={section.description || ''}
								onChange={e => setSection(si, { description: e.target.value })}
							/>
							{!isForm && (
								<Select
									w='120px'
									value={String(section.columns || 2)}
									onChange={v => setSection(si, { columns: Number(v) })}>
									<option value='1'>1 column</option>
									<option value='2'>2 columns</option>
									<option value='3'>3 columns</option>
								</Select>
							)}
							<IconButton
								size='xs'
								variant='ghost'
								aria-label='Remove section'
								color='red.500'
								_dark={{ color: 'red.300' }}
								onClick={() => emit(sections.filter((_, j) => j !== si))}>
								<Trash2 {...ICON} />
							</IconButton>
						</Flex>

						<Flex
							direction='column'
							gap={1.5}
							p={3}>
							{section.items.map((item: any, ii: number) => {
								const itemTarget = drag?.s === si && drag.i !== undefined && over?.s === si && over.i === ii && drag.i !== ii;
								const setItem = (next: any) => setItems(si, section.items.map((x: any, j: number) => (j === ii ? next : x)));
								const remove = () => setItems(si, section.items.filter((_: any, j: number) => j !== ii));
								return (
									<Flex
										key={ii}
										align='flex-start'
										gap={2}
										p={1.5}
										borderWidth='1px'
										borderStyle={itemTarget ? 'dashed' : 'solid'}
										borderColor={itemTarget ? 'fg' : 'transparent'}
										borderRadius={radius.CONTAINER}
										_hover={{ bg: 'bg.subtle' }}
										onDragOver={(e: DragEvent) => {
											if (drag?.s !== si || drag.i === undefined) return;
											e.preventDefault();
											e.stopPropagation();
											setOver({ s: si, i: ii });
										}}
										onDrop={(e: DragEvent) => {
											if (drag?.s !== si || drag.i === undefined) return;
											e.preventDefault();
											e.stopPropagation();
											dropItem(si, ii);
										}}>
										<Flex
											draggable
											onDragStart={(e: DragEvent) => {
												e.stopPropagation();
												setDrag({ s: si, i: ii });
												e.dataTransfer.setData('text/plain', `i${si}-${ii}`);
											}}
											onDragEnd={() => {
												setDrag(null);
												setOver(null);
											}}
											mt={1}
											color='fg.subtle'
											cursor='grab'
											title='Drag to reorder'>
											<GripVertical size={12} />
										</Flex>

										{isForm ? (
											// A form row: one field, or several side by side.
											<Flex
												gap={1.5}
												flex='1'
												flexWrap='wrap'
												align='center'>
												{(Array.isArray(item) ? item : [item]).map((k: string) => (
													<Chip
														key={k}
														label={labelOf(k)}
														muted={!known(k)}
														onRemove={() => {
															const row = (Array.isArray(item) ? item : [item]).filter((x: string) => x !== k);
															row.length ? setItem(row.length === 1 ? row[0] : row) : remove();
														}}
													/>
												))}
												<Select
													w='130px'
													value=''
													placeholder='+ beside'
													onChange={k => k && setItem([...(Array.isArray(item) ? item : [item]), k])}>
													{unplaced.map(f => (
														<option
															key={f.key}
															value={f.key}>
															{f.label}
														</option>
													))}
												</Select>
											</Flex>
										) : typeof item === 'string' ? (
											<Flex flex='1'>
												<Chip
													label={labelOf(item)}
													muted={!known(item)}
												/>
											</Flex>
										) : 'field' in item ? (
											<RefItem
												item={item}
												refModel={refFields.find((f: ModelField) => f.key === item.field)?.ref}
												onChange={setItem}
											/>
										) : (
											<RelatedItem
												item={item}
												routes={(props as any).routes}
												model={(props as any).model}
												onChange={setItem}
											/>
										)}

										<IconButton
											size='2xs'
											variant='ghost'
											aria-label='Remove'
											onClick={remove}>
											<X size={12} />
										</IconButton>
									</Flex>
								);
							})}

							<Flex
								gap={2}
								pt={1}
								flexWrap='wrap'>
								<Select
									w='180px'
									value=''
									placeholder={isForm ? '+ Add a row' : '+ Add a field'}
									onChange={k => k && setItems(si, [...section.items, k])}>
									{unplaced.map(f => (
										<option
											key={f.key}
											value={f.key}>
											{f.label}
										</option>
									))}
								</Select>
								{!isForm && refFields.length > 0 && (
									<Select
										w='220px'
										value=''
										placeholder='+ Fields of a linked record'
										onChange={k => k && setItems(si, [...section.items, { field: k, show: [] }])}>
										{refFields.map((f: ModelField) => (
											<option
												key={f.key}
												value={f.key}>
												{f.key} → {f.ref}
											</option>
										))}
									</Select>
								)}
								{!isForm && (
									<Button
										size='xs'
										variant='outline'
										onClick={() =>
											setItems(si, [
												...section.items,
												{ related: (props as any).routes[0]?.route || '', foreignField: '', columns: [], limit: 10 },
											])
										}>
										<Plus {...ICON} />
										Related records
									</Button>
								)}
							</Flex>
						</Flex>
					</Box>
				);
			})}

			<Flex
				gap={3}
				align='center'
				flexWrap='wrap'>
				<Button
					size='xs'
					variant='outline'
					onClick={() => emit([...sections, { title: 'New section', description: '', columns: isForm ? undefined : 2, items: [] }])}>
					<Plus {...ICON} />
					Add section
				</Button>
				{unplaced.length > 0 && (
					<Text
						fontSize='xs'
						color='fg.muted'>
						Not placed: {unplaced.map(f => f.label).join(', ')}
					</Text>
				)}
			</Flex>
		</Flex>
	);
};

const clean = (o: any) => {
	const out: any = {};
	for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
	return out;
};

export default SectionsEditor;
