'use client';

import { FC, useMemo } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, Center, Flex, Grid, Image, Link, Skeleton, Text } from '@chakra-ui/react';
import { Check, Circle, ExternalLink, Globe } from 'lucide-react';
import { useGetAnalyticsSeriesQuery, useGetAnalyticsSummaryQuery, useGetSiteOverviewQuery } from '../store';
import { CopyValue, Panel, StatTile } from '../cl';
import { LineChart } from '../dashboard/charts';
import { pagePath, projectHref } from '../config/lib/constants/panel';
import GuideLink from './GuideLink';
import type { TenantProject } from '../store/services/tenantApi';
import { useWorkspace } from './useWorkspace';
import { openSiteBuilder } from './siteBuilder';

/**
 * A website project's home (WO-34): how the site is doing (the last 30 days
 * of its analytics), what's left to set up, and its pages — above whatever
 * widgets the dashboard builder adds. Data: GET /site-overview and /analytics.
 */

const DAY = 24 * 60 * 60 * 1000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const number = (v: number) => v.toLocaleString();
const change = (now: number, before: number) => {
	if (!before) return now ? 'New this period' : 'No visits yet';
	const pct = Math.round(((now - before) / before) * 100);
	return `${pct > 0 ? '+' : ''}${pct}% vs previous 30 days`;
};

/** Where each checklist item is fixed. */
const FIX: Record<string, string> = {
	name: '/site-setup',
	logo: '/site-setup',
	favicon: '/site-setup',
	seo: '/site-setup?tab=seo',
	domain: '/site-setup?tab=domains',
	tracking: '/site-setup?tab=tracking',
};

const Traffic: FC = () => {
	const range = useMemo(() => ({ from: iso(new Date(Date.now() - 29 * DAY)), to: iso(new Date()) }), []);
	const { data: summary, isLoading } = useGetAnalyticsSummaryQuery(range);
	const { data: series, isLoading: loadingSeries } = useGetAnalyticsSeriesQuery(range);
	const tiles = [
		{ key: 'pageviews', label: 'Page views', format: number },
		{ key: 'visitors', label: 'Visitors', format: number },
		{ key: 'sessions', label: 'Visits', format: number },
		{ key: 'bounceRate', label: 'Bounce rate', format: (v: number) => `${v}%` },
	] as const;
	return (
		<Panel
			title='Traffic'
			subtitle='The last 30 days'
			actions={
				<Button
					asChild
					size='xs'
					variant='outline'>
					<NextLink href={projectHref('/analytics')}>Analytics</NextLink>
				</Button>
			}>
			<Grid
				templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
				gap={3}
				mb={4}>
				{tiles.map(t => (
					<StatTile
						key={t.key}
						label={t.label}
						isLoading={isLoading}
						value={summary ? t.format((summary.current as any)[t.key]) : '—'}
						hint={summary ? change((summary.current as any)[t.key], (summary.previous as any)[t.key]) : undefined}
					/>
				))}
			</Grid>
			{loadingSeries ? (
				<Skeleton h='160px' />
			) : (
				<LineChart
					title='Page views'
					interval='day'
					format={number}
					height={160}
					points={(series?.days || []).map(d => ({ key: d.date, value: d.pageviews }))}
				/>
			)}
		</Panel>
	);
};

/** The template's starter code (docs/templates T-10): the repository, a deploy button and the settings, filled for this project. */
const StarterCode: FC<{ starter: NonNullable<TenantProject['starter']> }> = ({ starter }) => {
	const env = (starter.env || []).map(e => `${e.key}=${e.value}`).join('\n');
	return (
		<Panel
			title='Starter code'
			subtitle={`The code your site starts from${starter.framework ? ` — ${starter.framework}` : ''}`}
			actions={<GuideLink section='starter-code' />}>
			<Flex
				direction='column'
				gap={3}>
				<Flex
					gap={2}
					wrap='wrap'>
					<Button
						asChild
						size='xs'
						variant='outline'>
						<Link
							href={starter.repoUrl}
							target='_blank'
							rel='noreferrer'>
							The repository <ExternalLink size={12} />
						</Link>
					</Button>
					{starter.deployUrl && (
						<Button
							asChild
							size='xs'>
							<Link
								href={starter.deployUrl}
								target='_blank'
								rel='noreferrer'>
								Deploy it <ExternalLink size={12} />
							</Link>
						</Button>
					)}
				</Flex>
				{env && (
					<Box>
						<Text
							fontSize='12px'
							color='fg.muted'
							mb={1}>
							Its settings (environment variables) — already filled in for this project:
						</Text>
						<Flex
							direction='column'
							gap={1}>
							{(starter.env || []).map(e => (
								<CopyValue
									key={e.key}
									value={`${e.key}=${e.value}`}
								/>
							))}
						</Flex>
					</Box>
				)}
			</Flex>
		</Panel>
	);
};

const WebsiteOverview: FC = () => {
	const { project, can } = useWorkspace();
	const { data, isLoading } = useGetSiteOverviewQuery();
	if (isLoading || !data) return <Skeleton h='240px' />;
	const name = data.settings?.siteName || project?.name || 'Your website';
	const todo = data.checklist.filter(c => !c.done);
	const live = data.origin || (data.domains[0] ? `https://${data.domains[0]}` : '');

	return (
		<Flex
			direction='column'
			gap={4}
			pt={2}>
			<Flex
				align='center'
				gap={3}
				wrap='wrap'>
				<Center
					boxSize='44px'
					borderRadius='md'
					borderWidth='1px'
					borderColor='border.muted'
					bg='bg.subtle'
					overflow='hidden'
					flexShrink={0}>
					{data.settings?.favicon || data.settings?.logo ? (
						<Image
							src={data.settings.favicon || data.settings.logo}
							alt=''
							boxSize='32px'
							objectFit='contain'
						/>
					) : (
						<Globe size={20} />
					)}
				</Center>
				<Box flex={1}>
					<Text
						fontSize='18px'
						fontWeight='600'>
						{name}
					</Text>
					<Text
						fontSize='12.5px'
						color='fg.muted'>
						{data.domains.length ? data.domains.join(' · ') : 'No domain yet'} · {data.counts.published} of {data.counts.total} pages published
					</Text>
				</Box>
				<Flex
					gap={2}
					align='center'>
					<GuideLink section='site-overview' />
					{live && (
						<Button
							asChild
							size='xs'
							variant='outline'>
							<Link
								href={live}
								target='_blank'
								rel='noreferrer'>
								Open site
								<ExternalLink size={12} />
							</Link>
						</Button>
					)}
					{can('build') && (
						<Button
							asChild
							size='xs'
							variant='outline'>
							<NextLink href={projectHref('/site-setup')}>Site setup</NextLink>
						</Button>
					)}
					{can('build') && (
						<Button
							asChild
							size='xs'>
							<NextLink
								href={projectHref('/site-builder')}
								onClick={e => {
									// The builder opens in its own tab, signed in; a blocked tab falls back to the launcher page.
									if (project && openSiteBuilder(project.publicSlug)) e.preventDefault();
								}}>
								Edit site
								<ExternalLink size={12} />
							</NextLink>
						</Button>
					)}
				</Flex>
			</Flex>

			<Grid
				templateColumns={{ base: '1fr', lg: todo.length ? '2fr 1fr' : '1fr' }}
				gap={4}
				alignItems='start'>
				{can('view-analytics') ? <Traffic /> : <Box />}
				{todo.length > 0 && (
					<Panel
						title='Set up'
						subtitle={`${data.checklist.length - todo.length} of ${data.checklist.length} done`}>
						<Flex
							direction='column'
							gap={1}>
							{data.checklist.map(c => {
								const href = c.key === 'pages' ? pagePath('pages') : c.key === 'page-seo' ? pagePath('seo') : projectHref(FIX[c.key] || '/site-setup');
								return (
									<Flex
										key={c.key}
										align='center'
										gap={2}
										py={1}
										fontSize='13px'
										color={c.done ? 'fg.muted' : 'fg'}>
										<Box color={c.done ? 'green.fg' : 'fg.subtle'}>{c.done ? <Check size={14} /> : <Circle size={14} />}</Box>
										<Text
											flex={1}
											textDecoration={c.done ? 'line-through' : undefined}>
											{c.label}
										</Text>
										{!c.done && (
											<Link
												asChild
												fontSize='12px'
												color='fg.muted'
												_hover={{ color: 'fg' }}>
												<NextLink href={href}>Set</NextLink>
											</Link>
										)}
									</Flex>
								);
							})}
						</Flex>
					</Panel>
				)}
			</Grid>

			{project?.starter?.repoUrl && <StarterCode starter={project.starter} />}

			<Panel
				title='Pages'
				subtitle='What your site serves, with its SEO and content blocks.'
				flush
				actions={
					<Button
						asChild
						size='xs'
						variant='outline'>
						<NextLink href={pagePath('pages')}>All pages</NextLink>
					</Button>
				}>
				{data.pages.length ? (
					data.pages.slice(0, 12).map(p => (
						<Flex
							key={p._id}
							asChild
							align='center'
							gap={3}
							px={4}
							py={2.5}
							borderTopWidth='1px'
							borderColor='border.muted'
							_hover={{ bg: 'bg.subtle' }}
							fontSize='13px'>
							<NextLink href={pagePath(`pages/${p._id}`)}>
								<Text
									fontFamily='mono'
									fontSize='12.5px'
									minW='120px'>
									{p.path}
								</Text>
								<Text
									flex={1}
									truncate>
									{p.name}
								</Text>
								<Text
									fontSize='12px'
									color='fg.muted'
									display={{ base: 'none', md: 'block' }}>
									{p.contents} block{p.contents === 1 ? '' : 's'}
								</Text>
								<Badge
									size='sm'
									variant='subtle'
									colorPalette={p.seo ? 'green' : 'orange'}>
									{p.seo ? 'SEO' : 'No SEO'}
								</Badge>
								<Badge
									size='sm'
									variant='subtle'
									colorPalette={p.status === 'published' ? 'green' : 'gray'}>
									{p.status}
								</Badge>
							</NextLink>
						</Flex>
					))
				) : (
					<Text
						px={4}
						pb={4}
						fontSize='13px'
						color='fg.muted'>
						No pages yet — add one in Pages, or let your AI build the site (Connect AI).
					</Text>
				)}
			</Panel>
		</Flex>
	);
};

export default WebsiteOverview;
