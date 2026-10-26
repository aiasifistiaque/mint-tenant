'use client';

import { FC } from 'react';
import NextLink from 'next/link';
import { Box, Button, Center, Flex, Grid, Skeleton, Text } from '@chakra-ui/react';
import { ChartLine } from 'lucide-react';
import { useGetAnalyticsSeriesQuery, useGetAnalyticsSummaryQuery, useGetAnalyticsTopQuery } from '@/components/library';
import { Panel, StatTile } from '@/components/library/cl';
import { BarList, LineChart } from '@/components/library/dashboard/charts';
import GuideLink from '@/components/library/tenant/GuideLink';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import type { AnalyticsDim, AnalyticsRange, AnalyticsTopRow, AnalyticsTotals } from '@/components/library/store/services/tenantApi';
import { duration, flag, number } from './format';

/**
 * Analytics → Overview: totals against the previous period, page views per
 * day, and the breakdowns — where visits come from, the pages, where visitors
 * are and what they use (docs/multi-tenancy WO-19, WO-56).
 */

/** "+12% vs previous period" — or nothing to compare against. */
const change = (now: number, before: number, unit = '%') => {
	if (!before) return now ? 'New this period' : 'No visits yet';
	const pct = Math.round(((now - before) / before) * 100);
	return `${pct > 0 ? '+' : ''}${pct}${unit} vs previous period`;
};

const TILES: { key: keyof AnalyticsTotals; label: string; format: (v: number) => string }[] = [
	{ key: 'pageviews', label: 'Page views', format: number },
	{ key: 'visitors', label: 'Visitors', format: number },
	{ key: 'sessions', label: 'Visits', format: number },
	{ key: 'pagesPerSession', label: 'Pages per visit', format: v => v.toFixed(1) },
	{ key: 'avgDuration', label: 'Average visit', format: v => duration(v) },
	{ key: 'bounceRate', label: 'Bounce rate', format: v => `${v}%` },
];

type Breakdown = { dim: AnalyticsDim; title: string; subtitle?: string; empty: string; blank?: string; label?: (r: AnalyticsTopRow) => string };

const withFlag = (r: AnalyticsTopRow) => [flag(r.code), r.value].filter(Boolean).join(' ');

const GROUPS: { title: string; items: Breakdown[] }[] = [
	{
		title: 'Where visits come from',
		items: [
			{ dim: 'channels', title: 'Channels', subtitle: 'Per visit', empty: 'No visits yet' },
			{ dim: 'sources', title: 'Sources', subtitle: 'Google, Facebook, Google Ads, a newsletter…', empty: 'No visits yet', blank: 'Direct' },
			{ dim: 'campaigns', title: 'Campaigns', subtitle: 'utm_campaign', empty: 'No campaign links — add ?utm_campaign= to your ad and email links', blank: 'No campaign' },
			{ dim: 'referrers', title: 'Referring sites', empty: 'No visits', blank: 'Direct / none' },
		],
	},
	{
		title: 'Pages',
		items: [
			{ dim: 'paths', title: 'Top pages', subtitle: 'With the average time on the page', empty: 'No page views', label: r => (r.avgDuration ? `${r.value} · ${duration(r.avgDuration)}` : r.value) },
			{ dim: 'entries', title: 'Landing pages', subtitle: 'Where visits start', empty: 'No visits yet' },
			{ dim: 'clicks', title: 'Clicks', empty: 'No tracked clicks — outbound links and [data-track] elements count' },
			{ dim: 'events', title: 'Events', empty: 'No custom events — MintAnalytics.track(name, props)' },
		],
	},
	{
		title: 'Where visitors are',
		items: [
			{ dim: 'countries', title: 'Countries', empty: 'No visits', blank: 'Unknown', label: withFlag },
			{ dim: 'cities', title: 'Cities', empty: 'No visits', blank: 'Unknown', label: withFlag },
			{ dim: 'isps', title: 'Internet providers', subtitle: 'The network they browse from', empty: 'No visits', blank: 'Unknown' },
			{ dim: 'languages', title: 'Languages', subtitle: 'Their browser’s language', empty: 'No visits', blank: 'Unknown' },
		],
	},
	{
		title: 'What they use',
		items: [
			{ dim: 'devices', title: 'Devices', empty: 'No visits' },
			{ dim: 'models', title: 'Device models', subtitle: 'When the browser says', empty: 'No visits', blank: 'Not told' },
			{ dim: 'browsers', title: 'Browsers', empty: 'No visits' },
			{ dim: 'os', title: 'Operating systems', empty: 'No visits' },
			{ dim: 'screens', title: 'Screen sizes', empty: 'No visits', blank: 'Unknown' },
		],
	},
];

const BreakdownPanel: FC<Breakdown & { range: AnalyticsRange }> = ({ dim, title, subtitle, empty, blank, label, range }) => {
	const { data, isLoading } = useGetAnalyticsTopQuery({ dim, ...range });
	const rows = data?.rows || [];
	return (
		<Panel
			title={title}
			subtitle={subtitle}>
			{isLoading ? (
				<Skeleton h='140px' />
			) : rows.length ? (
				<BarList
					title={title}
					format={number}
					slices={rows.map(r => ({ key: r.value, label: (r.value ? (label ? label(r) : r.value) : '') || blank || '—', value: r.count }))}
				/>
			) : (
				<Text
					fontSize='12.5px'
					color='fg.muted'>
					{empty}
				</Text>
			)}
		</Panel>
	);
};

const Overview: FC<{ range: AnalyticsRange }> = ({ range }) => {
	const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummaryQuery(range);
	const { data: series, isLoading: loadingSeries } = useGetAnalyticsSeriesQuery(range);
	const nothingYet = summary && !summary.current.pageviews && !summary.previous.pageviews;

	return (
		<Flex
			direction='column'
			gap={4}>
			{nothingYet && (
				<Panel>
					<Flex
						direction={{ base: 'column', sm: 'row' }}
						align={{ base: 'flex-start', sm: 'center' }}
						gap={3}>
						<Center
							boxSize='40px'
							flexShrink={0}
							borderRadius='full'
							bg='bg.muted'
							color='fg.muted'>
							<ChartLine size={18} />
						</Center>
						<Box flex={1}>
							<Text
								fontSize='13.5px'
								fontWeight='600'>
								No visits recorded yet
							</Text>
							<Text
								fontSize='12.5px'
								color='fg.muted'>
								Add the tracking snippet to your site’s pages — it’s on the Public API page.
							</Text>
						</Box>
						<Button
							size='sm'
							variant='outline'
							asChild>
							<NextLink href={projectHref('/public-api')}>Get the snippet</NextLink>
						</Button>
					</Flex>
				</Panel>
			)}

			<Grid
				templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }}
				gap={3}>
				{TILES.map(t => (
					<StatTile
						key={t.key}
						label={t.label}
						isLoading={loadingSummary}
						value={summary ? t.format(summary.current[t.key] ?? 0) : '—'}
						hint={summary ? change(summary.current[t.key] ?? 0, summary.previous[t.key] ?? 0) : undefined}
					/>
				))}
			</Grid>

			<Panel
				title='Page views'
				subtitle='Per day'
				actions={<GuideLink section='analytics' />}>
				{loadingSeries ? (
					<Skeleton h='220px' />
				) : (
					<LineChart
						title='Page views'
						interval='day'
						format={number}
						height={220}
						points={(series?.days || []).map(d => ({ key: d.date, value: d.pageviews }))}
					/>
				)}
			</Panel>

			{GROUPS.map(g => (
				<Flex
					key={g.title}
					direction='column'
					gap={3}>
					<Flex
						align='center'
						justify='space-between'
						mt={2}>
						<Text
							fontSize='11.5px'
							fontWeight='600'
							color='fg.muted'
							textTransform='uppercase'
							letterSpacing='0.04em'>
							{g.title}
						</Text>
						{g.title === 'Where visits come from' && (
							<GuideLink
								section='traffic-sources'
								label='How visits are sorted'
							/>
						)}
					</Flex>
					<Grid
						templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
						gap={4}>
						{g.items.map(b => (
							<BreakdownPanel
								key={b.dim}
								{...b}
								range={range}
							/>
						))}
					</Grid>
				</Flex>
			))}
		</Flex>
	);
};

export default Overview;
