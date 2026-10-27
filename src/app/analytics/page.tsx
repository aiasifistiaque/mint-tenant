'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Flex, Tabs, Text } from '@chakra-ui/react';
import { Layout } from '@/components/library';
import { ConsoleTabs, Dropdown } from '@/components/library/cl';
import { useWorkspace } from '@/components/library/tenant';
import type { AnalyticsRange } from '@/components/library/store/services/tenantApi';
import Overview from './_components/Overview';
import Visitors from './_components/Visitors';
import Live from './_components/Live';
import Domains from './_components/Domains';

/**
 * A website project's analytics (tenant panel; backend routes-tenant/
 * analytics.router.ts), from the events /public/track.js sends: Overview
 * (totals, page views per day, where visits come from and who they are),
 * Visitors (each one, and their journey on its own page) and Live — the tab
 * in ?tab= (docs/multi-tenancy WO-19, WO-56).
 */

const DAY = 24 * 60 * 60 * 1000;
const RANGES = [
	{ value: '1', label: 'Today' },
	{ value: '7', label: 'Last 7 days' },
	{ value: '30', label: 'Last 30 days' },
	{ value: '90', label: 'Last 90 days' },
	{ value: '365', label: 'Last 12 months' },
];
const TABS = [
	{ value: 'overview', label: 'Overview' },
	{ value: 'visitors', label: 'Visitors' },
	{ value: 'live', label: 'Live' },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

function Analytics() {
	const router = useRouter();
	const params = useSearchParams();
	const tab = TABS.some(t => t.value === params.get('tab')) ? String(params.get('tab')) : 'overview';
	const { project, can } = useWorkspace();
	const [days, setDays] = useState('30');
	const range = useMemo<AnalyticsRange>(() => ({ from: iso(new Date(Date.now() - (Number(days) - 1) * DAY)), to: iso(new Date()) }), [days]);

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
						<Domains
							domains={project?.domains || []}
							canEdit={can('manage-projects')}
						/>
					</Box>
					{tab !== 'live' && (
						<Box w='180px'>
							<Dropdown
								size='sm'
								value={days}
								onChange={setDays}
								items={RANGES}
							/>
						</Box>
					)}
				</Flex>
				<ConsoleTabs
					tabs={TABS}
					value={tab}
					onChange={v => router.replace(`?tab=${v}`, { scroll: false })}>
					{TABS.map(t => (
						<Tabs.Content
							key={t.value}
							value={t.value}
							pt={0}>
							{t.value !== tab ? null : tab === 'visitors' ? <Visitors range={range} /> : tab === 'live' ? <Live /> : <Overview range={range} />}
						</Tabs.Content>
					))}
				</ConsoleTabs>
			</Flex>
		</Layout>
	);
}

// useSearchParams (the ?tab=) needs a Suspense boundary to prerender.
export default function AnalyticsPage() {
	return (
		<Suspense>
			<Analytics />
		</Suspense>
	);
}
