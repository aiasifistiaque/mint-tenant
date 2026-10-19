/**
 * Editing an automation's texts where the cursor is (docs/automations
 * AU-03c): putting a field in at the cursor (or over the selected words),
 * and the email message's marks — **bold**, *italic*, "- " list lines —
 * which the server turns into the email's formatting (`emailBody`).
 */

/** What changed: the new text and where the cursor (or selection) goes. */
export type Edit = { value: string; start: number; end: number };

/** `{{key}}` at [start, end) — over the selection — with a space where it would touch a word. */
export const insertToken = (value: string, start: number, end: number, token: string): Edit => {
	const before = value.slice(0, start);
	const after = value.slice(end);
	const left = before && /[\w}.,!?:;]$/.test(before) ? ' ' : '';
	const right = after && /^[\w{]/.test(after) ? ' ' : '';
	const at = start + left.length + token.length + right.length;
	return { value: `${before}${left}${token}${right}${after}`, start: at, end: at };
};

/**
 * Bold (`**`) or italic (`*`) on the selection: added around it, or taken off
 * when it already has them. With nothing selected, the marks go in with the
 * cursor between them, so what's typed next is bold.
 */
export const toggleMark = (value: string, start: number, end: number, mark: '**' | '*'): Edit => {
	const n = mark.length;
	const sel = value.slice(start, end);
	// The marks just outside the selection (and, for italic, not half of a bold's).
	const boldOnly = n === 1 && value[start - 2] === '*' && value[end + 1] === '*' && value[start - 3] !== '*';
	const outside = value.slice(start - n, start) === mark && value.slice(end, end + n) === mark && !boldOnly;
	if (start !== end && outside) return { value: value.slice(0, start - n) + sel + value.slice(end + n), start: start - n, end: end - n };
	// The marks inside it.
	const inside = sel.length > 2 * n && sel.startsWith(mark) && sel.endsWith(mark) && (n === 2 || !sel.startsWith('**') || sel.startsWith('***'));
	if (inside) {
		const inner = sel.slice(n, -n);
		return { value: value.slice(0, start) + inner + value.slice(end), start, end: start + inner.length };
	}
	// Marks hug the words: spaces selected at either end stay outside them.
	const lead = sel.length - sel.trimStart().length;
	const trail = sel.length - sel.trimEnd().length;
	const s = start + lead;
	const e = Math.max(s, end - trail);
	const word = value.slice(s, e);
	return { value: `${value.slice(0, s)}${mark}${word}${mark}${value.slice(e)}`, start: s + n, end: s + n + word.length };
};

const BULLET = /^\s*[-•]\s+/;

/** "- " at the start of each line the selection touches, or off when they all have it. */
export const toggleList = (value: string, start: number, end: number): Edit => {
	const from = value.lastIndexOf('\n', start - 1) + 1;
	const nl = value.indexOf('\n', Math.max(end - (end > start && value[end - 1] === '\n' ? 1 : 0), start));
	const to = nl === -1 ? value.length : nl;
	const lines = value.slice(from, to).split('\n');
	const off = lines.every(l => BULLET.test(l) || !l.trim());
	const next = lines.map(l => (off ? l.replace(BULLET, '') : l.trim() && !BULLET.test(l) ? `- ${l}` : l)).join('\n');
	return { value: value.slice(0, from) + next + value.slice(to), start: from, end: from + next.length };
};

/** Which marks the selection (or the cursor) sits in — to light up the menu's buttons. */
export const marksAt = (value: string, start: number, end: number) => {
	const line0 = value.lastIndexOf('\n', start - 1) + 1;
	const lineEnd = value.indexOf('\n', end);
	const line = value.slice(line0, lineEnd === -1 ? value.length : lineEnd);
	const inPair = (rx: RegExp) => [...line.matchAll(rx)].some(m => line0 + m.index! <= start && end <= line0 + m.index! + m[0].length);
	const both = inPair(/\*\*\*(?=[^\s*])[^\n]*?[^\s*]\*\*\*/g);
	return { bold: both || inPair(/\*\*(?=\S)[^\n]*?\S\*\*/g), italic: both || inPair(/(?<![*\w])\*(?=[^\s*])[^*\n]*?[^\s*]?\*(?![*\w])/g), list: BULLET.test(line) };
};

/* --------------------------------------------------------------- preview */

const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const BOTH = /\*\*\*(?=[^\s*])([^\n]*?[^\s*])\*\*\*/g;
const BOLD = /\*\*(?=\S)([^\n]*?\S)\*\*/g;
const ITALIC = /(^|[^*\w])\*(?=[^\s*])([^*\n]*?[^\s*])?\*(?![*\w])/g;

/**
 * The message as the email will show it (the server's `formatHtml`), with
 * each field as a grey chip of its name. Everything typed is escaped.
 */
export const previewHtml = (text: string, labelOf: (key: string) => string) => {
	const chips: string[] = [];
	const marked = text.replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)\s*\}\}/g, (_, k) => {
		chips.push(labelOf(k));
		return `${chips.length - 1}`;
	});
	const inline = (line: string) => esc(line).replace(BOTH, '<b><i>$1</i></b>').replace(BOLD, '<b>$1</b>').replace(ITALIC, (m, pre, t) => (t === undefined ? m : `${pre}<i>${t}</i>`));
	const html = marked
		.replace(/\r\n/g, '\n')
		.split(/\n{2,}/)
		.filter(b => b.trim())
		.map(block => {
			const runs: { list: boolean; lines: string[] }[] = [];
			for (const l of block.split('\n')) {
				const list = BULLET.test(l);
				if (runs.length && runs[runs.length - 1].list === list) runs[runs.length - 1].lines.push(l);
				else runs.push({ list, lines: [l] });
			}
			return runs.map(r => (r.list ? `<ul>${r.lines.map(l => `<li>${inline(l.replace(BULLET, ''))}</li>`).join('')}</ul>` : `<p>${r.lines.map(inline).join('<br>')}</p>`)).join('');
		})
		.join('');
	return html.replace(/(\d+)/g, (_, i) => `<span class="mint-chip">${esc(chips[Number(i)] || '')}</span>`);
};
