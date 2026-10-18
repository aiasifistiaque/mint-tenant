'use client';

import { FC, ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Box, Button, Flex, Grid, Menu, Popover, Portal, Text, useDisclosure } from '@chakra-ui/react';
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	CaseSensitive,
	ChevronDown,
	ClipboardPaste,
	Code,
	Copy,
	Eraser,
	FileText,
	Image as ImageIcon,
	Italic,
	Link2,
	List,
	ListOrdered,
	Quote,
	Scissors,
	Strikethrough,
	Table2,
	Underline,
} from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';
import './editor.css';
import './document.css';
import { FULL_FORMATS, FULL_TOOLBAR, editorHtml } from './quill';
import ImageUploader from '../../../modals/upload-modal/ImageUploader';
import { toaster } from '@/components/ui/toaster';

/**
 * The full-page editor's writing surface (utils/RichTextEditorPage): Quill 2
 * with its toolbar lifted out to a full-width bar that stays under the page's
 * header, over a grey desk with a white sheet — white with black words in
 * light and dark mode alike, as it prints.
 *
 * - Page size: Infinite (one endless sheet, the default) or paper — A4,
 *   Letter, Legal, A5 — where the words break onto sheets. Quill keeps one
 *   column of blocks, so a block that would cross the bottom margin is moved
 *   to the next sheet with a top margin set from a <style> (Quill's own DOM is
 *   never touched); list items move one by one, anything taller than a page
 *   runs over.
 * - Right-click: marks, case, text style, alignment, lists, link, image,
 *   table rows and columns, cut / copy / paste. Selecting words shows a small
 *   bar for marks, case and link.
 * - Tables: Quill's table module (insert from the toolbar's grid; rows and
 *   columns from the right-click menu).
 *
 * It emits clean HTML (editorHtml) only for the person's own edits.
 */

export type PageSize = 'infinite' | 'a4' | 'letter' | 'legal' | 'a5';

export const PAGE_SIZES: { value: PageSize; label: string; hint: string; w: number; h: number; m: number }[] = [
	{ value: 'infinite', label: 'Infinite', hint: 'One long page', w: 816, h: 0, m: 72 },
	{ value: 'a4', label: 'A4', hint: '210 × 297 mm', w: 794, h: 1123, m: 96 },
	{ value: 'letter', label: 'Letter', hint: '8.5 × 11 in', w: 816, h: 1056, m: 96 },
	{ value: 'legal', label: 'Legal', hint: '8.5 × 14 in', w: 816, h: 1344, m: 96 },
	{ value: 'a5', label: 'A5', hint: '148 × 210 mm', w: 559, h: 794, m: 64 },
];
export const isPageSize = (v: any): v is PageSize => PAGE_SIZES.some(p => p.value === v);

/** The grey between sheets. */
const GAP = 24;
const DOC_FORMATS = [...FULL_FORMATS, 'table', 'table-row', 'table-body', 'table-container'];

type Range = { index: number; length: number };
type Case = 'upper' | 'lower' | 'title' | 'sentence';

const CASES: { value: Case; label: string; sample: string }[] = [
	{ value: 'upper', label: 'UPPERCASE', sample: 'AB' },
	{ value: 'lower', label: 'lowercase', sample: 'ab' },
	{ value: 'title', label: 'Title Case', sample: 'Ab' },
	{ value: 'sentence', label: 'Sentence case', sample: 'A.' },
];

const recase = (text: string, mode: Case) => {
	if (mode === 'upper') return text.toUpperCase();
	if (mode === 'lower') return text.toLowerCase();
	if (mode === 'title') return text.toLowerCase().replace(/(^|[\s\-–—("'“‘/])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
	return text.toLowerCase().replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const key = (k: string) => (isMac ? `⌘${k}` : `Ctrl+${k}`);

type Props = {
	value: string;
	onChange: (html: string) => void;
	pageSize: PageSize;
	onPageSize: (size: PageSize) => void;
	/** Height of the page's own header: the toolbar sticks just under it. */
	top?: number;
};

const DocumentEditor: FC<Props> = ({ value, onChange, pageSize, onPageSize, top = 0 }) => {
	const cls = `mint-doc-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const hostRef = useRef<HTMLDivElement>(null);
	const slotRef = useRef<HTMLDivElement>(null);
	const styleRef = useRef<HTMLStyleElement | null>(null);
	const [quill, setQuill] = useState<any>(null);
	const Delta = useRef<any>(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const initial = useRef(value);

	const page = PAGE_SIZES.find(p => p.value === pageSize) || PAGE_SIZES[0];
	const paged = page.h > 0;
	const [pages, setPages] = useState(1);

	const uploader = useDisclosure();
	const lastRange = useRef<Range | null>(null);
	const menuRange = useRef<Range | null>(null);

	/* ------------------------------------------------------------ Quill */
	useEffect(() => {
		let dead = false;
		let q: any;
		(async () => {
			const RQ: any = (await import('react-quill-new')).default;
			const Quill = RQ.Quill;
			try {
				const ImageResize = (await import('quill-resize-image')).default;
				Quill.register('modules/resize', ImageResize, true);
			} catch {
				// resizing images is a nicety
			}
			if (dead || !hostRef.current) return;
			Delta.current = Quill.import('delta');
			hostRef.current.innerHTML = '';
			const el = document.createElement('div');
			hostRef.current.appendChild(el);
			q = new Quill(el, {
				theme: 'snow',
				placeholder: 'Start writing…',
				formats: DOC_FORMATS,
				modules: {
					table: true,
					resize: { locale: {} },
					toolbar: { container: FULL_TOOLBAR, handlers: { image: () => uploader.onOpen() } },
				},
			});
			if (initial.current) q.setContents(q.clipboard.convert({ html: initial.current }), 'silent');
			q.history.clear();
			// The toolbar goes up into the full-width bar.
			slotRef.current?.replaceChildren(q.getModule('toolbar').container);
			q.on('text-change', (_d: any, _o: any, source: string) => {
				if (source !== 'user') return;
				onChangeRef.current(editorHtml(q));
			});
			q.on('selection-change', (range: Range | null) => {
				if (range) lastRange.current = range;
			});
			setQuill(q);
		})();
		return () => {
			dead = true;
			if (q) q.off('text-change');
			slotRef.current?.replaceChildren();
			if (hostRef.current) hostRef.current.innerHTML = '';
			setQuill(null);
		};
		// Mounted once per record: the page remounts it for another one.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/* ------------------------------------------------------- pagination */
	useEffect(() => {
		const style = document.createElement('style');
		document.head.appendChild(style);
		styleRef.current = style;
		return () => style.remove();
	}, []);

	const paginate = useCallback(() => {
		const style = styleRef.current;
		if (!quill || !style) return;
		const root: HTMLElement = quill.root;
		if (!paged) {
			style.textContent = '';
			setPages(1);
			return;
		}
		style.textContent = '';
		const H = page.h;
		const m = page.m;
		const stride = H + GAP;
		const content = H - 2 * m;
		const origin = root.getBoundingClientRect().top;
		const ed = `.${cls} .ql-editor`;
		type Unit = { sel: string; top: number; bottom: number };
		const units: Unit[] = [];
		Array.from(root.children).forEach((child, i) => {
			const el = child as HTMLElement;
			const sel = `${ed} > :nth-child(${i + 1})`;
			const r = el.getBoundingClientRect();
			// A list moves item by item (its first item moves the list).
			if (el.tagName === 'OL' && el.children.length > 1) {
				Array.from(el.children).forEach((li, j) => {
					const lr = (j ? li : el).getBoundingClientRect();
					units.push({ sel: j ? `${sel} > :nth-child(${j + 1})` : sel, top: lr.top - origin, bottom: (j ? lr.bottom : li.getBoundingClientRect().bottom) - origin });
				});
			} else units.push({ sel, top: r.top - origin, bottom: r.bottom - origin });
		});
		let shift = 0;
		let prevBottom = m;
		let last = m;
		const rules: string[] = [];
		for (const u of units) {
			const top = u.top + shift;
			const bottom = u.bottom + shift;
			const sheet = Math.floor(top / stride);
			const contentTop = sheet * stride + m;
			const contentBottom = sheet * stride + H - m;
			let push = 0;
			if (top > contentBottom - 2 || (bottom > contentBottom + 1 && u.bottom - u.top <= content && top > contentTop + 1)) push = (sheet + 1) * stride + m - top;
			if (push > 0) {
				rules.push(`${u.sel}{margin-top:${Math.max(0, u.top - prevBottom) + push}px !important}`);
				shift += push;
			}
			prevBottom = u.bottom;
			last = bottom + push;
		}
		const count = Math.max(1, Math.ceil((last + m) / stride));
		rules.push(`${ed}{min-height:${count * stride - GAP}px}`);
		style.textContent = rules.join('\n');
		setPages(count);
	}, [quill, paged, page.h, page.m, cls]);

	useEffect(() => {
		if (!quill) return;
		let t: any;
		const later = () => {
			clearTimeout(t);
			t = setTimeout(paginate, 30);
		};
		paginate();
		quill.on('text-change', later);
		window.addEventListener('resize', later);
		// Pictures change the height once they've loaded.
		quill.root.addEventListener('load', later, true);
		(document as any).fonts?.ready?.then(later);
		return () => {
			clearTimeout(t);
			quill.off('text-change', later);
			window.removeEventListener('resize', later);
			quill.root.removeEventListener('load', later, true);
		};
	}, [quill, paginate]);

	/* ------------------------------------------------------- formatting */
	/** Runs an edit on the range the right-click menu was opened on, else where the cursor is (or last was). */
	const act = (fn: (q: any, r: Range) => void) => {
		if (!quill) return;
		const r = menuRange.current || quill.getSelection() || lastRange.current || { index: Math.max(0, quill.getLength() - 1), length: 0 };
		quill.focus();
		quill.setSelection(r.index, r.length, 'silent');
		fn(quill, r);
	};
	const toggle = (name: string) => act(q => q.format(name, !q.getFormat()[name], 'user'));
	const setLine = (name: string, value: any) =>
		act(q => {
			const now = q.getFormat()[name];
			q.format(name, now === value ? false : value, 'user');
		});
	const changeCase = (mode: Case) =>
		act((q, r) => {
			if (!r.length) return;
			const contents = q.getContents(r.index, r.length);
			const whole = contents.ops.map((op: any) => (typeof op.insert === 'string' ? op.insert : '')).join('');
			const changed = recase(whole, mode);
			let at = 0;
			const ops = contents.ops.map((op: any) => {
				if (typeof op.insert !== 'string') return op;
				const len = op.insert.length;
				// Same length (nearly always): cut the changed text back into the runs; else each run alone.
				const insert = changed.length === whole.length ? changed.slice(at, at + len) : recase(op.insert, mode);
				at += len;
				return { ...op, insert };
			});
			const D = Delta.current;
			q.updateContents(new D().retain(r.index).delete(r.length).concat(new D(ops)), 'user');
			q.setSelection(r.index, r.length, 'silent');
		});
	const link = () =>
		act(q => {
			const toolbar = q.getModule('toolbar');
			toolbar.handlers.link.call(toolbar, !q.getFormat().link);
		});
	const table = (fn: string, ...args: any[]) => act(q => q.getModule('table')[fn](...args));
	const clipboard = (what: 'cut' | 'copy' | 'paste') =>
		act(async (q, r) => {
			if (what !== 'paste') {
				document.execCommand(what);
				return;
			}
			try {
				const text = await navigator.clipboard.readText();
				if (r.length) q.deleteText(r.index, r.length, 'user');
				q.insertText(r.index, text, 'user');
				q.setSelection(r.index + text.length, 0, 'silent');
			} catch {
				toaster.create({ type: 'info', title: `Press ${key('V')} to paste`, description: 'The browser keeps the clipboard to itself here.' });
			}
		});
	const insertImage = (url: string) =>
		act((q, r) => {
			q.insertEmbed(r.index, 'image', url, 'user');
			q.setSelection(r.index + 1, 0, 'silent');
		});

	/* ------------------------------------------- the menu and the bar */
	const [formats, setFormats] = useState<Record<string, any>>({});
	const [hasSelection, setHasSelection] = useState(false);
	// The right-click menu opens at the pointer, on the range under it.
	const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
	const onContextMenu = (e: any) => {
		if (!quill) return;
		e.preventDefault();
		const r = quill.getSelection() || lastRange.current;
		menuRange.current = r;
		setBubble(null);
		setHasSelection(!!r?.length);
		setFormats(r ? quill.getFormat(r) : {});
		setPoint({ x: e.clientX, y: e.clientY });
		setMenuOpen(true);
	};

	const [bubble, setBubble] = useState<{ top: number; left: number } | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [caseRow, setCaseRow] = useState(false);
	useEffect(() => {
		if (!quill) return;
		let down = false;
		const place = () => {
			const r = quill.getSelection();
			if (!r || !r.length || down) {
				setBubble(null);
				setCaseRow(false);
				return;
			}
			setFormats(quill.getFormat(r));
			const b = quill.getBounds(r.index, r.length);
			setBubble({ top: b.top, left: b.left + b.width / 2 });
		};
		const onDown = () => {
			down = true;
			setBubble(null);
		};
		const onUp = () => {
			if (!down) return;
			down = false;
			setTimeout(place, 0);
		};
		const onSel = (_r: any, _o: any, source: string) => source !== 'silent' && !down && place();
		quill.root.addEventListener('mousedown', onDown);
		document.addEventListener('mouseup', onUp);
		quill.on('selection-change', onSel);
		quill.on('text-change', place);
		return () => {
			quill.root.removeEventListener('mousedown', onDown);
			document.removeEventListener('mouseup', onUp);
			quill.off('selection-change', onSel);
			quill.off('text-change', place);
		};
	}, [quill]);

	const inTable = !!formats.table;
	const align = formats.align || '';
	const header = formats.header || 0;

	return (
		<Box
			className={`mint-doc ${cls}`}
			css={{ '--doc-top': `${top}px` }}>
			{/* The toolbar, full width under the header */}
			<Flex
				className='mint-doc-toolbar'
				align='center'
				gap={1}
				px={{ base: 2, md: 4 }}>
				<Box
					ref={slotRef}
					minW={0}
				/>
				<TablePicker onPick={(rows, cols) => table('insertTable', rows, cols)} />
				<Box flex={1} />
				<Menu.Root positioning={{ placement: 'bottom-end' }}>
					<Menu.Trigger asChild>
						<Button
							size='xs'
							variant='ghost'
							color='fg.muted'
							flexShrink={0}
							title='Page size'>
							<FileText size={14} />
							{page.label}
							<ChevronDown size={12} />
						</Button>
					</Menu.Trigger>
					<Portal>
						<Menu.Positioner>
							<Menu.Content minW='220px'>
								<Menu.RadioItemGroup
									value={pageSize}
									onValueChange={e => isPageSize(e.value) && onPageSize(e.value)}>
									<Menu.ItemGroupLabel>Page size</Menu.ItemGroupLabel>
									{PAGE_SIZES.map(p => (
										<Menu.RadioItem
											key={p.value}
											value={p.value}>
											<Text flex={1}>{p.label}</Text>
											<Text
												fontSize='xs'
												color='fg.muted'>
												{p.hint}
											</Text>
											<Menu.ItemIndicator />
										</Menu.RadioItem>
									))}
								</Menu.RadioItemGroup>
							</Menu.Content>
						</Menu.Positioner>
					</Portal>
				</Menu.Root>
			</Flex>

			{/* The desk and the sheet(s) */}
			<Box
				className='mint-doc-desk'
				px={{ base: 2, md: 6 }}
				py={{ base: 3, md: 6 }}>
				<Menu.Root
					open={menuOpen}
					positioning={{ placement: 'bottom-start', fitViewport: true, overflowPadding: 8, gutter: 2 }}
					onOpenChange={e => {
						setMenuOpen(e.open);
						if (!e.open) menuRange.current = null;
					}}>
					<Box
						className={`mint-doc-sheet${paged ? ' is-paged' : ''}`}
						onContextMenu={onContextMenu}
						position='relative'
						mx='auto'
						w={paged ? `${page.w}px` : '100%'}
						maxW={paged ? 'none' : `${page.w}px`}
						css={{ '--doc-m': `${page.m}px`, '--doc-h': `${page.h}px` }}>
						{/* Where the menu hangs from: the pointer. */}
						<Menu.Trigger asChild>
							<Box
								position='fixed'
								left={`${point?.x ?? 0}px`}
								top={`${point?.y ?? 0}px`}
								w='1px'
								h='1px'
								pointerEvents='none'
								tabIndex={-1}
								aria-hidden
							/>
						</Menu.Trigger>
							{/* Paper behind the words */}
							{paged ? (
								Array.from({ length: pages }, (_, i) => (
									<Box
										key={i}
										className='mint-doc-paper'
										position='absolute'
										left={0}
										right={0}
										top={`${i * (page.h + GAP)}px`}
										h={`${page.h}px`}>
										<Text
											position='absolute'
											bottom={`${Math.round(page.m / 2) - 8}px`}
											left={0}
											right={0}
											textAlign='center'
											fontSize='11px'
											color='#8c959f'
											userSelect='none'>
											{pages > 1 ? `${i + 1} / ${pages}` : ''}
										</Text>
									</Box>
								))
							) : (
								<Box
									className='mint-doc-paper'
									position='absolute'
									inset={0}
								/>
							)}
							<Box
								ref={hostRef}
								position='relative'
							/>
							{bubble && !menuOpen && (
								<SelectionBar
									top={bubble.top}
									left={bubble.left}
									formats={formats}
									caseRow={caseRow}
									onCaseRow={() => setCaseRow(v => !v)}
									onToggle={toggle}
									onCase={changeCase}
									onLink={link}
									onClear={() => act((q, r) => q.removeFormat(r.index, r.length, 'user'))}
								/>
							)}
					</Box>
					<Portal>
						<Menu.Positioner>
							<Menu.Content
								minW='250px'
								maxH='var(--available-height, 80vh)'
								overflowY='auto'>
								<Flex
									gap={1}
									px={1}
									pb={1}>
									<IconItem value='bold' label={`Bold ${key('B')}`} on={!!formats.bold} onSelect={() => toggle('bold')}><Bold size={15} /></IconItem>
									<IconItem value='italic' label={`Italic ${key('I')}`} on={!!formats.italic} onSelect={() => toggle('italic')}><Italic size={15} /></IconItem>
									<IconItem value='underline' label={`Underline ${key('U')}`} on={!!formats.underline} onSelect={() => toggle('underline')}><Underline size={15} /></IconItem>
									<IconItem value='strike' label='Strikethrough' on={!!formats.strike} onSelect={() => toggle('strike')}><Strikethrough size={15} /></IconItem>
									<IconItem value='code' label='Inline code' on={!!formats.code} onSelect={() => toggle('code')}><Code size={15} /></IconItem>
								</Flex>
								<Flex
									gap={1}
									px={1}
									pb={1}>
									<IconItem value='align-left' label='Align left' on={!align} onSelect={() => act(q => q.format('align', false, 'user'))}><AlignLeft size={15} /></IconItem>
									<IconItem value='align-center' label='Centre' on={align === 'center'} onSelect={() => setLine('align', 'center')}><AlignCenter size={15} /></IconItem>
									<IconItem value='align-right' label='Align right' on={align === 'right'} onSelect={() => setLine('align', 'right')}><AlignRight size={15} /></IconItem>
									<IconItem value='align-justify' label='Justify' on={align === 'justify'} onSelect={() => setLine('align', 'justify')}><AlignJustify size={15} /></IconItem>
								</Flex>
								<Menu.Separator />
								<Menu.ItemGroup>
									<Menu.ItemGroupLabel>Text</Menu.ItemGroupLabel>
									<Flex
										gap={1}
										px={1}
										pb={1}
										wrap='wrap'>
										{[
											{ v: 0, l: 'Normal' },
											{ v: 2, l: 'H2' },
											{ v: 3, l: 'H3' },
											{ v: 4, l: 'H4' },
										].map(h => (
											<ChipItem
												key={h.v}
												value={`h-${h.v}`}
												on={header === h.v}
												onSelect={() => act(q => q.format('header', h.v || false, 'user'))}>
												{h.l}
											</ChipItem>
										))}
									</Flex>
								</Menu.ItemGroup>
								{hasSelection && (
									<Menu.ItemGroup>
										<Menu.ItemGroupLabel>Change case</Menu.ItemGroupLabel>
										<Flex
											gap={1}
											px={1}
											pb={1}
											wrap='wrap'>
											{CASES.map(c => (
												<ChipItem
													key={c.value}
													value={`case-${c.value}`}
													title={c.label}
													onSelect={() => changeCase(c.value)}>
													{c.label}
												</ChipItem>
											))}
										</Flex>
									</Menu.ItemGroup>
								)}
								<Menu.Separator />
								<RowItem value='bullet' icon={<List size={15} />} on={formats.list === 'bullet'} onSelect={() => setLine('list', 'bullet')}>Bulleted list</RowItem>
								<RowItem value='ordered' icon={<ListOrdered size={15} />} on={formats.list === 'ordered'} onSelect={() => setLine('list', 'ordered')}>Numbered list</RowItem>
								<RowItem value='quote' icon={<Quote size={15} />} on={!!formats.blockquote} onSelect={() => toggle('blockquote')}>Quote</RowItem>
								<RowItem value='code-block' icon={<Code size={15} />} on={!!formats['code-block']} onSelect={() => toggle('code-block')}>Code block</RowItem>
								<Menu.Separator />
								<RowItem value='link' icon={<Link2 size={15} />} shortcut={key('K')} onSelect={link}>{formats.link ? 'Remove link' : 'Link…'}</RowItem>
								<RowItem value='image' icon={<ImageIcon size={15} />} onSelect={() => uploader.onOpen()}>Image…</RowItem>
								{!inTable && <RowItem value='table' icon={<Table2 size={15} />} onSelect={() => table('insertTable', 3, 3)}>Table (3 × 3)</RowItem>}
								{inTable && (
									<Menu.ItemGroup>
										<Menu.ItemGroupLabel>Table</Menu.ItemGroupLabel>
										<RowItem value='row-above' onSelect={() => table('insertRowAbove')}>Insert row above</RowItem>
										<RowItem value='row-below' onSelect={() => table('insertRowBelow')}>Insert row below</RowItem>
										<RowItem value='col-left' onSelect={() => table('insertColumnLeft')}>Insert column left</RowItem>
										<RowItem value='col-right' onSelect={() => table('insertColumnRight')}>Insert column right</RowItem>
										<RowItem value='del-row' onSelect={() => table('deleteRow')}>Delete row</RowItem>
										<RowItem value='del-col' onSelect={() => table('deleteColumn')}>Delete column</RowItem>
										<RowItem value='del-table' danger onSelect={() => table('deleteTable')}>Delete table</RowItem>
									</Menu.ItemGroup>
								)}
								<RowItem value='clear' icon={<Eraser size={15} />} onSelect={() => act((q, r) => (r.length ? q.removeFormat(r.index, r.length, 'user') : q.format('header', false, 'user')))}>
									Clear formatting
								</RowItem>
								<Menu.Separator />
								<RowItem value='cut' icon={<Scissors size={15} />} shortcut={key('X')} disabled={!hasSelection} onSelect={() => clipboard('cut')}>Cut</RowItem>
								<RowItem value='copy' icon={<Copy size={15} />} shortcut={key('C')} disabled={!hasSelection} onSelect={() => clipboard('copy')}>Copy</RowItem>
								<RowItem value='paste' icon={<ClipboardPaste size={15} />} shortcut={key('V')} onSelect={() => clipboard('paste')}>Paste</RowItem>
							</Menu.Content>
						</Menu.Positioner>
					</Portal>
				</Menu.Root>
			</Box>

			<ImageUploader
				handleImage={insertImage}
				isOpen={uploader.open}
				onClose={uploader.onClose}
				onOpen={uploader.onOpen}
			/>
		</Box>
	);
};

/* ------------------------------------------------------------- pieces */

const IconItem: FC<{ value: string; label: string; on?: boolean; onSelect: () => void; children: ReactNode }> = ({ value, label, on, onSelect, children }) => (
	<Menu.Item
		value={value}
		title={label}
		aria-label={label}
		onSelect={onSelect}
		w='auto'
		flex={1}
		justifyContent='center'
		px={0}
		h='32px'
		bg={on ? 'bg.emphasized' : undefined}>
		{children}
	</Menu.Item>
);

const ChipItem: FC<{ value: string; on?: boolean; title?: string; onSelect: () => void; children: ReactNode }> = ({ value, on, title, onSelect, children }) => (
	<Menu.Item
		value={value}
		title={title}
		onSelect={onSelect}
		w='auto'
		flex='0 0 auto'
		px={2}
		py={1}
		h='auto'
		minH='26px'
		fontSize='12px'
		borderWidth='1px'
		borderColor={on ? 'border.emphasized' : 'border'}
		bg={on ? 'bg.emphasized' : undefined}>
		{children}
	</Menu.Item>
);

const RowItem: FC<{ value: string; icon?: ReactNode; on?: boolean; shortcut?: string; danger?: boolean; disabled?: boolean; onSelect: () => void; children: ReactNode }> = ({
	value,
	icon,
	on,
	shortcut,
	danger,
	disabled,
	onSelect,
	children,
}) => (
	<Menu.Item
		value={value}
		disabled={disabled}
		onSelect={onSelect}
		color={danger ? 'fg.error' : undefined}
		fontWeight={on ? '600' : undefined}>
		<Box
			w='16px'
			color={danger ? 'inherit' : 'fg.muted'}
			display='flex'>
			{icon}
		</Box>
		<Text flex={1}>{children}</Text>
		{shortcut && <Menu.ItemCommand>{shortcut}</Menu.ItemCommand>}
	</Menu.Item>
);

/** The little bar over selected words: marks, case, link, clear. */
const SelectionBar: FC<{
	top: number;
	left: number;
	formats: Record<string, any>;
	caseRow: boolean;
	onCaseRow: () => void;
	onToggle: (name: string) => void;
	onCase: (mode: Case) => void;
	onLink: () => void;
	onClear: () => void;
}> = ({ top, left, formats, caseRow, onCaseRow, onToggle, onCase, onLink, onClear }) => {
	// Buttons keep the words selected: no focus moves on press.
	const keep = (e: any) => e.preventDefault();
	const btn = (label: string, on: boolean, onClick: () => void, icon: ReactNode) => (
		<Box
			as='button'
			title={label}
			aria-label={label}
			onMouseDown={keep}
			onClick={onClick}
			display='flex'
			alignItems='center'
			justifyContent='center'
			w='28px'
			h='28px'
			borderRadius='6px'
			color={on ? 'fg' : 'fg.muted'}
			bg={on ? 'bg.emphasized' : 'transparent'}
			_hover={{ bg: 'bg.muted', color: 'fg' }}>
			{icon}
		</Box>
	);
	return (
		<Box
			className='mint-doc-bubble'
			position='absolute'
			zIndex={4}
			top={`${Math.max(0, top - (caseRow ? 80 : 44))}px`}
			left={`${left}px`}
			transform='translateX(-50%)'
			bg='bg.panel'
			borderWidth='1px'
			borderColor='border'
			borderRadius='10px'
			boxShadow='0 6px 20px rgb(0 0 0 / 0.14)'
			p={1}
			onMouseDown={keep}>
			<Flex gap={0.5}>
				{btn('Bold', !!formats.bold, () => onToggle('bold'), <Bold size={15} />)}
				{btn('Italic', !!formats.italic, () => onToggle('italic'), <Italic size={15} />)}
				{btn('Underline', !!formats.underline, () => onToggle('underline'), <Underline size={15} />)}
				{btn('Strikethrough', !!formats.strike, () => onToggle('strike'), <Strikethrough size={15} />)}
				{btn('Link', !!formats.link, onLink, <Link2 size={15} />)}
				{btn('Change case', caseRow, onCaseRow, <CaseSensitive size={16} />)}
				{btn('Clear formatting', false, onClear, <Eraser size={15} />)}
			</Flex>
			{caseRow && (
				<Flex
					gap={0.5}
					pt={1}
					mt={1}
					borderTopWidth='1px'
					borderColor='border'>
					{CASES.map(c => (
						<Box
							key={c.value}
							as='button'
							title={c.label}
							onMouseDown={keep}
							onClick={() => onCase(c.value)}
							px={2}
							h='26px'
							fontSize='12px'
							borderRadius='6px'
							color='fg.muted'
							whiteSpace='nowrap'
							_hover={{ bg: 'bg.muted', color: 'fg' }}>
							{c.label}
						</Box>
					))}
				</Flex>
			)}
		</Box>
	);
};

/** The toolbar's Table button: a grid to pick rows and columns from. */
const TablePicker: FC<{ onPick: (rows: number, cols: number) => void }> = ({ onPick }) => {
	const [hover, setHover] = useState({ r: 0, c: 0 });
	const [open, setOpen] = useState(false);
	const N = 8;
	return (
		<Popover.Root
			open={open}
			onOpenChange={e => setOpen(e.open)}
			positioning={{ placement: 'bottom-start' }}>
			<Popover.Trigger asChild>
				<Button
					size='xs'
					variant='ghost'
					color='fg.muted'
					flexShrink={0}
					title='Insert a table'
					aria-label='Insert a table'>
					<Table2 size={15} />
				</Button>
			</Popover.Trigger>
			<Portal>
				<Popover.Positioner>
					<Popover.Content w='auto'>
						<Popover.Body p={3}>
							<Grid
								templateColumns={`repeat(${N}, 18px)`}
								gap='3px'
								onMouseLeave={() => setHover({ r: 0, c: 0 })}>
								{Array.from({ length: N * N }, (_, i) => {
									const r = Math.floor(i / N) + 1;
									const c = (i % N) + 1;
									const on = r <= hover.r && c <= hover.c;
									return (
										<Box
											key={i}
											as='button'
											aria-label={`${r} × ${c}`}
											w='18px'
											h='18px'
											borderWidth='1px'
											borderRadius='3px'
											borderColor={on ? 'brand.solid' : 'border'}
											bg={on ? 'brand.subtle' : 'transparent'}
											onMouseEnter={() => setHover({ r, c })}
											onFocus={() => setHover({ r, c })}
											onClick={() => {
												setOpen(false);
												onPick(r, c);
											}}
										/>
									);
								})}
							</Grid>
							<Text
								mt={2}
								fontSize='12px'
								color='fg.muted'
								textAlign='center'>
								{hover.r ? `${hover.r} × ${hover.c} table` : 'Pick the size'}
							</Text>
						</Popover.Body>
					</Popover.Content>
				</Popover.Positioner>
			</Portal>
		</Popover.Root>
	);
};

export default DocumentEditor;
