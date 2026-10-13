/**
 * PDF templates (backend docs/pdf-templates): the template's shape as the
 * designer edits it, and small helpers for its block tree. The server checks
 * every save (library/functions/pdfTemplates/schema.ts) — these only keep the
 * designer's edits tidy.
 */

export type Align = 'left' | 'center' | 'right';
export type Condition = { field: string; op: string; value?: any };

export type Block = {
	id: string;
	type: BlockType;
	showIf?: Condition[];
	showMatch?: 'all' | 'any';
	mt?: number;
	mb?: number;
	[key: string]: any;
};

export type BlockType = 'text' | 'image' | 'columns' | 'box' | 'table' | 'fields' | 'divider' | 'spacer' | 'pageBreak';
export type Part = 'header' | 'body' | 'footer';

export type PdfTemplate = {
	_id?: string;
	name: string;
	description?: string;
	kind: string;
	route: string;
	alias: string;
	isDefault?: boolean;
	page: { size: 'A4' | 'Letter' | 'Legal' | 'A5'; orientation: 'portrait' | 'landscape'; margin: [number, number, number, number] };
	style: { font: 'sans' | 'mono' | 'helvetica' | 'times' | 'courier'; size: number; color: string; muted: string; accent: string; lineHeight: number };
	lists: { name: string; route: string; foreignField: string; sort?: string; limit?: number }[];
	header: Block[];
	body: Block[];
	footer: Block[];
	slots?: any[];
	sample?: any;
	gallery?: { published: boolean; order: number };
	key?: string;
	builtIn?: boolean;
	updatedAt?: string;
};

export const PAGE_SIZES: Record<string, [number, number]> = {
	A4: [595.28, 841.89],
	Letter: [612, 792],
	Legal: [612, 1008],
	A5: [419.53, 595.28],
};

export const pageSize = (t: Pick<PdfTemplate, 'page'>): [number, number] => {
	const [w, h] = PAGE_SIZES[t.page?.size] || PAGE_SIZES.A4;
	return t.page?.orientation === 'landscape' ? [h, w] : [w, h];
};

export const KINDS: { value: string; label: string }[] = [
	{ value: 'invoice', label: 'Invoice' },
	{ value: 'bill', label: 'Bill' },
	{ value: 'receipt', label: 'Receipt' },
	{ value: 'quote', label: 'Quote' },
	{ value: 'statement', label: 'Statement' },
	{ value: 'other', label: 'Other' },
];

export const BLOCKS: { type: BlockType; label: string; hint: string }[] = [
	{ type: 'text', label: 'Text', hint: 'A heading or paragraph; fields go in as {{…}}' },
	{ type: 'fields', label: 'Label + value rows', hint: 'Invoice no., dates, the totals stack' },
	{ type: 'table', label: 'Table', hint: 'Line items, payments — one row each' },
	{ type: 'columns', label: 'Columns', hint: 'Blocks side by side' },
	{ type: 'box', label: 'Box', hint: 'A shaded or framed group' },
	{ type: 'image', label: 'Image', hint: 'Logo, signature, a photo field' },
	{ type: 'divider', label: 'Line', hint: 'A horizontal rule' },
	{ type: 'spacer', label: 'Space', hint: 'Blank room between blocks' },
	{ type: 'pageBreak', label: 'Page break', hint: 'What follows starts a new page' },
];

export const blockLabel = (type: string) => BLOCKS.find(b => b.type === type)?.label || type;

export const newId = () => `b_${Math.random().toString(36).slice(2, 12)}`;

export const newBlock = (type: BlockType, alias = 'record'): Block => {
	const id = newId();
	switch (type) {
		case 'text':
			return { id, type, text: 'New text' };
		case 'fields':
			return { id, type, rows: [{ label: 'Label', value: `{{${alias}._id}}` }], labelWidth: 0.5, align: 'left' };
		case 'table':
			return { id, type, rows: '', columns: [{ header: 'Item', value: '{{item.name}}', width: 3, align: 'left' }, { header: 'Amount', value: '{{item.amount | money}}', width: 1, align: 'right' }], lines: 'rows', headerBg: '#111827', headerColor: '#ffffff' };
		case 'columns':
			return { id, type, gap: 16, columns: [{ width: 1, blocks: [] }, { width: 1, blocks: [] }] };
		case 'box':
			return { id, type, pad: 12, bg: '#f6f7f9', radius: 4, blocks: [] };
		case 'image':
			return { id, type, src: '{{business.logo}}', height: 40, align: 'left' };
		case 'divider':
			return { id, type, thickness: 0.75 };
		case 'spacer':
			return { id, type, height: 16 };
		case 'pageBreak':
			return { id, type };
	}
};

/* ---------------------------------------------------- the block tree */

/** Where a list of blocks sits: a part, a column of a block, or inside a box. */
export type Slot = { part: Part; parent?: string; column?: number };

const childrenOf = (b: Block, column?: number): Block[] | undefined =>
	b.type === 'columns' ? b.columns?.[column ?? 0]?.blocks : b.type === 'box' ? b.blocks : undefined;

/** Calls `fn` on every block of a template, depth first, with where it sits. */
export const walk = (t: PdfTemplate, fn: (b: Block, slot: Slot, index: number) => void) => {
	const go = (blocks: Block[], slot: Slot) =>
		(blocks || []).forEach((b, i) => {
			fn(b, slot, i);
			if (b.type === 'columns') (b.columns || []).forEach((c: any, ci: number) => go(c.blocks, { part: slot.part, parent: b.id, column: ci }));
			if (b.type === 'box') go(b.blocks, { part: slot.part, parent: b.id });
		});
	(['header', 'body', 'footer'] as Part[]).forEach(part => go(t[part], { part }));
};

export const findBlock = (t: PdfTemplate, id: string | null): { block: Block; slot: Slot; index: number } | null => {
	let hit: any = null;
	if (id) walk(t, (b, slot, index) => b.id === id && !hit && (hit = { block: b, slot, index }));
	return hit;
};

/** A copy of the template with `fn` applied to the list of blocks at `slot`. */
export const editList = (t: PdfTemplate, slot: Slot, fn: (list: Block[]) => Block[]): PdfTemplate => {
	if (!slot.parent) return { ...t, [slot.part]: fn([...(t[slot.part] || [])]) };
	const map = (blocks: Block[]): Block[] =>
		blocks.map(b => {
			if (b.id === slot.parent) {
				if (b.type === 'columns')
					return { ...b, columns: b.columns.map((c: any, i: number) => (i === slot.column ? { ...c, blocks: fn([...(c.blocks || [])]) } : c)) };
				if (b.type === 'box') return { ...b, blocks: fn([...(b.blocks || [])]) };
			}
			if (b.type === 'columns') return { ...b, columns: b.columns.map((c: any) => ({ ...c, blocks: map(c.blocks || []) })) };
			if (b.type === 'box') return { ...b, blocks: map(b.blocks || []) };
			return b;
		});
	return { ...t, [slot.part]: map(t[slot.part] || []) };
};

export const updateBlock = (t: PdfTemplate, id: string, patch: Partial<Block> | ((b: Block) => Block)): PdfTemplate => {
	const hit = findBlock(t, id);
	if (!hit) return t;
	return editList(t, hit.slot, list => list.map(b => (b.id === id ? (typeof patch === 'function' ? patch(b) : { ...b, ...patch }) : b)));
};

export const removeBlock = (t: PdfTemplate, id: string): PdfTemplate => {
	const hit = findBlock(t, id);
	return hit ? editList(t, hit.slot, list => list.filter(b => b.id !== id)) : t;
};

export const insertBlock = (t: PdfTemplate, slot: Slot, index: number, block: Block): PdfTemplate =>
	editList(t, slot, list => [...list.slice(0, index), block, ...list.slice(index)]);

/** Moves a block up or down among its neighbours. */
export const moveBlock = (t: PdfTemplate, id: string, by: -1 | 1): PdfTemplate => {
	const hit = findBlock(t, id);
	if (!hit) return t;
	return editList(t, hit.slot, list => {
		const to = hit.index + by;
		if (to < 0 || to >= list.length) return list;
		const next = [...list];
		const [b] = next.splice(hit.index, 1);
		next.splice(to, 0, b);
		return next;
	});
};

/** Moves a block to another place (drag and drop); never into itself. */
export const relocateBlock = (t: PdfTemplate, id: string, slot: Slot, index: number): PdfTemplate => {
	const hit = findBlock(t, id);
	if (!hit) return t;
	let inside = false;
	const check = (b: Block) => {
		if (b.id === slot.parent) inside = true;
		if (b.type === 'columns') b.columns.forEach((c: any) => c.blocks?.forEach(check));
		if (b.type === 'box') b.blocks?.forEach(check);
	};
	check(hit.block);
	if (inside) return t;
	const same = hit.slot.part === slot.part && hit.slot.parent === slot.parent && hit.slot.column === slot.column;
	const without = removeBlock(t, id);
	return insertBlock(without, slot, same && index > hit.index ? index - 1 : index, hit.block);
};

/** A deep copy with fresh ids — duplicating a block. */
export const cloneBlock = (b: Block): Block => {
	const c: Block = JSON.parse(JSON.stringify(b));
	const fresh = (x: Block) => {
		x.id = newId();
		if (x.type === 'columns') x.columns.forEach((col: any) => col.blocks?.forEach(fresh));
		if (x.type === 'box') x.blocks?.forEach(fresh);
	};
	fresh(c);
	return c;
};

/** A one-line summary of a block for the outline. */
export const blockSummary = (b: Block): string => {
	const plain = (s: string) => String(s || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
	switch (b.type) {
		case 'text':
			return plain(b.text).slice(0, 60) || 'Empty text';
		case 'fields':
			return (b.rows || []).map((r: any) => plain(r.label)).filter(Boolean).join(' · ').slice(0, 60) || 'No rows';
		case 'table':
			return `${b.rows || 'pick a list'} · ${(b.columns || []).length} columns`;
		case 'columns':
			return `${(b.columns || []).length} columns`;
		case 'box':
			return `${(b.blocks || []).length} inside`;
		case 'image':
			return plain(b.src) || 'No image';
		case 'spacer':
			return `${b.height ?? 12} pt`;
		default:
			return '';
	}
};

/** "invoice" from "Invoices", "billPayment" from "Bill payments" — a template's token root (as the server makes it). */
export const aliasOf = (name: string) => {
	const words = String(name || '')
		.replace(/[^A-Za-z0-9 ]+/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (!words.length) return 'record';
	const last = words.length - 1;
	words[last] = words[last].replace(/ies$/i, 'y').replace(/(ss|sh|ch|x)es$/i, '$1').replace(/([^s])s$/i, '$1');
	const camel = words.map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('');
	return /^[A-Za-z_]/.test(camel) ? camel : `r${camel}`;
};

/** A field-picker node (backend GET /pdf-templates/fields/:route). */
export type FieldNode = { path: string; label: string; type: string; list?: boolean; children?: FieldNode[] };
export type FieldTree = { route: string; title: string; model: string; fields: FieldNode[]; lists: { route: string; title: string; foreignField: string; fieldLabel: string; fields: FieldNode[] }[] };

/** Every field as [path, "Client → Name", type], references and sections opened up. */
export const flattenFields = (nodes: FieldNode[], prefix = ''): { path: string; label: string; type: string }[] => {
	const out: { path: string; label: string; type: string }[] = [];
	for (const n of nodes || []) {
		const label = prefix ? `${prefix} → ${n.label}` : n.label;
		out.push({ path: n.path, label, type: n.type });
		if (n.children && n.type !== 'list') out.push(...flattenFields(n.children, label));
	}
	return out;
};
