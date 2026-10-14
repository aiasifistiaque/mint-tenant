'use client';

import { DragEvent, FC, PointerEvent as ReactPointerEvent, ReactNode, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, Flex, Grid, IconButton, Spinner, Text } from '@chakra-ui/react';
import {
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Braces,
	Building2,
	ClipboardCopy,
	ClipboardPaste,
	Copy,
	CornerLeftUp,
	Columns2,
	Group,
	Eye,
	FileDown,
	Redo2,
	Save,
	Send,
	EyeOff,
	ScanEye,
	Sparkles,
	Star,
	Trash2,
	Undo2,
	ZoomIn,
	ZoomOut,
} from 'lucide-react';
import {
	Layout,
	useGetAllQuery,
	useGetPdfFieldsQuery,
	useGetPdfPreviewDataQuery,
	useGetPdfRecordDataQuery,
	useGetPdfSettingsQuery,
	useGetPdfTemplateQuery,
	useSetDefaultPdfTemplateMutation,
	useUpdatePdfTemplateMutation,
	viewerZone,
} from '@/components/library';
import { ConfirmAction, ConsoleTabs, Dropdown, ErrorState } from '@/components/library/cl';
import PdfPage, { Corner } from '@/components/library/pdf/PdfPage';
import { recordScope, sampleScope } from '@/components/library/pdf/scope';
import {
	Block,
	FieldTree,
	PdfTemplate,
	Slot,
	cloneBlock,
	findBlock,
	flattenFields,
	insertBlock,
	labelOf,
	pageSize,
	placeOf,
	moveBlock,
	newBlock,
	relocateBlock,
	removeBlock,
	groupBlocks,
	relocateMany,
	topSelected,
	updateBlock,
} from '@/components/library/pdf/types';
import { mainRoute, modelLabel, useLinkModels } from '@/app/builder/_components/useLinkModels';
import { toaster } from '@/components/ui/toaster';
import Outline from '../_components/designer/Outline';
import PageSettings from '../_components/designer/PageSettings';
import ThemePanel, { ThemeBar } from '../_components/designer/ThemePanel';
import { ThemeStyleContext } from '../_components/designer/controls';
import Properties from '../_components/designer/Properties';
import AddPanel from '../_components/designer/AddPanel';
import { DRAG_TYPE, Drop, clipBlocks, clipText, dropAt, pagePoint, pastePlace } from '../_components/designer/dnd';
import AiDialog from '../_components/AiDialog';
import RealPdfDialog from '../_components/RealPdfDialog';
import SettingsDialog from '../_components/SettingsDialog';
import { DocLink, ICON, LIST_HREF, errorOf, openPreview } from '../_components/ui';

const INSTANCE: Record<string, string> = { number: 'Number', date: 'Date', boolean: 'Boolean' };
const MAX_HISTORY = 100;
/** Snap within this many screen pixels (D22). */
const SNAP_PX = 6;

/** Placed blocks (D22) always have a place: one put among them without x / y starts at the top-left margin. */
const placed = (t: PdfTemplate): PdfTemplate => {
	const free = t.free || [];
	if (free.every(b => typeof b.x === 'number' && typeof b.y === 'number' && b.w)) return t;
	const [mt, mr, , ml] = t.page?.margin || [40, 40, 40, 40];
	const room = pageSize(t)[0] - ml - mr;
	return { ...t, free: free.map((b, i) => (typeof b.x === 'number' && typeof b.y === 'number' && b.w ? b : { ...b, x: b.x ?? ml, y: b.y ?? mt + i * 16, w: b.w || Math.min(200, room) })) };
};

/** A block's placing props — what's dropped when it goes back into the flow. */
const PLACING = ['x', 'y', 'w', 'rotate', 'opacity', 'behind', 'pages'];
const ACCENT = '#4f46e5';

/** Waits until `value` has stopped changing for `ms`. */
const useSettled = <T,>(value: T, ms: number) => {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
};

/** A thin rule between toolbar groups. */
const Sep: FC = () => (
	<Box
		w='1px'
		h='20px'
		bg='border'
		mx={0.5}
		display={{ base: 'none', md: 'block' }}
	/>
);

/** A side panel: its own scroll, a border to the page. */
const Side: FC<{ side: 'left' | 'right'; children: ReactNode }> = ({ side, children }) => (
	<Box
		h={{ lg: 'full' }}
		minH={0}
		overflowY='auto'
		overflowX='hidden'
		bg='bg.panel'
		borderColor='border'
		{...(side === 'left' ? { borderRightWidth: { lg: '1px' } } : { borderLeftWidth: { lg: '1px' } })}
		p={3}>
		{children}
	</Box>
);

/** The selected block's tools, on the page above it. */
const BarButton: FC<{ label: string; onClick: () => void; children: ReactNode }> = ({ label, onClick, children }) => (
	<button
		type='button'
		aria-label={label}
		title={label}
		onClick={onClick}
		style={{ background: 'transparent', border: 0, color: '#fff', padding: '3px 4px', cursor: 'pointer', display: 'inline-flex', borderRadius: 3 }}
		onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
		onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
		{children}
	</button>
);

/**
 * The designer (backend docs/pdf-templates PT-06, reorganised in PT-16 / D17):
 * a full-page tool — one toolbar; on the left what to add (blocks, ready-made
 * pieces, saved texts) and the layers; the page in the middle (click a block,
 * its tools sit on it; an empty business detail says "Add phone" — click to
 * fill it in); on the right the selected block, or the document when none is.
 * The page shows a record of the page (or sample data) the way the PDF lays
 * it out; Preview and Real PDF show the file itself. Nothing is saved until Save.
 */
const DesignerPage = ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = use(params);
	const { data, error, refetch } = useGetPdfTemplateQuery(id);
	const { data: settings } = useGetPdfSettingsQuery();
	const [save, { isLoading: saving }] = useUpdatePdfTemplateMutation();
	const [makeDefault] = useSetDefaultPdfTemplateMutation();
	const { models } = useLinkModels();

	const [t, setT] = useState<PdfTemplate | null>(null);
	const [base, setBase] = useState<string>('');
	const [hist, setHist] = useState<{ past: PdfTemplate[]; future: PdfTemplate[] }>({ past: [], future: [] });
	const [selected, setPrimary] = useState<string | null>(null);
	// ⇧ / ⌘ click: more blocks selected alongside the main one (PT-29).
	const [also, setAlso] = useState<string[]>([]);
	/** Selects one block (or none), dropping any others. */
	const setSelected = (id: string | null) => {
		setPrimary(id);
		setAlso([]);
	};
	/** A click on a block: with ⇧ / ⌘ it's added to the selection (or taken out). */
	const pick = (id: string | null, add?: boolean) => {
		if (!id) return setSelected(null);
		if (!add || !selected) return setSelected(id);
		if (id === selected) {
			setPrimary(also[also.length - 1] ?? null);
			return setAlso(also.slice(0, -1));
		}
		if (also.includes(id)) return setAlso(also.filter(x => x !== id));
		setAlso([...also, selected]);
		setPrimary(id);
	};
	const allSelected = selected ? [...also, selected] : [];
	const multi = also.length > 0;
	const [tab, setTab] = useState<'add' | 'pieces' | 'layers' | 'theme'>('add');
	const [mode, setMode] = useState<'values' | 'fields'>('values');
	const [zoom, setZoom] = useState(1);
	// null: not picked yet (the first record shows); '': Sample data, picked.
	const [recordId, setRecordId] = useState<string | null>(null);
	const [ai, setAi] = useState(false);
	const [real, setReal] = useState(false);
	const [business, setBusiness] = useState<{ open: boolean; focus: string | null }>({ open: false, focus: null });
	const [problems, setProblems] = useState<string[]>([]);
	// The page fits the middle column; zoom is relative to that.
	const canvasRef = useRef<HTMLDivElement>(null);
	const [canvasW, setCanvasW] = useState(0);
	useEffect(() => {
		const el = canvasRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => setCanvasW(el.clientWidth));
		ro.observe(el);
		setCanvasW(el.clientWidth);
		return () => ro.disconnect();
		// The canvas mounts once the template has loaded.
	}, [!!t]);

	// A fresh load (first visit, or after a save) replaces the working copy.
	useEffect(() => {
		if (!data) return;
		setT(data);
		setBase(JSON.stringify(data));
		setHist({ past: [], future: [] });
	}, [data]);

	const dirty = !!t && JSON.stringify(t) !== base;
	// Older templates have no status: they're published.
	const draft = t?.status === 'draft';
	const [unpublishing, setUnpublishing] = useState(false);
	useEffect(() => {
		if (!dirty) return;
		const warn = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [dirty]);

	/** Every change goes through here, so it can be undone. */
	const edit = useCallback((fn: (t: PdfTemplate) => PdfTemplate) => {
		setT(cur => {
			if (!cur) return cur;
			const changed = fn(cur);
			if (changed === cur) return cur;
			const next = placed(changed);
			setHist(h => ({ past: [...h.past.slice(-MAX_HISTORY), cur], future: [] }));
			return next;
		});
	}, []);
	const undo = () =>
		setHist(h => {
			if (!h.past.length || !t) return h;
			const prev = h.past[h.past.length - 1];
			setT(prev);
			return { past: h.past.slice(0, -1), future: [t, ...h.future] };
		});
	const redo = () =>
		setHist(h => {
			if (!h.future.length || !t) return h;
			const [next, ...rest] = h.future;
			setT(next);
			return { past: [...h.past, t], future: rest };
		});

	const route = t?.route || '';
	const { data: tree } = useGetPdfFieldsQuery(route, { skip: !route }) as { data?: FieldTree };
	const { data: records } = useGetAllQuery({ path: route, limit: 25 }, { skip: !route });
	const recordList: any[] = records?.doc || [];
	useEffect(() => {
		if (recordId === null && recordList.length) setRecordId(String(recordList[0]._id));
	}, [recordList, recordId]);

	// The record's data follows the template (what it reads), once edits settle.
	const settled = useSettled(t, 700);
	const {
		data: recordData,
		isFetching: loadingRecord,
		refetch: refetchRecord,
	} = useGetPdfRecordDataQuery({ route, id: recordId || '', template: settled, tz: viewerZone() }, { skip: !route || !recordId || !settled });

	// "Sample data": every field filled like Preview; the business details and saved texts as they are, the empty ones as "Add phone".
	const { data: previewData, isFetching: loadingPreview } = useGetPdfPreviewDataQuery({ template: settled, tz: viewerZone() }, { skip: !!recordId || !settled });
	const scope = useMemo(() => {
		if (!t) return null;
		if (recordId && recordData) return recordScope(recordData);
		if (!recordId && previewData) return recordScope(previewData);
		return sampleScope(t, settings, viewerZone(), undefined, true);
	}, [t, recordId, recordData, previewData, settings]);

	// pt → px is 4/3; the column's padding (48px) stays clear.
	const fitScale = t && canvasW ? Math.min(1.2, Math.max(0.3, (canvasW - 64) / ((pageSize(t)[0] * 4) / 3))) : 0.8;
	const scale = fitScale * zoom;
	const pages = useMemo(() => models.map(m => ({ value: mainRoute(m), label: modelLabel(m) })), [models]);
	const conditionFields = useMemo(
		() => (t ? flattenFields(tree?.fields || []).filter(f => f.type !== 'list').map(f => ({ key: `${t.alias}.${f.path}`, instance: INSTANCE[f.type] || 'String' })) : []),
		[tree, t?.alias]
	);
	const ctx = useMemo(() => (t ? { template: t, tree, texts: settings?.texts || [] } : null), [t, tree, settings?.texts]);
	const sel = t ? findBlock(t, selected) : null;
	useEffect(() => {
		if (t && also.some(id => !findBlock(t, id))) setAlso(a => a.filter(id => !!findBlock(t, id)));
	}, [t]);
	// Where the selected block sits: a row runs left to right (D19).
	const place = t && sel ? placeOf(t, sel.slot) : null;
	const inRow = place?.flow === 'row';
	// Placed freely (D22): their order is which sits on top.
	const isFree = place?.part === 'free' && !sel?.slot.parent;

	// Add → Place freely (D22): new blocks go on the page where they're dropped (a click: the top-left margin).
	const [freeMode, setFreeMode] = useState(false);
	/** A new block: after the selected one, or at the end of the body — or placed freely. */
	const addBlock = (b: Block) => {
		if (!t) return;
		if (freeMode) {
			const [mt, , , ml] = t.page.margin;
			edit(x => ({ ...x, free: [...(x.free || []), { ...b, x: ml, y: mt + (x.free || []).length * 12, w: 200 }] }));
			setSelected(b.id);
			return;
		}
		const hit = findBlock(t, selected);
		edit(x => (hit ? insertBlock(x, hit.slot, hit.index + 1, b) : insertBlock(x, { part: 'body' }, x.body.length, b)));
		setSelected(b.id);
		requestAnimationFrame(() => document.querySelector(`[data-block="${b.id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
	};
	const addAt = (slot: Slot, index: number, b: Block) => {
		edit(x => insertBlock(x, slot, index, b));
		setSelected(b.id);
	};
	const remove = (bid: string) => {
		edit(x => removeBlock(x, bid));
		setSelected(null);
	};
	/** Deletes every selected block. */
	const removeAll = (ids: string[]) => {
		edit(x => ids.reduce((acc, id) => removeBlock(acc, id), x));
		setSelected(null);
	};
	/** Wraps the selected blocks in a box or a row (⌘G). */
	const group = (row = false) => {
		if (!t) return;
		const { template, id: gid } = groupBlocks(t, allSelected, row);
		if (!gid) return;
		edit(() => template);
		setSelected(gid);
	};
	const duplicate = () => {
		if (!sel) return;
		const c = cloneBlock(sel.block);
		edit(x => insertBlock(x, sel.slot, sel.index + 1, c));
		setSelected(c.id);
	};
	const openBusiness = (focus: string | null = null) => setBusiness({ open: true, focus });
	const reveal = (bid: string) => requestAnimationFrame(() => document.querySelector(`[data-block="${bid}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));

	/* ------------------------------------------- drag on the page (D20) */
	// What is being dragged: a block on the page, or a new one from the Add panel.
	const dragRef = useRef<{ id?: string; block: Block; ids?: string[] } | null>(null);
	const [dragging, setDragging] = useState(false);
	const [drop, setDrop] = useState<Drop | null>(null);
	const endDrag = () => {
		dragRef.current = null;
		setDragging(false);
		setDrop(null);
	};
	useEffect(() => {
		window.addEventListener('dragend', endDrag);
		return () => window.removeEventListener('dragend', endDrag);
	}, []);
	const startDrag = (e: DragEvent, what: { id?: string; block: Block; ids?: string[] }) => {
		e.dataTransfer.setData(DRAG_TYPE, what.id || 'new');
		e.dataTransfer.effectAllowed = what.id ? 'move' : 'copy';
		dragRef.current = what;
		// After the browser has its drag image: the empty header / footer appear as places to drop.
		setTimeout(() => setDragging(true), 0);
	};
	const onDragBlock = useCallback(
		(bid: string, e: DragEvent) => {
			const hit = t && findBlock(t, bid);
			// A selected block drags the whole selection along (PT-29).
			if (hit) startDrag(e, { id: bid, block: hit.block, ids: also.length && allSelected.includes(bid) ? allSelected : undefined });
		},
		[t, selected, also]
	);
	const onDragOver = (e: DragEvent) => {
		const d = dragRef.current;
		if (!d || !t) return;
		if (freeMode && !d.id) {
			// Placed freely: anywhere on the page, a box where it will sit.
			const p = pagePoint(pageSize(t)[0], e.clientX, e.clientY);
			if (!p || !(e.target as Element)?.closest?.('[data-page]')) return drop && setDrop(null);
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
			const w = 200 / p.ppx;
			setDrop({ slot: { part: 'free' }, index: (t.free || []).length, at: { x: Math.round(p.x), y: Math.round(p.y) }, line: { left: e.clientX, top: e.clientY, width: w, height: 24 / p.ppx, box: true } });
			return;
		}
		const at = dropAt(t, e.target as Element, e.clientX, e.clientY, d.block);
		if (!at) {
			if (drop) setDrop(null);
			return;
		}
		e.preventDefault();
		e.dataTransfer.dropEffect = d.id ? 'move' : 'copy';
		if (JSON.stringify(at) !== JSON.stringify(drop)) setDrop(at);
	};
	const onDrop = (e: DragEvent) => {
		const d = dragRef.current;
		if (!d || !drop) return endDrag();
		e.preventDefault();
		const { slot, index } = drop;
		if (drop.at) {
			edit(x => ({ ...x, free: [...(x.free || []), { ...d.block, x: drop.at!.x, y: drop.at!.y, w: 200 }] }));
			setSelected(d.block.id);
			return endDrag();
		}
		if (d.ids) edit(x => relocateMany(x, d.ids!, slot, index));
		else if (d.id) edit(x => relocateBlock(x, d.id!, slot, index));
		else edit(x => insertBlock(x, slot, index, d.block));
		if (!d.ids) setSelected(d.block.id);
		endDrag();
	};

	/* ----------------------------------------- placed freely: move (D22) */
	const [guides, setGuides] = useState<{ x: number[]; y: number[] } | null>(null);
	const tRef = useRef(t);
	tRef.current = t;
	const onFreeDown = useCallback(
		(fid: string, e: ReactPointerEvent, mode: 'move' | 'resize') => {
			const base = tRef.current;
			const b = base && findBlock(base, fid)?.block;
			if (!base || !b || e.button !== 0) return;
			e.stopPropagation();
			const add = e.shiftKey || e.metaKey || e.ctrlKey;
			if (!add) pick(fid);
			const [pw, ph] = pageSize(base);
			const [mt, mr, mb, ml] = base.page.margin;
			const start = pagePoint(pw, e.clientX, e.clientY);
			if (!start) return;
			const ppx = start.ppx;
			const sizeOf = (id: string) => {
				const r = document.querySelector(`[data-free="${id}"]`)?.getBoundingClientRect();
				const page = document.querySelector('[data-page]')!.getBoundingClientRect();
				return r ? { x: (r.left - page.left) * ppx, y: (r.top - page.top) * ppx, w: r.width * ppx, h: r.height * ppx } : null;
			};
			const me = sizeOf(fid);
			const h = me?.h || 20;
			// What it can snap to: the page's edges, margins and middle, and the other placed blocks.
			const others = (base.free || []).filter(o => o.id !== fid).map(o => sizeOf(o.id)).filter(Boolean) as { x: number; y: number; w: number; h: number }[];
			const xs = [0, ml, pw / 2, pw - mr, pw, ...others.flatMap(o => [o.x, o.x + o.w / 2, o.x + o.w])];
			const ys = [0, mt, ph / 2, ph - mb, ph, ...others.flatMap(o => [o.y, o.y + o.h / 2, o.y + o.h])];
			const near = SNAP_PX * ppx;
			const snap = (edges: number[], lines: number[]) => {
				let best: { d: number; line: number; edge: number } | null = null;
				for (const edge of edges) for (const line of lines) if (Math.abs(line - edge) <= near && (!best || Math.abs(line - edge) < Math.abs(best.d))) best = { d: line - edge, line, edge };
				return best;
			};
			let moved = false;
			const move = (ev: PointerEvent) => {
				const p = pagePoint(pw, ev.clientX, ev.clientY);
				if (!p) return;
				const dx = p.x - start.x;
				const dy = p.y - start.y;
				if (!moved && Math.hypot(dx / ppx, dy / ppx) < 3) return;
				if (!moved) {
					moved = true;
					// One step to undo for the whole drag.
					setHist(hh => ({ past: [...hh.past.slice(-MAX_HISTORY), base], future: [] }));
				}
				const round = (n: number) => Math.round(n * 2) / 2;
				if (mode === 'resize') {
					const right = b.x + b.w + dx;
					const s = ev.altKey ? null : snap([right], xs);
					const w = Math.max(20, (s ? right + s.d : right) - b.x);
					setGuides(s ? { x: [s.line], y: [] } : null);
					setT(cur => (cur ? updateBlock(cur, fid, { w: round(w) }) : cur));
					return;
				}
				let x = b.x + dx;
				let y = b.y + dy;
				// ⌥ held: no snapping.
				const sx = ev.altKey ? null : snap([x, x + b.w / 2, x + b.w], xs);
				const sy = ev.altKey ? null : snap([y, y + h / 2, y + h], ys);
				if (sx) x += sx.d;
				if (sy) y += sy.d;
				setGuides(sx || sy ? { x: sx ? [sx.line] : [], y: sy ? [sy.line] : [] } : null);
				setT(cur => (cur ? updateBlock(cur, fid, { x: round(x), y: round(y) }) : cur));
			};
			const up = () => {
				window.removeEventListener('pointermove', move);
				window.removeEventListener('pointerup', up);
				setGuides(null);
				if (!moved) return;
				// The click that ends a drag lands wherever the pointer is — on the page it would unselect the block.
				const swallow = (ev: MouseEvent) => {
					ev.stopPropagation();
					ev.preventDefault();
				};
				window.addEventListener('click', swallow, { capture: true, once: true });
				setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
			};
			window.addEventListener('pointermove', move);
			window.addEventListener('pointerup', up);
		},
		[selected, also]
	);
	/* ------------------------------- images: corner handles, like Figma */
	const [sizeHint, setSizeHint] = useState<string | null>(null);
	const onImageDown = useCallback((iid: string, e: ReactPointerEvent, corner: Corner) => {
		const base = tRef.current;
		const hit = base && findBlock(base, iid);
		if (!base || !hit || e.button !== 0) return;
		const b = hit.block;
		const [pw] = pageSize(base);
		const start = pagePoint(pw, e.clientX, e.clientY);
		const img = document.querySelector(`[data-image="${iid}"]`)?.getBoundingClientRect();
		// Its room: what holds it (in a row its own place is only as wide as it is).
		const room = document.querySelector(`[data-block="${iid}"]`)?.parentElement?.getBoundingClientRect();
		if (!start || !img || !room) return;
		const ppx = start.ppx;
		const w0 = img.width * ppx;
		const h0 = img.height * ppx;
		const ratio = h0 / Math.max(1, w0);
		// Placed freely, it may grow past its box (its box grows along); in the flow, no wider than what holds it.
		const free = (base.free || []).some(f => f.id === iid);
		const most = free ? pw : room.width * ppx;
		// Centred, both sides move — twice the pointer's way, so the corner stays under it.
		const twice = b.align === 'center' ? 2 : 1;
		const east = corner[1] === 'e' ? 1 : -1;
		const south = corner[0] === 's' ? 1 : -1;
		const round = (n: number) => Math.round(n * 2) / 2;
		let moved = false;
		const move = (ev: PointerEvent) => {
			const p = pagePoint(pw, ev.clientX, ev.clientY);
			if (!p) return;
			const dx = (p.x - start.x) * east * twice;
			const dy = (p.y - start.y) * south;
			if (!moved && Math.hypot(dx, dy) / ppx < 2) return;
			if (!moved) {
				moved = true;
				setHist(hh => ({ past: [...hh.past.slice(-MAX_HISTORY), base], future: [] }));
			}
			let w: number, h: number | undefined;
			if (ev.shiftKey) {
				// ⇧: its own width and height — the picture keeps its shape inside.
				w = Math.min(most, Math.max(8, w0 + dx));
				h = Math.max(8, h0 + dy);
			} else {
				// The way the pointer went furthest decides; the shape stays.
				const by = Math.abs(dx) >= Math.abs(dy / ratio) ? dx : dy / ratio;
				w = Math.min(most, Math.max(8, w0 + by));
				h = b.height ? w * ratio : undefined;
			}
			const patch: Partial<Block> = { width: round(w), height: h === undefined ? undefined : round(h) };
			if (free) patch.w = Math.max(b.w || 0, round(w));
			setSizeHint(`${Math.round(w)} × ${Math.round(h ?? w * ratio)} pt`);
			setT(cur => (cur ? updateBlock(cur, iid, patch) : cur));
		};
		const up = () => {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
			setSizeHint(null);
			if (!moved) return;
			const swallow = (ev: MouseEvent) => {
				ev.stopPropagation();
				ev.preventDefault();
			};
			window.addEventListener('click', swallow, { capture: true, once: true });
			setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', up);
	}, []);
	/** Takes a block out of the flow and puts it on the page where it is now (D22). */
	const placeFreely = (bid: string) => {
		if (!t) return;
		const hit = findBlock(t, bid);
		const el = document.querySelector(`[data-block="${bid}"]`);
		const at = el && pagePoint(pageSize(t)[0], el.getBoundingClientRect().left, el.getBoundingClientRect().top);
		if (!hit || hit.block.type === 'pageBreak') return;
		const w = el ? el.getBoundingClientRect().width * (at?.ppx || 1) : 200;
		edit(x => ({ ...removeBlock(x, bid), free: [...(removeBlock(x, bid).free || []), { ...hit.block, x: Math.round(at?.x ?? x.page.margin[3]), y: Math.round(at?.y ?? x.page.margin[0]), w: Math.max(20, Math.round(w)) }] }));
		setSelected(bid);
	};
	/** Puts a placed block back into the flow, at the end of the body. */
	const backInFlow = (bid: string) => {
		if (!t) return;
		const hit = findBlock(t, bid);
		if (!hit) return;
		const b: Block = { ...hit.block };
		for (const k of PLACING) delete b[k];
		edit(x => insertBlock(removeBlock(x, bid), { part: 'body' }, x.body.length, b));
		setSelected(bid);
		reveal(bid);
	};

	/* --------------------------------------------- copy / cut / paste (D20) */
	const [clip, setClip] = useState<Block[] | null>(null);
	/** The selected blocks (the whole selection, in the template's order). */
	const selectedBlocks = (): Block[] => (t ? topSelected(t, allSelected).map(id => findBlock(t, id)!.block) : []);
	const copyBlocks = (blocks: Block[]) => {
		if (!blocks.length) return;
		setClip(blocks);
		navigator.clipboard?.writeText(clipText(blocks)).catch(() => {});
		toaster.create({ type: 'info', title: blocks.length > 1 ? `Copied ${blocks.length} blocks` : 'Copied', description: 'Select a box (or a block) and press ⌘V — it goes inside the box, or after the block.' });
	};
	const paste = (blocks: Block[]) => {
		if (!t || !blocks.length) return;
		const copies = blocks.map(cloneBlock);
		const { slot, index } = pastePlace(t, selected, copies[0]);
		edit(x => copies.reduce((acc, c, i) => insertBlock(acc, slot, index + i, c), x));
		if (copies.length === 1) setSelected(copies[0].id);
		else {
			setPrimary(copies[copies.length - 1].id);
			setAlso(copies.slice(0, -1).map(c => c.id));
		}
		reveal(copies[0].id);
	};

	// Keys: undo / redo, delete the selected block, save — not while typing.
	const keyRef = useRef<any>(null);
	keyRef.current = { undo, redo, selected, sel, remove, removeAll, group, multi, allSelected, selectedBlocks, doSave: () => doSave(), copyBlocks, paste, edit };
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const k = keyRef.current;
			const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable;
			const mod = e.metaKey || e.ctrlKey;
			if (mod && e.key.toLowerCase() === 's') {
				e.preventDefault();
				k.doSave();
				return;
			}
			if (typing || document.querySelector('[role=dialog]')) return;
			if (mod && e.key.toLowerCase() === 'z') {
				e.preventDefault();
				e.shiftKey ? k.redo() : k.undo();
			} else if (mod && e.key.toLowerCase() === 'g' && k.selected) {
				// ⌘G: the selection into a box; ⇧⌘G into a row (PT-29).
				e.preventDefault();
				k.group(e.shiftKey);
			} else if ((e.key === 'Delete' || e.key === 'Backspace') && k.multi) {
				e.preventDefault();
				k.removeAll(k.allSelected);
			} else if ((e.key === 'Delete' || e.key === 'Backspace') && k.selected && k.sel) {
				e.preventDefault();
				k.remove(k.selected);
			} else if (e.key.startsWith('Arrow') && k.sel?.slot.part === 'free' && !k.sel.slot.parent) {
				// A placed block nudges 1pt (⇧ 10pt) — D22.
				e.preventDefault();
				const by = e.shiftKey ? 10 : 1;
				const d = { ArrowLeft: [-by, 0], ArrowRight: [by, 0], ArrowUp: [0, -by], ArrowDown: [0, by] }[e.key as 'ArrowLeft'] || [0, 0];
				const b = k.sel.block;
				k.edit((x: PdfTemplate) => updateBlock(x, b.id, { x: (b.x || 0) + d[0], y: (b.y || 0) + d[1] }));
			} else if (e.key === 'Escape') setSelected(null);
		};
		window.addEventListener('keydown', onKey);
		// ⌘C / ⌘X / ⌘V on a selected block — not while typing, in a dialog, or with words selected on the page.
		const busy = () => {
			const a = document.activeElement as HTMLElement | null;
			return /^(INPUT|TEXTAREA|SELECT)$/.test(a?.tagName || '') || !!a?.isContentEditable || !!document.querySelector('[role=dialog]');
		};
		const onCopy = (cut: boolean) => (e: ClipboardEvent) => {
			const k = keyRef.current;
			if (busy() || !k.sel || String(window.getSelection() || '').trim()) return;
			e.preventDefault();
			const blocks: Block[] = k.selectedBlocks();
			e.clipboardData?.setData('text/plain', clipText(blocks));
			k.copyBlocks(blocks);
			if (cut) k.removeAll(blocks.map((b: Block) => b.id));
		};
		const onPaste = (e: ClipboardEvent) => {
			if (busy()) return;
			const blocks = clipBlocks(e.clipboardData?.getData('text/plain'));
			if (!blocks) return;
			e.preventDefault();
			keyRef.current.paste(blocks);
		};
		const copy = onCopy(false);
		const cut = onCopy(true);
		document.addEventListener('copy', copy);
		document.addEventListener('cut', cut);
		document.addEventListener('paste', onPaste);
		return () => {
			window.removeEventListener('keydown', onKey);
			document.removeEventListener('copy', copy);
			document.removeEventListener('cut', cut);
			document.removeEventListener('paste', onPaste);
		};
	}, []);

	/** Saves the working copy — with `status`, published or back to a draft as well (PT-33). */
	const doSave = async (status?: 'draft' | 'published') => {
		if (!t || saving) return;
		try {
			const doc = await save({ id, body: status ? { ...t, status } : t }).unwrap();
			setProblems([]);
			setT(doc);
			setBase(JSON.stringify(doc));
			toaster.create(
				status === 'published'
					? { type: 'success', title: 'Published', description: doc.route ? `It’s offered on /${doc.route}’s Download PDF now.` : 'Pick the page it prints to offer it there.' }
					: status === 'draft'
					? { type: 'success', title: 'Back to a draft', description: 'It’s no longer offered on the page’s Download PDF.' }
					: { type: 'success', title: 'Saved' }
			);
		} catch (e: any) {
			setProblems(e?.data?.errors || [errorOf(e)]);
			toaster.create({ type: 'error', title: 'Not saved', description: errorOf(e) });
		}
	};

	if (error)
		return (
			<Layout
				title='PDF Template'
				path='pdf-templates'>
				<ErrorState
					error={error}
					onRetry={refetch}
				/>
			</Layout>
		);

	// Several selected (PT-29): the bar on the main one acts on all of them.
	const multiBar = sel && multi && (
		<Flex
			align='center'
			bg={ACCENT}
			color='white'
			borderRadius='4px'
			px={1}
			py={0.5}
			gap={0.5}
			boxShadow='0 2px 6px rgba(0,0,0,.18)'
			whiteSpace='nowrap'>
			<Text
				fontSize='11px'
				fontWeight='600'
				px={1}>
				{allSelected.length} selected
			</Text>
			<BarButton
				label='Group in a box (⌘G)'
				onClick={() => group(false)}>
				<Group size={13} />
			</BarButton>
			<BarButton
				label='Group in a row — side by side (⇧⌘G)'
				onClick={() => group(true)}>
				<Columns2 size={13} />
			</BarButton>
			<BarButton
				label='Copy them (⌘C)'
				onClick={() => copyBlocks(selectedBlocks())}>
				<ClipboardCopy size={13} />
			</BarButton>
			<BarButton
				label='Delete them'
				onClick={() => removeAll(allSelected)}>
				<Trash2 size={13} />
			</BarButton>
		</Flex>
	);

	const blockBar = sel && !multi && (
		<Flex
			align='center'
			bg={ACCENT}
			color='white'
			borderRadius='4px'
			px={1}
			py={0.5}
			gap={0.5}
			boxShadow='0 2px 6px rgba(0,0,0,.18)'
			whiteSpace='nowrap'>
			<Text
				fontSize='11px'
				fontWeight='600'
				px={1}>
				{labelOf(sel.block)}
			</Text>
			{sel.slot.parent && (
				<BarButton
					label={`Select the ${labelOf(place?.parent).toLowerCase()} around it`}
					onClick={() => setSelected(sel.slot.parent!)}>
					<CornerLeftUp size={13} />
				</BarButton>
			)}
			<BarButton
				label={isFree ? 'Send backward — under the placed blocks after it' : inRow ? 'Move left' : 'Move up'}
				onClick={() => edit(x => moveBlock(x, sel.block.id, -1))}>
				{inRow ? <ArrowLeft size={13} /> : <ArrowUp size={13} />}
			</BarButton>
			<BarButton
				label={isFree ? 'Bring forward — over the placed blocks before it' : inRow ? 'Move right' : 'Move down'}
				onClick={() => edit(x => moveBlock(x, sel.block.id, 1))}>
				{inRow ? <ArrowRight size={13} /> : <ArrowDown size={13} />}
			</BarButton>
			<BarButton
				label='Duplicate'
				onClick={duplicate}>
				<Copy size={13} />
			</BarButton>
			<BarButton
				label='Copy (⌘C) — paste it inside a box or another template'
				onClick={() => copyBlocks([sel.block])}>
				<ClipboardCopy size={13} />
			</BarButton>
			{clip && (sel.block.type === 'box' || sel.block.type === 'columns') && (
				<BarButton
					label={`Paste inside (⌘V) — ${clip.length > 1 ? `the ${clip.length} copied blocks` : `the copied ${labelOf(clip[0]).toLowerCase()}`}`}
					onClick={() => paste(clip)}>
					<ClipboardPaste size={13} />
				</BarButton>
			)}
			<BarButton
				label='Delete (⌫)'
				onClick={() => remove(sel.block.id)}>
				<Trash2 size={13} />
			</BarButton>
		</Flex>
	);

	return (
		<Layout
			title={t?.name || 'PDF Template'}
			path='pdf-templates'
			type='pos'
			fullBleed>
			<Flex
				direction='column'
				h={{ lg: 'calc(100dvh - var(--chakra-spacing-14))' }}>
				{/* One toolbar: the template, undo, what the page shows, then what to do with it. */}
				<Flex
					align='center'
					gap={1.5}
					px={3}
					py={2}
					borderBottomWidth='1px'
					borderColor='border'
					bg='bg.panel'
					flexWrap='wrap'
					flexShrink={0}>
					<NextLink href={LIST_HREF()}>
						<IconButton
							size='xs'
							variant='ghost'
							aria-label='All templates'
							title='All templates'>
							<ArrowLeft {...ICON} />
						</IconButton>
					</NextLink>
					<Box
						minW={0}
						maxW='260px'
						mr={1}>
						<Flex
							align='center'
							gap={1.5}>
							<Text
								fontSize='sm'
								fontWeight='600'
								truncate>
								{t?.name || '…'}
							</Text>
							{t && (
								<Badge
									size='xs'
									colorPalette={draft ? 'orange' : 'blue'}
									variant='subtle'
									title={draft ? 'Shows only here — publish it to offer it on the page’s Download PDF' : 'Offered on the page’s Download PDF'}>
									{draft ? 'Draft' : 'Published'}
								</Badge>
							)}
							{t?.isDefault && (
								<Badge
									size='xs'
									colorPalette='green'
									variant='subtle'>
									Default
								</Badge>
							)}
						</Flex>
						<Text
							fontSize='11px'
							color={dirty ? 'orange.fg' : 'fg.muted'}
							truncate>
							{route ? `Prints /${route}` : 'No page picked yet'} · {dirty ? 'Unsaved changes' : 'Saved'}
						</Text>
					</Box>
					<Sep />
					<IconButton
						size='xs'
						variant='ghost'
						aria-label='Undo'
						title='Undo (⌘Z)'
						disabled={!hist.past.length}
						onClick={undo}>
						<Undo2 {...ICON} />
					</IconButton>
					<IconButton
						size='xs'
						variant='ghost'
						aria-label='Redo'
						title='Redo (⇧⌘Z)'
						disabled={!hist.future.length}
						onClick={redo}>
						<Redo2 {...ICON} />
					</IconButton>
					<Sep />
					<Box
						w='210px'
						maxW='100%'>
						<Dropdown
							size='xs'
							value={recordId || ''}
							searchable
							placeholder={route ? (recordList.length ? 'Show a record' : 'No records yet — sample data') : 'Pick the page first'}
							onChange={setRecordId}>
							<option value=''>Sample data</option>
							{recordList.map((r: any) => (
								<option
									key={r._id}
									value={String(r._id)}>
									{String(r.name || r.title || r.code || r.number || r._id)}
								</option>
							))}
						</Dropdown>
					</Box>
					{(loadingRecord || loadingPreview) && <Spinner size='xs' />}
					<Button
						size='xs'
						variant={mode === 'fields' ? 'solid' : 'ghost'}
						onClick={() => setMode(m => (m === 'fields' ? 'values' : 'fields'))}
						title='Show which field goes where'>
						{mode === 'fields' ? <Eye {...ICON} /> : <Braces {...ICON} />}
						{mode === 'fields' ? 'Values' : 'Fields'}
					</Button>
					<Flex
						align='center'
						gap={0}>
						<IconButton
							size='xs'
							variant='ghost'
							aria-label='Zoom out'
							onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}>
							<ZoomOut {...ICON} />
						</IconButton>
						<Text
							as='button'
							fontSize='xs'
							w='38px'
							textAlign='center'
							title='Fit the width'
							onClick={() => setZoom(1)}>
							{Math.round(zoom * 100)}%
						</Text>
						<IconButton
							size='xs'
							variant='ghost'
							aria-label='Zoom in'
							onClick={() => setZoom(z => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}>
							<ZoomIn {...ICON} />
						</IconButton>
					</Flex>
					<Box flex='1' />
					<Button
						size='xs'
						variant='ghost'
						onClick={() => openBusiness()}>
						<Building2 {...ICON} />
						Business details
					</Button>
					<Button
						size='xs'
						variant='ghost'
						disabled={!t?.route}
						onClick={() => setAi(true)}>
						<Sparkles {...ICON} />
						Your AI
					</Button>
					<Sep />
					<Button
						size='xs'
						variant='outline'
						disabled={!t}
						title='The PDF in a new tab, every field filled with sample data'
						onClick={() => t && openPreview(id, dirty ? t : undefined)}>
						<ScanEye {...ICON} />
						Preview
					</Button>
					<Button
						size='xs'
						variant='outline'
						disabled={!t}
						title='The PDF of the record shown, with your unsaved changes'
						onClick={() => setReal(true)}>
						<FileDown {...ICON} />
						Real PDF
					</Button>
					{t && !t.isDefault && t.route && !dirty && (
						<Button
							size='xs'
							variant='ghost'
							title='Make it this page’s Download PDF'
							onClick={async () => {
								try {
									await makeDefault(id).unwrap();
									toaster.create({ type: 'success', title: 'It’s this page’s Download PDF now' });
								} catch (e) {
									toaster.create({ type: 'error', title: 'That didn’t work', description: errorOf(e) });
								}
							}}>
							<Star {...ICON} />
							Make default
						</Button>
					)}
					<Button
						size='xs'
						variant={draft ? 'outline' : 'solid'}
						disabled={!dirty}
						loading={saving}
						onClick={() => doSave()}>
						<Save {...ICON} />
						Save
					</Button>
					{/* Draft → Publish (offered on the page's Download PDF); published → back to a draft (PT-33). */}
					{t && draft && (
						<Button
							size='xs'
							colorPalette='blue'
							loading={saving}
							title={dirty ? 'Save your changes and offer it on the page’s Download PDF' : 'Offer it on the page’s Download PDF'}
							onClick={() => doSave('published')}>
							<Send {...ICON} />
							Publish
						</Button>
					)}
					{t && !draft && (
						<Button
							size='xs'
							variant='ghost'
							title='Back to a draft: it stops showing on the page’s Download PDF'
							onClick={() => setUnpublishing(true)}>
							<EyeOff {...ICON} />
							Unpublish
						</Button>
					)}
				</Flex>

				<ConfirmAction
					isOpen={unpublishing}
					onClose={() => setUnpublishing(false)}
					title={`Unpublish “${t?.name || 'this template'}”?`}
					consequence={`It goes back to a draft and stops showing on ${route ? `/${route}’s` : 'the page’s'} Download PDF — row menus linked to it hide their Download PDF too.${dirty ? ' Your unsaved changes are saved with it.' : ''}`}
					confirmLabel='Unpublish'
					isLoading={saving}
					onConfirm={async () => {
						await doSave('draft');
						setUnpublishing(false);
					}}
				/>
				{problems.length > 0 && (
					<Box
						px={4}
						py={2}
						borderBottomWidth='1px'
						borderColor='red.300'
						bg='red.subtle'
						fontSize='xs'
						flexShrink={0}>
						<Text fontWeight='600'>Fix these to save:</Text>
						{problems.slice(0, 8).map(p => (
							<Text key={p}>• {p}</Text>
						))}
					</Box>
				)}

				{!t || !scope || !ctx ? (
					<Flex
						flex='1'
						justify='center'
						align='center'
						py={20}>
						<Spinner />
					</Flex>
				) : (
					<Grid
						flex='1'
						minH={0}
						templateColumns={{ base: '1fr', lg: '280px minmax(0, 1fr) 330px' }}>
						{/* Left: what to add, and the layers */}
						<Side side='left'>
							<ThemeBar
								template={t}
								on={tab === 'theme'}
								onClick={() => setTab(tab === 'theme' ? 'add' : 'theme')}
							/>
							<ConsoleTabs
								value={tab}
								onChange={v => setTab(v as any)}
								tabs={[
									{ value: 'add', label: 'Blocks' },
									{ value: 'pieces', label: 'Ready-made' },
									{ value: 'layers', label: 'Layers' },
								]}>
								{null}
							</ConsoleTabs>
							<Box pt={3}>
								{tab === 'theme' ? (
									<ThemePanel
										template={t}
										onChange={next => edit(() => next)}
									/>
								) : tab !== 'layers' ? (
									<AddPanel
										section={tab === 'add' ? 'blocks' : 'pieces'}
										where={freeMode ? 'on the page — drag it to where it goes' : sel ? `after the selected ${labelOf(sel.block).toLowerCase()}` : 'at the end of the body — select a block to add after it'}
										onAdd={addBlock}
										alias={t.alias}
										texts={settings?.texts || []}
										onTexts={focus => openBusiness(focus || 'texts.')}
										onDragNew={(make, e) => startDrag(e, { block: make() })}
										free={freeMode}
										onFree={setFreeMode}
									/>
								) : (
									<>
										<Outline
											template={t}
											selected={selected}
											onSelect={pick}
											alsoSelected={also}
											onAdd={(slot, index, type) => addAt(slot, index, newBlock(type, t.alias))}
											onMove={(bid, slot, index) => edit(x => (multi && allSelected.includes(bid) ? relocateMany(x, allSelected, slot, index) : relocateBlock(x, bid, slot, index)))}
										/>
										<Box mt={4}>
											<DocLink section='blocks' />
										</Box>
									</>
								)}
							</Box>
						</Side>

						{/* Middle: the page */}
						<Box
							ref={canvasRef}
							minW={0}
							h={{ lg: 'full' }}
							overflow='auto'
							bg='bg.muted'
							px={{ base: 3, md: 8 }}
							py={{ base: 4, md: 8 }}
							onClick={() => setSelected(null)}
							onDragOver={onDragOver}
							onDrop={onDrop}>
							<Box
								mx='auto'
								w='fit-content'
								boxShadow='0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08)'
								css={{ '& .pdf-block:hover': { outline: '1px dashed rgba(79,70,229,.5)', outlineOffset: '2px' } }}>
								<PdfPage
									template={t}
									scope={scope}
									mode={mode}
									selected={selected}
									onSelect={(i, add) => pick(i || null, add)}
									alsoSelected={also}
									scale={scale}
									onFix={path => openBusiness(path)}
									blockBar={dragging ? null : multiBar || blockBar}
									onDragBlock={onDragBlock}
									showEmptyParts={dragging && !freeMode}
									onFreeDown={onFreeDown}
									onImageDown={onImageDown}
									sizeHint={sizeHint}
									guides={guides}
								/>
							</Box>
							{/* Where a drag lands: a line between blocks, or the empty box it goes into. */}
							{drop && (
								<Box
									position='fixed'
									pointerEvents='none'
									zIndex={1400}
									left={`${drop.line.left}px`}
									top={`${drop.line.top}px`}
									w={`${drop.line.width}px`}
									h={`${drop.line.height}px`}
									borderRadius='2px'
									{...(drop.line.box ? { bg: 'rgba(79,70,229,.10)', border: `1.5px dashed ${ACCENT}` } : { bg: ACCENT, boxShadow: `0 0 0 1px #fff` })}
								/>
							)}
							<Text
								fontSize='11px'
								color='fg.subtle'
								textAlign='center'
								mt={3}>
								One long page here — Preview and Real PDF show it split into pages, with page numbers. Drag blocks to move them; ⌘C / ⌘V copy and paste (inside a selected box).
							</Text>
						</Box>

						{/* Right: the selected block, or the document */}
						<ThemeStyleContext.Provider value={t.style as any}>
						<Side side='right'>
							{sel && multi ? (
								<Box>
									<Text
										fontSize='sm'
										fontWeight='600'>
										{allSelected.length} blocks selected
									</Text>
									<Text
										fontSize='xs'
										color='fg.muted'
										mb={3}>
										⇧ or ⌘ click adds or takes out a block. Drag any of them and they all move — into a box or a column too.
									</Text>
									<Flex
										direction='column'
										gap={2}>
										<Button
											size='sm'
											variant='outline'
											justifyContent='flex-start'
											onClick={() => group(false)}>
											<Group {...ICON} />
											Group in a box
											<Text
												as='span'
												ml='auto'
												color='fg.subtle'
												fontSize='xs'>
												⌘G
											</Text>
										</Button>
										<Button
											size='sm'
											variant='outline'
											justifyContent='flex-start'
											onClick={() => group(true)}>
											<Columns2 {...ICON} />
											Group in a row — side by side
											<Text
												as='span'
												ml='auto'
												color='fg.subtle'
												fontSize='xs'>
												⇧⌘G
											</Text>
										</Button>
										<Button
											size='sm'
											variant='outline'
											justifyContent='flex-start'
											onClick={() => copyBlocks(selectedBlocks())}>
											<ClipboardCopy {...ICON} />
											Copy
											<Text
												as='span'
												ml='auto'
												color='fg.subtle'
												fontSize='xs'>
												⌘C
											</Text>
										</Button>
										<Button
											size='sm'
											variant='outline'
											justifyContent='flex-start'
											color='red.500'
											_dark={{ color: 'red.300' }}
											onClick={() => removeAll(allSelected)}>
											<Trash2 {...ICON} />
											Delete them
										</Button>
										<Button
											size='sm'
											variant='ghost'
											onClick={() => setSelected(null)}>
											Clear the selection (Esc)
										</Button>
									</Flex>
									<Box mt={4}>
										<DocLink section='moving' />
									</Box>
								</Box>
							) : sel ? (
								<Properties
									key={sel.block.id}
									block={sel.block}
									ctx={ctx}
									conditionFields={conditionFields as any}
									onChange={patch => edit(x => updateBlock(x, sel.block.id, patch as Partial<Block>))}
									onRemove={() => remove(sel.block.id)}
									onDuplicate={duplicate}
									onMove={by => edit(x => moveBlock(x, sel.block.id, by))}
									place={place!}
									onPlaceFreely={() => placeFreely(sel.block.id)}
									onBackInFlow={() => backInFlow(sel.block.id)}
								/>
							) : (
								<Box>
									<Text
										fontSize='sm'
										fontWeight='600'>
										Document
									</Text>
									<Text
										fontSize='xs'
										color='fg.muted'
										mb={3}>
										The whole template. Click a block on the page to change it instead.
									</Text>
									<PageSettings
										template={t}
										set={p => edit(x => ({ ...x, ...p }))}
										pages={pages}
										tree={tree}
										onTheme={() => setTab('theme')}
									/>
								</Box>
							)}
						</Side>
						</ThemeStyleContext.Provider>
					</Grid>
				)}
			</Flex>

			{t && (
				<AiDialog
					open={ai}
					onClose={() => setAi(false)}
					template={t}
					dirty={dirty}
					onReload={refetch}
				/>
			)}
			{t && (
				<RealPdfDialog
					open={real}
					onClose={() => setReal(false)}
					template={t}
					recordId={recordId || undefined}
				/>
			)}
			<SettingsDialog
				open={business.open}
				focus={business.focus}
				onClose={() => {
					setBusiness({ open: false, focus: null });
					// The record's data carries the business details: fetch it again.
					if (route && recordId) refetchRecord();
				}}
			/>
		</Layout>
	);
};

export default DesignerPage;
