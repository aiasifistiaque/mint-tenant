'use client';

import { FC, ReactNode, Suspense } from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Flex, Grid, Skeleton, Tabs, Text } from '@chakra-ui/react';
import { Layout } from '@/components/library';
import { ConsoleTabs, CopyValue, EmptyState, PageHeader, Panel } from '@/components/library/cl';
import { API_ORIGIN, HOME, pagePath, projectHref } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import { useProjectKey } from '@/components/library/tenant/useProjectKey';
import GuideLink from '@/components/library/tenant/GuideLink';
import { MONO_CAPS } from '@/theme/tones';
import Snippet from '@/app/public-api/_components/Snippet';
import { FRAMEWORKS, type Filled, type Framework, type Step } from './_components/snippets';
import ConnectionTest from './_components/ConnectionTest';

/**
 * Website setup: how a website connects to this website project — one that's
 * already built (the snippet: analytics + each added page's SEO, docs/site-connect),
 * or one you build yourself in plain HTML, React or Next.js. Its keys and
 * where each one goes, then per kind of site: the settings file, reading the site API, showing
 * a page, analytics (track.js) and SEO (page SEO, robots.txt, sitemap.xml),
 * all filled in with this project's address, key and domain. Nothing is
 * saved here; the settings themselves are on Site setup and API → Keys.
 */

const WHERE: { what: string; where: ReactNode; browser: string }[] = [
	{ what: 'Site API address', where: <>Your settings file: MINT_API · VITE_MINT_API · NEXT_PUBLIC_MINT_API</>, browser: 'Yes' },
	{ what: 'Project key (mint_pk_…)', where: <>Your settings file: MINT_API_KEY · VITE_MINT_API_KEY · NEXT_PUBLIC_MINT_API_KEY</>, browser: 'Yes — it’s publishable' },
	{
		what: 'Server key (mint_sk_…)',
		where: <>Only your server’s settings: MINT_SERVER_KEY — never with VITE_ or NEXT_PUBLIC_, never in a page</>,
		browser: 'Never',
	},
	{ what: 'Google Analytics, Tag Manager, pixels', where: <Go href='/site-setup?tab=tracking'>Site setup → Tracking</Go>, browser: 'Added by the analytics script' },
	{ what: 'Chat, verification and other scripts', where: <Go href='/site-setup?tab=scripts'>Site setup → Add script</Go>, browser: 'Added by the analytics script' },
	{ what: 'Default title, description, share image', where: <Go href='/site-setup?tab=seo'>Site setup → SEO</Go>, browser: '—' },
	{ what: 'Each page’s SEO', where: <Go href={pagePath('seo')}>Website → SEO</Go>, browser: '—' },
	{ what: 'Your site’s domain', where: <Go href='/site-setup?tab=domains'>Site setup → Domains</Go>, browser: '—' },
	{ what: 'Redirects and headers', where: <Go href='/site-setup?tab=redirects'>Site setup → Redirects & headers</Go>, browser: '—' },
];

// projectHref leaves an address that's already in the project (pagePath's) as it is.
function Go({ href, children }: { href: string; children: ReactNode }) {
	return (
		<NextLink
			href={projectHref(href)}
			style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
			{children}
		</NextLink>
	);
}

const StepBlock: FC<{ n: number; step: Step; children?: ReactNode }> = ({ n, step, children }) => (
	<Flex
		id={step.id}
		gap={3}
		align='flex-start'>
		<Flex
			flexShrink={0}
			align='center'
			justify='center'
			boxSize='24px'
			borderRadius='full'
			borderWidth='1px'
			borderColor='border'
			color='fg.muted'
			fontSize='11.5px'
			fontFamily='mono'>
			{n}
		</Flex>
		<Box
			flex={1}
			minW={0}>
			<Text
				fontSize='14px'
				fontWeight='600'>
				{step.title}
			</Text>
			<Text
				fontSize='12.5px'
				color='fg.muted'
				mt={0.5}
				mb={3}>
				{step.lead}
			</Text>
			<Flex
				direction='column'
				gap={3}>
				{step.snippets.map(s => (
					<Box key={s.label}>
						{s.file && (
							<Text
								{...MONO_CAPS}
								fontSize='10.5px'
								color='fg.subtle'
								mb={1}>
								{s.file}
							</Text>
						)}
						<Snippet
							label={s.label}
							code={s.code}
						/>
					</Box>
				))}
			</Flex>
			{children}
			{step.links?.length ? (
				<Flex
					gap={4}
					wrap='wrap'
					mt={step.snippets.length || children ? 3 : 0}
					fontSize='12.5px'>
					{step.links.map(l => (
						<Go
							key={l.href}
							href={l.href}>
							{l.label} →
						</Go>
					))}
				</Flex>
			) : null}
			{step.notes?.length ? (
				<Box
					as='ul'
					mt={3}
					pl={4}
					fontSize='12.5px'
					color='fg.muted'
					display='flex'
					flexDirection='column'
					gap={1}>
					{step.notes.map(note => (
						<li key={note}>{note}</li>
					))}
				</Box>
			) : null}
		</Box>
	</Flex>
);

function WebsiteSetup() {
	const router = useRouter();
	const params = useSearchParams();
	const { project, can, isLoading } = useWorkspace();
	const apiKey = useProjectKey();
	const asked = params.get('fw');
	const fw: Framework = FRAMEWORKS.some(f => f.value === asked) ? (asked as Framework) : 'site';

	const realDomain = (project?.domains || []).find(d => !d.startsWith('localhost')) || '';
	const domain = realDomain || 'www.your-site.com';
	const filled: Filled = { api: `${API_ORIGIN}/public/api`, origin: API_ORIGIN, key: apiKey || 'mint_pk_…', domain };

	const body = () => {
		if (isLoading || !project) return <Skeleton h='320px' />;
		if (project.type !== 'website' && project.type !== 'ecommerce')
			return (
				<EmptyState
					title='For website and store projects'
					description='This page shows how a website connects to a website or store project. An app or API project connects through API → Overview.'
				/>
			);
		if (!can('build'))
			return (
				<EmptyState
					title='For people who build'
					description='Roles with Build see the project’s keys and connect its website.'
				/>
			);
		return (
			<>
				<Panel
					title='Your keys'
					subtitle='The two things every website needs to read this project.'
					actions={<GuideLink section='website-setup-keys' />}>
					<Grid
						templateColumns={{ base: '1fr', md: '160px minmax(0, 1fr)' }}
						gap={3}
						alignItems='center'>
						<Text fontSize='12.5px'>Site API address</Text>
						<CopyValue value={filled.api} />
						<Text fontSize='12.5px'>Project key</Text>
						{apiKey ? <CopyValue value={apiKey} /> : <Skeleton h='20px' />}
					</Grid>
					<Text
						fontSize='12.5px'
						color='fg.muted'
						mt={3}>
						The project key is publishable: it only reads what you’ve published and what your endpoints allow, so it can sit in your
						site’s code. Your own server calling endpoints that need a <strong>server key</strong> makes one on{' '}
						<Go href='/public-api/keys'>API → Keys</Go> — that one stays on the server.
					</Text>
				</Panel>

				<Panel
					title='Connect your site'
					subtitle='Already have a website? Start with Existing website. Building one? Pick what it’s built with — the code below is filled in for this project.'
					actions={<GuideLink section={fw === 'site' ? 'connect-a-website' : 'website-setup'} />}>
					<ConsoleTabs
						tabs={FRAMEWORKS.map(f => ({ value: f.value, label: f.label }))}
						value={fw}
						onChange={v => router.replace(`?fw=${v}`, { scroll: false })}>
						{FRAMEWORKS.map(f => (
							<Tabs.Content
								key={f.value}
								value={f.value}>
								<Text
									fontSize='12.5px'
									color='fg.muted'
									mb={5}>
									{f.about}
								</Text>
								<Flex
									direction='column'
									gap={7}>
									{f.steps(filled).map((step, i) => (
										<StepBlock
											key={step.id}
											n={i + 1}
											step={step}>
											{step.test && <ConnectionTest domain={realDomain} />}
										</StepBlock>
									))}
								</Flex>
							</Tabs.Content>
						))}
					</ConsoleTabs>
				</Panel>

				<Panel
					title='Where each setting goes'
					subtitle='Keys go in your code’s settings; everything else is set here, and reaches the site without a deploy.'
					flush>
					<Box overflowX='auto'>
						<Box
							as='table'
							w='full'
							fontSize='12.5px'
							css={{ '& th, & td': { textAlign: 'left', padding: '10px 16px', borderTop: '1px solid var(--chakra-colors-border)', verticalAlign: 'top' } }}>
							<thead>
								<tr>
									{['Setting', 'Where it goes', 'In the browser?'].map(h => (
										<Box
											as='th'
											key={h}
											{...MONO_CAPS}
											fontSize='10.5px'
											color='fg.subtle'
											fontWeight='500'>
											{h}
										</Box>
									))}
								</tr>
							</thead>
							<tbody>
								{WHERE.map(r => (
									<tr key={r.what}>
										<Box
											as='td'
											fontWeight='500'
											minW='180px'>
											{r.what}
										</Box>
										<Box
											as='td'
											minW='240px'>
											{r.where}
										</Box>
										<Box
											as='td'
											color='fg.muted'
											minW='140px'>
											{r.browser}
										</Box>
									</tr>
								))}
							</tbody>
						</Box>
					</Box>
				</Panel>

				<Panel
					title='Once it’s live'
					subtitle='Two things after the first deploy.'>
					<Box
						as='ol'
						pl={4}
						fontSize='12.5px'
						display='flex'
						flexDirection='column'
						gap={1.5}>
						<li>
							Add the site’s domain on <Go href='/site-setup?tab=domains'>Site setup → Domains</Go> — analytics counts visits only from your
							domains, and the sitemap and share links use it.
						</li>
						<li>
							Run <Go href='/site-setup?tab=check'>Site setup → Check the site</Go>: it opens your live site and says whether the analytics
							script and each tag are on it.
						</li>
					</Box>
				</Panel>
			</>
		);
	};

	return (
		<Layout
			title='Website setup'
			path='website-setup'>
			<Flex
				direction='column'
				gap={5}
				maxW='960px'>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '#', title: 'Website setup' },
					]}
					title='Website setup'
					meta='Connect a website — one you already have, or one you build yourself — to this project’s analytics and SEO.'
				/>
				{body()}
			</Flex>
		</Layout>
	);
}

// useSearchParams (the ?fw=) needs a Suspense boundary to prerender.
export default function WebsiteSetupPage() {
	return (
		<Suspense>
			<WebsiteSetup />
		</Suspense>
	);
}
