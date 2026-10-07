'use client';

import { DragEvent, FC, ReactNode } from 'react';
import { Badge, Box, Button, Flex, IconButton, Menu, Portal, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Lock, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { LucideIcon, radius } from '@/components/library';
import { Item, Section } from './draft';

export type Drag = { type: 'item'; key: string } | { type: 'section'; key: string } | null;
/** Where a drop would land: an item slot in a section, or a section slot. */
export type Over = { type: 'item'; section: string; index: number } | { type: 'section'; index: number } | null;

type Props = {
	section: Section;
	index: number;
	total: number;
	drag: Drag;
	over: Over;
	/** Keys of records with unsaved edits, and of ones not saved yet at all. */
	edited: Set<string>;
	created: Set<string>;
	onDragStart: (drag: Drag) => void;
	onDragOver: (over: Over) => void;
	onDrop: () => void;
	onDragEnd: () => void;
	onEdit: () => void;
	onToggle: () => void;
	onDelete: () => void;
	onMove: (delta: number) => void;
	onAddItem: () => void;
	onEditItem: (item: Item) => void;
	onToggleItem: (item: Item) => void;
	onDeleteItem: (item: Item) => void;
	onMoveItem: (item: Item, delta: number) => void;
};

/** Top or bottom half of the element under the pointer. */
const lowerHalf = (e: DragEvent<HTMLElement>) => {
	const r = e.currentTarget.getBoundingClientRect();
	return e.clientY > r.top + r.height / 2;
};

const DropLine: FC = () => (
	<Box
		h='2px'
		mx={2}
		my='-1px'
		bg='blue.solid'
		borderRadius='full'
		position='relative'
		zIndex={1}
	/>
);

const Status: FC<{ k: string; edited: Set<string>; created: Set<string> }> = ({ k, edited, created }) =>
	created.has(k) ? (
		<Badge
			size='xs'
			colorPalette='green'
			variant='subtle'>
			New
		</Badge>
	) : edited.has(k) ? (
		<Badge
			size='xs'
			colorPalette='orange'
			variant='subtle'>
			Edited
		</Badge>
	) : null;

const RowMenu: FC<{ children: ReactNode; label: string }> = ({ children, label }) => (
	<Menu.Root positioning={{ placement: 'bottom-end' }}>
		<Menu.Trigger asChild>
			<IconButton
				size='xs'
				variant='ghost'
				aria-label={label}
				onClick={e => e.stopPropagation()}>
				<MoreHorizontal size={14} />
			</IconButton>
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner>
				<Menu.Content minW='160px'>{children}</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu.Root>
);

const SectionCard: FC<Props> = ({
	section: s,
	index,
	total,
	drag,
	over,
	edited,
	created,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	onEdit,
	onToggle,
	onDelete,
	onMove,
	onAddItem,
	onEditItem,
	onToggleItem,
	onDeleteItem,
	onMoveItem,
}) => {
	const itemSlot = over?.type === 'item' && over.section === s.key ? over.index : -1;

	const start = (e: DragEvent<HTMLElement>, d: Drag) => {
		e.stopPropagation();
		e.dataTransfer.effectAllowed = 'move';
		// Firefox won't start a drag without data.
		e.dataTransfer.setData('text/plain', d!.key);
		onDragStart(d);
	};

	const allow = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	return (
		<Box
			borderWidth='1px'
			borderColor='border'
			borderRadius={radius.CONTAINER}
			bg='bg.panel'
			opacity={drag?.type === 'section' && drag.key === s.key ? 0.4 : 1}
			onDragOver={e => {
				if (!drag) return;
				allow(e);
				if (drag.type === 'section') onDragOver({ type: 'section', index: lowerHalf(e) ? index + 1 : index });
				// Over the card but not over a row: the end of this section.
				else if (itemSlot < 0) onDragOver({ type: 'item', section: s.key, index: s.items.length });
			}}
			onDrop={e => {
				e.preventDefault();
				onDrop();
			}}>
			{/* Section header — drag it by the grip to reorder sections. */}
			<Flex
				align='center'
				gap={2}
				px={2}
				py={2}
				borderBottomWidth={s.items.length ? '1px' : 0}
				borderColor='border.muted'
				bg='bg.subtle'
				borderTopRadius={radius.CONTAINER}>
				<Box
					draggable
					onDragStart={e => start(e, { type: 'section', key: s.key })}
					onDragEnd={onDragEnd}
					cursor='grab'
					color='fg.subtle'
					_hover={{ color: 'fg' }}
					p={1}
					title='Drag to move this section'>
					<GripVertical size={14} />
				</Box>
				<Flex
					w='24px'
					h='24px'
					align='center'
					justify='center'
					flexShrink={0}
					borderRadius='sm'
					borderWidth='1px'
					borderColor='border'
					bg='bg.panel'>
					<LucideIcon
						name={s.icon || 'folder'}
						size={13}
						color='currentColor'
					/>
				</Flex>
				<Flex
					flex='1'
					minW={0}
					align='center'
					gap={2}
					cursor='pointer'
					onClick={onEdit}>
					<Text
						fontSize='sm'
						fontWeight='600'
						truncate
						opacity={s.isActive ? 1 : 0.55}>
						{s.name || 'Untitled section'}
					</Text>
					<Text
						fontSize='xs'
						color='fg.muted'
						flexShrink={0}>
						{s.items.length} page{s.items.length === 1 ? '' : 's'}
					</Text>
					{!s.isActive && (
						<Badge
							size='xs'
							variant='outline'>
							Hidden
						</Badge>
					)}
					<Status
						k={s.key}
						edited={edited}
						created={created}
					/>
				</Flex>
				<IconButton
					size='xs'
					variant='ghost'
					aria-label={s.isActive ? 'Hide section' : 'Show section'}
					title={s.isActive ? 'Hide section' : 'Show section'}
					onClick={onToggle}>
					{s.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
				</IconButton>
				<RowMenu label='Section actions'>
					<Menu.Item
						value='edit'
						onClick={onEdit}>
						<Pencil size={13} /> Edit section
					</Menu.Item>
					<Menu.Item
						value='add'
						onClick={onAddItem}>
						<Plus size={13} /> Add a page here
					</Menu.Item>
					<Menu.Item
						value='up'
						disabled={index === 0}
						onClick={() => onMove(-1)}>
						<ArrowUp size={13} /> Move up
					</Menu.Item>
					<Menu.Item
						value='down'
						disabled={index === total - 1}
						onClick={() => onMove(1)}>
						<ArrowDown size={13} /> Move down
					</Menu.Item>
					<Menu.Separator />
					<Menu.Item
						value='delete'
						color='fg.error'
						onClick={onDelete}>
						<Trash2 size={13} /> Delete section
					</Menu.Item>
				</RowMenu>
			</Flex>

			{/* Pages */}
			<Box py={s.items.length ? 1 : 0}>
				{s.items.map((i, ii) => (
					<Box key={i.key}>
						{itemSlot === ii && drag?.key !== i.key && <DropLine />}
						<Flex
							draggable
							onDragStart={e => start(e, { type: 'item', key: i.key })}
							onDragEnd={onDragEnd}
							onDragOver={e => {
								if (drag?.type !== 'item') return;
								allow(e);
								e.stopPropagation();
								onDragOver({ type: 'item', section: s.key, index: lowerHalf(e) ? ii + 1 : ii });
							}}
							onClick={() => onEditItem(i)}
							align='center'
							gap={2}
							px={2}
							py={1.5}
							mx={1}
							borderRadius='md'
							cursor='pointer'
							opacity={drag?.type === 'item' && drag.key === i.key ? 0.4 : 1}
							_hover={{ bg: 'bg.muted' }}
							role='group'>
							<Box
								color='fg.subtle'
								cursor='grab'
								_groupHover={{ color: 'fg.muted' }}
								title='Drag to move this page'>
								<GripVertical size={14} />
							</Box>
							<Flex
								flex='1'
								minW={0}
								align='baseline'
								gap={2}
								opacity={i.isActive ? 1 : 0.55}>
								<Text
									fontSize='sm'
									truncate>
									{i.name || 'Untitled page'}
								</Text>
								<Text
									fontSize='xs'
									color='fg.muted'
									fontFamily='mono'
									truncate>
									/{i.href}
								</Text>
							</Flex>
							{!i.isActive && (
								<Badge
									size='xs'
									variant='outline'>
									Hidden
								</Badge>
							)}
							{i.permissionProtected && (
								<Badge
									size='xs'
									variant='subtle'
									title={`Only roles with “${i.permission}” see this`}>
									<Lock size={10} />
									{i.permission}
								</Badge>
							)}
							<Status
								k={i.key}
								edited={edited}
								created={created}
							/>
							<IconButton
								size='xs'
								variant='ghost'
								aria-label={i.isActive ? 'Hide page' : 'Show page'}
								title={i.isActive ? 'Hide page' : 'Show page'}
								onClick={e => {
									e.stopPropagation();
									onToggleItem(i);
								}}>
								{i.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
							</IconButton>
							<RowMenu label='Page actions'>
								<Menu.Item
									value='edit'
									onClick={() => onEditItem(i)}>
									<Pencil size={13} /> Edit page
								</Menu.Item>
								<Menu.Item
									value='up'
									disabled={ii === 0}
									onClick={() => onMoveItem(i, -1)}>
									<ArrowUp size={13} /> Move up
								</Menu.Item>
								<Menu.Item
									value='down'
									disabled={ii === s.items.length - 1}
									onClick={() => onMoveItem(i, 1)}>
									<ArrowDown size={13} /> Move down
								</Menu.Item>
								<Menu.Separator />
								<Menu.Item
									value='delete'
									color='fg.error'
									onClick={() => onDeleteItem(i)}>
									<Trash2 size={13} /> Delete page
								</Menu.Item>
							</RowMenu>
						</Flex>
					</Box>
				))}
				{itemSlot === s.items.length && <DropLine />}
			</Box>

			{!s.items.length && (
				<Text
					fontSize='xs'
					color='fg.muted'
					px={4}
					pt={3}>
					No pages yet — drag one here or add one. Empty sections don’t show in the sidebar.
				</Text>
			)}

			<Box
				px={2}
				pb={2}
				pt={s.items.length ? 0 : 2}>
				<Button
					size='xs'
					variant='ghost'
					color='fg.muted'
					onClick={onAddItem}>
					<Plus size={12} />
					Add page
				</Button>
			</Box>
		</Box>
	);
};

export default SectionCard;
