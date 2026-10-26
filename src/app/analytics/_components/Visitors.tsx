'use client';

import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react';
import { useGetAnalyticsVisitorsQuery } from '@/components/library';
import { DataTable, Dropdown, EmptyState, ErrorState, FilterInput, Panel, TableSkeleton } from '@/components/library/cl';
import type { Column } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import type { AnalyticsRange, AnalyticsVisitor, AnalyticsVisitorsQuery } from '@/components/library/store/services/tenantApi';
import { CHANNELS, ago, number, placeLine, sourceLine, visitorName } from './format';

/**
 * Analytics → Visitors (docs/multi-tenancy WO-56): everyone seen in the range —
 * who they are when the site knows, where they are and on what network, what
 * they use, how they first arrived — newest first. A row opens their journey.
 */

const SORTS = [
	{ value: 'lastSeen', label: 'Last seen' },
	{ value: 'firstSeen', label: 'Newest visitors' },
	{ value: 'visits', label: 'Most visits' },
	{ value: 'pageviews', label: 'Most page views' },
];
const CHANNEL_ITEMS = [{ value: '', label: 'Any source' }, ...CHANNELS.map(c => ({ value: c, label: c }))];
const WHO_ITEMS = [
	{ value: '', label: 'Everyone' },
	{ value: 'known', label: 'Known people only' },
];

const Muted: FC<{ children: string }> = ({ children }) => (
	<Text
		fontSize='11.5px'
		color='fg.muted'
		truncate
		maxW='240px'>
		{children}
	</Text>
);

const columns: Column<AnalyticsVisitor>[] = [
	{
		key: 'visitor',
		label: 'Visitor',
		render: v => {
			const known = !!(v.customer || v.email || v.userId);
			return (
				<Box minW='160px'>
					<Flex
						align='center'
						gap={1.5}>
						<Text
							fontSize='13px'
							fontWeight='500'
							truncate
							maxW='220px'>
							{visitorName(v)}
						</Text>
						{v.customer && (
							<Badge
								size='xs'
								colorPalette='green'>
								Customer
							</Badge>
						)}
					</Flex>
					<Muted>{known && v.name && v.email ? v.email : v.visitorId}</Muted>
				</Box>
			);
		},
	},
	{
		key: 'place',
		label: 'Location',
		render: v => (
			<Box maxW='190px'>
				<Text
					fontSize='13px'
					truncate>
					{placeLine(v.place) || '—'}
				</Text>
				{v.place?.timezone && <Muted>{v.place.timezone}</Muted>}
			</Box>
		),
	},
	{
		key: 'network',
		label: 'Network',
		render: v => (
			<Box>
				<Text
					fontSize='13px'
					truncate
					maxW='170px'>
					{v.place?.isp || '—'}
				</Text>
				{v.place?.ip && (
					<Text
						fontSize='11.5px'
						color='fg.muted'
						fontFamily='mono'>
						{v.place.ip}
					</Text>
				)}
			</Box>
		),
	},
	{
		key: 'device',
		label: 'Device',
		render: v => (
			<Box maxW='170px'>
				<Text
					fontSize='13px'
					truncate>
					{v.deviceModel || v.device || '—'}
				</Text>
				<Muted>{[v.browser, v.os].filter(Boolean).join(' · ')}</Muted>
			</Box>
		),
	},
	{
		key: 'source',
		label: 'First came from',
		render: v => (
			<Box maxW='180px'>
				<Text
					fontSize='13px'
					truncate>
					{sourceLine(v.first?.channel, v.first?.source) || '—'}
				</Text>
				{v.first?.landing && <Muted>{v.first.landing}</Muted>}
			</Box>
		),
	},
	{
		key: 'visits',
		label: 'Visits',
		numeric: true,
		render: v => (
			<Box whiteSpace='nowrap'>
				<Text fontSize='13px'>{number(v.visits || 0)}</Text>
				<Text
					fontSize='11.5px'
					color='fg.muted'>
					{number(v.pageviews || 0)} {v.pageviews === 1 ? 'page' : 'pages'}
				</Text>
			</Box>
		),
	},
	{ key: 'lastSeen', label: 'Last seen', render: v => <Text whiteSpace='nowrap'>{ago(v.lastSeen)}</Text> },
];

const Visitors: FC<{ range: AnalyticsRange }> = ({ range }) => {
	const router = useRouter();
	const [search, setSearch] = useState('');
	const [q, setQ] = useState('');
	const [channel, setChannel] = useState('');
	const [who, setWho] = useState('');
	const [sort, setSort] = useState<NonNullable<AnalyticsVisitorsQuery['sort']>>('lastSeen');
	const [page, setPage] = useState(1);

	// Search once typing stops.
	useEffect(() => {
		const t = setTimeout(() => setQ(search.trim()), 350);
		return () => clearTimeout(t);
	}, [search]);
	useEffect(() => setPage(1), [q, channel, who, sort, range.from, range.to]);

	const { data, isLoading, isFetching, isError, refetch } = useGetAnalyticsVisitorsQuery({ ...range, q, channel, known: who === 'known', sort, page });
	const rows = data?.rows || [];

	return (
		<Panel
			title='Visitors'
			subtitle='Everyone seen in this period — open one to see every page they visited, in order'
			actions={<GuideLink section='visitors' />}
			flush>
			<Flex
				gap={2}
				p={3}
				wrap='wrap'
				align='center'
				borderBottomWidth='1px'
				borderColor='border.muted'>
				<Box
					flex='1'
					minW='220px'>
					<FilterInput
						value={search}
						onChange={setSearch}
						placeholder='Name, email, IP, city or internet provider'
						shown={rows.length}
						total={data?.total}
					/>
				</Box>
				<Box w={{ base: 'full', sm: '170px' }}>
					<Dropdown
						size='sm'
						value={channel}
						onChange={setChannel}
						items={CHANNEL_ITEMS}
					/>
				</Box>
				<Box w={{ base: 'full', sm: '170px' }}>
					<Dropdown
						size='sm'
						value={who}
						onChange={setWho}
						items={WHO_ITEMS}
					/>
				</Box>
				<Box w={{ base: 'full', sm: '170px' }}>
					<Dropdown
						size='sm'
						value={sort}
						onChange={v => setSort(v as typeof sort)}
						items={SORTS}
					/>
				</Box>
			</Flex>
			{isLoading ? (
				<Box p={4}>
					<TableSkeleton />
				</Box>
			) : isError ? (
				<ErrorState
					message='Couldn’t load the visitors.'
					onRetry={refetch}
				/>
			) : !rows.length ? (
				<EmptyState
					title={q || channel || who ? 'No visitors match' : 'No visitors in this period'}
					description={q || channel || who ? 'Try another search or filter.' : 'Visitors show here once the tracking snippet is on your site.'}
				/>
			) : (
				<Box opacity={isFetching ? 0.6 : 1}>
					<DataTable
						columns={columns}
						rows={rows}
						rowKey={v => v.visitorId}
						onRowClick={v => router.push(projectHref(`/analytics/visitors/${encodeURIComponent(v.visitorId)}`))}
					/>
				</Box>
			)}
			{data && data.pages > 1 && (
				<Flex
					align='center'
					justify='space-between'
					gap={3}
					px={4}
					py={3}
					borderTopWidth='1px'
					borderColor='border.muted'>
					<Text
						fontSize='12px'
						color='fg.muted'>
						Page {data.page} of {data.pages} · {number(data.total)} visitors
					</Text>
					<Flex gap={2}>
						<Button
							size='xs'
							variant='outline'
							disabled={page <= 1}
							onClick={() => setPage(p => p - 1)}>
							Previous
						</Button>
						<Button
							size='xs'
							variant='outline'
							disabled={page >= data.pages}
							onClick={() => setPage(p => p + 1)}>
							Next
						</Button>
					</Flex>
				</Flex>
			)}
		</Panel>
	);
};

export default Visitors;
