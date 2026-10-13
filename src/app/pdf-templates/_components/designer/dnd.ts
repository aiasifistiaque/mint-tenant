import { BLOCKS, Block, Part, PdfTemplate, Slot, findBlock } from '@/components/library/pdf/types';

/**
 * Moving blocks on the designer's page (backend docs/pdf-templates D20):
 * where a drag would land, read from the page's own markup (PdfPage marks
 * blocks `data-block` + `data-flow`, boxes and columns `data-container`,
 * the parts `data-part`), and the copy / paste format.
 */

/** The drag's type on the page and from the Add panel (the payload itself is kept in the designer). */
export const DRAG_TYPE = 'application/x-mint-pdf-block';

/** Where a drop lands, and the line (or box) that shows it, in window coordinates. */
export type Drop = { slot: Slot; index: number; line: { left: number; top: number; width: number; height: number; box?: boolean } };

/** Near a container's edge (screen px), a drop goes beside it rather than inside. */
const EDGE = 8;
const LINE = 2;

const rectOf = (el: Element) => el.getBoundingClientRect();

/** The blocks directly inside a container (a box's, a column's, a part's). */
const childrenOf = (container: Element): Element[] =>
	[...container.querySelectorAll('[data-block]')].filter(el => el.parentElement?.closest('[data-container],[data-part]') === container);

/** Before or after a block, along the way its list runs. */
const beside = (t: PdfTemplate, el: Element, x: number, y: number): Drop | null => {
	const id = el.getAttribute('data-block');
	const hit = findBlock(t, id);
	if (!hit) return null;
	const r = rectOf(el);
	const row = el.getAttribute('data-flow') === 'row';
	const after = row ? x > r.left + r.width / 2 : y > r.top + r.height / 2;
	return {
		slot: hit.slot,
		index: hit.index + (after ? 1 : 0),
		line: row
			? { left: (after ? r.right : r.left) - LINE / 2, top: r.top, width: LINE, height: r.height }
			: { left: r.left, top: (after ? r.bottom : r.top) - LINE / 2, width: r.width, height: LINE },
	};
};

/** Inside a container, at the place the pointer is among its blocks. */
const inside = (t: PdfTemplate, container: Element, x: number, y: number): Drop | null => {
	const part = container.getAttribute('data-part') as Part | null;
	const id = container.getAttribute('data-container');
	const column = container.getAttribute('data-column');
	let slot: Slot;
	if (part) slot = { part };
	else {
		const hit = findBlock(t, id);
		if (!hit) return null;
		slot = { part: hit.slot.part, parent: id!, ...(column !== null && { column: Number(column) }) };
	}
	const row = container.getAttribute('data-dir') === 'row';
	const kids = childrenOf(container);
	if (!kids.length) {
		const r = rectOf(container);
		return { slot, index: 0, line: { left: r.left, top: r.top, width: r.width, height: Math.max(r.height, 12), box: true } };
	}
	const index = kids.filter(k => {
		const r = rectOf(k);
		return row ? x > r.left + r.width / 2 : y > r.top + r.height / 2;
	}).length;
	const ref = rectOf(kids[Math.min(index, kids.length - 1)]);
	const after = index >= kids.length;
	const c = rectOf(container);
	return {
		slot,
		index,
		line: row
			? { left: (after ? ref.right : ref.left) - LINE / 2, top: ref.top, width: LINE, height: ref.height }
			: { left: c.left, top: (after ? ref.bottom : ref.top) - LINE / 2, width: c.width, height: LINE },
	};
};

/**
 * Where a drag over `target` at (x, y) lands — the innermost place under the
 * pointer: inside a box / column / part, or before / after a block. Never
 * inside the block being moved; a page break only in the body itself.
 */
export const dropAt = (t: PdfTemplate, target: Element | null, x: number, y: number, moving: Block | null): Drop | null => {
	const el = target?.closest('[data-block],[data-container],[data-part]');
	if (!el) return null;
	if (moving) {
		const self = document.querySelector(`[data-block="${moving.id}"]`);
		if (self && (self === el || self.contains(el))) return null;
	}
	let drop: Drop | null = null;
	if (el.hasAttribute('data-block')) drop = beside(t, el, x, y);
	else {
		// Near a box's or column's edge: beside the block that holds it.
		const holder = el.hasAttribute('data-container') ? el.closest('[data-block]') : null;
		if (holder) {
			const r = rectOf(el);
			const row = holder.getAttribute('data-flow') === 'row';
			const near = row ? x - r.left < EDGE || r.right - x < EDGE : y - r.top < EDGE || r.bottom - y < EDGE;
			if (near && !(moving && holder.closest(`[data-block="${moving.id}"]`))) drop = beside(t, holder, x, y);
		}
		drop = drop || inside(t, el, x, y);
	}
	if (drop && moving?.type === 'pageBreak' && (drop.slot.part !== 'body' || drop.slot.parent)) return null;
	return drop;
};

/* ---------------------------------------------------------- copy / paste */

/** A copied block on the system clipboard: JSON, so it pastes into another template or tab. */
export const clipText = (b: Block) => JSON.stringify({ mintPdfBlock: b });

/** A block from the clipboard's text, or null when it isn't one. */
export const clipBlock = (text: string | undefined | null): Block | null => {
	if (!text || !text.includes('mintPdfBlock')) return null;
	try {
		const b = JSON.parse(text)?.mintPdfBlock;
		return b && typeof b === 'object' && BLOCKS.some(x => x.type === b.type) ? b : null;
	} catch {
		return null;
	}
};

/**
 * Where a paste goes: inside a selected box (at its end) or columns block
 * (the first empty column, else the last), after any other selected block,
 * or at the end of the body.
 */
export const pastePlace = (t: PdfTemplate, selected: string | null, block: Block): { slot: Slot; index: number } => {
	const end = { slot: { part: 'body' as Part }, index: t.body.length };
	const hit = findBlock(t, selected);
	if (!hit || block.type === 'pageBreak') return block.type === 'pageBreak' && hit && hit.slot.part === 'body' && !hit.slot.parent ? { slot: hit.slot, index: hit.index + 1 } : end;
	const s = hit.block;
	if (s.type === 'box') return { slot: { part: hit.slot.part, parent: s.id }, index: (s.blocks || []).length };
	if (s.type === 'columns' && (s.columns || []).length) {
		const cols: any[] = s.columns;
		const empty = cols.findIndex(c => !(c.blocks || []).length);
		const column = empty >= 0 ? empty : cols.length - 1;
		return { slot: { part: hit.slot.part, parent: s.id, column }, index: (cols[column].blocks || []).length };
	}
	return { slot: hit.slot, index: hit.index + 1 };
};
