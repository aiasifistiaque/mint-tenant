'use client';

import { CSSProperties, DragEvent, FC, Fragment, MouseEvent, ReactNode, memo } from 'react';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { meets } from '../functions/fieldLocks';
import { Scope, fill, valueOf } from './tokens';
import { Block, PdfTemplate, pageSize } from './types';

/**
 * A PDF template drawn in HTML — the designer's page and the gallery's
 * thumbnails. It follows the server's layout rules (backend
 * library/functions/pdfTemplates/render.ts): sizes in pt, the same fonts,
 * column shares, box padding inside the border, label/value rows, tables
 * with heading rows. It shows one long page: header at the top, footer at
 * the bottom, body between — the PDF splits the body over pages ("Real PDF"
 * in the designer shows the file itself).
 *
 * `mode='fields'` shows tokens as chips instead of values. With `onSelect`,
 * blocks are clickable and the selected one is outlined (with `blockBar` on
 * it); blocks whose "Show only when" doesn't hold are drawn faded rather than
 * hidden. With `onFix`, an empty business detail or saved text shows as
 * "Add phone" / "Upload logo" / "Write Terms & conditions" — click to fill it in.
 */

export type PdfPageProps = {
	template: PdfTemplate;
	scope: Scope;
	mode?: 'values' | 'fields';
	selected?: string | null;
	onSelect?: (id: string) => void;
	/** Zoom: 1 = 1pt per pt (a page is about 800px wide). */
	scale?: number;
	/** The page's height grows with its body (designer) or stays one page (thumbnail). */
	clip?: boolean;
	/** The designer: what an empty {{business.x}} / {{texts.x}} opens ("business.logo"). */
	onFix?: (path: string) => void;
	/** The designer: tools drawn on the selected block (move, duplicate, delete). */
	blockBar?: ReactNode;
	/** The designer: a block on the page starts being dragged (D20). */
	onDragBlock?: (id: string, e: DragEvent) => void;
	/** The designer, while something is dragged: an empty header or footer shows a place to drop. */
	showEmptyParts?: boolean;
};

const FAMILY: Record<string, string> = {
	sans: GeistSans.style.fontFamily,
	mono: GeistMono.style.fontFamily,
	helvetica: 'Helvetica, Arial, sans-serif',
	times: '"Times New Roman", Times, serif',
	courier: '"Courier New", Courier, monospace',
};
const HAIRLINE = '#e5e7eb';
const ZEBRA = '#f6f7f9';
const pt = (n: number | undefined) => `${n ?? 0}pt`;

type Ctx = PdfPageProps & { t: PdfTemplate };

const BUSINESS_FIX: Record<string, string> = {
	name: 'Add business name',
	logo: 'Upload logo',
	address: 'Add address',
	phone: 'Add phone',
	email: 'Add email',
	website: 'Add website',
	taxId: 'Add tax number',
	note: 'Add bank details',
};

/** What an empty detail's placeholder says. */
export const fixLabel = (path: string) => {
	const [root, key = ''] = path.split('.');
	if (root === 'business') return BUSINESS_FIX[key] || `Add ${key}`;
	return `Write “${key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}”`;
};

const FIXABLE = /^(business|texts)\.[A-Za-z0-9_]+$/;

/** "Add phone": a dashed chip that opens the business details at that field. */
const Fix: FC<{ path: string; onFix: (path: string) => void }> = ({ path, onFix }) => (
	<span
		role='button'
		tabIndex={0}
		title='Click to fill it in — every template uses it'
		onClick={e => {
			e.stopPropagation();
			onFix(path);
		}}
		onKeyDown={e => {
			if (e.key === 'Enter') {
				e.stopPropagation();
				onFix(path);
			}
		}}
		style={{
			display: 'inline-block',
			border: '1px dashed #8b8ff0',
			color: '#4f46e5',
			background: 'rgba(79,70,229,.06)',
			borderRadius: 3,
			padding: '0 4px',
			fontFamily: FAMILY.sans,
			fontSize: '0.85em',
			fontWeight: 500,
			fontStyle: 'normal',
			letterSpacing: 0,
			textTransform: 'none',
			cursor: 'pointer',
			whiteSpace: 'nowrap',
		}}>
		+ {fixLabel(path)}
	</span>
);

/** `**bold**` and tokens: values, or chips naming the field. */
const Rich: FC<{ text: string; ctx: Ctx; scope: Scope }> = ({ text, ctx, scope }) => {
	// A saved text goes in before **bold** is read, so its own bold shows (as in the PDF).
	const texts = scope.roots?.texts || {};
	const raw = ctx.mode === 'fields' ? text || '' : (text || '').replace(/\{\{\s*texts\.([A-Za-z0-9_]+)\s*\}\}/g, (m, k) => (texts[k] ? texts[k] : m));
	const parts = raw.split('**');
	return (
		<>
			{parts.map((part, i) => {
				const content: ReactNode =
					ctx.mode === 'fields'
						? part.split(/(\{\{[\s\S]*?\}\})/g).map((bit, j) =>
								/^\{\{[\s\S]*\}\}$/.test(bit) ? (
									<span
										key={j}
										style={{ background: 'rgba(79,70,229,.10)', color: '#4338ca', borderRadius: 3, padding: '0 2px', fontFamily: FAMILY.mono, fontSize: '0.82em', fontWeight: 500 }}>
										{bit.slice(2, -2).trim()}
									</span>
								) : (
									<Fragment key={j}>{bit}</Fragment>
								)
						  )
						: ctx.onFix
						? part.split(/(\{\{[\s\S]*?\}\})/g).map((bit, j) => {
								if (!/^\{\{[\s\S]*\}\}$/.test(bit)) return <Fragment key={j}>{bit}</Fragment>;
								const value = fill(bit, scope);
								const path = bit.slice(2, -2).split('|')[0].trim();
								return value === '' && FIXABLE.test(path) ? (
									<Fix
										key={j}
										path={path}
										onFix={ctx.onFix!}
									/>
								) : (
									<Fragment key={j}>{value}</Fragment>
								);
						  })
						: fill(part, scope);
				return i % 2 ? (
					<strong
						key={i}
						style={{ fontWeight: 700 }}>
						{content}
					</strong>
				) : (
					<Fragment key={i}>{content}</Fragment>
				);
			})}
		</>
	);
};

const textCss = (ctx: Ctx, b: any, over: Partial<{ size: number; weight: number; color: string; align: string; upper: boolean; spacing: number }> = {}): CSSProperties => {
	const s = ctx.t.style;
	const size = over.size ?? b.size ?? s.size;
	return {
		fontSize: pt(size),
		fontWeight: over.weight ?? b.weight ?? 400,
		fontStyle: b.italic ? 'italic' : 'normal',
		color: over.color ?? b.color ?? s.color,
		textAlign: (over.align ?? b.align ?? 'left') as any,
		lineHeight: b.lineHeight ?? s.lineHeight,
		letterSpacing: pt(over.spacing ?? b.spacing ?? 0),
		textTransform: (over.upper ?? b.upper) ? 'uppercase' : 'none',
		whiteSpace: 'pre-wrap',
		overflowWrap: 'anywhere',
		minHeight: `${size * (b.lineHeight ?? s.lineHeight)}pt`,
	};
};

const visible = (b: Block, scope: Scope) => !b.showIf?.length || meets(scope.roots, b.showIf as any, b.showMatch === 'any' ? 'any' : 'all');

/** Which way the list a block sits in runs: a stack, or a box's row (D19). */
type Flow = 'column' | 'row';

/** Blocks with no width of their own: in a row they fill unless given one (render.ts FILLERS). */
const FILLERS = new Set(['fields', 'table', 'divider', 'columns']);
const ROW_ALIGN: Record<string, string> = { top: 'flex-start', middle: 'center', bottom: 'flex-end', stretch: 'stretch' };
const ROW_JUSTIFY: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' };
/** A Space set to fill, seen in the designer. */
const HATCH = 'repeating-linear-gradient(45deg, rgba(79,70,229,.10) 0 3pt, transparent 3pt 6pt)';

/** A block's flex item rules (D19) — the same widths the PDF gives it. */
const flexOf = (b: Block, flow: Flow): CSSProperties => {
	const grow = Number(b.grow) > 0 ? Number(b.grow) : 0;
	if (flow === 'row') {
		if (grow) return { flex: `${grow} 1 0`, minWidth: 0 };
		if (b.basis) return { flex: `0 0 ${pt(b.basis)}`, minWidth: 0 };
		if (b.type === 'spacer') return { flex: `0 0 ${pt(b.height ?? 12)}`, alignSelf: 'stretch' };
		if (FILLERS.has(b.type)) return { flex: '1 1 0', minWidth: 0 };
		return { flex: '0 1 auto', minWidth: 0 };
	}
	return { flexShrink: 0, ...(grow && { flexGrow: grow }) };
};

/** A part's own blocks know the page's margins, so a full-width box can reach the edges (PT-27). */
type PartEdge = { name: 'header' | 'body' | 'footer'; ml: number; mr: number; mt: number; mb: number };
/** How far a full-width box's background reaches past its place. */
type Bleed = { l: number; r: number; t: number; b: number };

const Blocks: FC<{ blocks: Block[]; ctx: Ctx; scope: Scope; flow?: Flow; part?: PartEdge }> = ({ blocks, ctx, scope, flow = 'column', part }) => (
	<>
		{(blocks || []).map((b, i, all) => (
			<BlockView
				key={b.id}
				b={b}
				ctx={ctx}
				scope={scope}
				flow={flow}
				bleed={
					part && b.type === 'box' && b.bleed
						? { l: part.ml, r: part.mr, t: part.name === 'header' && i === 0 ? part.mt : 0, b: part.name === 'footer' && i === all.length - 1 ? part.mb : 0 }
						: undefined
				}
			/>
		))}
	</>
);

const BlockView: FC<{ b: Block; ctx: Ctx; scope: Scope; flow: Flow; bleed?: Bleed }> = ({ b, ctx, scope, flow, bleed }) => {
	const shown = visible(b, scope);
	const editing = !!ctx.onSelect;
	if (!shown && !editing) return null;
	if (b.type === 'pageBreak' && !editing) return null;
	const selected = ctx.selected === b.id;
	const select = (e: MouseEvent) => {
		if (!ctx.onSelect) return;
		e.stopPropagation();
		ctx.onSelect(b.id);
	};
	return (
		<div
			data-block={b.id}
			data-flow={flow}
			draggable={!!ctx.onDragBlock || undefined}
			onDragStart={
				ctx.onDragBlock
					? e => {
							e.stopPropagation();
							ctx.onDragBlock!(b.id, e);
					  }
					: undefined
			}
			onClick={select}
			className={editing ? 'pdf-block' : undefined}
			style={{
				marginTop: pt(b.mt),
				marginBottom: pt(b.mb),
				display: 'flex',
				flexDirection: 'column',
				...flexOf(b, flow),
				position: 'relative',
				cursor: editing ? 'pointer' : undefined,
				opacity: shown ? 1 : 0.35,
				outline: selected ? '1.5px solid #4f46e5' : undefined,
				outlineOffset: selected ? 2 : undefined,
				borderRadius: 2,
			}}>
			<BlockBody
				b={b}
				ctx={ctx}
				scope={scope}
				flow={flow}
				bleed={bleed}
			/>
			{selected && ctx.blockBar && (
				// Undoes the page's zoom, so the tools keep their size at any zoom.
				<div
					onClick={e => e.stopPropagation()}
					style={{ position: 'absolute', right: 0, bottom: '100%', marginBottom: 3, zoom: 1 / (ctx.scale || 1), zIndex: 2, lineHeight: 1 }}>
					{ctx.blockBar}
				</div>
			)}
		</div>
	);
};

const BlockBody: FC<{ b: Block; ctx: Ctx; scope: Scope; flow: Flow; bleed?: Bleed }> = ({ b, ctx, scope, flow, bleed }) => {
	switch (b.type) {
		case 'text':
			return (
				<div style={textCss(ctx, b)}>
					<Rich
						text={b.text}
						ctx={ctx}
						scope={scope}
					/>
				</div>
			);
		case 'image': {
			const src = ctx.mode === 'fields' ? '' : String(valueOf(b.src || '', scope) || '').trim();
			const box: CSSProperties = { width: b.width ? pt(b.width) : undefined, height: b.height ? pt(b.height) : undefined, maxWidth: '100%' };
			const wrap: CSSProperties = { display: 'flex', justifyContent: b.align === 'center' ? 'center' : b.align === 'right' ? 'flex-end' : 'flex-start' };
			if (src && /^(https?:|data:image\/)/.test(src))
				return (
					<div style={wrap}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={src}
							alt=''
							style={{ ...box, objectFit: 'contain', display: 'block' }}
						/>
					</div>
				);
			if (!ctx.onSelect) return null;
			const fixPath = String(b.src || '').replace(/^\{\{\s*|\s*\}\}$/g, '').split('|')[0].trim();
			const fixable = !!ctx.onFix && ctx.mode !== 'fields' && FIXABLE.test(fixPath);
			return (
				<div style={wrap}>
					<div
						role={fixable ? 'button' : undefined}
						title={fixable ? 'Click to upload it — every template uses it' : undefined}
						onClick={
							fixable
								? e => {
										e.stopPropagation();
										ctx.onFix!(fixPath);
								  }
								: undefined
						}
						style={{
							...box,
							width: pt(b.width || (b.height ? b.height * 2.5 : 100)),
							height: pt(b.height || 40),
							border: fixable ? '1px dashed #8b8ff0' : '1px dashed #c7cad1',
							background: fixable ? 'rgba(79,70,229,.06)' : undefined,
							borderRadius: 3,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '7pt',
							color: fixable ? '#4f46e5' : '#8a8f98',
							fontFamily: fixable ? FAMILY.sans : FAMILY.mono,
							fontWeight: fixable ? 600 : undefined,
							cursor: fixable ? 'pointer' : undefined,
							overflow: 'hidden',
							padding: 2,
							textAlign: 'center',
						}}>
						{fixable ? `+ ${fixLabel(fixPath)}` : String(b.src || 'Image').replace(/^\{\{\s*|\s*\}\}$/g, '')}
					</div>
				</div>
			);
		}
		case 'columns':
			return (
				<div style={{ display: 'flex', gap: pt(b.gap ?? 16), alignItems: 'stretch' }}>
					{(b.columns || []).map((c: any, i: number) => (
						<div
							key={i}
							data-container={b.id}
							data-column={i}
							data-dir={c.direction === 'row' ? 'row' : 'column'}
							style={{
								flex: `${c.width || 1} 1 0`,
								minWidth: 0,
								display: 'flex',
								flexDirection: 'column',
								justifyContent: c.valign === 'middle' ? 'center' : c.valign === 'bottom' ? 'flex-end' : 'flex-start',
								...(ctx.onSelect && !(c.blocks || []).length && { minHeight: '24pt', outline: '1px dashed #d4d6db' }),
							}}>
							{/* A column's blocks one under another, or side by side (PT-28). */}
							<div style={c.direction === 'row' ? { display: 'flex', flexDirection: 'row', gap: pt(c.gap ?? 8), alignItems: ROW_ALIGN[c.valign === 'middle' ? 'middle' : c.valign === 'bottom' ? 'bottom' : 'top'] } : undefined}>
								<Blocks
									blocks={c.blocks}
									ctx={ctx}
									scope={scope}
									flow={c.direction === 'row' ? 'row' : 'column'}
								/>
							</div>
						</div>
					))}
				</div>
			);
		case 'box': {
			const row = b.direction === 'row';
			// Padding top-bottom / left-right over the all-round one, the border on some sides only (PT-30).
			const px = b.padX ?? b.pad ?? 10;
			const py = b.padY ?? b.pad ?? 10;
			const sides: string[] | null = Array.isArray(b.borderSides) && b.borderSides.length ? b.borderSides : null;
			const line = b.border ? `${pt(b.border)} solid ${b.borderColor || HAIRLINE}` : undefined;
			const reach = bleed && b.bg ? bleed : null;
			return (
				<div
					data-container={b.id}
					data-dir={row ? 'row' : 'column'}
					style={{
						padding: `${pt(py + (reach?.t || 0))} ${pt(px + (reach?.r || 0))} ${pt(py + (reach?.b || 0))} ${pt(px + (reach?.l || 0))}`,
						// Full width (PT-27): out to the page's edges; the contents stay inside the margins.
						...(reach && { marginLeft: pt(-reach.l), marginRight: pt(-reach.r), marginTop: pt(-reach.t), marginBottom: pt(-reach.b) }),
						background: b.bg,
						...(sides
							? { borderTop: sides.includes('top') ? line : undefined, borderRight: sides.includes('right') ? line : undefined, borderBottom: sides.includes('bottom') ? line : undefined, borderLeft: sides.includes('left') ? line : undefined }
							: { border: line }),
						borderRadius: sides || reach ? 0 : pt(b.radius),
						boxSizing: 'border-box',
						flex: '1 1 auto',
						display: 'flex',
						flexDirection: row ? 'row' : 'column',
						gap: pt(b.gap ?? (row ? 8 : 0)),
						alignItems: row ? ROW_ALIGN[b.valign || 'top'] : 'stretch',
						justifyContent: row ? ROW_JUSTIFY[b.justify || 'start'] : undefined,
						minHeight: b.height ? pt(b.height) : ctx.onSelect && !(b.blocks || []).length ? '30pt' : undefined,
						...(ctx.onSelect && !(b.blocks || []).length && !b.bg && !b.border && { outline: '1px dashed #d4d6db' }),
					}}>
					<Blocks
						blocks={b.blocks}
						ctx={ctx}
						scope={scope}
						flow={row ? 'row' : 'column'}
					/>
				</div>
			);
		}
		case 'divider':
			return <div style={{ height: 0, borderTop: `${pt(b.thickness ?? 0.75)} ${b.dashed ? 'dashed' : 'solid'} ${b.color || HAIRLINE}` }} />;
		case 'spacer': {
			// A height in a stack, a width in a row (the wrapper's flex basis); hatched in the designer when it fills.
			const fills = Number(b.grow) > 0 && !!ctx.onSelect;
			return (
				<div
					style={{
						height: flow === 'row' ? undefined : pt(b.height ?? 12),
						minHeight: flow === 'row' && fills ? '8pt' : undefined,
						flex: '1 1 auto',
						background: fills ? HATCH : undefined,
						borderRadius: 2,
					}}
				/>
			);
		}
		case 'pageBreak':
			return (
				<div style={{ borderTop: '1px dashed #a5a9b1', margin: '6pt 0', textAlign: 'center', fontSize: '7pt', color: '#8a8f98', lineHeight: 0 }}>
					<span style={{ background: '#fff', padding: '0 6px', fontFamily: FAMILY.sans }}>Page break</span>
				</div>
			);
		case 'fields':
			return (
				<FieldsView
					b={b}
					ctx={ctx}
					scope={scope}
				/>
			);
		case 'table':
			return (
				<TableView
					b={b}
					ctx={ctx}
					scope={scope}
				/>
			);
	}
	return null;
};

const FieldsView: FC<{ b: any; ctx: Ctx; scope: Scope }> = ({ b, ctx, scope }) => {
	const s = ctx.t.style;
	const rows = (b.rows || []).filter((r: any) => !b.hideEmpty || ctx.mode === 'fields' || fill(r.value || '', scope).trim());
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: pt(b.gap ?? 3) }}>
			{rows.map((r: any, i: number) => {
				const big = !!r.big;
				const size = (b.size ?? s.size) * (big ? 1.3 : 1);
				const bold = r.bold || big || r.bar;
				return (
					<Fragment key={i}>
						{r.line && <div style={{ height: '6pt', position: 'relative' }}><div style={{ position: 'absolute', top: '2pt', left: 0, right: 0, borderTop: `0.75pt solid ${s.color}` }} /></div>}
						<div
							style={{
								display: 'flex',
								gap: '6pt',
								background: r.bar ? s.accent : undefined,
								padding: r.bar ? '6pt 8pt' : 0,
							}}>
							<div style={{ ...textCss(ctx, b, { size, weight: bold ? 600 : b.weight ?? 400, color: r.bar ? '#ffffff' : bold ? b.color ?? s.color : s.muted, align: 'left', upper: false, spacing: 0 }), flex: `0 0 calc(${(b.labelWidth ?? 0.5) * 100}% - 3pt)` }}>
								<Rich
									text={r.label}
									ctx={ctx}
									scope={scope}
								/>
							</div>
							<div style={{ ...textCss(ctx, b, { size, weight: bold ? 700 : b.weight ?? 400, color: r.bar ? '#ffffff' : b.color ?? s.color, align: b.align === 'right' ? 'right' : 'left', upper: false, spacing: 0 }), flex: '1 1 0', minWidth: 0 }}>
								<Rich
									text={r.value}
									ctx={ctx}
									scope={scope}
								/>
							</div>
						</div>
					</Fragment>
				);
			})}
		</div>
	);
};

const TableView: FC<{ b: any; ctx: Ctx; scope: Scope }> = ({ b, ctx, scope }) => {
	const s = ctx.t.style;
	const cols: any[] = b.columns || [];
	const total = cols.reduce((t, c) => t + (c.width || 1), 0) || 1;
	const pad = pt(b.pad ?? 5);
	const grid = b.lines === 'grid';
	const lines = b.lines !== 'none';
	let items: any = ctx.mode === 'fields' ? [{}] : valueOf(b.rows || '', scope);
	if (items == null || items === '') items = [];
	if (!Array.isArray(items)) items = [items];
	const shown = ctx.onSelect ? items.slice(0, 40) : items.slice(0, 12);
	const cell = (header: boolean, align: string, last: boolean, zebra = false): CSSProperties => ({
		padding: pad,
		verticalAlign: 'top',
		textAlign: align as any,
		background: header ? b.headerBg : zebra ? ZEBRA : undefined,
		border: grid ? `0.5pt solid ${HAIRLINE}` : undefined,
		borderBottom: grid ? `0.5pt solid ${HAIRLINE}` : lines ? (header ? `0.75pt solid ${s.color}` : `0.5pt solid ${HAIRLINE}`) : undefined,
	});
	const style = (header: boolean) => textCss(ctx, b, { weight: header ? 600 : b.weight ?? 400, color: header ? b.headerColor ?? s.color : b.color ?? s.color, upper: false, spacing: 0 });
	return (
		<table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
			<colgroup>
				{cols.map((c, i) => (
					<col
						key={i}
						style={{ width: `${((c.width || 1) / total) * 100}%` }}
					/>
				))}
			</colgroup>
			{cols.some(c => c.header) && (
				<thead>
					<tr>
						{cols.map((c, i) => (
							<th
								key={i}
								style={{ ...cell(true, c.align || 'left', i === cols.length - 1), ...style(true), textAlign: (c.align || 'left') as any }}>
								<Rich
									text={c.header}
									ctx={ctx}
									scope={scope}
								/>
							</th>
						))}
					</tr>
				</thead>
			)}
			<tbody>
				{shown.map((item: any, ri: number) => {
					const rowScope: Scope = { ...scope, roots: { ...scope.roots, item, index: ri + 1 } };
					return (
						<tr key={ri}>
							{cols.map((c, i) => (
								<td
									key={i}
									style={{ ...cell(false, c.align || 'left', i === cols.length - 1, b.zebra && ri % 2 === 1), ...style(false), textAlign: (c.align || 'left') as any }}>
									<Rich
										text={c.value}
										ctx={ctx}
										scope={rowScope}
									/>
								</td>
							))}
						</tr>
					);
				})}
				{!shown.length && (
					<tr>
						<td
							colSpan={cols.length || 1}
							style={{ ...cell(false, 'center', true), ...textCss(ctx, b, { color: s.muted, align: 'center', upper: false, spacing: 0 }) }}>
							{b.emptyText ? fill(b.emptyText, scope) : ctx.onSelect ? (b.rows ? 'No rows in this record' : 'Pick the list this table shows') : ''}
						</td>
					</tr>
				)}
				{items.length > shown.length && (
					<tr>
						<td
							colSpan={cols.length || 1}
							style={{ padding: pad, fontSize: '7.5pt', color: s.muted, textAlign: 'center' }}>
							+ {items.length - shown.length} more rows
						</td>
					</tr>
				)}
			</tbody>
		</table>
	);
};

/**
 * An empty header or footer while something is dragged: somewhere to drop
 * it, drawn in the page's margin so nothing on the page moves under the pointer.
 */
const EmptyPart: FC<{ part: 'header' | 'footer'; label: string; margin: number; left: number; right: number }> = ({ part, label, margin, left, right }) => (
	<div
		data-part={part}
		style={{
			position: 'absolute',
			[part === 'header' ? 'top' : 'bottom']: pt(Math.max(2, (margin - Math.max(14, margin - 8)) / 2)),
			left: pt(left),
			right: pt(right),
			height: pt(Math.max(14, margin - 8)),
			border: '1px dashed #a5a9b1',
			borderRadius: 3,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: '7pt',
			color: '#8a8f98',
			fontFamily: FAMILY.sans,
			background: 'rgba(255,255,255,.9)',
			zIndex: 1,
		}}>
		{label}
	</div>
);

const PdfPage: FC<PdfPageProps> = props => {
	const { template: t, scope, scale = 1, clip } = props;
	const [w, h] = pageSize(t);
	const [mt, mr, mb, ml] = t.page?.margin || [40, 40, 40, 40];
	const ctx: Ctx = { ...props, t };
	const pageScope = (page: number): Scope => ({ ...scope, roots: { ...scope.roots, page, pages: 1 } });
	return (
		<div
			onClick={() => props.onSelect?.('')}
			style={{
				zoom: scale,
				width: pt(w),
				minHeight: pt(h),
				height: clip ? pt(h) : undefined,
				overflow: clip ? 'hidden' : undefined,
				background: '#ffffff',
				color: t.style?.color,
				fontFamily: FAMILY[t.style?.font] || FAMILY.sans,
				padding: `${pt(mt)} ${pt(mr)} ${pt(mb)} ${pt(ml)}`,
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				textAlign: 'left',
				position: 'relative',
			}}>
			{(t.header || []).length > 0 ? (
				<div
					data-part='header'
					style={{ marginBottom: '12pt' }}>
					<Blocks
						blocks={t.header}
						ctx={ctx}
						scope={pageScope(1)}
						part={{ name: 'header', ml, mr, mt, mb }}
					/>
				</div>
			) : (
				props.showEmptyParts && (
					<EmptyPart
						part='header'
						label='Header — on top of every page'
						margin={mt}
						left={ml}
						right={mr}
					/>
				)
			)}
			{/* A flex column, so a block set to fill takes the room left on the page (D19). */}
			<div
				data-part='body'
				style={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>
				<Blocks
					blocks={t.body}
					ctx={ctx}
					scope={scope}
					part={{ name: 'body', ml, mr, mt, mb }}
				/>
			</div>
			{(t.footer || []).length > 0 ? (
				<div
					data-part='footer'
					style={{ marginTop: '12pt' }}>
					<Blocks
						blocks={t.footer}
						ctx={ctx}
						scope={pageScope(1)}
						part={{ name: 'footer', ml, mr, mt, mb }}
					/>
				</div>
			) : (
				props.showEmptyParts && (
					<EmptyPart
						part='footer'
						label='Footer — at the bottom of every page'
						margin={mb}
						left={ml}
						right={mr}
					/>
				)
			)}
		</div>
	);
};

export default memo(PdfPage);
