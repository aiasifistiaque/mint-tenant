'use client';

import { FC, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Flex, Grid, Skeleton, Text } from '@chakra-ui/react';
import { ArrowRight, Copy, KeyRound, Route, Sparkles, UserRound } from 'lucide-react';
import { Layout } from '@/components/library';
import { CopyValue, EmptyState, PageHeader, Panel, StatTile } from '@/components/library/cl';
import { HOME, IS_TENANT_PANEL, pagePath } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { ago } from '@/components/library/modals/CreateModal/CreateModal';
import { useGetApiBuilderOverviewQuery, useGetApiEndpointsQuery } from '@/components/library/store/services/apiBuilderApi';
import { MONO_CAPS } from '@/theme/tones';
import { ApiTabs, MethodBadge, WhoBadge, apiBase, apiHref, publicBase } from './_components/shared';
import GenerateDialog from './_components/GenerateDialog';
import { LogsGlance } from './_components/logs';

/**
 * API → Overview (backend docs/api-builder D11): the project's API at a
 * glance — its address, how many endpoints are on and who can call them,
 * each model's endpoints, what was called lately — and how to start: generate
 * a model's endpoints, then call them from a site, a signed-in customer's
 * browser or a server. The endpoints themselves are on Endpoints; keys on
 * Keys; every endpoint documented on Reference.
 */

const Snippet: FC<{ code: string; label: string }> = ({ code, label }) => {
	const [copied, setCopied] = useState(false);
	return (
		<Box
			position='relative'
			borderWidth='1px'
			borderColor='border'
			borderRadius='md'
			bg='bg.subtle'>
			<Box
				as='pre'
				m={0}
				p={3}
				pr={12}
				fontSize='12px'
				fontFamily='mono'
				whiteSpace='pre-wrap'
				wordBreak='break-all'
				aria-label={label}>
				{code}
			</Box>
			<Button
				position='absolute'
				top={1.5}
				right={1.5}
				size='xs'
				variant='ghost'
				aria-label={`Copy ${label}`}
				onClick={() => {
					navigator.clipboard?.writeText(code);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				}}>
				{copied ? 'Copied' : <Copy size={14} />}
			</Button>
		</Box>
	);
};

const Step: FC<{ n: number; title: string; done?: boolean; children: React.ReactNode }> = ({ n, title, done, children }) => (
	<Flex
		gap={3}
		align='flex-start'>
		<Flex
			flexShrink={0}
			align='center'
			justify='center'
			boxSize='24px'
			borderRadius='full'
			borderWidth='1px'
			borderColor={done ? 'fg' : 'border'}
			bg={done ? 'fg' : 'transparent'}
			color={done ? 'bg' : 'fg.muted'}
			fontSize='11.5px'
			fontFamily='mono'>
			{n}
		</Flex>
		<Box
			flex={1}
			minW={0}>
			<Text
				fontSize='13.5px'
				fontWeight='500'
				textDecoration={done ? 'line-through' : undefined}
				color={done ? 'fg.muted' : 'fg'}>
				{title}
			</Text>
			<Box
				fontSize='12.5px'
				color='fg.muted'
				mt={0.5}>
				{children}
			</Box>
		</Box>
	</Flex>
);

export default function ApiOverviewPage() {
	const { project, can, isLoading: loadingSelf } = useWorkspace();
	const allowed = IS_TENANT_PANEL && can('build');
	const { data, isLoading } = useGetApiBuilderOverviewQuery(undefined, { skip: !allowed || !project });
	const { data: eps } = useGetApiEndpointsQuery(undefined, { skip: !allowed || !project });
	const [generating, setGenerating] = useState<string | null>(null);
	const base = apiBase(project?.publicSlug);
	const origin = publicBase();
	const e = data?.endpoints;
	const firstOpen = eps?.doc.find(x => x.enabled && x.action === 'list' && x.access.who === 'anyone');
	const firstKey = eps?.doc.find(x => x.enabled && x.access.who === 'key');

	return (
		<Layout
			title='API'
			path='public-api'>
			<Flex
				direction='column'
				gap={5}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '#', title: 'API' },
					]}
					title='API'
					meta='Your models’ records for your own website, app or server — at addresses you choose, with rules you set.'
					actions={allowed && <GuideLink section='public-api' />}
				/>
				<ApiTabs />
				{!loadingSelf && !allowed ? (
					<EmptyState
						title='For people who build'
						description='Roles with Build make and change the project’s API.'
					/>
				) : isLoading || !data ? (
					<Skeleton h='240px' />
				) : (
					<>
						<Panel
							title='Address'
							subtitle='Every endpoint is under it.'>
							<CopyValue value={base} />
						</Panel>

						<Grid
							templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }}
							gap={3}>
							<StatTile
								label='Endpoints on'
								value={`${e!.on} of ${e!.total}`}
								hint={e!.custom ? `${e!.custom} custom` : 'none custom yet'}
								href={apiHref('/endpoints')}
							/>
							<StatTile
								label='Calls'
								value={data.calls.toLocaleString()}
								hint='to every endpoint, ever'
								href={apiHref('/logs')}
							/>
							<StatTile
								label='Server keys'
								value={data.keys}
								hint={data.who.key ? `${data.who.key} endpoint${data.who.key === 1 ? '' : 's'} need one` : 'no endpoint needs one'}
								href={apiHref('/keys')}
							/>
							<StatTile
								label='Customers'
								value={data.customers}
								hint={data.who.customer ? `${data.who.customer} endpoint${data.who.customer === 1 ? '' : 's'} for them` : 'signed up on your site'}
								href={pagePath('customers')}
							/>
						</Grid>

						{!!e!.total && <LogsGlance />}

						{!e!.total && (
							<Panel
								title='Start here'
								subtitle='Three steps to a working API.'>
								<Flex
									direction='column'
									gap={4}>
									<Step
										n={1}
										title='Generate a model’s endpoints'>
										List, read one, create, update, delete — at the model’s own address. Pick which, and who can call them.
										<Box mt={2}>
											<Button
												size='xs'
												disabled={!data.models.length}
												onClick={() => setGenerating('')}>
												<Sparkles size={13} />
												Generate from a model
											</Button>
										</Box>
									</Step>
									<Step
										n={2}
										title='Set the rules'>
										Open an endpoint: who can call it, which records it reaches (“status is published”, “their own orders”), which fields
										go in and out.
									</Step>
									<Step
										n={3}
										title='Call it'>
										Try it on its page, then copy the code into your site or app.
									</Step>
								</Flex>
							</Panel>
						)}

						<Panel
							title='By model'
							subtitle='What each model has on the API.'
							flush>
							{data.models.length ? (
								data.models.map(m => (
									<Flex
										key={m.route}
										align='center'
										gap={3}
										px={4}
										py={3}
										borderTopWidth='1px'
										borderColor='border.muted'
										_first={{ borderTopWidth: 0 }}>
										<Box
											flex={1}
											minW={0}>
											<Text
												fontSize='13.5px'
												fontWeight='500'>
												{m.title}
											</Text>
											<Text
												fontSize='12px'
												color='fg.muted'
												fontFamily='mono'
												truncate>
												/{m.route}
											</Text>
										</Box>
										<Text
											fontSize='12.5px'
											color='fg.muted'
											whiteSpace='nowrap'>
											{m.endpoints ? `${m.on} of ${m.endpoints} on` : 'Not on the API'}
										</Text>
										{m.endpoints ? (
											<Button
												size='xs'
												variant='ghost'
												asChild>
												<NextLink href={`${apiHref('/endpoints')}?model=${m.route}`}>
													Endpoints
													<ArrowRight size={13} />
												</NextLink>
											</Button>
										) : (
											<Button
												size='xs'
												variant='outline'
												onClick={() => setGenerating(m.route)}>
												<Sparkles size={13} />
												Generate
											</Button>
										)}
									</Flex>
								))
							) : (
								<Text
									p={4}
									fontSize='13px'
									color='fg.muted'>
									No models yet — build one first; its records are what the API serves.
								</Text>
							)}
						</Panel>

						{data.recent.length > 0 && (
							<Panel
								title='Called lately'
								flush>
								{data.recent.map(x => (
									<NextLink
										key={x._id}
										href={apiHref(`/endpoints/${x._id}`)}>
										<Flex
											align='center'
											gap={3}
											px={4}
											py={2.5}
											borderTopWidth='1px'
											borderColor='border.muted'
											_hover={{ bg: 'bg.subtle' }}>
											<MethodBadge method={x.method} />
											<Text
												flex={1}
												minW={0}
												fontSize='13px'
												fontFamily='mono'
												truncate>
												{x.path}
											</Text>
											<WhoBadge who={x.access.who} />
											<Text
												fontSize='12px'
												color='fg.muted'
												whiteSpace='nowrap'>
												{ago(x.stats.lastCalledAt!)}
											</Text>
										</Flex>
									</NextLink>
								))}
							</Panel>
						)}

						<Panel
							title='Use it'
							subtitle='From a website, a signed-in customer’s browser, or your own server.'
							actions={<GuideLink section='examples' label='More examples' />}>
							<Flex
								direction='column'
								gap={5}>
								<Box>
									<Flex
										align='center'
										gap={2}
										mb={1.5}>
										<Route size={14} />
										<Text {...hCss}>Anyone — from any site</Text>
									</Flex>
									<Snippet
										label='fetch example'
										code={`const res = await fetch('${base}${firstOpen?.path || '/<path>'}?limit=20');\nconst { doc, total } = await res.json();`}
									/>
								</Box>
								<Box>
									<Flex
										align='center'
										gap={2}
										mb={1.5}>
										<UserRound size={14} />
										<Text {...hCss}>Signed-in customers</Text>
									</Flex>
									<Text {...pCss}>
										Drop the sign-in where it should show. Afterwards <code>MintAuth.fetch('&lt;path&gt;')</code> calls the API as the signed-in
										customer.
									</Text>
									<Snippet
										label='sign-in widget snippet'
										code={`<script src="${origin}/public/widget.js" data-project="${project?.publicSlug}" async></script>\n<div data-mint-login></div>`}
									/>
								</Box>
								<Box>
									<Flex
										align='center'
										gap={2}
										mb={1.5}>
										<KeyRound size={14} />
										<Text {...hCss}>Your server, with a key</Text>
									</Flex>
									<Text {...pCss}>Keep the key on the server — in an environment variable, never in a page.</Text>
									<Snippet
										label='server key example'
										code={`curl ${base}${firstKey?.path || '/<path>'} \\\n  -H "Authorization: Bearer $MINT_SERVER_KEY"`}
									/>
								</Box>
								{project?.type === 'website' && (
									<Box>
										<Text
											{...hCss}
											mb={1.5}>
											Analytics
										</Text>
										<Text {...pCss}>
											Add to every page. Visits from {project.domains?.length ? project.domains.join(', ') : 'any site (add your domains to the project)'} are
											counted.
										</Text>
										<Snippet
											label='analytics snippet'
											code={`<script src="${origin}/public/track.js" data-project="${project.publicSlug}" defer></script>`}
										/>
									</Box>
								)}
							</Flex>
						</Panel>
						<Text {...MONO_CAPS} color='fg.subtle'>
							Every endpoint, documented: <NextLink href={apiHref('/reference')}>Reference →</NextLink>
						</Text>
					</>
				)}
			</Flex>
			<GenerateDialog
				open={generating !== null}
				onClose={() => setGenerating(null)}
				models={eps?.models || []}
				endpoints={eps?.doc || []}
				model={generating || undefined}
			/>
		</Layout>
	);
}

const hCss: any = { fontSize: '13px', fontWeight: '600' };
const pCss: any = { fontSize: '12.5px', color: 'fg.muted', mb: 2 };
