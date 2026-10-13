'use client';

import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, Input, Popover, Portal, Text } from '@chakra-ui/react';
import { ArrowLeft, Braces, Building2, Calendar, ChevronRight, FileText, List, Quote, Rows3 } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import { FieldNode, FieldTree, PdfTemplate } from '@/components/library/pdf/types';
import { SavedText } from '@/components/library/pdf/scope';

/**
 * Picks a field and hands back its token — `{{bill.total | money}}` — in
 * layers, like a menu: first what it comes from (this record, this row, a
 * list, the business, a saved text, the page), then its fields; a reference
 * (Client) opens into its own. Search looks through every layer. The format
 * is guessed from the field (dates → date, amounts → money) and can be
 * changed before picking.
 *
 * `describeToken` turns a token back into words — "Saved text · Invoice
 * terms" — for the chips TokenText shows instead of raw keys.
 */

export type PickerContext = { template: PdfTemplate; tree?: FieldTree; rows?: string; texts?: SavedText[] };

/** One place in the menu: a field to pick (`token`) and / or a layer to open (`children`). */
type MenuNode = { key: string; label: string; type: string; token?: string; children?: MenuNode[]; icon?: FC<any> };

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

/** The record's fields as layers: a reference or section opens into its fields (two deep). */
const fieldNodes = (nodes: FieldNode[], prefix: string, depth = 0): MenuNode[] =>
	(nodes || []).map(n => {
		const token = n.path.startsWith('item.') ? n.path : `${prefix}${n.path}`;
		const opens = !!n.children?.length && n.type !== 'list' && depth < 2;
		return { key: token, label: n.label, type: n.type, token, ...(opens && { children: fieldNodes(n.children!, prefix, depth + 1) }) };
	});

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

const BUSINESS: [string, string][] = [
	['name', 'Name'],
	['logo', 'Logo'],
	['address', 'Address'],
	['phone', 'Phone'],
	['email', 'Email'],
	['website', 'Website'],
	['taxId', 'Tax number'],
	['note', 'Note'],
];

/** Everything a field can come from, as the menu's first layer. */
export const fieldMenu = (ctx: PickerContext, inTable?: boolean): MenuNode[] => {
	const alias = ctx.template.alias;
	const record = ctx.tree?.title ? `This ${ctx.tree.title.replace(/s$/, '').toLowerCase()}` : 'This record';
	const menu: MenuNode[] = [];
	if (inTable)
		menu.push({
			key: 'row',
			label: 'This row',
			type: 'group',
			icon: Rows3,
			children: [{ key: 'index', label: 'Row number', type: 'number', token: 'index' }, ...fieldNodes(rowFields(ctx), 'item.')],
		});
	menu.push({ key: 'record', label: record, type: 'group', icon: FileText, children: fieldNodes(ctx.tree?.fields || [], `${alias}.`) });
	if ((ctx.template.lists || []).length)
		menu.push({
			key: 'lists',
			label: 'Lists',
			type: 'group',
			icon: List,
			children: (ctx.template.lists || []).map(l => ({ key: l.name, label: l.name, type: 'list', token: l.name })),
		});
	menu.push({ key: 'business', label: 'Business', type: 'group', icon: Building2, children: BUSINESS.map(([k, label]) => ({ key: `business.${k}`, label, type: 'text', token: `business.${k}` })) });
	menu.push({
		key: 'texts',
		label: 'Saved texts',
		type: 'group',
		icon: Quote,
		children: (ctx.texts || []).map(t => ({ key: `texts.${t.key}`, label: t.label || t.key, type: 'text', token: `texts.${t.key}` })),
	});
	menu.push({
		key: 'other',
		label: 'Page & date',
		type: 'group',
		icon: Calendar,
		children: [
			{ key: 'today', label: 'Today', type: 'date', token: 'today' },
			{ key: 'page', label: 'Page number', type: 'text', token: 'page' },
			{ key: 'pages', label: 'Page count', type: 'text', token: 'pages' },
			{ key: 'template.name', label: 'Template name', type: 'text', token: 'template.name' },
		],
	});
	return menu;
};

/** Every field in the menu with the way to it — "This invoice › Client › Name". */
const flatMenu = (nodes: MenuNode[], trail: string[] = [], out: { node: MenuNode; trail: string[] }[] = []) => {
	for (const n of nodes) {
		if (n.token) out.push({ node: n, trail });
		if (n.children) flatMenu(n.children, [...trail, n.label], out);
	}
	return out;
};

const formatLabel = (f: string) => FORMATS.find(x => x.value === f)?.label || f;

/**
 * A token in words: where it comes from, its name, and its format —
 * `{{texts.invoice_terms}}` → Saved text · Invoice terms. Unknown paths read
 * as their last part, so a field the page no longer has still says something.
 */
export const describeToken = (raw: string, menu: MenuNode[]): { group: string; label: string; format: string; known: boolean } => {
	const inner = raw.replace(/^\{\{\s*|\s*\}\}$/g, '');
	const [path, ...filters] = inner.split('|').map(s => s.trim());
	const format = filters.length ? filters.map(f => (f.startsWith('number') ? formatLabel(f) : formatLabel(f.split(':')[0]))).join(', ') : '';
	const hit = flatMenu(menu).find(x => x.node.token === path);
	if (hit) {
		// The record's own fields need no "This invoice ·" — that's what a field is unless it says otherwise.
		const record = menu.find(m => m.key === 'record')?.label;
		const group = hit.trail[0] === 'Saved texts' ? 'Saved text' : hit.trail[0] === record ? '' : hit.trail[0] || '';
		return { group, label: [...hit.trail.slice(1), hit.node.label].join(' › '), format, known: true };
	}
	const last = path.split('.').pop() || path;
	return { group: '', label: last.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase()), format, known: false };
};

const Row: FC<{ n: MenuNode; sub?: string; onOpen: () => void; onPick: () => void; current?: boolean }> = ({ n, sub, onOpen, onPick, current }) => {
	const Icon = n.icon;
	const opens = !!n.children;
	return (
		<Flex
			as='button'
			w='full'
			textAlign='left'
			align='center'
			gap={2}
			px={3}
			py={1.5}
			fontSize='xs'
			bg={current ? 'bg.muted' : undefined}
			fontWeight={current ? 600 : undefined}
			_hover={{ bg: 'bg.muted' }}
			onClick={opens && !n.token ? onOpen : onPick}>
			{Icon && (
				<Icon
					size={14}
					strokeWidth={1.75}
					style={{ flexShrink: 0, opacity: 0.7 }}
				/>
			)}
			<Box
				flex='1'
				minW={0}>
				<Text truncate>{n.label}</Text>
				{sub && (
					<Text
						fontSize='10px'
						color='fg.subtle'
						truncate>
						{sub}
					</Text>
				)}
			</Box>
			{!opens && (
				<Text
					fontSize='10px'
					color='fg.subtle'
					fontFamily='mono'
					flexShrink={0}>
					{n.type}
				</Text>
			)}
			{opens && (
				// A reference is a field itself (picking prints it) and opens into its fields.
				<Box
					as='span'
					role='button'
					aria-label={`Open ${n.label}`}
					p={0.5}
					m={-0.5}
					borderRadius='sm'
					_hover={{ bg: 'bg.emphasized' }}
					onClick={(e: any) => {
						e.stopPropagation();
						onOpen();
					}}>
					<ChevronRight
						size={14}
						style={{ opacity: 0.6 }}
					/>
				</Box>
			)}
		</Flex>
	);
};

type PickerProps = {
	ctx: PickerContext;
	onPick: (token: string) => void;
	trigger?: ReactNode;
	inTable?: boolean;
	/** Controlled, without a trigger: open beside `anchor` (a chip being changed). */
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	anchor?: DOMRect | null;
	/** The token being changed — opens at its layer, shown as the current one. */
	current?: string;
};

const FieldPicker: FC<PickerProps> = ({ ctx, onPick, trigger, inTable, open: openProp, onOpenChange, anchor, current }) => {
	const [openSelf, setOpenSelf] = useState(false);
	const controlled = openProp !== undefined;
	const open = controlled ? openProp : openSelf;
	const setOpen = (v: boolean) => (controlled ? onOpenChange?.(v) : setOpenSelf(v));
	const [q, setQ] = useState('');
	const [format, setFormat] = useState('auto');
	const [trail, setTrail] = useState<MenuNode[]>([]);
	const menu = useMemo(() => fieldMenu(ctx, inTable), [ctx, inTable]);
	const currentPath = current?.replace(/^\{\{\s*|\s*\}\}$/g, '').split('|')[0].trim();

	// Opening on a chip: start at the layer its field is in.
	const startAt = () => {
		if (!currentPath) return setTrail([]);
		const walk = (nodes: MenuNode[], path: MenuNode[]): MenuNode[] | null => {
			for (const n of nodes) {
				if (n.token === currentPath) return path;
				if (n.children) {
					const hit = walk(n.children, [...path, n]);
					if (hit) return hit;
				}
			}
			return null;
		};
		setTrail(walk(menu, []) || []);
	};

	useEffect(() => {
		if (open) startAt();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, currentPath]);

	const layer = trail.length ? trail[trail.length - 1].children || [] : menu;
	const s = q.trim().toLowerCase();
	const found = s ? flatMenu(menu).filter(x => x.node.label.toLowerCase().includes(s) || x.node.token!.toLowerCase().includes(s) || x.trail.join(' ').toLowerCase().includes(s)) : [];

	const pick = (n: MenuNode) => {
		onPick(tokenFor({ token: n.token!, type: n.type }, n.type === 'list' && format === 'auto' ? 'count' : format));
		setOpen(false);
		setQ('');
	};

	const content = (
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
				<Box
					w='150px'
					flexShrink={0}>
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
			{!s && trail.length > 0 && (
				<Flex
					align='center'
					gap={1}
					px={1.5}
					py={1}
					borderBottomWidth='1px'
					borderColor='border'>
					<Button
						size='2xs'
						variant='ghost'
						aria-label='Back'
						onClick={() => setTrail(t => t.slice(0, -1))}>
						<ArrowLeft size={12} />
					</Button>
					<Text
						fontSize='11px'
						color='fg.muted'
						truncate>
						{trail.map(t => t.label).join(' › ')}
					</Text>
				</Flex>
			)}
			<Box
				overflowY='auto'
				py={1}>
				{s ? (
					found.length ? (
						found.slice(0, 80).map(({ node, trail: tr }) => (
							<Row
								key={`${tr.join('/')}/${node.key}`}
								n={{ ...node, children: undefined }}
								sub={tr.join(' › ')}
								current={node.token === currentPath}
								onOpen={() => {}}
								onPick={() => pick(node)}
							/>
						))
					) : (
						<Text
							px={3}
							py={2}
							fontSize='xs'
							color='fg.muted'>
							No field matches.
						</Text>
					)
				) : layer.length ? (
					layer.map(n => (
						<Row
							key={n.key}
							n={n}
							current={!!currentPath && (n.token === currentPath || !!(n.children && flatMenu(n.children).some(x => x.node.token === currentPath)))}
							onOpen={() => setTrail(t => [...t, n])}
							onPick={() => pick(n)}
						/>
					))
				) : (
					<Text
						px={3}
						py={2}
						fontSize='xs'
						color='fg.muted'>
						{trail[trail.length - 1]?.key === 'texts' ? 'No saved texts yet — add them in Business details → Saved texts.' : 'Nothing here.'}
					</Text>
				)}
			</Box>
		</Popover.Content>
	);

	return (
		<Popover.Root
			open={open}
			onOpenChange={e => setOpen(e.open)}
			onExitComplete={() => setQ('')}
			positioning={{ placement: controlled ? 'bottom-start' : 'bottom-end' }}
			lazyMount
			unmountOnExit>
			{controlled && anchor && (
				// Opened from a chip: an invisible box where the chip is, for the menu to sit under.
				<Popover.Anchor asChild>
					<span style={{ position: 'fixed', left: anchor.left, top: anchor.top, width: anchor.width, height: anchor.height, pointerEvents: 'none' }} />
				</Popover.Anchor>
			)}
			{!controlled && (
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
			)}
			<Portal>
				<Popover.Positioner>{content}</Popover.Positioner>
			</Portal>
		</Popover.Root>
	);
};

export default FieldPicker;
