'use client';

import { FC, ReactNode, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, CloseButton, Drawer, Flex, Grid, Portal, SegmentGroup, Skeleton, Tabs, Text } from '@chakra-ui/react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { DataTable, EmptyState, Panel, type Column } from '../cl';
import GuideLink from '../tenant/GuideLink';
import { ColumnChart } from '../dashboard/charts';
import { projectHref } from '../config/lib/constants/panel';
import {
	useGetCommerceSettingsQuery,
	useGetStoreSearchInsightsQuery,
	useGetStoreSearchQueryInsightQuery,
	useTryStoreSearchQuery,
	type SearchQueryRow,
} from '../store/services/commerceApi';
import { help } from './sections';
import { RuleFixes, RulesTouching } from './SearchRules';

/**
 * Search insights (backend docs/search README §6, SI-14): what shoppers search for on the store's website — totals for
 * 7 / 30 / 90 days against the period before, a chart by day, and four tables, each search with its fix one tap away:
 * Top searches, No results (add a synonym, a redirect, or the product), Low click rate (try it as shoppers see it) and
 * Trending. A search opens on the side: its days, its results now, clicks by position, what people searched next.
 */

const PERIODS = [
	{ value: '7', label: '7 days' },
	{ value: '30', label: '30 days' },
	{ value: '90', label: '90 days' },
];

const count = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString());
const pct = (n: number | null | undefined) => (n == null ? '—' : `${(n * 100).toFixed(n > 0 && n < 0.1 ? 1 : 0)}%`);

/** The store's money: its currency before the amount. */
const useMoney = () => {
	const { data } = useGetCommerceSettingsQuery();
	const currency = (data?.answers as any)?.store?.currency || '';
	return (n: number) => `${currency ? `${currency} ` : ''}${Math.round(n).toLocaleString()}`;
};

/** How a number moved against the period before: a share for counts, points for rates. */
const Change: FC<{ now: number | null; before: number | null; rate?: boolean; goodDown?: boolean }> = ({ now, before, rate, goodDown }) => {
	if (now == null || before == null) return null;
	if (!rate && before === 0) return now ? <Hint>new this period</Hint> : null;
	const diff = rate ? (now - before) * 100 : ((now - before) / before) * 100;
	if (Math.abs(diff) < 0.5)
		return (
			<Flex align='center' gap={1} color='fg.muted' fontSize='12px'>
				<Minus size={12} /> same as before
			</Flex>
		);
	const up = diff > 0;
	const good = goodDown ? !up : up;
	return (
		<Flex align='center' gap={1} fontSize='12px' color={good ? 'green.fg' : 'red.fg'}>
			{up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
			{Math.abs(diff).toFixed(0)}
			{rate ? ' pts' : '%'} vs before
		</Flex>
	);
};

const Hint: FC<{ children: ReactNode }> = ({ children }) => (
	<Text fontSize='12px' color='fg.muted'>
		{children}
	</Text>
);

const Tile: FC<{ label: string; value: string; children?: ReactNode; title?: string }> = ({ label, value, children, title }) => (
	<Box p={3} borderWidth='1px' borderColor='border' borderRadius='lg' bg='bg.panel' title={title}>
		<Text fontSize='12px' color='fg.muted'>
			{label}
		</Text>
		<Text fontSize='22px' fontWeight='600' lineHeight='1.2' mt={1}>
			{value}
		</Text>
		<Box mt={1} minH='18px'>
			{children}
		</Box>
	</Box>
);

const CHARTS = [
	{ value: 'searches', label: 'Searches' },
	{ value: 'zero', label: 'No results' },
	{ value: 'revenue', label: 'Revenue' },
];

/** The fixes for a search with no results: a synonym, a redirect, or the product itself — each a form with it filled in. */
const NoResultFixes: FC<{ q: string }> = ({ q }) => {
	const { data } = useGetCommerceSettingsQuery();
	const i: any = data?.installed || {};
	const fill = (route: string | undefined, field: string) => (route ? projectHref(`/t/${route}/create?fill_${field}=${encodeURIComponent(q)}`) : null);
	const links = [
		{ label: 'Add a synonym', href: fill(i.searchSynonym?.route, 'words') },
		{ label: 'Redirect', href: fill(i.searchRedirect?.route, 'queries') },
		{ label: 'Create the product', href: fill(i.product?.route, 'name') },
	].filter(l => l.href);
	return (
		<Flex gap={1} wrap={{ base: 'wrap', lg: 'nowrap' }} justify='flex-end' onClick={e => e.stopPropagation()}>
			{links.map(l => (
				<Button key={l.label} asChild size='xs' variant='outline'>
					<NextLink href={l.href!}>{l.label}</NextLink>
				</Button>
			))}
		</Flex>
	);
};

const TryFix: FC<{ q: string }> = ({ q }) => (
	<Flex justify='flex-end' onClick={e => e.stopPropagation()}>
		<Button asChild size='xs' variant='outline'>
			<NextLink href={projectHref(`/store/settings/search?try=${encodeURIComponent(q)}#store-search-try`)}>Try search</NextLink>
		</Button>
	</Flex>
);

const queryCell = (r: { q: string }) => (
	<Text as='span' fontWeight='500'>
		{r.q}
	</Text>
);

/** One search on the side: its days, its results as shoppers see them now, clicks by position, what came next. */
const QueryDrawer: FC<{ q: string | null; days: number; onClose: () => void; onOpen: (q: string) => void }> = ({ q, days, onClose, onOpen }) => {
	const money = useMoney();
	const { data, isFetching } = useGetStoreSearchQueryInsightQuery({ q: q || '', days }, { skip: !q });
	const { data: now } = useTryStoreSearchQuery(q || '', { skip: !q });
	const t = data?.totals;
	const most = Math.max(1, ...(data?.positions || []).map(p => p.clicks));
	return (
		<Drawer.Root open={!!q} onOpenChange={d => !d.open && onClose()} placement='end' size='md' lazyMount unmountOnExit>
			<Portal>
				<Drawer.Backdrop />
				<Drawer.Positioner>
					<Drawer.Content>
						<Drawer.Header>
							<Drawer.Title>“{data?.q || q}”</Drawer.Title>
						</Drawer.Header>
						<Drawer.CloseTrigger asChild>
							<CloseButton size='sm' />
						</Drawer.CloseTrigger>
						<Drawer.Body>
							{!data || isFetching ? (
								<Skeleton h='320px' />
							) : (
								<Flex direction='column' gap={5}>
									<Grid templateColumns='repeat(2, minmax(0, 1fr))' gap={2}>
										<Tile label='Searches' value={count(t!.searches)}>
											<Change now={t!.searches} before={data.before.searches} />
										</Tile>
										<Tile label='Visitors' value={count(t!.visitors)} />
										<Tile label='Click rate' value={pct(t!.clickRate)} />
										<Tile label='Revenue from it' value={money(t!.revenue)}>
											<Hint>
												{count(t!.orders)} order{t!.orders === 1 ? '' : 's'}
											</Hint>
										</Tile>
									</Grid>
									<Box>
										<Text fontSize='13px' fontWeight='600' mb={2}>
											By day
										</Text>
										<ColumnChart points={data.series.map(p => ({ key: p.day, value: p.searches }))} interval='day' format={v => `${v} searches`} title='Searches by day' height={140} />
									</Box>
									<Box>
										<Text fontSize='13px' fontWeight='600' mb={1}>
											Its results now
										</Text>
										<Text {...help} mb={2}>
											As shoppers see them — the same for every shopper.
											{now?.redirect ? ` It opens ${now.redirect.url} instead.` : ''}
										</Text>
										{!now ? (
											<Skeleton h='80px' />
										) : !now.doc?.length ? (
											<Hint>Nothing yet{now.fallback?.doc?.length ? ' — shoppers see popular products instead' : ''}.</Hint>
										) : (
											<Flex direction='column' gap={1}>
												{now.doc.slice(0, 8).map((d: any, i: number) => (
													<Flex key={d._id} gap={2} fontSize='13px' justify='space-between'>
														<Text lineClamp={1}>
															<Text as='span' color='fg.muted' mr={2}>
																{i + 1}
															</Text>
															{d.name}
														</Text>
														{d.price != null && <Text color='fg.muted' whiteSpace='nowrap'>{money(d.salePrice ?? d.price)}</Text>}
													</Flex>
												))}
											</Flex>
										)}
										{(now?.query?.synonyms || []).length > 0 && (
											<Flex gap={1} wrap='wrap' mt={2}>
												{now.query.synonyms.map((s: any, i: number) => (
													<Badge key={i} size='sm' variant='surface'>
														{s.word} → {s.with.join(', ')}
													</Badge>
												))}
											</Flex>
										)}
									</Box>
									<Box>
										<Text fontSize='13px' fontWeight='600' mb={1}>
											Clicks by position
										</Text>
										<Text {...help} mb={2}>
											Which result shoppers opened: most on the first few is a good sign.
										</Text>
										{data.positions.every(p => !p.clicks) ? (
											<Hint>No clicks yet.</Hint>
										) : (
											<Flex direction='column' gap={1}>
												{data.positions
													.filter(p => p.clicks)
													.map(p => (
														<Flex key={p.position} align='center' gap={2} fontSize='12px'>
															<Text w='28px' color='fg.muted'>
																#{p.position}
															</Text>
															<Box flex={1} h='8px' borderRadius='full' bg='bg.muted' overflow='hidden'>
																<Box h='full' w={`${(p.clicks / most) * 100}%`} bg='var(--series-1, var(--chakra-colors-blue-solid))' />
															</Box>
															<Text w='32px' textAlign='right'>
																{p.clicks}
															</Text>
														</Flex>
													))}
											</Flex>
										)}
									</Box>
									<Box>
										<Text fontSize='13px' fontWeight='600' mb={1}>
											What people searched next
										</Text>
										<Text {...help} mb={2}>
											In the same visit, within 10 minutes — often what they meant.
										</Text>
										{!data.next.length ? (
											<Hint>Nothing yet.</Hint>
										) : (
											<Flex gap={1} wrap='wrap'>
												{data.next.map(n => (
													<Button key={n.nq} size='xs' variant='outline' onClick={() => onOpen(n.q)}>
														{n.q} · {n.times}
													</Button>
												))}
											</Flex>
										)}
									</Box>
									<Flex gap={2} wrap='wrap'>
										{t!.zero > 0 && <NoResultFixes q={data.q} />}
										<TryFix q={data.q} />
										{t!.zero < t!.searches && <RuleFixes q={data.q} />}
									</Flex>
									<RulesTouching q={data.q} />
								</Flex>
							)}
						</Drawer.Body>
					</Drawer.Content>
				</Drawer.Positioner>
			</Portal>
		</Drawer.Root>
	);
};

const SearchInsights: FC = () => {
	const money = useMoney();
	const [days, setDays] = useState(30);
	const [chart, setChart] = useState('searches');
	const [open, setOpen] = useState<string | null>(null);
	const { data, isLoading, isFetching, error } = useGetStoreSearchInsightsQuery(days);

	const cols = {
		q: { key: 'q', label: 'Search', render: queryCell } as Column<SearchQueryRow>,
		searches: { key: 'searches', label: 'Searches', numeric: true, render: (r: SearchQueryRow) => count(r.searches) } as Column<SearchQueryRow>,
		clickRate: { key: 'clickRate', label: 'Click rate', numeric: true, render: (r: SearchQueryRow) => pct(r.clickRate) } as Column<SearchQueryRow>,
		orders: { key: 'orders', label: 'Orders', numeric: true, render: (r: SearchQueryRow) => count(r.orders) } as Column<SearchQueryRow>,
		revenue: { key: 'revenue', label: 'Revenue', numeric: true, render: (r: SearchQueryRow) => money(r.revenue) } as Column<SearchQueryRow>,
	};
	const empty = (title: string, description: string) => (
		<Box py={6}>
			<EmptyState title={title} description={description} />
		</Box>
	);
	const table = (rows: SearchQueryRow[], columns: Column<SearchQueryRow>[], none: ReactNode, actions?: (r: SearchQueryRow) => ReactNode) =>
		rows.length ? <DataTable columns={columns} rows={rows} rowKey={r => r.nq} onRowClick={r => setOpen(r.q)} rowActions={actions} /> : none;

	if (error) return empty('Couldn’t load search insights', (error as any)?.data?.message || 'Try again in a moment.');
	const t = data?.totals;
	const b = data?.before;
	return (
		<Flex direction='column' gap={4}>
			<Flex align='center' justify='space-between' gap={3} wrap='wrap'>
				<Text {...help} maxW='620px'>
					What shoppers search for on your website, and what they find. Updated every hour, in your store’s time zone{data?.timeZone ? ` (${data.timeZone})` : ''}.
				</Text>
				<Flex align='center' gap={2}>
					<SegmentGroup.Root size='sm' value={String(days)} onValueChange={d => d.value && setDays(Number(d.value))} aria-label='Period'>
						<SegmentGroup.Indicator />
						<SegmentGroup.Items items={PERIODS} />
					</SegmentGroup.Root>
					<GuideLink section='store-search-insights' />
				</Flex>
			</Flex>

			{isLoading || !data ? (
				<Skeleton h='520px' />
			) : !t!.searches && !b!.searches ? (
				empty(
					'No searches yet',
					'Once shoppers search your website — through the store’s search, or a widget that uses it — what they look for shows here. Searches made through a Products list don’t count.'
				)
			) : (
				<>
					<Grid templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }} gap={2} opacity={isFetching ? 0.6 : 1}>
						<Tile label='Searches' value={count(t!.searches)}>
							<Change now={t!.searches} before={b!.searches} />
						</Tile>
						<Tile label='Visitors who searched' value={count(t!.visitors)}>
							<Change now={t!.visitors} before={b!.visitors} />
						</Tile>
						<Tile label='Visits with a search' value={pct(t!.sessionShare)} title='Of your website’s visits (its analytics), the share where the shopper searched'>
							{t!.sessionShare == null ? <Hint>Needs your website’s analytics</Hint> : <Hint>{count(t!.searchedSessions)} of {count(t!.sessions)} visits</Hint>}
						</Tile>
						<Tile label='Revenue from search' value={money(t!.revenue)} title='Order lines whose product the shopper found by searching, in the 24 hours before ordering'>
							<Change now={t!.revenue} before={b!.revenue} />
						</Tile>
						<Tile label='No results' value={pct(t!.zeroRate)} title='Searches that found nothing'>
							<Change now={t!.zeroRate} before={b!.searches ? b!.zeroRate : null} rate goodDown />
						</Tile>
						<Tile label='Click rate' value={pct(t!.clickRate)} title='Results opened, for every search that showed results'>
							<Change now={t!.clickRate} before={b!.searches ? b!.clickRate : null} rate />
						</Tile>
						<Tile label='Conversion from search' value={pct(t!.conversion)} title='Orders with a line from search, for every search'>
							<Change now={t!.conversion} before={b!.searches ? b!.conversion : null} rate />
						</Tile>
						<Tile label='Orders from search' value={count(t!.orders)}>
							<Change now={t!.orders} before={b!.orders} />
						</Tile>
					</Grid>

					<Panel
						id='store-search-chart'
						title='Over time'
						actions={
							<SegmentGroup.Root size='xs' value={chart} onValueChange={d => d.value && setChart(d.value)} aria-label='Chart'>
								<SegmentGroup.Indicator />
								<SegmentGroup.Items items={CHARTS} />
							</SegmentGroup.Root>
						}>
						<Box p={4}>
							<ColumnChart
								points={data.series.map(p => ({ key: p.day, value: (p as any)[chart] || 0 }))}
								interval='day'
								format={v => (chart === 'revenue' ? money(v) : `${v.toLocaleString()} ${chart === 'zero' ? 'with no results' : 'searches'}`)}
								title={CHARTS.find(c => c.value === chart)!.label}
							/>
						</Box>
					</Panel>

					<Panel id='store-search-tables' title='Searches' subtitle='Open one to see its results, clicks by position and what people searched next.'>
						<Tabs.Root defaultValue='top' variant='line' size='sm' lazyMount>
							<Tabs.List px={4}>
								<Tabs.Trigger value='top'>Top searches</Tabs.Trigger>
								<Tabs.Trigger value='none'>
									No results
									{data.noResults.length > 0 && (
										<Badge size='xs' colorPalette='red' variant='subtle'>
											{data.noResults.length}
										</Badge>
									)}
								</Tabs.Trigger>
								<Tabs.Trigger value='low'>Low click rate</Tabs.Trigger>
								<Tabs.Trigger value='trending'>Trending</Tabs.Trigger>
							</Tabs.List>
							<Box px={4} pb={4}>
								<Tabs.Content value='top'>
									{table(data.top, [cols.q, cols.searches, cols.clickRate, cols.orders, cols.revenue], empty('No searches', 'Nothing searched in this period.'))}
								</Tabs.Content>
								<Tabs.Content value='none'>
									<Text {...help} mb={2}>
										Searches that found nothing, the most first. Add a synonym when you sell it under another word, a redirect when a page answers it, or the
										product when you should sell it.
									</Text>
									{table(
										data.noResults,
										[
											cols.q,
											{ key: 'zero', label: 'No results', numeric: true, render: r => count(r.zero) },
											{ key: 'last', label: 'Last', render: r => (r.last ? new Date(r.last).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—') },
										],
										empty('Every search found something', 'No search came back empty in this period.'),
										r => <NoResultFixes q={r.q} />
									)}
								</Tabs.Content>
								<Tabs.Content value='low'>
									<Text {...help} mb={2}>
										Searched at least 3 times, results showed, and fewer than 15% were opened — the results may not be what shoppers meant. Try one to see what
										they see, then pin the products they meant or boost a brand or collection with a search rule.
									</Text>
									{table(
										data.lowClicks,
										[cols.q, { key: 'shown', label: 'With results', numeric: true, render: r => count(r.searches - r.zero) }, cols.clickRate],
										empty('Nothing to fix here', 'Shoppers open the results of the searches they make often.'),
										r => (
											<Flex gap={1}>
												<TryFix q={r.q} />
												<RuleFixes q={r.q} />
											</Flex>
										)
									)}
								</Tabs.Content>
								<Tabs.Content value='trending'>
									<Text {...help} mb={2}>
										The last 7 days against the 7 before, whatever the period above.
									</Text>
									{data.trending.length ? (
										<DataTable
											columns={[
												{ key: 'q', label: 'Search', render: r => queryCell(r) },
												{ key: 'searches', label: 'Last 7 days', numeric: true, render: r => count(r.searches) },
												{ key: 'before', label: 'The 7 before', numeric: true, render: r => count(r.before) },
												{
													key: 'up',
													label: 'Up',
													numeric: true,
													render: r => (r.isNew ? <Badge size='sm' colorPalette='green' variant='subtle'>new</Badge> : `+${count(r.up)}`),
												},
											]}
											rows={data.trending}
											rowKey={r => r.nq}
											onRowClick={r => setOpen(r.q)}
										/>
									) : (
										empty('Nothing trending', 'No search grew against the week before.')
									)}
								</Tabs.Content>
							</Box>
						</Tabs.Root>
					</Panel>
				</>
			)}
			<QueryDrawer q={open} days={days} onClose={() => setOpen(null)} onOpen={setOpen} />
		</Flex>
	);
};

export default SearchInsights;
