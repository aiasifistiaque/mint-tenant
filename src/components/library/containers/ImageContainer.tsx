import { FC, ReactNode } from 'react';
import { Center, CenterProps, FlexProps, Image } from '@chakra-ui/react';
import { PLACEHOLDER_IMAGE } from '..';

type ImageContainerProps = FlexProps &
	CenterProps & {
		size?: number;
		children?: ReactNode;
		src?: string;
		alt?: string;
		objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
	};

const ImageContainer: FC<ImageContainerProps> = ({
	children,
	objectFit,
	size,
	alt,
	src,

	...props
}) => {
	const boxSize = size || 200;

	const imageComponent = (
		<Image
			src={src || PLACEHOLDER_IMAGE}
			alt={alt || 'image'}
			objectFit={objectFit || 'contain'}
			width='100%'
			height='100%'
			style={{ borderRadius: '2px' }}
		/>
	);

	const innerComponent = src ? imageComponent : children;

	return (
		<Center
			borderRadius='4px'
			h={`${boxSize}px`}
			w={`${boxSize}px`}
			bg='bg.muted'
			_dark={{ bg: 'background.dark' }}
			{...props}>
			{innerComponent}
		</Center>
	);
};

export default ImageContainer;
