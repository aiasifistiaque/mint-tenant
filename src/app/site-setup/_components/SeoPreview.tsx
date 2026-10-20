'use client';

import { FC } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

/**
 * The AGS VSeo's Google preview and character counters (docs/site-builder
 * SB-31) — the builder's page SEO has the whole editor; Site setup's defaults
 * use these two pieces.
 */

export const TITLE = { min: 30, max: 60, hard: 70 };
export const DESCRIPTION = { min: 70, max: 160, hard: 320 };

/** "42 / 60" — green inside Google's window, amber short or near the cut, red past it. */
export const CharCount: FC<{ value?: string; min: number; max: number; hard: number }> = ({ value, min, max, hard }) => {
	const n = value?.length || 0;
	let color = 'fg.subtle';
	let hint = `aim for ${min}–${max}`;
	if (n > 0 && n < min) [color, hint] = ['orange.fg', 'a little short'];
	else if (n >= min && n <= max) [color, hint] = ['green.fg', 'good length'];
	else if (n > max && n <= hard) [color, hint] = ['orange.fg', 'may be truncated'];
	else if (n > hard) [color, hint] = ['red.fg', 'too long, will be cut'];
	return (
		<Flex
			as='span'
			justify='space-between'
			gap={2}
			w='full'
			fontSize='12px'
			lineHeight='1.4'
			color={color}>
			{/* The panel's global CSS sizes a bare span; these follow the help text. */}
			<Box
				as='span'
				fontSize='inherit'
				color='inherit'>
				{hint}
			</Box>
			<Box
				as='span'
				fontSize='inherit'
				color='inherit'>
				{n} / {max}
			</Box>
		</Flex>
	);
};

/** An approximation of a Google result — to catch truncation and empty fields, not a mock. */
export const SerpPreview: FC<{ host: string; title?: string; description?: string; path?: string }> = ({ host, title, description, path = '/' }) => {
	const crumb = path.split('/').filter(Boolean).join(' › ');
	return (
		<Box
			borderWidth='1px'
			borderColor='border.muted'
			borderRadius='lg'
			bg='bg.subtle'
			p={4}>
			<Text
				fontSize='11px'
				fontWeight='600'
				letterSpacing='wide'
				textTransform='uppercase'
				color='fg.subtle'
				mb={3}>
				Google preview
			</Text>
			<Text
				fontSize='12px'
				color='fg.muted'
				truncate>
				{host || 'your-site.com'}
				{crumb ? ` › ${crumb}` : ''}
			</Text>
			<Text
				fontSize='18px'
				lineHeight='1.3'
				color='#1a0dab'
				_dark={{ color: '#8ab4f8' }}
				truncate>
				{title?.trim() || 'Your meta title will appear here'}
			</Text>
			<Text
				fontSize='13px'
				lineHeight='1.5'
				color='fg'
				lineClamp={2}>
				{description?.trim() || 'Your meta description will appear here. Write 70–160 characters that make someone want to click.'}
			</Text>
		</Box>
	);
};
