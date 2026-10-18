'use client';

import { FC } from 'react';
import NextLink from 'next/link';
import { Button } from '@chakra-ui/react';
import { FilePenLine } from 'lucide-react';
import { writePath } from '../config/lib/constants/panel';

/** "Open editor" on a rich-text field's panel: the field in the full-page editor (RichTextEditorPage). */
const OpenEditorButton: FC<{ route: string; id?: string; field: string }> = ({ route, id, field }) => {
	if (!route || !id || !field) return null;
	return (
		<Button
			asChild
			size='xs'
			variant='ghost'
			color='fg.muted'>
			<NextLink href={writePath(route, id, field)}>
				<FilePenLine size={14} />
				Open editor
			</NextLink>
		</Button>
	);
};

export default OpenEditorButton;
