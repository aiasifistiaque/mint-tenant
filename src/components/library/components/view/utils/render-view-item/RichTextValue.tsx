import { FC } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { sanitizeRichText } from '../../../../utils/richText';

/**
 * An `editor` / `basic-editor` value on a record page: sanitized to what the
 * site's text block keeps (utils/richText.ts), so nothing in it runs here, and
 * styled in the panel's tokens — Chakra's reset leaves lists without bullets
 * and headings at body size otherwise.
 */
const RichTextValue: FC<{ value: any }> = ({ value }) => {
	const html = sanitizeRichText(value);
	if (!html.replace(/<[^>]*>/g, '').trim() && !/<(img|hr)\b/.test(html)) return <Text fontSize='.95rem'>--</Text>;
	return (
		<Box
			fontSize='.95rem'
			lineHeight='1.6'
			color='fg'
			minW={0}
			overflowWrap='anywhere'
			css={proseCss}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
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
	"& [data-align='center']": { textAlign: 'center' },
	"& [data-align='right']": { textAlign: 'right' },
	"& [data-align='justify']": { textAlign: 'justify' },
	"& [data-align='center'] img": { marginInline: 'auto' },
	"& [data-align='right'] img": { marginInlineStart: 'auto' },
};

export default RichTextValue;
