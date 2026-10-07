'use client';

import { FC } from 'react';
import { Box } from '@chakra-ui/react';
import {
	File as FileIcon,
	FileArchive,
	FileCode,
	FileMusic,
	FileSpreadsheet,
	FileText,
	Film,
	Image as ImageIcon,
	Presentation,
} from 'lucide-react';
import type { FileKind } from './utils';

/**
 * Each kind's icon and the hue that tells them apart at a glance (text stays
 * neutral). The media manager's tiles and a view page's document tiles both
 * draw from this, so a PDF looks the same in either place.
 */
export const KIND: Record<FileKind, { icon: any; color: string; dark: string }> = {
	image: { icon: ImageIcon, color: 'fg.muted', dark: 'fg.muted' },
	video: { icon: Film, color: 'purple.600', dark: 'purple.300' },
	pdf: { icon: FileText, color: 'red.600', dark: 'red.300' },
	doc: { icon: FileText, color: 'blue.600', dark: 'blue.300' },
	sheet: { icon: FileSpreadsheet, color: 'green.600', dark: 'green.300' },
	slides: { icon: Presentation, color: 'orange.600', dark: 'orange.300' },
	archive: { icon: FileArchive, color: 'yellow.700', dark: 'yellow.300' },
	audio: { icon: FileMusic, color: 'pink.600', dark: 'pink.300' },
	code: { icon: FileCode, color: 'teal.600', dark: 'teal.300' },
	text: { icon: FileText, color: 'fg.muted', dark: 'fg.muted' },
	file: { icon: FileIcon, color: 'fg.muted', dark: 'fg.muted' },
};

/** A kind's icon in its colour. */
export const KindGlyph: FC<{ kind: FileKind; size?: number }> = ({ kind, size = 16 }) => {
	const k = KIND[kind];
	return (
		<Box
			as='span'
			display='inline-flex'
			color={k.color}
			_dark={{ color: k.dark }}>
			<k.icon
				size={size}
				strokeWidth={1.75}
			/>
		</Box>
	);
};
