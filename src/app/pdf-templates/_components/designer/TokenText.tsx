'use client';

import { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Input, Switch, Text, Textarea } from '@chakra-ui/react';
import FieldPicker, { PickerContext, describeToken, fieldMenu } from './FieldPicker';

/**
 * Text that takes fields. Fields show as chips in words — "Saved text ·
 * Invoice terms", not `{{texts.invoice_terms}}` — and a click on one opens the
 * field menu to change it; "Field" puts a new one where the cursor is. The
 * Keys switch shows the raw text instead, to type keys by hand (remembered
 * in this browser).
 */

const TOKEN = /\{\{[^{}]*\}\}/g;
const RAW_KEY = 'mint-pdf-raw-keys';

const readRaw = () => {
	try {
		return localStorage.getItem(RAW_KEY) === '1';
	} catch {
		return false;
	}
};

/** The editor's content back to text: chips are their tokens, line breaks are \n. */
const serialize = (root: HTMLElement): string => {
	let out = '';
	const walk = (node: Node) => {
		for (const n of [...node.childNodes]) {
			if (n.nodeType === Node.TEXT_NODE) out += (n as Text).data;
			else if (n instanceof HTMLElement) {
				if (n.dataset.token) out += n.dataset.token;
				else if (n.tagName === 'BR') out += '\n';
				else {
					// Chrome wraps a new line in a <div> when Enter is pressed.
					if ((n.tagName === 'DIV' || n.tagName === 'P') && out && !out.endsWith('\n')) out += '\n';
					walk(n);
				}
			}
		}
	};
	walk(root);
	return out.replace(/ /g, ' ');
};

const TokenText: FC<{
	label?: string;
	value: string;
	onChange: (v: string) => void;
	ctx: PickerContext;
	multiline?: boolean;
	placeholder?: string;
	inTable?: boolean;
	hint?: string;
}> = ({ label, value, onChange, ctx, multiline, placeholder, inTable, hint }) => {
	const [raw, setRawState] = useState(false);
	useEffect(() => setRawState(readRaw()), []);
	const setRaw = (v: boolean) => {
		setRawState(v);
		try {
			localStorage.setItem(RAW_KEY, v ? '1' : '0');
		} catch {
			/* not remembered */
		}
	};

	const menu = useMemo(() => fieldMenu(ctx, inTable), [ctx, inTable]);
	const editor = useRef<HTMLDivElement>(null);
	const input = useRef<any>(null);
	const emitted = useRef<string | null>(null);
	const range = useRef<Range | null>(null);
	// The chip being changed, and where its menu opens.
	const [chip, setChip] = useState<{ el: HTMLElement; rect: DOMRect } | null>(null);

	const chipFor = (token: string) => {
		const d = describeToken(token, menu);
		const el = document.createElement('span');
		el.contentEditable = 'false';
		el.dataset.token = token;
		el.className = 'pdf-chip';
		el.title = `${token} — click to change`;
		if (!d.known) el.dataset.unknown = '1';
		const group = d.group ? `<span class="pdf-chip-group">${esc(d.group)} ·</span> ` : '';
		const fmt = d.format ? ` <span class="pdf-chip-group">${esc(d.format)}</span>` : '';
		el.innerHTML = `${group}${esc(d.label)}${fmt}`;
		return el;
	};

	/** Builds the editor from the value: text as it is, every token a chip. */
	const render = () => {
		const root = editor.current;
		if (!root) return;
		root.textContent = '';
		const v = value || '';
		let at = 0;
		for (const m of v.matchAll(TOKEN)) {
			if (m.index! > at) root.append(document.createTextNode(v.slice(at, m.index)));
			root.append(chipFor(m[0]));
			at = m.index! + m[0].length;
		}
		if (at < v.length) root.append(document.createTextNode(v.slice(at)));
		emitted.current = v;
	};

	// The value changed from outside (another block selected, undo, the Keys box), or the
	// field names arrived: draw it again — but never under the cursor while typing.
	const labels = useMemo(() => JSON.stringify(menu.map(m => [m.key, (m.children || []).length])), [menu]);
	useLayoutEffect(() => {
		if (raw) return;
		const typing = document.activeElement === editor.current;
		if (value !== emitted.current || !typing) render();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, labels, raw]);

	const emit = () => {
		const root = editor.current;
		if (!root) return;
		const v = serialize(root);
		emitted.current = v;
		if (v !== value) onChange(v);
	};

	const keepRange = () => {
		const sel = window.getSelection();
		if (sel?.rangeCount && editor.current?.contains(sel.anchorNode)) range.current = sel.getRangeAt(0).cloneRange();
	};

	/** Puts a field where the cursor was (or at the end). */
	const insert = (token: string) => {
		if (raw) {
			const el = input.current;
			const v = value || '';
			const start = el?.selectionStart ?? v.length;
			const end = el?.selectionEnd ?? v.length;
			onChange(v.slice(0, start) + token + v.slice(end));
			requestAnimationFrame(() => {
				if (!el) return;
				el.focus();
				el.setSelectionRange(start + token.length, start + token.length);
			});
			return;
		}
		const root = editor.current;
		if (!root) return;
		const node = chipFor(token);
		const r = range.current && root.contains(range.current.startContainer) ? range.current : null;
		if (r) {
			r.deleteContents();
			r.insertNode(node);
		} else root.append(node);
		// The cursor goes after it.
		const after = document.createRange();
		after.setStartAfter(node);
		after.collapse(true);
		range.current = after;
		emit();
		root.focus();
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(after);
	};

	const box = {
		borderWidth: '1px',
		borderColor: 'border',
		borderRadius: 'l2',
		px: 2.5,
		py: 1.5,
		fontSize: '13px',
		lineHeight: '22px',
		minH: multiline ? '76px' : '32px',
		bg: 'bg',
		_focusVisible: { outline: '2px solid', outlineColor: 'colorPalette.focusRing', outlineOffset: '-1px' },
	} as const;

	return (
		<Box>
			<Flex
				align='center'
				justify='space-between'
				gap={2}
				mb={1}
				minH='20px'>
				{label ? (
					<Text
						fontSize='xs'
						fontWeight='500'
						truncate>
						{label}
					</Text>
				) : (
					<span />
				)}
				<Flex
					align='center'
					gap={1}
					flexShrink={0}>
					<Switch.Root
						size='xs'
						checked={raw}
						onCheckedChange={e => setRaw(!!e.checked)}
						title='Show the raw keys — {{…}} — to type them by hand'>
						<Switch.HiddenInput />
						<Switch.Control />
						<Switch.Label
							fontSize='10px'
							color='fg.muted'>
							Keys
						</Switch.Label>
					</Switch.Root>
					<FieldPicker
						ctx={ctx}
						onPick={insert}
						inTable={inTable}
					/>
				</Flex>
			</Flex>
			{raw ? (
				multiline ? (
					<Textarea
						ref={input}
						size='sm'
						rows={3}
						fontFamily='mono'
						fontSize='12px'
						value={value || ''}
						placeholder={placeholder}
						onChange={e => onChange(e.target.value)}
					/>
				) : (
					<Input
						ref={input}
						size='sm'
						fontFamily='mono'
						fontSize='12px'
						value={value || ''}
						placeholder={placeholder}
						onChange={e => onChange(e.target.value)}
					/>
				)
			) : (
				<Box
					ref={editor}
					role='textbox'
					aria-multiline={multiline || undefined}
					aria-label={label || placeholder}
					contentEditable
					suppressContentEditableWarning
					data-placeholder={placeholder}
					{...box}
					whiteSpace={multiline ? 'pre-wrap' : 'nowrap'}
					overflowX={multiline ? undefined : 'auto'}
					css={{
						scrollbarWidth: 'none',
						'&:empty::before': { content: 'attr(data-placeholder)', color: 'var(--chakra-colors-fg-subtle)', pointerEvents: 'none' },
						'& .pdf-chip': {
							display: 'inline-block',
							verticalAlign: 'baseline',
							lineHeight: '18px',
							margin: '0 1px',
							padding: '0 6px',
							borderRadius: '4px',
							fontSize: '12px',
							fontWeight: 500,
							whiteSpace: 'nowrap',
							cursor: 'pointer',
							userSelect: 'none',
							background: 'var(--chakra-colors-blue-subtle)',
							color: 'var(--chakra-colors-blue-fg)',
						},
						'& .pdf-chip:hover': { background: 'var(--chakra-colors-blue-muted)' },
						'& .pdf-chip[data-unknown]': { background: 'var(--chakra-colors-orange-subtle)', color: 'var(--chakra-colors-orange-fg)' },
						// Global span styles would size and colour it apart from its chip.
						'& .pdf-chip-group': { opacity: 0.7, fontWeight: 400, fontSize: 'inherit', color: 'inherit', lineHeight: 'inherit' },
					}}
					onInput={emit}
					onKeyUp={keepRange}
					onMouseUp={keepRange}
					onBlur={() => {
						keepRange();
						// Keys typed by hand ({{…}}) become chips once you leave the box.
						const root = editor.current!;
						if ((serialize(root).match(TOKEN) || []).length !== root.querySelectorAll('.pdf-chip').length) render();
					}}
					onKeyDown={e => {
						if (e.key === 'Enter' && !multiline) e.preventDefault();
					}}
					onPaste={e => {
						// Plain text only — no styles from wherever it was copied.
						e.preventDefault();
						document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
					}}
					onClick={e => {
						const el = (e.target as HTMLElement).closest<HTMLElement>('.pdf-chip');
						if (el) setChip({ el, rect: el.getBoundingClientRect() });
					}}
				/>
			)}
			{chip && (
				<FieldPicker
					ctx={ctx}
					inTable={inTable}
					open
					anchor={chip.rect}
					current={chip.el.dataset.token}
					onOpenChange={o => !o && setChip(null)}
					onPick={token => {
						chip.el.replaceWith(chipFor(token));
						setChip(null);
						emit();
					}}
				/>
			)}
			{hint && (
				<Text
					fontSize='11px'
					color='fg.muted'
					mt={1}>
					{hint}
				</Text>
			)}
		</Box>
	);
};

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export default TokenText;
