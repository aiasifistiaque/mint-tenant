'use client';

import { DragEvent, FC, useState } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { EyeOff, GripVertical, Plus, X } from 'lucide-react';
import { radius } from '@/components/library';

export type TableField = {
	key: string;
	label: string;
	/** Stored data type ('number', 'string'…). */
	type?: string;
	/** Form input ('select', 'date'…) and its options, from the field's schema. */
	input?: string;
	options?: any[];
	default?: boolean;
};

type Props = {
	columns: string[];
	fields: TableField[];
	onChange: (columns: string[]) => void;
};

const ICON = { size: 13, strokeWidth: 1.75 };

/**
 * The table's columns as an ordered row of chips, and every other field the
 * route's settings declare as chips to add.
 *
 * A column can only be a settings field: getConfig builds each cell from the
 * settings schema, so anything else would have nothing to render with.
 * Chips instead of cards, because a column has nothing to configure here — its
 * title and cell type come from settings — only whether it's there and where.
 */
const TableColumnsEditor: FC<Props> = ({ columns, fields, onChange }) => {
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);

	const byKey = new Map(fields.map(f => [f.key, f]));
	const available = fields.filter(f => !columns.includes(f.key));

	const drop = (index: number) => {
		if (dragIndex !== null && dragIndex !== index) {
			const next = [...columns];
			const [moved] = next.splice(dragIndex, 1);
			next.splice(index, 0, moved);
			onChange(next);
		}
		setDragIndex(null);
		setOverIndex(null);
	};

	return (
		<Flex
			direction='column'
			gap={4}>
			<Flex
				flexWrap='wrap'
				gap={2}
				minH='34px'
				onDragLeave={e => {
					if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverIndex(null);
				}}>
				{columns.length === 0 && (
					<Text
						fontSize='xs'
						color='fg.muted'
						py={2}>
						No columns picked — the table falls back to the config file&apos;s list. Add fields below.
					</Text>
				)}
				{columns.map((key, i) => {
					const field = byKey.get(key);
					const isTarget = dragIndex !== null && overIndex === i && dragIndex !== i;
					return (
						<Flex
							key={key}
							draggable
							onDragStart={(e: DragEvent) => {
								setDragIndex(i);
								e.dataTransfer.effectAllowed = 'move';
								e.dataTransfer.setData('text/plain', key);
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
							align='center'
							gap={1.5}
							h='32px'
							pl={1.5}
							pr={1}
							borderWidth='1px'
							borderStyle={isTarget ? 'dashed' : 'solid'}
							borderColor={!field ? 'red.500' : isTarget ? 'fg' : 'border'}
							borderRadius={radius.CONTAINER}
							bg='bg.panel'
							opacity={dragIndex === i ? 0.4 : 1}
							cursor='grab'
							userSelect='none'
							title={field ? key : `${key} is not a field in this route's settings — it won't render`}>
							<Flex color='fg.subtle'>
								<GripVertical {...ICON} />
							</Flex>
							<Text
								fontSize='xs'
								color='fg.subtle'
								fontFamily='mono'>
								{i + 1}
							</Text>
							<Text
								fontSize='sm'
								fontWeight='500'>
								{field?.label || key}
							</Text>
							{field && !field.default && (
								// Visible in the table only for admins who switch it on in
								// Preferences; the settings don't show it by default.
								<Flex
									color='fg.subtle'
									title='Hidden until an admin turns it on in Preferences'>
									<EyeOff {...ICON} />
								</Flex>
							)}
							<Flex
								as='button'
								aria-label={`Remove ${field?.label || key}`}
								onClick={() => onChange(columns.filter(c => c !== key))}
								color='fg.muted'
								p={1}
								borderRadius='sm'
								_hover={{ color: 'fg', bg: 'bg.muted' }}>
								<X {...ICON} />
							</Flex>
						</Flex>
					);
				})}
			</Flex>

			{available.length > 0 && (
				<Flex
					direction='column'
					gap={2}>
					<Text
						fontSize='xs'
						color='fg.muted'>
						Other fields
					</Text>
					<Flex
						flexWrap='wrap'
						gap={1.5}>
						{available.map(f => (
							<Flex
								key={f.key}
								as='button'
								onClick={() => onChange([...columns, f.key])}
								align='center'
								gap={1}
								h='28px'
								px={2}
								fontSize='xs'
								borderWidth='1px'
								borderStyle='dashed'
								borderColor='border'
								borderRadius={radius.CONTAINER}
								color='fg.muted'
								_hover={{ color: 'fg', borderColor: 'fg.muted', bg: 'bg.subtle' }}
								title={f.key}>
								<Plus {...ICON} />
								{f.label}
							</Flex>
						))}
					</Flex>
				</Flex>
			)}
		</Flex>
	);
};

export default TableColumnsEditor;
