'use client';

import { FC } from 'react';
import { Center, CenterProps, Text } from '@chakra-ui/react';
import { ImageOff } from 'lucide-react';

type NoImageProps = CenterProps & {
	/** What the box says; small boxes (under 64px) show the icon alone. */
	label?: string;
	/** The box's size in px, when it's square. */
	size?: number;
};

/**
 * Where a picture would be when there isn't one (or it didn't load): a quiet
 * box with a crossed-out picture and "No image", in the theme's colours — not
 * a remote placeholder file, which can itself fail to load.
 */
const NoImage: FC<NoImageProps> = ({ label = 'No image', size, ...props }) => {
	const small = !!size && size < 64;
	return (
		<Center
			flexDirection='column'
			gap={1.5}
			flexShrink={0}
			{...(size && { w: `${size}px`, h: `${size}px` })}
			borderRadius='md'
			borderWidth='1px'
			borderStyle='dashed'
			borderColor='border'
			bg='bg.subtle'
			color='fg.subtle'
			title={label}
			aria-label={label}
			role='img'
			{...props}>
			<ImageOff
				size={small ? 14 : 24}
				strokeWidth={1.5}
			/>
			{!small && (
				<Text
					fontSize='12px'
					color='fg.muted'>
					{label}
				</Text>
			)}
		</Center>
	);
};

export default NoImage;
