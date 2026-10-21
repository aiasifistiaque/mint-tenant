'use client';

import { FC } from 'react';
import { Box, Flex, Image, Text } from '@chakra-ui/react';

import { CARD_BG, CARD_BORDER, TEXT_BODY, TEXT_FAINT, TEXT_MUTED, TEXT_STRONG, tone } from './constants';

type Props = {
	host: string;
	title?: string;
	description?: string;
	image?: string;
};

/**
 * Roughly how a shared link looks on Facebook, LinkedIn, WhatsApp or X with a
 * large-image card: the share image, the site, the title and the description —
 * what the Open Graph and Twitter tags below put there.
 */
const SocialPreview: FC<Props> = ({ host, title, description, image }) => (
	<Box>
		<Text
			fontSize='11px'
			fontWeight='600'
			letterSpacing='wide'
			textTransform='uppercase'
			{...tone(TEXT_FAINT)}
			mb={2}>
			Share preview
		</Text>
		<Box
			maxW='520px'
			borderWidth='1px'
			borderColor={CARD_BORDER.light}
			_dark={{ borderColor: CARD_BORDER.dark, bg: CARD_BG.dark }}
			bg={CARD_BG.light}
			borderRadius='lg'
			overflow='hidden'>
			{image ? (
				<Image
					src={image}
					alt=''
					w='full'
					aspectRatio={1200 / 630}
					objectFit='cover'
				/>
			) : (
				<Flex
					aspectRatio={1200 / 630}
					align='center'
					justify='center'
					fontSize='12px'
					{...tone(TEXT_FAINT)}>
					No share image — add one below (1200×630)
				</Flex>
			)}
			<Flex
				direction='column'
				gap='2px'
				px={4}
				py={3}>
				<Text
					fontSize='11px'
					textTransform='uppercase'
					{...tone(TEXT_MUTED)}
					lineClamp={1}>
					{host}
				</Text>
				<Text
					fontSize='15px'
					fontWeight='600'
					{...tone(TEXT_STRONG)}
					lineClamp={2}>
					{title?.trim() || 'Your share title will appear here'}
				</Text>
				<Text
					fontSize='13px'
					{...tone(TEXT_BODY)}
					lineClamp={2}>
					{description?.trim() || 'Your share description will appear here.'}
				</Text>
			</Flex>
		</Box>
	</Box>
);

export default SocialPreview;
