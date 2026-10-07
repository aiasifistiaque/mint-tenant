'use client';

import { Suspense } from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Flex, Skeleton, Tabs, Text } from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import { Layout, useGetSiteConfigQuery } from '@/components/library';
import { ConsoleTabs } from '@/components/library/cl';
import { API_ORIGIN, pagePath } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { ContactTab, GeneralTab } from './_components/General';
import { SeoTab } from './_components/Seo';
import { ServerSideTab, TrackingTab } from './_components/Tracking';
import { CodeTab } from './_components/Code';
import { DomainsTab, RedirectsTab } from './_components/Lists';
import { CheckTab } from './_components/Check';

/**
 * A website project's settings (WO-34, WO-38) — one page, a tab per concern,
 * never a table: branding and theme, contact and socials, SEO and indexing,
 * tracking tags, server-side tracking, code on every page, redirects and
 * headers, domains, and a check of the live site. All of it is the project's
 * WebsiteSettings (backend siteConfig.function.ts); every card saves on its
 * own, the site reads it from the site API, and track.js adds the tags.
 */

const TABS = [
	{ value: 'general', label: 'General' },
	{ value: 'contact', label: 'Contact & social' },
	{ value: 'seo', label: 'SEO' },
	{ value: 'tracking', label: 'Tracking' },
	{ value: 'server-side', label: 'Server-side' },
	{ value: 'code', label: 'Code' },
	{ value: 'redirects', label: 'Redirects & headers' },
	{ value: 'domains', label: 'Domains' },
	{ value: 'check', label: 'Check the site' },
];

function SiteSetup() {
	const router = useRouter();
	const params = useSearchParams();
	const tab = TABS.some(t => t.value === params.get('tab')) ? String(params.get('tab')) : 'general';
	const { project, can } = useWorkspace();
	const { data: config, isLoading, isError } = useGetSiteConfigQuery();
	const base = project ? `${API_ORIGIN}/public/api/${project.publicSlug}` : '';
	const props = { canBuild: can('build'), canDomains: can('manage-projects'), base };

	const body = () => {
		if (isError) return <Text color='red.fg'>Only website projects have a site setup.</Text>;
		if (isLoading || !config) return <Skeleton h='320px' />;
		const p = { ...props, config };
		switch (tab) {
			case 'general':
				return <GeneralTab {...p} />;
			case 'contact':
				return <ContactTab {...p} />;
			case 'seo':
				return <SeoTab {...p} />;
			case 'tracking':
				return <TrackingTab {...p} />;
			case 'server-side':
				return <ServerSideTab {...p} />;
			case 'code':
				return <CodeTab {...p} />;
			case 'redirects':
				return <RedirectsTab {...p} />;
			case 'domains':
				return <DomainsTab {...p} />;
			case 'check':
				return <CheckTab {...p} />;
		}
		return null;
	};

	return (
		<Layout
			title='Site setup'
			path='site-setup'>
			<Flex
				direction='column'
				gap={4}
				pt={2}
				maxW='960px'>
				<Flex
					align='center'
					justify='space-between'
					gap={3}
					wrap='wrap'>
					<Box>
						<Text
							fontSize='18px'
							fontWeight='600'>
							Site setup
						</Text>
						<Text
							fontSize='12.5px'
							color='fg.muted'>
							Everything your website needs besides its pages — saved card by card, live on the site within a minute.
						</Text>
					</Box>
					<Flex
						gap={3}
						align='center'>
						<GuideLink section='site-setup' />
						<Button
							asChild
							size='xs'
							variant='outline'>
							<NextLink href={pagePath('pages')}>
								Pages
								<ExternalLink size={12} />
							</NextLink>
						</Button>
					</Flex>
				</Flex>
				<ConsoleTabs
					tabs={TABS}
					value={tab}
					onChange={v => router.replace(`?tab=${v}`, { scroll: false })}>
					{TABS.map(t => (
						<Tabs.Content
							key={t.value}
							value={t.value}
							pt={4}>
							{t.value === tab ? body() : null}
						</Tabs.Content>
					))}
				</ConsoleTabs>
			</Flex>
		</Layout>
	);
}

// useSearchParams (the ?tab=) needs a Suspense boundary to prerender.
export default function SiteSetupPage() {
	return (
		<Suspense>
			<SiteSetup />
		</Suspense>
	);
}
