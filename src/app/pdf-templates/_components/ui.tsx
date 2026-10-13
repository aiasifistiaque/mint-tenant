'use client';

import { FC } from 'react';
import { Box, Link, Text } from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import { docsPath, projectHref } from '@/components/library/config/lib/constants/panel';

/** The PDF templates guide. Section ids are the anchors below. */
export const GUIDE = docsPath('/docs/pdf-templates');

/** A link into the guide, opened beside the page rather than in place of it. */
export const DocLink: FC<{ section: string; label?: string }> = ({ section, label = 'How this works' }) => (
	<Link
		href={`${GUIDE}#${section}`}
		target='_blank'
		rel='noopener noreferrer'
		display='inline-flex'
		alignItems='center'
		gap={1}
		fontSize='xs'
		color='fg.muted'
		flexShrink={0}
		_hover={{ color: 'fg', textDecoration: 'underline' }}>
		{label}
		<ExternalLink size={11} />
	</Link>
);

/** The list, and one template's designer — inside the project in the tenant panel. */
export const LIST_HREF = () => projectHref('/pdf-templates');
export const designerHref = (id: string) => projectHref(`/pdf-templates/${id}`);

/** Preview (PT-18): the real PDF in its own tab, every field filled with sample data. */
export const previewHref = (id: string) => projectHref(`/pdf-templates/${encodeURIComponent(id)}/preview`);
/** Where the designer leaves its working copy for the preview tab (same origin, so the new tab reads it). */
export const previewDraftKey = (id: string) => `MINT_PDF_PREVIEW_${id}`;
/** Opens the preview — of the saved template, or of `draft` (the designer's unsaved copy). */
export const openPreview = (id: string, draft?: any) => {
	if (draft)
		try {
			localStorage.setItem(previewDraftKey(id), JSON.stringify(draft));
		} catch {
			/* storage full or blocked: the saved copy shows instead */
		}
	window.open(`${previewHref(id)}${draft ? '?draft=1' : ''}`, '_blank');
};

export const ICON = { size: 14, strokeWidth: 1.75 };

/** Why a request failed, in the server's words. */
export const errorOf = (e: any, fallback = 'Something went wrong') => e?.data?.message || e?.error || fallback;

/** A label over its input, with an optional hint under it. */
export const Labeled: FC<{ label: string; hint?: string; children: any }> = ({ label, hint, children }) => (
	<Box>
		<Text
			fontSize='xs'
			fontWeight='500'
			mb={1}>
			{label}
		</Text>
		{children}
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
