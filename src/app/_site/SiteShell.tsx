'use client';

import { FC, ReactNode } from 'react';
import NextLink from 'next/link';
import { Box, Button, Flex, Link, Text } from '@chakra-ui/react';
import { ArrowUpRight } from 'lucide-react';
import Footer from '@/components/library/nav/Footer';
import { HOME, IS_TENANT_PANEL, docsPath } from '@/components/library/config/lib/constants/panel';

/**
 * The frame of the public site pages — Terms of Use, Privacy Policy, System
 * Status: a slim bar, a readable column, the footer. Public, so no admin
 * layout or login; everything navigates with Next Links.
 */

const NAV = [
	{ href: docsPath('/docs'), label: 'Docs' },
	{ href: '/system-status', label: 'System Status' },
];

const SiteShell: FC<{ title: string; lead?: ReactNode; updated?: string; children: ReactNode }> = ({ title, lead, updated, children }) => (
	<Box
		minH='100vh'
		bg='bg'
		display='flex'
		flexDirection='column'>
		<Flex
			as='header'
			position='sticky'
			top={0}
			zIndex={10}
			h='56px'
			align='center'
			gap={4}
			px={{ base: 4, md: 10 }}
			bg='bg'
			borderBottomWidth='1px'
			borderColor='border.muted'>
			<Link
				asChild
				fontWeight='600'
				fontSize='15px'
				letterSpacing='-0.01em'
				color='fg'
				_hover={{ textDecoration: 'none' }}>
				<NextLink href='/'>MINT</NextLink>
			</Link>
			<Flex
				as='nav'
				gap={1}
				flex={1}>
				{NAV.map(n => (
					<Link
						key={n.href}
						asChild
						px={2.5}
						py={1.5}
						borderRadius='md'
						fontSize='13px'
						color='fg.muted'
						_hover={{ color: 'fg', bg: 'bg.muted', textDecoration: 'none' }}>
						<NextLink href={n.href}>{n.label}</NextLink>
					</Link>
				))}
			</Flex>
			<Button
				asChild
				size='xs'
				variant='outline'>
				<NextLink href={HOME}>
					{IS_TENANT_PANEL ? 'Open dashboard' : 'Open admin'}
					<ArrowUpRight size={13} />
				</NextLink>
			</Button>
		</Flex>

		<Box
			as='main'
			flex={1}
			w='full'
			maxW='800px'
			mx='auto'
			px={{ base: 4, md: 10 }}
			py={{ base: 8, md: 14 }}>
			<Text
				as='h1'
				fontSize={{ base: '2xl', md: '3xl' }}
				fontWeight='600'
				letterSpacing='-0.02em'
				mb={lead || updated ? 2 : 8}>
				{title}
			</Text>
			{lead && (
				<Text
					fontSize='md'
					color='fg.muted'
					lineHeight='1.7'
					mb={updated ? 2 : 8}>
					{lead}
				</Text>
			)}
			{updated && (
				<Text
					fontSize='13px'
					color='fg.muted'
					mb={8}>
					Last updated {updated}
				</Text>
			)}
			{children}
		</Box>
		<Footer />
	</Box>
);

/** A heading and its paragraphs, for the legal pages. */
export const Clause: FC<{ id: string; title: string; children: ReactNode }> = ({ id, title, children }) => (
	<Box
		as='section'
		id={id}
		scrollMarginTop='80px'
		mb={8}>
		<Text
			as='h2'
			fontSize='lg'
			fontWeight='600'
			mb={2}>
			{title}
		</Text>
		<Flex
			direction='column'
			gap={3}
			fontSize='sm'
			lineHeight='1.75'
			color='fg'
			css={{ '& ul': { paddingLeft: '1.25rem', listStyle: 'disc' }, '& li': { marginBottom: '0.35rem' } }}>
			{children}
		</Flex>
	</Box>
);

export default SiteShell;
