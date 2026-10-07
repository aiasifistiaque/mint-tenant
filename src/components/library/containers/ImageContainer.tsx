'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { Center, CenterProps, FlexProps, Image } from '@chakra-ui/react';
import { PLACEHOLDER_IMAGE } from '..';
import NoImage from './NoImage';

type ImageContainerProps = FlexProps &
	CenterProps & {
		size?: number;
		children?: ReactNode;
		src?: string;
		alt?: string;
		objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
	};

/**
 * A picture in a box of `size` px. With no picture (no `src`, or the
 * placeholder callers pass for one) it shows its children, or a "No image"
 * box; a picture that fails to load shows "Image not found" instead of the
 * browser's broken-image icon.
 */
const ImageContainer: FC<ImageContainerProps> = ({ children, objectFit, size, alt, src, ...props }) => {
	const boxSize = size || 200;
	const [failed, setFailed] = useState(false);
	const img = useRef<HTMLImageElement>(null);
	// A picture that failed before React was listening (server-rendered, or
	// cached) never fires onError: check it once it's on the page.
	useEffect(() => {
		setFailed(false);
		const el = img.current;
		// naturalWidth is 0 for a broken picture, and also for an SVG without a
		// size — decode() tells them apart (it rejects only for a broken one).
		if (el?.complete && el.naturalWidth === 0) el.decode().catch(() => setFailed(true));
	}, [src]);
	const missing = !src || src === PLACEHOLDER_IMAGE;

	if ((missing && !children) || failed)
		return (
			<NoImage
				label={failed ? 'Image not found' : 'No image'}
				size={boxSize}
				{...props}
			/>
		);

	return (
		<Center
			borderRadius='4px'
			h={`${boxSize}px`}
			w={`${boxSize}px`}
			bg='bg.muted'
			_dark={{ bg: 'background.dark' }}
			{...props}>
			{missing ? (
				children
			) : (
				<Image
					ref={img}
					src={src}
					alt={alt || 'image'}
					objectFit={objectFit || 'contain'}
					width='100%'
					height='100%'
					style={{ borderRadius: '2px' }}
					onError={() => setFailed(true)}
				/>
			)}
		</Center>
	);
};

export default ImageContainer;
