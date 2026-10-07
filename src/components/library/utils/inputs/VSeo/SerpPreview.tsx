'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

import { CARD_BG, CARD_BORDER, SITE_URL, TEXT_BODY, TEXT_FAINT, TEXT_MUTED, tone } from './constants';

type Props = {
	title?: string;
	description?: string;
	path?: string;
};

/**
 * An approximation of a Google result, so the admin can see the copy they are
 * writing in the shape a searcher will read it. Deliberately not pixel-exact:
 * its job is to catch truncation and empty fields, not to be a mock.
 */
const SerpPreview: FC<Props> = ({ title, description, path }) => {
	// The server can't know the browser's host: render the fallback first and
	// swap in the real one after mount, or hydration fails on this text.
	const [site, setSite] = useState(process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://example.com');
	useEffect(() => setSite(SITE_URL), []);
	const host = site.replace(/^https?:\/\//, '').replace(/\/+$/, '');
	const crumb = (path || '/').split('/').filter(Boolean).join(' › ');

	const shownTitle = title?.trim() || 'Your meta title will appear here';
	const shownDescription =
		description?.trim() ||
		'Your meta description will appear here. Write 70–160 characters that make someone want to click.';

	return (
		<Box
			borderWidth='1px'
			borderColor={CARD_BORDER.light}
			_dark={{ borderColor: CARD_BORDER.dark, bg: CARD_BG.dark }}
			bg={CARD_BG.light}
			borderRadius='lg'
			p={4}>
			<Text
				fontSize='11px'
				fontWeight='600'
				letterSpacing='wide'
				textTransform='uppercase'
				{...tone(TEXT_FAINT)}
				mb={3}>
				Google preview
			</Text>

			<Flex
				direction='column'
				gap='2px'>
				<Text
					fontSize='12px'
					{...tone(TEXT_MUTED)}
					lineClamp={1}>
					{host}
					{crumb ? ` › ${crumb}` : ''}
				</Text>
				<Text
					fontSize='18px'
					lineHeight='1.3'
					color='#1a0dab'
					_dark={{ color: '#8ab4f8' }}
					lineClamp={1}>
					{shownTitle}
				</Text>
				<Text
					fontSize='13px'
					lineHeight='1.5'
					{...tone(TEXT_BODY)}
					lineClamp={2}>
					{shownDescription}
				</Text>
			</Flex>
		</Box>
	);
};

export default SerpPreview;
