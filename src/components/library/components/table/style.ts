import { FlexProps, TextProps } from '@chakra-ui/react';

export const wrapperCss: FlexProps = {
	flexDir: 'column',
	gap: 4,
	pb: 2,
};

export const containerCss: FlexProps = {
	flexDir: { base: 'row', md: 'row' },
	flexWrap: 'wrap',
	gap: 3,
	justify: 'space-between',
	align: { base: 'flex-start', md: 'center' },
	pt: { base: 4, md: 6 },
	pb: { base: 1, md: 2 },
};

// Page titles are the largest type on a table page, so they carry the tighter
// tracking that large text needs to avoid looking spaced out.
export const headingCss: TextProps = {
	// The page's font, or the theme's heading typeface when it has one.
	fontFamily: 'display',
	fontSize: { base: '1.375rem', md: '1.5rem' },
	fontWeight: 'display',
	letterSpacing: '-0.02em',
	lineHeight: '1.25',
	color: 'text.light',
	_dark: { color: 'text.dark' },
};

export const subHeadingCss: TextProps = {
	fontSize: '14px',
	lineHeight: '1.5',
	color: 'fg.muted',
};

export const buttonGroupCss: FlexProps = {
	gap: 2,
	align: 'center',
	justify: 'flex-end',
};
