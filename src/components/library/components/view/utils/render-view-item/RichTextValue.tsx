'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { Box, Button, Text } from '@chakra-ui/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { sanitizeRichText } from '../../../../utils/richText';

/**
 * An `editor` / `basic-editor` value on a record page: sanitized to what the
 * site's text block keeps (utils/richText.ts), so nothing in it runs here, and
 * styled in the panel's tokens — Chakra's reset leaves lists without bullets
 * and headings at body size otherwise. A long one shows its first 20 lines or
 * so, fading out, with Show more to open it all (and Show less to fold it back).
 */

const LINE = 1.6;
const LINES = 20;
/** Folded height, in the text's own em; a little over it still shows whole. */
const FOLD = LINE * LINES;
const SLACK = LINE * 3;

const RichTextValue: FC<{ value: any }> = ({ value }) => {
	const html = sanitizeRichText(value);
	const ref = useRef<HTMLDivElement>(null);
	const [long, setLong] = useState(false);
	const [open, setOpen] = useState(false);

	// Measured, and again as images load or the panel's width changes.
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const measure = () => {
			const em = parseFloat(getComputedStyle(el).fontSize) || 15;
			setLong(el.scrollHeight > (FOLD + SLACK) * em);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		Array.from(el.children).forEach(c => observer.observe(c));
		el.addEventListener('load', measure, true);
		return () => {
			observer.disconnect();
			el.removeEventListener('load', measure, true);
		};
	}, [html]);

	if (!html.replace(/<[^>]*>/g, '').trim() && !/<(img|hr)\b/.test(html)) return <Text fontSize='.95rem'>--</Text>;
	const folded = long && !open;
	return (
		<Box minW={0}>
			<Box
				ref={ref}
				fontSize='.95rem'
				lineHeight={String(LINE)}
				color='fg'
				minW={0}
				overflowWrap='anywhere'
				css={proseCss}
				{...(folded && {
					maxH: `${FOLD}em`,
					overflow: 'hidden',
					style: { maskImage: 'linear-gradient(to bottom, #000 75%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, #000 75%, transparent)' },
				})}
				dangerouslySetInnerHTML={{ __html: html }}
			/>
			{long && (
				<Button
					size='xs'
					variant='ghost'
					mt={2}
					ml='-2'
					aria-expanded={open}
					onClick={() => {
						setOpen(!open);
						// Folding back from far down brings the field back into view.
						if (open) window.setTimeout(() => ref.current?.scrollIntoView({ block: 'nearest' }));
					}}>
					{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
					{open ? 'Show less' : 'Show more'}
				</Button>
			)}
		</Box>
	);
};

const proseCss = {
	'& > * + *': { marginTop: '0.7em' },
	// As typed: the panel's own headings are uppercase (theme globalCss), a post's aren't.
	'& :is(h2, h3, h4)': { fontWeight: '500', lineHeight: '1.3', marginTop: '1em', textTransform: 'none', letterSpacing: 'normal' },
	'& h2': { fontSize: '1.35em' },
	'& h3': { fontSize: '1.2em' },
	'& h4': { fontSize: '1.05em' },
	'& a': { color: 'accent.fg', textDecoration: 'underline', textUnderlineOffset: '3px' },
	'& ul': { listStyleType: 'disc', paddingInlineStart: '1.25em' },
	'& ol': { listStyleType: 'decimal', paddingInlineStart: '1.25em' },
	'& ul ul': { listStyleType: 'circle' },
	'& ol ol': { listStyleType: 'lower-alpha' },
	'& :is(ul, ol) :is(ul, ol)': { marginTop: '0.25em' },
	'& li + li': { marginTop: '0.25em' },
	'& u': { textDecoration: 'underline' },
	'& s': { textDecoration: 'line-through' },
	'& blockquote': { borderInlineStartWidth: '3px', borderColor: 'border', paddingInlineStart: '0.9em', color: 'fg.muted' },
	'& code': { fontFamily: 'mono', fontSize: '0.88em', bg: 'bg.muted', px: '0.35em', py: '0.1em', borderRadius: '4px' },
	'& pre': { fontFamily: 'mono', fontSize: '0.88em', bg: 'bg.muted', p: '0.8em 1em', borderRadius: '8px', overflowX: 'auto', whiteSpace: 'pre' },
	'& pre code': { bg: 'transparent', p: 0 },
	'& hr': { borderTopWidth: '1px', borderColor: 'border', marginBlock: '1.2em' },
	'& img': { display: 'block', maxWidth: '100%', height: 'auto', borderRadius: '8px' },
	'& table': { display: 'block', maxWidth: '100%', overflowX: 'auto', borderCollapse: 'collapse' },
	'& :is(th, td)': { borderWidth: '1px', borderColor: 'border', px: '0.6em', py: '0.35em', verticalAlign: 'top', textAlign: 'left', minWidth: '5em' },
	'& th': { fontWeight: '600', bg: 'bg.muted' },
	// An empty cell keeps its row's height.
	'& :is(th, td):empty::after': { content: '"\\00a0"' },
	"& [data-align='center']": { textAlign: 'center' },
	"& [data-align='right']": { textAlign: 'right' },
	"& [data-align='justify']": { textAlign: 'justify' },
	"& [data-align='center'] img": { marginInline: 'auto' },
	"& [data-align='right'] img": { marginInlineStart: 'auto' },
};

export default RichTextValue;
