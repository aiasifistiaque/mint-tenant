'use client';

import { DragEvent, FC, ReactNode } from 'react';
import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react';
import {
	BadgeCheck,
	ArrowDownToLine,
	Box as BoxIcon,
	Columns2,
	Building2,
	Columns3,
	FileText,
	Heart,
	Image,
	Landmark,
	LayoutList,
	Minus,
	MonitorCheck,
	MoveVertical,
	PenLine,
	Plus,
	ScrollText,
	Scissors,
	Settings2,
	Table2,
	Type,
} from 'lucide-react';
import { BLOCKS, Block, BlockType, newBlock, newRow } from '@/components/library/pdf/types';
import { SavedText } from '@/components/library/pdf/scope';
import { DocLink } from '../ui';

/**
 * The designer's Add panel (backend docs/pdf-templates D17): plain blocks,
 * ready-made pieces (a business header, a signature, "computer generated —
 * no signature required", terms and conditions…) and the project's saved
 * texts. A click puts it after the selected block, or at the end of the body.
 */

const ICONS: Record<string, any> = {
	text: Type,
	fields: LayoutList,
	table: Table2,
	columns: Columns3,
	box: BoxIcon,
	image: Image,
	divider: Minus,
	spacer: MoveVertical,
	pageBreak: Scissors,
};

const text = (t: string, more: Partial<Block> = {}): Block => ({ ...newBlock('text'), text: t, ...more });

/** Ready-made pieces: real blocks, changed like any other once they're on the page. */
export const PIECES: { key: string; label: string; hint: string; icon: any; make: () => Block }[] = [
	{
		key: 'business',
		label: 'Logo and business',
		hint: 'Your logo, name, address and contacts',
		icon: Building2,
		make: () => ({
			...newBlock('columns'),
			columns: [
				{ width: 1, valign: 'top', blocks: [{ ...newBlock('image'), src: '{{business.logo}}', height: 44, align: 'left' }] },
				{
					width: 2,
					valign: 'top',
					blocks: [
						text('{{business.name}}', { size: 13, weight: 700, align: 'right' }),
						text('{{business.address}}\n{{business.phone}} · {{business.email}}', { size: 8.5, color: '#6b7280', align: 'right' }),
					],
				},
			],
		}),
	},
	{
		key: 'signature',
		label: 'Signature line',
		hint: 'A line and “Authorised signature”',
		icon: PenLine,
		// A row: a space that fills, then the line — so it sits on the right.
		make: () => ({
			...newRow(),
			mt: 36,
			blocks: [
				{ ...newBlock('spacer'), grow: 1 },
				{ ...newBlock('box'), bg: undefined, radius: undefined, pad: 0, basis: 170, blocks: [{ ...newBlock('divider'), color: '#9ca3af' }, text('Authorised signature', { size: 8.5, color: '#6b7280', align: 'center', mt: 4 })] },
			],
		}),
	},
	{
		key: 'push',
		label: 'Push to the bottom',
		hint: 'A space that takes the room left — what follows sits at the page bottom',
		icon: ArrowDownToLine,
		make: () => ({ ...newBlock('spacer'), grow: 1 }),
	},
	{
		key: 'computer',
		label: 'Computer generated',
		hint: '“…no signature is required”',
		icon: MonitorCheck,
		make: () => text('This is a computer-generated document — no signature is required.', { size: 8, color: '#6b7280', align: 'center', italic: true, mt: 16 }),
	},
	{
		key: 'terms',
		label: 'Terms & conditions',
		hint: 'Your saved terms, in a box',
		icon: ScrollText,
		make: () => ({
			...newBlock('box'),
			mt: 16,
			pad: 10,
			bg: '#f9fafb',
			radius: 4,
			blocks: [text('Terms & conditions', { size: 9, weight: 700, mb: 3 }), text('{{texts.terms_conditions}}', { size: 8.5, color: '#4b5563' })],
		}),
	},
	{
		key: 'bank',
		label: 'Bank details',
		hint: 'Your bank note',
		icon: Landmark,
		make: () => text('**Payment details**\n{{business.note}}', { size: 8.5, color: '#4b5563', mt: 12 }),
	},
	{
		key: 'paid',
		label: 'PAID stamp',
		hint: 'Big and green — add “Show only when”',
		icon: BadgeCheck,
		make: () => text('PAID', { size: 28, weight: 700, color: '#16a34a', align: 'right', spacing: 4 }),
	},
	{
		key: 'thanks',
		label: 'Thank-you line',
		hint: 'A friendly closing line',
		icon: Heart,
		make: () => text('Thank you for your business!', { size: 10, weight: 600, align: 'center', mt: 18 }),
	},
];

const Tile: FC<{ icon: any; label: string; hint: string; onClick: () => void; onDragStart?: (e: DragEvent) => void }> = ({ icon: Icon, label, hint, onClick, onDragStart }) => (
	<Box
		as='button'
		draggable={!!onDragStart || undefined}
		onDragStart={onDragStart}
		textAlign='left'
		borderWidth='1px'
		borderColor='border'
		borderRadius='md'
		bg='bg.panel'
		px={2.5}
		py={2}
		cursor='pointer'
		_hover={{ borderColor: 'accent.solid', bg: 'bg.subtle' }}
		onClick={onClick}
		title={`${hint} — click to add, or drag onto the page`}>
		<Flex
			align='center'
			gap={1.5}>
			<Icon
				size={14}
				strokeWidth={1.75}
			/>
			<Text
				fontSize='12px'
				fontWeight='600'
				truncate>
				{label}
			</Text>
		</Flex>
		<Text
			fontSize='11px'
			color='fg.muted'
			lineClamp={2}
			mt={0.5}>
			{hint}
		</Text>
	</Box>
);

const Heading: FC<{ children: ReactNode; action?: ReactNode }> = ({ children, action }) => (
	<Flex
		align='center'
		justify='space-between'
		mt={4}
		mb={2}>
		<Text
			fontSize='11px'
			fontWeight='600'
			color='fg.muted'
			textTransform='uppercase'
			letterSpacing='0.04em'>
			{children}
		</Text>
		{action}
	</Flex>
);

const AddPanel: FC<{
	where: string;
	onAdd: (block: Block) => void;
	alias: string;
	texts: SavedText[];
	onTexts: (focus?: string) => void;
	/** A tile dragged onto the page: what it makes (D20). */
	onDragNew?: (make: () => Block, e: DragEvent) => void;
}> = ({ where, onAdd, alias, texts, onTexts, onDragNew }) => {
	const drag = (make: () => Block) => (onDragNew ? (e: DragEvent) => onDragNew(make, e) : undefined);
	return (
		<Box>
			<Text
				fontSize='11px'
				color='fg.muted'>
				Goes {where} — or drag it onto the page.
			</Text>

			<Heading>Blocks</Heading>
			<Grid
				templateColumns='1fr 1fr'
				gap={1.5}>
				{BLOCKS.map(b => (
					<Tile
						key={b.type}
						icon={ICONS[b.type] || FileText}
						label={b.label.replace(' rows', '')}
						hint={b.hint}
						onClick={() => onAdd(newBlock(b.type as BlockType, alias))}
						onDragStart={drag(() => newBlock(b.type as BlockType, alias))}
					/>
				))}
				<Tile
					icon={Columns2}
					label='Row'
					hint='Blocks side by side, each as wide as it needs'
					onClick={() => onAdd(newRow())}
					onDragStart={drag(newRow)}
				/>
			</Grid>

			<Heading>Ready-made</Heading>
			<Grid
				templateColumns='1fr 1fr'
				gap={1.5}>
				{PIECES.map(p => (
					<Tile
						key={p.key}
						icon={p.icon}
						label={p.label}
						hint={p.hint}
						onClick={() => onAdd(p.make())}
						onDragStart={drag(p.make)}
					/>
				))}
			</Grid>

			<Heading
				action={
					<Button
						size='2xs'
						variant='ghost'
						onClick={() => onTexts()}>
						<Settings2 size={12} />
						Manage
					</Button>
				}>
				Your saved texts
			</Heading>
			{texts.length ? (
				<Flex
					direction='column'
					gap={1.5}>
					{texts.map(t => (
						<Tile
							key={t.key}
							icon={ScrollText}
							label={t.label || t.key}
							hint={t.text.replace(/\*\*/g, '').slice(0, 90) || 'Empty — write it in Manage'}
							onClick={() => onAdd(text(`{{texts.${t.key}}}`, { size: 8.5, color: '#4b5563', mt: 10 }))}
							onDragStart={drag(() => text(`{{texts.${t.key}}}`, { size: 8.5, color: '#4b5563', mt: 10 }))}
						/>
					))}
				</Flex>
			) : (
				<Text
					fontSize='11px'
					color='fg.muted'>
					Terms and conditions, a return policy — write them once, print them on any template.
				</Text>
			)}
			<Button
				size='xs'
				variant='outline'
				mt={2}
				w='full'
				onClick={() => onTexts('texts.new_text')}>
				<Plus size={12} />
				New saved text
			</Button>
			<Box mt={4}>
				<DocLink section='blocks' />
			</Box>
		</Box>
	);
};

export default AddPanel;
