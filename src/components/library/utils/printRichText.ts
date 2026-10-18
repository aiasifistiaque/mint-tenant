import { sanitizeRichText } from './richText';

/**
 * Printing a rich-text field as the full-page editor shows it: black words on
 * white paper, nothing of the panel around them. The cleaned HTML
 * (richText.ts) goes into a hidden frame with its own print styles — the
 * editor's page size as the paper (`@page`), Infinite on the printer's own —
 * and that frame prints. Its title names the file when "Save as PDF" is picked.
 */

const PAPER: Record<string, { size: string; margin: string }> = {
	infinite: { size: 'auto', margin: '0.75in' },
	a4: { size: 'A4', margin: '1in' },
	letter: { size: 'letter', margin: '1in' },
	legal: { size: 'legal', margin: '1in' },
	a5: { size: 'A5', margin: '0.67in' },
};

const escape = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const css = (size: string, margin: string) => `
@page { size: ${size}; margin: ${margin}; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; }
body {
	color: #1f2328;
	font: 11pt/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	overflow-wrap: anywhere;
	-webkit-print-color-adjust: exact;
	print-color-adjust: exact;
}
body > :first-child { margin-top: 0; }
p { margin: 0; }
h2, h3, h4 { font-weight: 600; line-height: 1.3; margin: 0.9em 0 0.35em; break-after: avoid; }
h2 { font-size: 1.75em; }
h3 { font-size: 1.4em; }
h4 { font-size: 1.15em; }
a { color: #0b5fcc; text-decoration: underline; }
ul, ol { margin: 0; padding-left: 1.5em; }
ul ul { list-style-type: circle; }
ol ol { list-style-type: lower-alpha; }
blockquote { border-left: 3px solid #d0d7de; color: #59636e; margin: 6px 0; padding-left: 12px; }
code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.88em; background: #f3f4f6; padding: 0.1em 0.35em; border-radius: 4px; }
pre { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.88em; background: #f3f4f6; padding: 10px 14px; border-radius: 6px; white-space: pre-wrap; }
pre code { background: none; padding: 0; }
hr { border: 0; border-top: 1px solid #d0d7de; margin: 1.2em 0; }
img { display: block; max-width: 100%; height: auto; break-inside: avoid; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; margin: 8px 0; }
th, td { border: 1px solid #c9d1d9; padding: 6px 8px; vertical-align: top; text-align: left; }
th { font-weight: 600; background: #f3f4f6; }
tr { break-inside: avoid; }
:is(th, td):empty::after { content: '\\00a0'; }
[data-align='center'], .ql-align-center { text-align: center; }
[data-align='right'], .ql-align-right { text-align: right; }
[data-align='justify'], .ql-align-justify { text-align: justify; }
[data-align='center'] img { margin-inline: auto; }
[data-align='right'] img { margin-inline-start: auto; }
`;

/** Prints the field's words on the given paper (an editor PageSize). */
export const printRichText = ({ html, title, pageSize = 'infinite' }: { html: unknown; title: string; pageSize?: string }) => {
	const paper = PAPER[pageSize] || PAPER.infinite;
	const frame = document.createElement('iframe');
	frame.setAttribute('aria-hidden', 'true');
	// Off screen but full size: some browsers print a zero-size or hidden frame blank.
	frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:600px;border:0';
	document.body.appendChild(frame);
	const win = frame.contentWindow;
	const doc = frame.contentDocument;
	if (!win || !doc) return frame.remove();
	doc.open();
	doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>${css(paper.size, paper.margin)}</style></head><body>${sanitizeRichText(html)}</body></html>`);
	doc.close();

	// The frame goes once the print dialog closes, or after a minute at the latest.
	let gone = false;
	const remove = () => {
		if (gone) return;
		gone = true;
		window.setTimeout(() => frame.remove(), 500);
	};
	win.addEventListener('afterprint', remove);
	window.setTimeout(remove, 60_000);

	// Images print once they've loaded (a broken one doesn't hold it up).
	const images = Array.from(doc.images).filter(img => !img.complete);
	Promise.all(images.map(img => new Promise(done => ((img.onload = done), (img.onerror = done))))).then(() => {
		win.focus();
		win.print();
	});
};
