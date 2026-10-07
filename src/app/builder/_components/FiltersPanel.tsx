'use client';

import { DragEvent, FC, useMemo, useState } from 'react';
import { Button, Grid, Text } from '@chakra-ui/react';
import { Download, Plus } from 'lucide-react';
import { EmptyState, Panel } from '@/components/library/cl';
import FilterCard from './FilterCard';
import { EditableFilter, ModelField, newUid, validate } from './filterTypes';

/**
 * A route's filter chips as draggable cards. Used by the route builder's
 * Filters tab and the model wizard's Filters step.
 *
 * The open card can be controlled from outside (the route builder opens the
 * first card with an error when a save is refused); left alone, it manages
 * itself.
 */

// Mirrors COLLAPSED_COUNT in DynamicFilters: how many chips a table shows
// before "Show more filters" — what makes the order matter.
export const VISIBLE_BEFORE_MORE = 4;

type Props = {
	filters: EditableFilter[];
	onChange: (filters: EditableFilter[]) => void;
	/** The model's real fields — the only ones a filter may use. */
	fields: ModelField[];
	/** Model names a "From another model" filter can read options from. */
	models: string[];
	/** The code file's filters, offered as a starting point when present. */
	codeFilters?: any[];
	onImportCode?: () => void;
	editingUid?: string | null;
	onEditingChange?: (uid: string | null) => void;
};

const FiltersPanel: FC<Props> = ({
	filters,
	onChange,
	fields,
	models,
	codeFilters = [],
	onImportCode,
	editingUid: controlled,
	onEditingChange,
}) => {
	const [own, setOwn] = useState<string | null>(null);
	const editingUid = controlled !== undefined ? controlled : own;
	const setEditingUid = (uid: string | null) => (onEditingChange ? onEditingChange(uid) : setOwn(uid));
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);

	const { errors, warnings } = useMemo(() => validate(filters), [filters]);
	const errorCount = Object.keys(errors).length;

	const dragProps = (index: number) => ({
		onDragStart: (e: DragEvent) => {
			setDragIndex(index);
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		},
		onDragOver: (e: DragEvent) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			if (overIndex !== index) setOverIndex(index);
		},
		onDrop: (e: DragEvent) => {
			e.preventDefault();
			if (dragIndex !== null && dragIndex !== index) {
				const next = [...filters];
				const [moved] = next.splice(dragIndex, 1);
				next.splice(index, 0, moved);
				onChange(next);
			}
			setDragIndex(null);
			setOverIndex(null);
		},
		onDragEnd: () => {
			setDragIndex(null);
			setOverIndex(null);
		},
	});

	const addFilter = () => {
		const uid = newUid();
		onChange([...filters, { uid, name: '', type: 'text', category: 'default' }]);
		setEditingUid(uid);
	};

	return (
		<Panel
			title='Filters'
			subtitle={`Drag cards to set the order chips appear in. The first ${VISIBLE_BEFORE_MORE} show before “Show more filters”.`}
			actions={
				<>
					{codeFilters.length > 0 && onImportCode && (
						<Button
							size='xs'
							variant='outline'
							onClick={onImportCode}>
							<Download size={14} />
							Code filters ({codeFilters.length})
						</Button>
					)}
					<Button
						size='xs'
						disabled={!fields.length}
						onClick={addFilter}>
						<Plus size={14} />
						Add filter
					</Button>
				</>
			}>
			{filters.length === 0 ? (
				<EmptyState
					title='No filters'
					description='With none, the table shows no filter row.'
				/>
			) : (
				<Grid
					templateColumns='repeat(auto-fill, minmax(280px, 1fr))'
					gap={3}
					onDragLeave={e => {
						if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverIndex(null);
					}}>
					{filters.map((f, i) => (
						<FilterCard
							key={f.uid}
							filter={f}
							index={i}
							fields={fields}
							models={models}
							isEditing={editingUid === f.uid}
							isDragging={dragIndex === i}
							isDropTarget={dragIndex !== null && overIndex === i && dragIndex !== i}
							error={errors[f.uid]}
							warning={warnings[f.uid]}
							drag={dragProps(i)}
							onEdit={() => setEditingUid(f.uid)}
							onDone={() => setEditingUid(null)}
							onDelete={() => {
								onChange(filters.filter(x => x.uid !== f.uid));
								if (editingUid === f.uid) setEditingUid(null);
							}}
							onChange={next => onChange(filters.map(x => (x.uid === next.uid ? next : x)))}
						/>
					))}
				</Grid>
			)}
			{errorCount > 0 && (
				<Text
					mt={3}
					fontSize='xs'
					color='red.fg'>
					{errorCount} filter{errorCount === 1 ? ' needs' : 's need'} attention before saving.
				</Text>
			)}
		</Panel>
	);
};

export default FiltersPanel;
