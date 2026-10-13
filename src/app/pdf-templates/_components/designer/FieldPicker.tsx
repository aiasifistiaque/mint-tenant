'use client';

import { FC, ReactNode, useMemo, useState } from 'react';
import { Box, Button, Flex, Input, Popover, Portal, Text } from '@chakra-ui/react';
import { Braces } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import { FieldNode, FieldTree, PdfTemplate } from '@/components/library/pdf/types';

/**
 * Picks a field and hands back its token — `{{bill.total | money}}`. Lists
 * this page's fields (references and sections opened up), the rows' fields
 * inside a table, the template's lists, the business details and the page
 * number. The format is guessed from the field (dates → date, amounts →
 * money) and can be changed before picking.
 */

export type PickerContext = { template: PdfTemplate; tree?: FieldTree; rows?: string };

type Item = { token: string; label: string; type: string; depth: number };

const MONEYISH = /amount|total|price|paid|due|balance|cost|tax|vat|discount|subtotal|fee|rate|salary|payable/i;
const FORMATS = [
	{ value: 'auto', label: 'Format: guess' },
	{ value: '', label: 'As it is' },
	{ value: 'money', label: 'Money' },
	{ value: 'number', label: 'Number' },
	{ value: 'number:2', label: 'Number, 2 decimals' },
	{ value: 'date', label: 'Date' },
	{ value: 'datetime', label: 'Date and time' },
	{ value: 'words', label: 'Amount in words' },
	{ value: 'upper', label: 'UPPER CASE' },
	{ value: 'count', label: 'How many (a list)' },
];

const nodesToItems = (nodes: FieldNode[], prefix: string, depth = 0, out: Item[] = []): Item[] => {
	for (const n of nodes || []) {
		const token = n.path.startsWith('item.') ? n.path : `${prefix}${n.path}`;
		out.push({ token, label: n.label, type: n.type, depth });
		if (n.children && n.type !== 'list' && depth < 2) nodesToItems(n.children, prefix, depth + 1, out);
	}
	return out;
};

/** The fields a table's rows have, by what the table lists. */
export const rowFields = (ctx: PickerContext): FieldNode[] => {
	const rows = String(ctx.rows || '').trim();
	if (!rows || !ctx.tree) return [];
	const alias = ctx.template.alias;
	const list = ctx.template.lists?.find(l => l.name === rows);
	if (list) return ctx.tree.lists.find(l => l.route === list.route && l.foreignField === list.foreignField)?.fields || [];
	const path = rows.replace(new RegExp(`^(${alias}|record)\\.`), '');
	const find = (nodes: FieldNode[]): FieldNode | undefined => {
		for (const n of nodes) {
			if (n.path === path) return n;
			const hit = n.children && find(n.children);
			if (hit) return hit;
		}
	};
	return find(ctx.tree.fields)?.children || [];
};

export const tokenFor = (item: { token: string; type: string }, format: string) => {
	const f =
		format === 'auto'
			? item.type === 'date'
				? 'date'
				: item.type === 'number' && MONEYISH.test(item.token.split('.').pop() || '')
				? 'money'
				: ''
			: format;
	return `{{${item.token}${f ? ` | ${f}` : ''}}}`;
};

const FieldPicker: FC<{ ctx: PickerContext; onPick: (token: string) => void; trigger?: ReactNode; inTable?: boolean }> = ({ ctx, onPick, trigger, inTable }) => {
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState('');
	const [format, setFormat] = useState('auto');
	const alias = ctx.template.alias;

	const groups = useMemo(() => {
		const g: { title: string; items: Item[] }[] = [];
		if (inTable) {
			const rows = rowFields(ctx);
			g.push({ title: 'This row', items: [{ token: 'index', label: 'Row number', type: 'number', depth: 0 }, ...nodesToItems(rows, 'item.')] });
		}
		g.push({ title: ctx.tree?.title ? `This ${ctx.tree.title.replace(/s$/, '').toLowerCase()}` : 'This record', items: nodesToItems(ctx.tree?.fields || [], `${alias}.`) });
		for (const l of ctx.template.lists || [])
			g.push({ title: `List: ${l.name}`, items: [{ token: l.name, label: `${l.name} (the whole list)`, type: 'list', depth: 0 }] });
		g.push({
			title: 'Business',
			items: ['name', 'logo', 'address', 'phone', 'email', 'website', 'taxId', 'note'].map(k => ({ token: `business.${k}`, label: k === 'taxId' ? 'Tax number' : k[0].toUpperCase() + k.slice(1), type: 'text', depth: 0 })),
		});
		g.push({
			title: 'Other',
			items: [
				{ token: 'today', label: 'Today', type: 'date', depth: 0 },
				{ token: 'page', label: 'Page number (header/footer)', type: 'text', depth: 0 },
				{ token: 'pages', label: 'Page count (header/footer)', type: 'text', depth: 0 },
				{ token: 'template.name', label: 'Template name', type: 'text', depth: 0 },
			],
		});
		const s = q.trim().toLowerCase();
		return s ? g.map(x => ({ ...x, items: x.items.filter(i => i.label.toLowerCase().includes(s) || i.token.toLowerCase().includes(s)) })).filter(x => x.items.length) : g;
	}, [ctx, alias, q, inTable]);

	return (
		<Popover.Root
			open={open}
			onOpenChange={e => setOpen(e.open)}
			positioning={{ placement: 'bottom-end' }}
			lazyMount
			unmountOnExit>
			<Popover.Trigger asChild>
				{trigger || (
					<Button
						size='2xs'
						variant='ghost'
						title='Insert a field'>
						<Braces size={12} />
						Field
					</Button>
				)}
			</Popover.Trigger>
			<Portal>
				<Popover.Positioner>
					<Popover.Content
						w='320px'
						maxH='420px'
						display='flex'
						flexDirection='column'>
						<Flex
							gap={2}
							p={2}
							borderBottomWidth='1px'
							borderColor='border'>
							<Input
								size='xs'
								autoFocus
								placeholder='Search fields'
								value={q}
								onChange={e => setQ(e.target.value)}
							/>
							<Box w='150px'>
								<Dropdown
									size='xs'
									value={format}
									portalled={false}
									onChange={setFormat}>
									{FORMATS.map(f => (
										<option
											key={f.value}
											value={f.value}>
											{f.label}
										</option>
									))}
								</Dropdown>
							</Box>
						</Flex>
						<Box
							overflowY='auto'
							py={1}>
							{groups.map(g => (
								<Box
									key={g.title}
									mb={1}>
									<Text
										px={3}
										pt={2}
										pb={1}
										fontSize='10px'
										fontWeight='600'
										textTransform='uppercase'
										letterSpacing='0.05em'
										color='fg.muted'>
										{g.title}
									</Text>
									{g.items.map(i => (
										<Flex
											key={i.token}
											as='button'
											w='full'
											textAlign='left'
											align='center'
											gap={2}
											px={3}
											pl={`${12 + i.depth * 14}px`}
											py={1}
											fontSize='xs'
											_hover={{ bg: 'bg.muted' }}
											onClick={() => {
												onPick(tokenFor(i, i.type === 'list' && format === 'auto' ? 'count' : format));
												setOpen(false);
												setQ('');
											}}>
											<Text
												flex='1'
												truncate>
												{i.label}
											</Text>
											<Text
												fontSize='10px'
												color='fg.subtle'
												fontFamily='mono'
												truncate
												maxW='45%'>
												{i.type}
											</Text>
										</Flex>
									))}
								</Box>
							))}
						</Box>
					</Popover.Content>
				</Popover.Positioner>
			</Portal>
		</Popover.Root>
	);
};

export default FieldPicker;
