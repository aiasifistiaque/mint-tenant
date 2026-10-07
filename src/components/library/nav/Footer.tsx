'use client';

import { FC, Fragment, memo } from 'react';
import Link from 'next/link';
import { Box, Flex, Text } from '@chakra-ui/react';
import { padding } from '../config';
import { IS_TENANT_PANEL } from '../config/lib/constants/panel';

/**
 * The links along the bottom of pages (Layout renders this under the page
 * body, except on table pages; DocsShell and SiteShell too). Next `Link`s,
 * so moving between them is client-side. An empty `href` shows the label
 * without a link; links starting with `http` open in a new tab.
 */
const ADMIN_LINKS: { label: string; href: string }[] = [
	{ label: 'Support', href: '/support' },
	{ label: 'System Status', href: '/system-status' },
	{ label: 'Docs', href: '/docs' },
	{ label: 'Terms of Use', href: '/terms' },
	{ label: 'Report Issue', href: '/report-issue' },
	{ label: 'Privacy Policy', href: '/privacy-policy' },
];

// Support, status and issue reports are the super-admin panel's own pages.
const TENANT_LINKS: { label: string; href: string }[] = [
	{ label: 'Guides', href: '/user-docs' },
	{ label: 'Terms of Use', href: '/terms' },
	{ label: 'Privacy Policy', href: '/privacy-policy' },
];

export const FOOTER_LINKS = IS_TENANT_PANEL ? TENANT_LINKS : ADMIN_LINKS;

const COMPANY = { name: 'MINT', href: 'https://mintapp.shop' };

const PX = { base: padding.BASE, md: padding.MD, lg: padding.LG };

// Smaller on phones, where the links wrap onto two or three lines.
const FONT_SIZE = { base: '11.5px', md: '12.5px' };

const linkCss: any = {
	fontSize: FONT_SIZE,
	color: 'fg',
	whiteSpace: 'nowrap',
	transition: 'color .12s ease',
	_hover: { color: 'fg.muted' },
};

const FooterLink: FC<{ label: string; href: string }> = ({ label, href }) => {
	if (!href) return <Text {...linkCss}>{label}</Text>;
	const external = /^https?:\/\//.test(href);
	return (
		<Link
			href={href}
			{...(external && { target: '_blank', rel: 'noopener noreferrer' })}>
			<Text {...linkCss}>{label}</Text>
		</Link>
	);
};

const Footer = () => (
	<Box
		as='footer'
		flexShrink={0}
		// Pinned to the bottom of the window while the page scrolls under it;
		// the page's own background so nothing shows through.
		position='sticky'
		bottom={0}
		zIndex={2}
		bg='inherit'
		borderTopWidth='1px'
		borderColor='border.muted'
		px={PX}
		// A slim strip: the links are a way out, not a section of the page.
		py={{ base: 2.5, md: 3 }}>
		<Flex
			align='center'
			justify='center'
			wrap='wrap'
			rowGap={{ base: 1, md: 1.5 }}
			columnGap={{ base: 2.5, md: 4 }}>
			{FOOTER_LINKS.map((link, i) => (
				<Fragment key={link.label}>
					{i > 0 && (
						<Box
							aria-hidden
							h={{ base: '10px', md: '12px' }}
							w='1px'
							bg='border'
						/>
					)}
					<FooterLink {...link} />
				</Fragment>
			))}
			<Link
				href={COMPANY.href}
				target='_blank'
				rel='noopener noreferrer'>
				<Text
					fontSize={FONT_SIZE}
					color='fg.muted'
					whiteSpace='nowrap'
					letterSpacing='0.02em'
					ml={{ base: 0, md: 2 }}
					transition='color .12s ease'
					_hover={{ color: 'fg' }}>
					© {new Date().getFullYear()} {COMPANY.name}
				</Text>
			</Link>
		</Flex>
	</Box>
);

export default memo(Footer);
