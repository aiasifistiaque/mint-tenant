'use client';

import { FC, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Center, Flex, Grid, Skeleton, Text } from '@chakra-ui/react';
import { ChartLine } from 'lucide-react';
import {
	Layout,
	useGetAnalyticsSeriesQuery,
	useGetAnalyticsSummaryQuery,
	useGetAnalyticsTopQuery,
} from '@/components/library';
import { Dropdown, Panel, StatTile } from '@/components/library/cl';
import { BarList, LineChart } from '@/components/library/dashboard/charts';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import type { AnalyticsDim, AnalyticsRange, AnalyticsTotals } from '@/components/library/store/services/tenantApi';

/**
 * A website project's analytics (tenant panel; backend routes-tenant/
 * analytics.router.ts), from the events /public/track.js sends: totals against
 * the previous period, page views per day, and where visits come from.
 */

const DAY = 24 * 60 * 60 * 1000;
const RANGES = [
	{ value: '7', label: 'Last 7 days' },
	{ value: '30', label: 'Last 30 days' },
	{ value: '90', label: 'Last 90 days' },
	{ value: '365', label: 'Last 12 months' },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const number = (v: number) => v.toLocaleString();

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
	{ key: 'bounceRate', label: 'Bounce rate', format: v => `${v}%` },
];

const BREAKDOWNS: { dim: AnalyticsDim; title: string; empty: string; blank?: string }[] = [
	{ dim: 'paths', title: 'Top pages', empty: 'No page views' },
	{ dim: 'referrers', title: 'Referrers', empty: 'No visits', blank: 'Direct / none' },
	{ dim: 'devices', title: 'Devices', empty: 'No visits' },
	{ dim: 'countries', title: 'Countries', empty: 'No visits', blank: 'Unknown' },
	{ dim: 'clicks', title: 'Clicks', empty: 'No tracked clicks — outbound links and [data-track] elements count' },
	{ dim: 'events', title: 'Events', empty: 'No custom events — MintAnalytics.track(name, props)' },
];

const Breakdown: FC<{ dim: AnalyticsDim; title: string; empty: string; blank?: string; range: AnalyticsRange }> = ({ dim, title, empty, blank, range }) => {
	const { data, isLoading } = useGetAnalyticsTopQuery({ dim, ...range });
	const rows = data?.rows || [];
	return (
		<Panel title={title}>
			{isLoading ? (
				<Skeleton h='140px' />
			) : rows.length ? (
				<BarList
					title={title}
					format={number}
					slices={rows.map(r => ({ key: r.value, label: r.value || blank || '—', value: r.count }))}
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

export default function AnalyticsPage() {
	const { project } = useWorkspace();
	const [days, setDays] = useState('30');
	const range = useMemo<AnalyticsRange>(() => ({ from: iso(new Date(Date.now() - (Number(days) - 1) * DAY)), to: iso(new Date()) }), [days]);
	const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummaryQuery(range);
	const { data: series, isLoading: loadingSeries } = useGetAnalyticsSeriesQuery(range);
	const nothingYet = summary && !summary.current.pageviews && !summary.previous.pageviews;

	return (
		<Layout
			title='Analytics'
			path='analytics'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				<Flex
					align='center'
					justify='space-between'
					gap={3}
					wrap='wrap'>
					<Box>
						<Text
							fontSize='18px'
							fontWeight='600'>
							{project?.name || 'Website'}
						</Text>
						<Text
							fontSize='12.5px'
							color='fg.muted'>
							{project?.domains?.length ? project.domains.join(' · ') : 'Counting visits from any site — add your domains to the project'}
						</Text>
					</Box>
					<Box w='180px'>
						<Dropdown
							size='sm'
							value={days}
							onChange={setDays}
							items={RANGES}
						/>
					</Box>
				</Flex>

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
					templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }}
					gap={3}>
					{TILES.map(t => (
						<StatTile
							key={t.key}
							label={t.label}
							isLoading={loadingSummary}
							value={summary ? t.format(summary.current[t.key]) : '—'}
							hint={summary ? change(summary.current[t.key], summary.previous[t.key]) : undefined}
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

				<Grid
					templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
					gap={4}>
					{BREAKDOWNS.map(b => (
						<Breakdown
							key={b.dim}
							{...b}
							range={range}
						/>
					))}
				</Grid>
			</Flex>
		</Layout>
	);
}
