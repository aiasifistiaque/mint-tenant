'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { Box, Center, Grid, Image, Text } from '@chakra-ui/react';
import type { MediaFile } from '../../../../store/services/mediaApi';
import { fileKind, splitExt } from '../../../../pages/media/utils';
import { KindGlyph } from '../../../../pages/media/fileKinds';

/**
 * A record's documents (`file` / `file-array` fields) on its view page, the
 * way the media manager shows them: each one a tile with its kind's icon and
 * extension, its name underneath, opening in a new tab when clicked. A picture
 * shows itself instead of an icon.
 */

/**
 * A file's readable name from its address: the last part, decoded, without
 * the upload's `<timestamp>_` prefix ("1712345678901_Invoice.pdf" → "Invoice.pdf").
 */
export const documentName = (url: string, i = 0) => {
	let last = String(url || '').split(/[?#]/)[0].split('/').pop() || '';
	try {
		last = decodeURIComponent(last);
	} catch {}
	return last.replace(/^\d{10,}[_-]/, '') || `Document ${i + 1}`;
};

/** Only the address is stored, so a picture is known by its extension. */
const PICTURE = /\.(png|jpe?g|gif|webp|avif|bmp)$/i;

const asFile = (url: string, i: number) => {
	const name = documentName(url, i);
	return { name, type: PICTURE.test(name) ? 'image/*' : '', url } as MediaFile;
};

const Face: FC<{ file: MediaFile }> = ({ file }) => {
	const kind = fileKind(file);
	const [broken, setBroken] = useState(false);
	const ext = splitExt(file.name)[1].slice(1);
	const img = useRef<HTMLImageElement>(null);

	// A picture that failed before the page hydrated never fires onError here.
	useEffect(() => {
		const el = img.current;
		if (el?.complete && el.naturalWidth === 0) el.decode().catch(() => setBroken(true));
	}, []);

	if (kind === 'image' && !broken)
		return (
			<Image
				ref={img}
				src={file.url}
				alt=''
				w='full'
				h='full'
				objectFit='cover'
				onError={() => setBroken(true)}
			/>
		);

	return (
		<Center
			h='full'
			flexDirection='column'
			gap={2}>
			<KindGlyph
				kind={kind}
				size={40}
			/>
			<Text
				fontSize='10px'
				fontWeight='700'
				letterSpacing='0.06em'
				color='fg.muted'
				px={1.5}
				py={0.5}
				borderRadius='sm'
				borderWidth='1px'
				borderColor='border'
				bg='bg.panel'>
				{(ext && ext.length <= 5 ? ext : 'FILE').toUpperCase()}
			</Text>
		</Center>
	);
};

const DocumentTiles: FC<{ urls: string[] }> = ({ urls }) => {
	const files = urls.filter(url => typeof url === 'string' && url && url !== '--').map(asFile);

	if (!files.length)
		return (
			<Text
				fontSize='13px'
				color='fg.muted'>
				No documents
			</Text>
		);

	return (
		<Grid
			w='full'
			templateColumns='repeat(auto-fill, minmax(116px, 1fr))'
			gap={3}>
			{files.map((file, i) => (
				<Box
					asChild
					key={`${file.url}-${i}`}
					display='flex'
					flexDirection='column'
					gap={1.5}
					minW={0}
					borderRadius='md'
					css={{
						'&:hover .doc-face, &:focus-visible .doc-face': { borderColor: 'accent.solid', bg: 'bg.muted' },
						'&:hover .doc-name, &:focus-visible .doc-name': { color: 'fg' },
						'&:focus-visible': { outline: '2px solid', outlineColor: 'accent.focusRing', outlineOffset: '2px' },
					}}>
					<a
						href={file.url}
						target='_blank'
						rel='noopener noreferrer'
						title={`${file.name} — opens in a new tab`}>
						<Box
							className='doc-face'
							h='96px'
							overflow='hidden'
							borderRadius='md'
							borderWidth='1px'
							borderColor='border'
							bg='bg.subtle'
							transition='border-color .15s, background .15s'>
							<Face file={file} />
						</Box>
						<Text
							className='doc-name'
							fontSize='12px'
							lineHeight='1.35'
							color='fg.muted'
							textAlign='center'
							lineClamp={2}
							wordBreak='break-word'
							px={0.5}>
							{file.name}
						</Text>
					</a>
				</Box>
			))}
		</Grid>
	);
};

export default DocumentTiles;
