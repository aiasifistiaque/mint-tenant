'use client';

import { FC, DragEvent, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Menu, Portal, Text } from '@chakra-ui/react';
import { Box as BoxIcon, Columns3, FileText, GripVertical, Image, LayoutList, Minus, MoveVertical, Plus, Scissors, Table2 } from 'lucide-react';
import { BLOCKS, Block, BlockType, Part, PdfTemplate, Slot, blockSummary } from '@/components/library/pdf/types';

/**
 * The template's blocks as a tree — header, body, footer, and what sits in
 * columns and boxes. Click to select (the page outlines it), + to add a block
 * there. Drag a row like Figma's layers: its top half drops it above, the
 * bottom half below (a line shows where), the middle of a box, row or columns
 * puts it inside (the row outlined) and its bottom edge first inside — its
 * blocks are listed under it — and so do a column's or box's own
 * "Column 2" / "Inside" line and a part's title. Near the panel's top or
 * bottom edge the list scrolls along.
 */

const ICONS: Record<string, any> = {
	text: FileText,
	fields: LayoutList,
	table: Table2,
	columns: Columns3,
	box: BoxIcon,
	image: Image,
	divider: Minus,
	spacer: MoveVertical,
	pageBreak: Scissors,
};

const PARTS: { part: Part; title: string; hint: string }[] = [
	{ part: 'header', title: 'Header', hint: 'On top of every page' },
	{ part: 'body', title: 'Body', hint: 'Flows over as many pages as it needs' },
	{ part: 'footer', title: 'Footer', hint: 'At the bottom of every page' },
	{ part: 'free', title: 'Placed freely', hint: 'Anywhere on the page — drag them there' },
];

type Props = {
	template: PdfTemplate;
	selected: string | null;
	/** `add`: ⇧ / ⌘ click — add it to the selection (PT-29). */
	onSelect: (id: string, add?: boolean) => void;
	/** Selected alongside the main one. */
	alsoSelected?: string[];
	onAdd: (slot: Slot, index: number, type: BlockType) => void;
	onMove: (id: string, slot: Slot, index: number) => void;
};

export const AddMenu: FC<{ onPick: (type: BlockType) => void; label?: string; part?: Part }> = ({ onPick, label, part }) => (
	<Menu.Root positioning={{ placement: 'bottom-start' }}>
		<Menu.Trigger asChild>
			<Button
				size='2xs'
				variant='ghost'
				color='fg.muted'>
				<Plus size={12} />
				{label}
			</Button>
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner>
				<Menu.Content minW='240px'>
					{BLOCKS.filter(b => b.type !== 'pageBreak' || part === 'body').map(b => {
						const Icon = ICONS[b.type];
						return (
							<Menu.Item
								key={b.type}
								value={b.type}
								onClick={() => onPick(b.type)}>
								<Icon size={14} />
								<Box>
									<Text fontSize='sm'>{b.label}</Text>
									<Text
										fontSize='11px'
										color='fg.muted'>
										{b.hint}
									</Text>
								</Box>
							</Menu.Item>
						);
					})}
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu.Root>
);

/** Where a dragged row would go — and how it shows: a line above / below a row, or a row outlined. */
type Target = { slot: Slot; index: number; key: string; show: 'above' | 'below' | 'inside' };

/** How close to the panel's edge (px) the list starts scrolling along with a drag. */
const EDGE = 40;

const Outline: FC<Props> = ({ template, selected, onSelect, onAdd, onMove, alsoSelected = [] }) => {
	const [drag, setDrag] = useState<string | null>(null);
	const [target, setTarget] = useState<Target | null>(null);
	const root = useRef<HTMLDivElement>(null);
	// What can't take the dragged block: itself and everything inside it.
	const banned = useRef<Set<string>>(new Set());
	const dragPart = useRef<Part | null>(null);
	const dragType = useRef<string>('');
	const scroller = useRef<HTMLElement | null>(null);

	// Selected on the page (or already selected when Layers opens): bring its row into view.
	// `nearest` leaves a row that's already showing where it is — a click here doesn't jump.
	useEffect(() => {
		if (!selected) return;
		root.current?.querySelector(`[data-layer="${CSS.escape(selected)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, [selected]);

	const startDrag = (e: DragEvent, b: Block, part: Part) => {
		e.stopPropagation();
		e.dataTransfer.effectAllowed = 'move';
		// Firefox starts a drag only with some data.
		e.dataTransfer.setData('text/plain', b.id);
		const ids = new Set<string>();
		const walk = (x: Block) => {
			ids.add(x.id);
			(x.blocks || []).forEach(walk);
			(x.columns || []).forEach((c: any) => (c.blocks || []).forEach(walk));
		};
		walk(b);
		banned.current = ids;
		dragPart.current = part;
		dragType.current = b.type;
		let el: HTMLElement | null = root.current;
		while (el && !(el.scrollHeight > el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY))) el = el.parentElement;
		scroller.current = el;
		setDrag(b.id);
	};
	const endDrag = () => {
		setDrag(null);
		setTarget(null);
	};

	/** Whether the dragged block may go there: not into itself, placed-freely ones stay among themselves, a page break only in the body. */
	const allowed = (slot: Slot) => {
		if (slot.parent && banned.current.has(slot.parent)) return false;
		if ((dragPart.current === 'free') !== (slot.part === 'free')) return false;
		if (dragType.current === 'pageBreak' && (slot.part !== 'body' || slot.parent)) return false;
		return true;
	};

	const offer = (e: DragEvent, t: Target | null) => {
		if (!drag) return;
		// No stopPropagation: the panel's own dragover scrolls the list along.
		e.preventDefault();
		if (!t || !allowed(t.slot)) {
			e.dataTransfer.dropEffect = 'none';
			if (target) setTarget(null);
			return;
		}
		e.dataTransfer.dropEffect = 'move';
		if (!target || target.key !== t.key || target.show !== t.show) setTarget(t);
	};

	/** Over a block's row: above or below it — or, in the middle of a box / columns row, inside. */
	const overRow = (e: DragEvent, b: Block, slot: Slot, i: number) => {
		if (banned.current.has(b.id) && b.id !== drag) return offer(e, null);
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const f = (e.clientY - r.top) / Math.max(1, r.height);
		const holds = (b.type === 'box' || b.type === 'columns') && b.id !== drag;
		if (holds && f > 0.25 && f < 0.75) {
			const into: Slot = b.type === 'box' ? { part: slot.part, parent: b.id } : { part: slot.part, parent: b.id, column: 0 };
			const n = b.type === 'box' ? (b.blocks || []).length : (b.columns?.[0]?.blocks || []).length;
			return offer(e, { slot: into, index: n, key: b.id, show: 'inside' });
		}
		// Under a box or columns row its own blocks follow, so "below" there is first inside it (as in Figma).
		if (holds && f >= 0.75) {
			const into: Slot = b.type === 'box' ? { part: slot.part, parent: b.id } : { part: slot.part, parent: b.id, column: 0 };
			return offer(e, { slot: into, index: 0, key: b.id, show: 'below' });
		}
		const below = f >= 0.5;
		offer(e, { slot, index: i + (below ? 1 : 0), key: b.id, show: below ? 'below' : 'above' });
	};

	const drop = (e: DragEvent) => {
		if (!drag) return;
		e.preventDefault();
		e.stopPropagation();
		if (target && allowed(target.slot)) onMove(drag, target.slot, target.index);
		endDrag();
	};

	// Dragging near the panel's top or bottom edge scrolls the list.
	const scrollAlong = (e: DragEvent) => {
		const el = scroller.current;
		if (!drag || !el) return;
		const r = el.getBoundingClientRect();
		if (e.clientY < r.top + EDGE) el.scrollTop -= Math.ceil((r.top + EDGE - e.clientY) / 3);
		else if (e.clientY > r.bottom - EDGE) el.scrollTop += Math.ceil((e.clientY - (r.bottom - EDGE)) / 3);
	};

	const line = (show: Target['show'], indent: number) => (
		<Box
			position='absolute'
			left={`${indent}px`}
			right={1}
			{...(show === 'above' ? { top: '-1px' } : { bottom: '-1px' })}
			h='2px'
			borderRadius='full'
			bg='blue.500'
			pointerEvents='none'
			zIndex={1}
		/>
	);

	/** A "Column 2" / "Inside" line, or a part's title: dropped on, the block goes in at its end. */
	const intoProps = (slot: Slot, n: number, key: string) => ({
		onDragOver: (e: DragEvent) => offer(e, { slot, index: n, key, show: 'inside' }),
		onDrop: drop,
		borderRadius: 'sm',
		outline: drag && target?.key === key && target.show === 'inside' ? '1.5px solid var(--chakra-colors-blue-500)' : undefined,
		outlineOffset: '-1px',
	});

	const list = (blocks: Block[], slot: Slot, depth: number): any => (
		<Box>
			{(blocks || []).map((b, i) => {
				const Icon = ICONS[b.type] || FileText;
				const isSel = selected === b.id || alsoSelected.includes(b.id);
				const indent = 6 + depth * 14;
				const here = drag && target?.key === b.id ? target.show : null;
				return (
					<Box key={b.id}>
						<Flex
							data-layer={b.id}
							// Scrolled to (selected on the page): a little room above / below it.
							scrollMarginBlock='8px'
							draggable
							onDragStart={(e: DragEvent) => startDrag(e, b, slot.part)}
							onDragEnd={endDrag}
							onDragOver={(e: DragEvent) => overRow(e, b, slot, i)}
							onDrop={drop}
							position='relative'
							align='center'
							gap={1.5}
							pl={`${indent}px`}
							pr={2}
							py={1}
							borderRadius='sm'
							cursor='pointer'
							bg={here === 'inside' ? 'blue.subtle' : isSel ? 'blue.subtle' : undefined}
							color={isSel ? 'blue.fg' : undefined}
							opacity={drag === b.id ? 0.4 : 1}
							outline={here === 'inside' ? '1.5px solid var(--chakra-colors-blue-500)' : undefined}
							outlineOffset='-1px'
							_hover={{ bg: isSel ? 'blue.subtle' : 'bg.muted' }}
							onClick={(e: any) => onSelect(b.id, e.shiftKey || e.metaKey || e.ctrlKey)}>
							{(here === 'above' || here === 'below') && line(here, indent)}
							<GripVertical
								size={12}
								style={{ opacity: 0.4, cursor: 'grab', flexShrink: 0 }}
							/>
							<Icon
								size={13}
								style={{ flexShrink: 0 }}
							/>
							<Text
								fontSize='xs'
								truncate
								flex='1'>
								{blockSummary(b) || BLOCKS.find(x => x.type === b.type)?.label}
							</Text>
							{b.showIf?.length ? (
								<Text
									fontSize='10px'
									color='fg.subtle'>
									if
								</Text>
							) : null}
						</Flex>
						{b.type === 'columns' &&
							(b.columns || []).map((c: any, ci: number) => {
								const s: Slot = { part: slot.part, parent: b.id, column: ci };
								return (
									<Box key={ci}>
										<Flex
											align='center'
											pl={`${20 + depth * 14}px`}
											pr={1}
											{...intoProps(s, (c.blocks || []).length, `${b.id}|${ci}`)}>
											<Text
												fontSize='10px'
												color='fg.subtle'
												flex='1'>
												Column {ci + 1}
											</Text>
											<AddMenu onPick={t => onAdd(s, (c.blocks || []).length, t)} />
										</Flex>
										{list(c.blocks || [], s, depth + 2)}
									</Box>
								);
							})}
						{b.type === 'box' && (
							<Box>
								<Flex
									align='center'
									pl={`${20 + depth * 14}px`}
									pr={1}
									{...intoProps({ part: slot.part, parent: b.id }, (b.blocks || []).length, `${b.id}|in`)}>
									<Text
										fontSize='10px'
										color='fg.subtle'
										flex='1'>
										{b.direction === 'row' ? 'Side by side' : 'Inside'}
									</Text>
									<AddMenu onPick={t => onAdd({ part: slot.part, parent: b.id }, (b.blocks || []).length, t)} />
								</Flex>
								{list(b.blocks || [], { part: slot.part, parent: b.id }, depth + 2)}
							</Box>
						)}
					</Box>
				);
			})}
		</Box>
	);

	return (
		<Flex
			ref={root}
			direction='column'
			gap={3}
			onDragOver={scrollAlong}
			onDragLeave={(e: DragEvent) => {
				// Out of the panel altogether: nothing to drop on.
				if (!root.current?.contains(e.relatedTarget as Node)) setTarget(null);
			}}>
			{PARTS.map(p => (
				<Box key={p.part}>
					<Flex
						align='center'
						mb={0.5}
						{...intoProps({ part: p.part }, (template[p.part] || []).length, `part|${p.part}`)}>
						<Box flex='1'>
							<Text
								fontSize='11px'
								fontWeight='600'
								textTransform='uppercase'
								letterSpacing='0.05em'
								color='fg.muted'>
								{p.title}
							</Text>
						</Box>
						<AddMenu
							part={p.part}
							onPick={t => onAdd({ part: p.part }, (template[p.part] || []).length, t)}
						/>
					</Flex>
					{!(template[p.part] || []).length && (
						<Text
							fontSize='11px'
							color='fg.subtle'
							pl={1.5}
							py={1}
							{...intoProps({ part: p.part }, 0, `part|${p.part}`)}>
							{p.hint}
						</Text>
					)}
					{list(template[p.part] || [], { part: p.part }, 0)}
				</Box>
			))}
		</Flex>
	);
};

export default Outline;
