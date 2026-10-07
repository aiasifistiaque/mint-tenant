'use client';

import { useState } from 'react';
import { Box, Button, Center, Flex, Spinner, Text } from '@chakra-ui/react';
import { ExternalLink, LayoutTemplate } from 'lucide-react';
import { Layout } from '@/components/library';
import { EmptyState } from '@/components/library/cl';
import { BUILDER_URL, GuideLink, openSiteBuilder, useWorkspace } from '@/components/library/tenant';

/**
 * The site builder (backend docs/site-builder) lives on its own address — the
 * mint-builder app, builder.mintapp.shop — with its own full-screen editor.
 * This page (/<project>/site-builder, the sidebar's link) opens it in a new
 * tab, signed in as you: the panel hands the builder your session over
 * postMessage (components/library/tenant/siteBuilder.ts), never in the address.
 */
export default function SiteBuilderPage() {
	const { project, can, isLoading } = useWorkspace();
	const [state, setState] = useState<'idle' | 'opened' | 'blocked'>('idle');
	const isWebsite = project?.type === 'website';

	const open = () => {
		if (!project) return;
		setState(openSiteBuilder(project.publicSlug) ? 'opened' : 'blocked');
	};

	let body: React.ReactNode;
	if (isLoading)
		body = (
			<Center h='full'>
				<Spinner size='sm' />
			</Center>
		);
	else if (!isWebsite)
		body = (
			<EmptyState
				title='Only website projects have a site builder'
				description='Start a website project to build a site visually.'
			/>
		);
	else
		body = (
			<Center
				h='full'
				px={4}
				py={10}>
				<Box
					w='full'
					maxW='520px'
					p={{ base: 6, md: 10 }}
					borderWidth='1px'
					borderRadius='2xl'
					bg='bg.panel'>
					<Flex
						align='center'
						justify='space-between'
						mb={5}>
						<Center
							w='44px'
							h='44px'
							borderRadius='xl'
							bg='bg.muted'>
							<LayoutTemplate size={20} />
						</Center>
						<GuideLink section='start' />
					</Flex>
					<Text
						fontSize='xs'
						fontWeight='600'
						letterSpacing='0.12em'
						textTransform='uppercase'
						color='fg.muted'
						mb={2}>
						{project?.name}
					</Text>
					<Text
						as='h1'
						fontSize='2xl'
						fontWeight='600'
						mb={3}>
						Site builder
					</Text>
					<Text
						color='fg.muted'
						fontSize='sm'
						lineHeight='1.6'
						mb={6}>
						The builder opens full screen in its own tab, already signed in as you. Edit pages on the real site, then publish when you’re ready.
						{!can('build') && ' Your role can look but not change the site.'}
					</Text>
					<Button
						size='md'
						w='full'
						onClick={open}>
						Open the site builder <ExternalLink size={14} />
					</Button>
					{state === 'opened' && (
						<Text
							mt={3}
							fontSize='sm'
							color='fg.muted'>
							Opened in a new tab. Closed it? Open it again here.
						</Text>
					)}
					{state === 'blocked' && (
						<Text
							mt={3}
							fontSize='sm'
							color='red.fg'>
							Your browser blocked the new tab. Allow pop-ups for this site, then try again.
						</Text>
					)}
					<Text
						mt={6}
						fontSize='xs'
						color='fg.subtle'>
						{BUILDER_URL.replace(/^https?:\/\//, '')}
					</Text>
				</Box>
			</Center>
		);

	return (
		<Layout
			title='Site builder'
			path='site-builder'
			fullBleed>
			{body}
		</Layout>
	);
}
