// What the panel's Quill editors offer and save (docs/rich-text RT-00). Only
// what a Mint site's text block shows: headings 2–4, bold, italic, underline,
// strike, alignment, lists, quotes, code blocks, links and images. Colours,
// fonts and sizes are left to the site's theme — and pasted ones would be
// invisible in dark mode — so `formats` drops them, pasted or not.

export const FULL_TOOLBAR = [
	[{ header: [2, 3, 4, false] }],
	['bold', 'italic', 'underline', 'strike'],
	[{ align: [] }],
	[{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
	// Inline `code` is kept (in FULL_FORMATS) but has no button: Quill draws it with the code-block icon.
	['blockquote', 'code-block'],
	['link', 'image'],
	['clean'],
];

export const BASIC_TOOLBAR = [['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']];

export const FULL_FORMATS = ['header', 'bold', 'italic', 'underline', 'strike', 'align', 'list', 'indent', 'blockquote', 'code', 'code-block', 'link', 'image'];

export const BASIC_FORMATS = ['bold', 'italic', 'underline', 'link', 'list'];

/**
 * The editor's content as clean HTML: real <ul>/<ol> (nested by indent), <pre>
 * code blocks — not Quill's internal markup (`getHTML()`), which a site's
 * renderer can't read. Empty is ''. Quill 2.0.3 writes every space as &nbsp;.
 * Headings an older record still has (H1, H5, H6) save as the nearest the
 * site shows, and a code block loses the newlines Quill wraps it in.
 */
export const editorHtml = (editor: any): string => {
	if (!editor || editor.getLength() <= 1) return '';
	return editor
		.getSemanticHTML()
		.replace(/&nbsp;/g, ' ')
		.replace(/<(\/?)h1\b/g, '<$1h2')
		.replace(/<(\/?)h[56]\b/g, '<$1h4')
		.replace(/(<pre\b[^>]*>)\n/g, '$1')
		.replace(/\n<\/pre>/g, '</pre>');
};
