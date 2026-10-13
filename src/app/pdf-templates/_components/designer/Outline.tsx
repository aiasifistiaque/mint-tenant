'use client';

import { FC, DragEvent, useState } from 'react';
import { Box, Button, Flex, Menu, Portal, Text } from '@chakra-ui/react';
import { Box as BoxIcon, Columns3, FileText, GripVertical, Image, LayoutList, Minus, MoveVertical, Plus, Scissors, Table2 } from 'lucide-react';
import { BLOCKS, Block, BlockType, Part, PdfTemplate, Slot, blockSummary } from '@/components/library/pdf/types';

/**
 * The template's blocks as a tree — header, body, footer, and what sits in
 * columns and boxes. Click to select (the page outlines it), drag to move
 * (between parts and into columns or boxes too), + to add a block there.
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
];

type Props = {
	template: PdfTemplate;
	selected: string | null;
	onSelect: (id: string) => void;
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

const Outline: FC<Props> = ({ template, selected, onSelect, onAdd, onMove }) => {
	const [drag, setDrag] = useState<string | null>(null);
	const [over, setOver] = useState<string | null>(null);

	const dropZone = (slot: Slot, index: number) => {
		const key = `${slot.part}|${slot.parent || ''}|${slot.column ?? ''}|${index}`;
		return (
			<Box
				key={`z-${key}`}
				h={drag ? '8px' : '2px'}
				mx={1}
				borderRadius='full'
				bg={over === key ? 'blue.500' : 'transparent'}
				onDragOver={(e: DragEvent) => {
					if (!drag) return;
					e.preventDefault();
					setOver(key);
				}}
				onDragLeave={() => setOver(o => (o === key ? null : o))}
				onDrop={(e: DragEvent) => {
					e.preventDefault();
					if (drag) onMove(drag, slot, index);
					setDrag(null);
					setOver(null);
				}}
			/>
		);
	};

	const list = (blocks: Block[], slot: Slot, depth: number): any => (
		<Box>
			{dropZone(slot, 0)}
			{(blocks || []).map((b, i) => {
				const Icon = ICONS[b.type] || FileText;
				const isSel = selected === b.id;
				return (
					<Box key={b.id}>
						<Flex
							draggable
							onDragStart={(e: DragEvent) => {
								e.dataTransfer.effectAllowed = 'move';
								setDrag(b.id);
							}}
							onDragEnd={() => {
								setDrag(null);
								setOver(null);
							}}
							align='center'
							gap={1.5}
							pl={`${6 + depth * 14}px`}
							pr={2}
							py={1}
							borderRadius='sm'
							cursor='pointer'
							bg={isSel ? 'blue.subtle' : undefined}
							color={isSel ? 'blue.fg' : undefined}
							opacity={drag === b.id ? 0.4 : 1}
							_hover={{ bg: isSel ? 'blue.subtle' : 'bg.muted' }}
							onClick={() => onSelect(b.id)}>
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
											pr={1}>
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
									pr={1}>
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
						{dropZone(slot, i + 1)}
					</Box>
				);
			})}
		</Box>
	);

	return (
		<Flex
			direction='column'
			gap={3}>
			{PARTS.map(p => (
				<Box key={p.part}>
					<Flex
						align='center'
						mb={0.5}>
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
							pl={1.5}>
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
