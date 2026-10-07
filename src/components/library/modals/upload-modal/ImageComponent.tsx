import { useRef } from 'react';
import { Box, Center, FlexProps, Image } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { useIsMobile } from '../../hooks';

/**
 * One tile in the upload modal's grids: a square, cropped thumbnail that
 * selects on click. Selected tiles get the accent ring and a check badge, in
 * single- and multi-select alike. Videos play on hover (desktop only).
 */
const ImageComponent = ({
	src,
	type,
	selected,
	thumbnail,
	...props
}: FlexProps & {
	src: string;
	type: string;
	/** A single selected url (single-select mode) or an array of them
	 *  (multi-select mode — see `MyPhotos`/`MyFolders`'s `multiple` prop). */
	selected: any;
	thumbnail?: string;
}) => {
	const videoRef = useRef<any>(null);
	const isMobile = useIsMobile();
	const isSelected = Array.isArray(selected) ? selected.includes(src) : selected === src;
	const order = Array.isArray(selected) ? selected.indexOf(src) + 1 : 0;

	const play = () => {
		if (isMobile || type !== 'video') return;
		videoRef.current?.play();
	};

	const stop = () => {
		if (isMobile || type !== 'video' || !videoRef.current) return;
		videoRef.current.pause();
		videoRef.current.currentTime = 0;
	};

	return (
		<Box
			as='button'
			// @ts-ignore — Box as button
			type='button'
			aria-pressed={isSelected}
			aria-label={src.split('/').pop() || 'Media'}
			position='relative'
			w='full'
			aspectRatio={1}
			borderRadius='lg'
			overflow='hidden'
			bg='bg.muted'
			cursor='pointer'
			borderWidth='1px'
			borderColor='border.muted'
			outline={isSelected ? '2px solid' : '2px solid transparent'}
			outlineColor={isSelected ? 'accent.solid' : 'transparent'}
			outlineOffset='2px'
			transition='outline-color .12s ease, border-color .12s ease'
			_hover={{ borderColor: 'border.emphasized' }}
			_focusVisible={{ outlineColor: 'accent.solid' }}
			css={{ '&:hover img, &:hover video': { transform: 'scale(1.03)' } }}
			onMouseEnter={play}
			onMouseLeave={stop}
			{...(props as any)}>
			{type == 'video' ? (
				<video
					muted
					poster={thumbnail || undefined}
					ref={videoRef}
					playsInline
					loop
					style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .2s ease' }}>
					<source
						src={src}
						type='video/mp4'
					/>
				</video>
			) : (
				<Image
					src={src}
					alt=''
					loading='lazy'
					w='full'
					h='full'
					objectFit='cover'
					transition='transform .2s ease'
				/>
			)}
			{isSelected && (
				<Center
					position='absolute'
					top={1.5}
					right={1.5}
					boxSize='22px'
					borderRadius='full'
					bg='accent.solid'
					color='accent.contrast'
					fontSize='11px'
					fontWeight='700'
					boxShadow='0 0 0 2px var(--chakra-colors-bg-panel)'>
					{order > 0 ? order : <Check size={13} strokeWidth={3} />}
				</Center>
			)}
		</Box>
	);
};

export default ImageComponent;
