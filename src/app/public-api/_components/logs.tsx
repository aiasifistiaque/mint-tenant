'use client';

import { FC, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Dialog, Flex, Grid, Input, Portal, Skeleton, Switch, Text } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Copy, Search } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '@/components/library';
import { Dropdown, EmptyState, Panel, StatTile, when } from '@/components/library/cl';
import { ago } from '@/components/library/modals/CreateModal/CreateModal';
import { PALETTE_CSS } from '@/components/library/dashboard/charts';
import { useWorkspace } from '@/components/library/tenant';
import {
	ApiLog,
	ApiLogFilters,
	ApiLogPeriod,
	ApiLogSummary,
	useGetApiEndpointsQuery,
	useGetApiRequestLogSummaryQuery,
	useGetApiRequestLogsQuery,
} from '@/components/library/store/services/apiBuilderApi';
import { TONES, Tone } from '@/theme/tones';
import { MethodBadge, apiBase, apiHref, useProjectKey, whoOf } from './shared';
import { withKey } from './api';

/**
 * The API's request logs (backend docs/api-builder AB-06): every call to the
 * project's API over the last hour, day or week — the numbers and a chart of
 * calls that worked and failed, the commonest errors, then the calls
 * themselves, newest first, each opening to the whole story (who called,
 * which endpoint answered, the error they got, where from, as curl). Used on
 * API → Logs, an endpoint's Logs tab (fixed to it) and, as a glance, on the
 * Overview. Kept 7 days; never bodies, tokens or IP addresses.
 */

export const PERIODS: { value: ApiLogPeriod; label: string }[] = [
	{ value: 1, label: 'Last hour' },
	{ value: 24, label: 'Last 24 hours' },
	{ value: 168, label: 'Last 7 days' },
];

const STATUSES = [
	{ value: '', label: 'Any answer' },
	{ value: 'ok', label: 'Worked (2xx–3xx)' },
	{ value: 'errors', label: 'Failed (4xx–5xx)' },
	{ value: '4xx', label: 'Refused (4xx)' },
	{ value: '5xx', label: 'Server errors (5xx)' },
];

const WHO_ITEMS = [
	{ value: '', label: 'Anyone calling' },
	{ value: 'anyone', label: 'No sign-in' },
	{ value: 'customer', label: 'Signed-in customers' },
	{ value: 'key', label: 'Server keys' },
];

/** What each status means, for the dialog. */
const STATUS_MEANS: Record<number, string> = {
	200: 'OK',
	201: 'Created',
	204: 'No content',
	304: 'Not modified',
	400: 'Bad request — what was sent didn’t pass the checks',
	401: 'Not signed in, or no valid server key',
	403: 'Not allowed — a rule refused it',
	404: 'Not found — no such endpoint or record',
	409: 'Conflict',
	413: 'Too large',
	429: 'Too many calls — slowed down',
	500: 'Something went wrong on the server',
};

const toneOf = (status: number): Tone => (status >= 500 ? 'rose' : status >= 400 ? 'amber' : status >= 300 ? 'sky' : 'emerald');

export const StatusBadge: FC<{ status: number }> = ({ status }) => {
	const t = TONES[toneOf(status)];
	return (
		<Box
			as='span'
			display='inline-flex'
			justifyContent='center'
			flexShrink={0}
			minW='40px'
			px={1.5}
			py='2px'
			borderRadius='md'
			fontFamily='mono'
			fontSize='11px'
			fontWeight='500'
			color={t.fg}
			bg={t.soft}>
			{status}
		</Box>
	);
};

const pad = (n: number) => String(n).padStart(2, '0');
/** 14:05:09 today; Oct 12 14:05 before. */
const clock = (iso: string) => {
	const d = new Date(iso);
	const today = new Date().toDateString() === d.toDateString();
	const time = `${pad(d.getHours())}:${pad(d.getMinutes())}${today ? `:${pad(d.getSeconds())}` : ''}`;
	return today ? time : `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`;
};
const ms = (v: number | null | undefined) => (v == null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${v} ms`);
const callerOf = (c: ApiLog) => (c.key ? `Key “${c.key.name}”` : c.customer ? c.customer.email : whoOf('anyone').short);

/* --------------------------------------------------------------- chart */

/** A bar's label: 14:05 (an hour), 14:00 (a day), Mon 12:00 (a week). */
const barLabel = (iso: string, hours: number, long = false) => {
	const d = new Date(iso);
	const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
	if (hours === 168 || long) return `${d.toLocaleDateString('en-US', { weekday: 'short', ...(long && { month: 'short', day: 'numeric' }) })} ${hm}`;
	return hm;
};

const AXIS_TICK = { fontSize: 11, fill: 'var(--chakra-colors-fg-muted)' };

/** Calls per bar, those that worked under those that failed. */
export const LogChart: FC<{ summary: ApiLogSummary; height?: number }> = ({ summary, height = 160 }) => {
	const chart = useChart({
		data: summary.series.map(s => ({ key: s.at, ok: s.ok, errors: s.errors })),
		series: [
			{ name: 'ok', color: 'var(--series-1)', label: 'Worked' },
			{ name: 'errors', color: 'var(--series-5)', label: 'Failed' },
		],
	});
	return (
		<Box css={PALETTE_CSS}>
			<Chart.Root
				chart={chart}
				w='full'
				h={`${height}px`}
				aspectRatio='auto'
				aria-label='Calls over time'>
				<BarChart
					responsive
					style={{ width: '100%', height: '100%' }}
					data={chart.data}
					margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
					<CartesianGrid
						stroke='var(--chakra-colors-border-muted)'
						strokeDasharray='3 3'
						vertical={false}
					/>
					<XAxis
						dataKey='key'
						axisLine={false}
						tickLine={false}
						tickMargin={8}
						minTickGap={24}
						tick={AXIS_TICK}
						tickFormatter={(k: string) => barLabel(k, summary.hours)}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						width={40}
						allowDecimals={false}
						tick={AXIS_TICK}
					/>
					<Tooltip
						cursor={{ fill: 'var(--chakra-colors-bg-muted)', radius: 4 }}
						animationDuration={100}
						labelFormatter={(k: any) => barLabel(String(k), summary.hours, true)}
						content={<Chart.Tooltip />}
					/>
					{chart.series.map((s, i) => (
						<Bar
							key={String(s.name)}
							dataKey={chart.key(s.name)}
							name={String(s.name)}
							stackId='calls'
							fill={chart.color(s.color)}
							radius={i === chart.series.length - 1 ? [3, 3, 0, 0] : 0}
							maxBarSize={22}
							animationDuration={400}
						/>
					))}
				</BarChart>
			</Chart.Root>
		</Box>
	);
};

/* ------------------------------------------------------------- numbers */

const Tiles: FC<{ summary?: ApiLogSummary; loading?: boolean }> = ({ summary, loading }) => {
	const rate = summary?.total ? Math.round((summary.errors / summary.total) * 1000) / 10 : 0;
	return (
		<Grid
			templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }}
			gap={3}>
			<StatTile
				label='Calls'
				value={(summary?.total ?? 0).toLocaleString()}
				isLoading={loading}
			/>
			<StatTile
				label='Failed'
				value={(summary?.errors ?? 0).toLocaleString()}
				hint={summary?.total ? `${rate}% of calls` : 'no calls yet'}
				isLoading={loading}
			/>
			<StatTile
				label='Typical time'
				value={ms(summary?.avgMs)}
				hint='on average'
				isLoading={loading}
			/>
			<StatTile
				label='Slowest 5%'
				value={summary?.p95Ms == null ? '—' : `over ${ms(summary.p95Ms)}`}
				hint='95% answer faster'
				isLoading={loading}
			/>
		</Grid>
	);
};

const TopErrors: FC<{ summary: ApiLogSummary; onPick?: (e: ApiLogSummary['topErrors'][number]) => void }> = ({ summary, onPick }) => (
	<Panel
		title='Commonest errors'
		subtitle='What callers were told most often.'
		flush>
		{summary.topErrors.map((e, i) => (
			<Flex
				key={i}
				as={onPick ? 'button' : 'div'}
				w='full'
				textAlign='left'
				align='center'
				gap={3}
				px={4}
				py={2.5}
				borderTopWidth='1px'
				borderColor='border.muted'
				_first={{ borderTopWidth: 0 }}
				cursor={onPick ? 'pointer' : undefined}
				_hover={onPick ? { bg: 'bg.subtle' } : undefined}
				onClick={onPick ? () => onPick(e) : undefined}>
				<StatusBadge status={e.status} />
				<Box
					flex={1}
					minW={0}>
					<Text
						fontSize='13px'
						truncate>
						{e.error || STATUS_MEANS[e.status] || 'No message'}
					</Text>
					<Text
						fontSize='12px'
						color='fg.muted'
						truncate>
						{[e.code, e.endpoint || 'no endpoint', `last ${ago(e.last)}`].filter(Boolean).join(' · ')}
					</Text>
				</Box>
				<Text
					fontSize='12.5px'
					fontFamily='mono'
					color='fg.muted'
					flexShrink={0}>
					×{e.count}
				</Text>
			</Flex>
		))}
	</Panel>
);

/* --------------------------------------------------------------- a call */

const Detail: FC<{ label: string; children: React.ReactNode; mono?: boolean }> = ({ label, children, mono }) => (
	<Flex
		gap={3}
		py={2}
		borderTopWidth='1px'
		borderColor='border.muted'
		_first={{ borderTopWidth: 0 }}
		direction={{ base: 'column', sm: 'row' }}>
		<Text
			w={{ sm: '120px' }}
			flexShrink={0}
			fontSize='12.5px'
			color='fg.muted'>
			{label}
		</Text>
		<Box
			flex={1}
			minW={0}
			fontSize='13px'
			fontFamily={mono ? 'mono' : undefined}
			wordBreak='break-all'>
			{children}
		</Box>
	</Flex>
);

/** The call as a curl command: where it went, with the header it needs — never a real secret. */
const curlOf = (c: ApiLog, base: string, apiKey: string) => {
	const url = withKey(`${base}${c.path}${c.query ? `?${c.query}` : ''}`, apiKey);
	const lines = [`curl${c.method === 'GET' ? '' : ` -X ${c.method}`} '${url}'`];
	if (c.key) lines.push(`  -H "Authorization: Bearer $MINT_SERVER_KEY"`);
	else if (c.customer) lines.push(`  -H "Authorization: Bearer <the customer’s token>"`);
	if (['POST', 'PUT'].includes(c.method)) lines.push(`  -H "Content-Type: application/json" -d '{…}'`);
	return lines.join(' \\\n');
};

const LogDialog: FC<{ call: ApiLog | null; onClose: () => void; base: string; fixedEndpoint?: boolean }> = ({ call, onClose, base, fixedEndpoint }) => {
	const [copied, setCopied] = useState(false);
	const c = call;
	const apiKey = useProjectKey();
	const curl = c ? curlOf(c, base, apiKey) : '';
	return (
		<Dialog.Root
			placement='center'
			size='lg'
			open={!!c}
			scrollBehavior='inside'
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						borderWidth='1px'
						borderColor='border'
						_dark={{ bg: 'background.dark' }}>
						<AlertDialogHeader>
							{c && (
								<Flex
									align='center'
									gap={2}
									minW={0}>
									<StatusBadge status={c.status} />
									<MethodBadge method={c.method} />
									<Text
										as='span'
										fontFamily='mono'
										fontSize='14px'
										fontWeight='400'
										letterSpacing='0'
										textTransform='none'
										truncate>
										{c.path}
									</Text>
								</Flex>
							)}
						</AlertDialogHeader>
						<Dialog.Body
							p={4}
							pb={5}>
							{c && (
								<>
									{c.status >= 400 && (
										<Box
											mb={3}
											p={3}
											borderRadius='lg'
											bg={TONES[toneOf(c.status)].soft}
											color={TONES[toneOf(c.status)].fg}>
											<Text
												fontSize='13px'
												fontWeight='500'
												color='inherit'>
												{c.error || STATUS_MEANS[c.status] || 'No message'}
											</Text>
											{c.code && (
												<Text
													fontSize='12px'
													fontFamily='mono'
													color='inherit'
													mt={0.5}>
													code: {c.code}
												</Text>
											)}
										</Box>
									)}
									<Detail label='When'>
										{when(c.at)} · {ago(c.at)}
									</Detail>
									<Detail label='Answer'>
										{c.status} — {STATUS_MEANS[c.status] || (c.status < 400 ? 'Worked' : 'Failed')}
									</Detail>
									<Detail label='Took'>{ms(c.ms)}</Detail>
									<Detail
										label='Address'
										mono>
										{c.method} {c.path}
										{c.query ? `?${c.query}` : ''}
									</Detail>
									<Detail label='Endpoint'>
										{c.endpoint ? (
											fixedEndpoint ? (
												c.endpoint.name
											) : (
												<NextLink href={apiHref(`/endpoints/${c.endpoint._id}`)}>
													<Text
														as='span'
														fontSize='inherit'
														textDecoration='underline'
														textUnderlineOffset='2px'>
														{c.endpoint.name}
													</Text>
												</NextLink>
											)
										) : (
											<Text
												as='span'
												fontSize='inherit'
												color='fg.muted'>
												None — {c.path.startsWith('/auth') ? 'customer sign-in' : c.status === 404 ? 'no endpoint at this address' : 'a built-in address (cart, shop, widgets…)'}
											</Text>
										)}
									</Detail>
									<Detail label='Who called'>
										{c.key ? `Server key “${c.key.name}”` : c.customer ? `Signed-in customer ${c.customer.email}` : 'Anyone — no sign-in, no key'}
									</Detail>
									<Detail label='From'>
										{c.origin || <Text as='span' fontSize='inherit' color='fg.muted'>No calling site (a server, an app, curl)</Text>}
									</Detail>
									<Detail label='Client'>{c.client || '—'}</Detail>
									<Box mt={4}>
										<Flex
											align='center'
											justify='space-between'
											mb={1.5}>
											<Text
												fontSize='12.5px'
												fontWeight='500'>
												As curl
											</Text>
											<Button
												size='2xs'
												variant='ghost'
												onClick={() => {
													navigator.clipboard?.writeText(curl);
													setCopied(true);
													setTimeout(() => setCopied(false), 1500);
												}}>
												{copied ? 'Copied' : <Copy size={13} />}
											</Button>
										</Flex>
										<Box
											as='pre'
											m={0}
											p={3}
											fontSize='12px'
											fontFamily='mono'
											whiteSpace='pre-wrap'
											wordBreak='break-all'
											bg='bg.subtle'
											borderWidth='1px'
											borderColor='border'
											borderRadius='md'>
											{curl}
										</Box>
										<Text
											mt={1.5}
											fontSize='12px'
											color='fg.muted'>
											The log never keeps what was sent, tokens or keys — fill those in to repeat the call.
										</Text>
									</Box>
								</>
							)}
						</Dialog.Body>
						<ModalFooter>
							{c?.endpoint && !fixedEndpoint && (
								<Button
									size='sm'
									variant='outline'
									px={3}
									asChild>
									<NextLink href={apiHref(`/endpoints/${c.endpoint._id}`)}>
										Open the endpoint
										<ArrowRight size={14} />
									</NextLink>
								</Button>
							)}
							<Button
								size='sm'
								px={3}
								onClick={onClose}>
								Close
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

/* ---------------------------------------------------------------- calls */

const LogRow: FC<{ c: ApiLog; showEndpoint: boolean; onOpen: () => void }> = ({ c, showEndpoint, onOpen }) => (
	<Flex
		as='button'
		w='full'
		textAlign='left'
		align='center'
		gap={3}
		px={4}
		py={2.5}
		borderTopWidth='1px'
		borderColor='border.muted'
		_first={{ borderTopWidth: 0 }}
		_hover={{ bg: 'bg.subtle' }}
		cursor='pointer'
		onClick={onOpen}>
		<Text
			display={{ base: 'none', md: 'block' }}
			w='92px'
			flexShrink={0}
			fontSize='12px'
			fontFamily='mono'
			color='fg.muted'
			title={when(c.at)}>
			{clock(c.at)}
		</Text>
		<StatusBadge status={c.status} />
		<MethodBadge method={c.method} />
		<Box
			flex={1}
			minW={0}>
			<Text
				fontSize='13px'
				fontFamily='mono'
				truncate>
				{c.path}
				{c.query && (
					<Text
						as='span'
						fontSize='inherit'
						fontFamily='inherit'
						color='fg.muted'>
						?{c.query}
					</Text>
				)}
			</Text>
			{c.status >= 400 && c.error && (
				<Text
					fontSize='12px'
					color={TONES[toneOf(c.status)].fg}
					truncate>
					{c.error}
				</Text>
			)}
			<Text
				display={{ base: 'block', md: 'none' }}
				fontSize='12px'
				color='fg.muted'
				truncate>
				{clock(c.at)} · {callerOf(c)} · {ms(c.ms)}
			</Text>
		</Box>
		{showEndpoint && (
			<Text
				display={{ base: 'none', lg: 'block' }}
				w='170px'
				flexShrink={0}
				fontSize='12.5px'
				color='fg.muted'
				truncate>
				{c.endpoint?.name || '—'}
			</Text>
		)}
		<Text
			display={{ base: 'none', md: 'block' }}
			w='170px'
			flexShrink={0}
			fontSize='12.5px'
			color='fg.muted'
			truncate>
			{callerOf(c)}
		</Text>
		<Text
			display={{ base: 'none', md: 'block' }}
			w='62px'
			flexShrink={0}
			textAlign='right'
			fontSize='12px'
			fontFamily='mono'
			color='fg.muted'>
			{ms(c.ms)}
		</Text>
	</Flex>
);

const PAGE = 50;
const MAX = 200;

type ApiLogsProps = {
	/** Fixed to one endpoint (its Logs tab): no endpoint filter, no endpoint column. */
	endpointId?: string;
	/** Filters to start from (from the address: ?status=errors&endpoint=…). */
	initial?: Partial<ApiLogFilters>;
	/** Keep the filters in the address, so a reload or a shared link keeps them. */
	syncUrl?: boolean;
};

/** API → Logs, and an endpoint's Logs tab. */
export const ApiLogs: FC<ApiLogsProps> = ({ endpointId, initial, syncUrl }) => {
	const { project } = useWorkspace();
	const [filters, setFilters] = useState<ApiLogFilters>({ hours: 24, status: '', endpoint: '', who: '', q: '', ...initial });
	const [search, setSearch] = useState(initial?.q || '');
	const [live, setLive] = useState(false);
	const [limit, setLimit] = useState(PAGE);
	const [open, setOpen] = useState<ApiLog | null>(null);
	const set = (patch: Partial<ApiLogFilters>) => {
		setFilters(f => ({ ...f, ...patch }));
		setLimit(PAGE);
	};
	// The search box waits for a pause in typing.
	useEffect(() => {
		const t = setTimeout(() => search !== filters.q && set({ q: search.trim() }), 350);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search]);
	useEffect(() => {
		if (!syncUrl) return;
		const url = new URL(window.location.href);
		for (const k of ['hours', 'status', 'endpoint', 'who', 'q'] as const) {
			const v = filters[k];
			if (v && !(k === 'hours' && v === 24)) url.searchParams.set(k, String(v));
			else url.searchParams.delete(k);
		}
		window.history.replaceState(null, '', url.toString());
	}, [filters, syncUrl]);

	const query = { ...filters, ...(endpointId && { endpoint: endpointId }) };
	const poll = { pollingInterval: live ? 5000 : 0, skipPollingIfUnfocused: true, refetchOnMountOrArgChange: true };
	const { data: summary, isLoading: loadingSum } = useGetApiRequestLogSummaryQuery(query, poll);
	const { data, isLoading, isFetching } = useGetApiRequestLogsQuery({ ...query, limit }, poll);
	const { data: eps } = useGetApiEndpointsQuery(undefined, { skip: !!endpointId });
	const calls = data?.doc || [];
	const filtered = !!(filters.status || (!endpointId && filters.endpoint) || filters.who || filters.q);

	return (
		<Flex
			direction='column'
			gap={4}>
			<Flex
				gap={2}
				wrap='wrap'
				align='center'>
				<Box w={{ base: 'calc(50% - 4px)', md: '150px' }}>
					<Dropdown
						size='sm'
						value={String(filters.hours)}
						onChange={v => set({ hours: Number(v) as ApiLogPeriod })}
						items={PERIODS.map(p => ({ value: String(p.value), label: p.label }))}
					/>
				</Box>
				<Box w={{ base: 'calc(50% - 4px)', md: '170px' }}>
					<Dropdown
						size='sm'
						value={filters.status || ''}
						onChange={v => set({ status: v })}
						items={STATUSES}
					/>
				</Box>
				{!endpointId && (
					<Box w={{ base: 'calc(50% - 4px)', md: '200px' }}>
						<Dropdown
							size='sm'
							value={filters.endpoint || ''}
							onChange={v => set({ endpoint: v })}
							items={[
								{ value: '', label: 'Every endpoint' },
								{ value: 'none', label: 'No endpoint (sign-in, cart, unknown)' },
								...(eps?.doc || []).map(e => ({ value: e._id, label: `${e.method} ${e.path}` })),
							]}
						/>
					</Box>
				)}
				<Box w={{ base: endpointId ? '100%' : 'calc(50% - 4px)', md: '170px' }}>
					<Dropdown
						size='sm'
						value={filters.who || ''}
						onChange={v => set({ who: v })}
						items={WHO_ITEMS}
					/>
				</Box>
				<Flex
					flex={{ base: '1 1 100%', md: '1 1 160px' }}
					align='center'
					position='relative'>
					<Box
						position='absolute'
						left={2.5}
						zIndex={1}
						display='flex'
						color='fg.muted'
						pointerEvents='none'>
						<Search size={14} />
					</Box>
					<Input
						size='sm'
						pl={8}
						bg='bg.panel'
						value={search}
						onChange={e => setSearch(e.target.value)}
						placeholder='Path, query, error or email'
						aria-label='Search the calls'
					/>
				</Flex>
				<Flex
					as='label'
					align='center'
					gap={2}
					fontSize='13px'
					cursor='pointer'
					title='Checks for new calls every 5 seconds'>
					<Switch.Root
						size='sm'
						checked={live}
						onCheckedChange={d => setLive(d.checked)}>
						<Switch.HiddenInput />
						<Switch.Control />
					</Switch.Root>
					Live
				</Flex>
			</Flex>

			<Tiles
				summary={summary}
				loading={loadingSum}
			/>

			{summary && summary.total > 0 && (
				<Panel
					title='Calls over time'
					subtitle={`${PERIODS.find(p => p.value === summary.hours)?.label} — calls that worked, and those that failed on top.`}>
					<LogChart summary={summary} />
				</Panel>
			)}

			{summary && summary.topErrors.length > 0 && filters.status !== 'ok' && (
				<TopErrors
					summary={summary}
					onPick={e => {
						setSearch(e.error);
						set({ status: String(e.status), q: e.error });
					}}
				/>
			)}

			<Panel
				title='Calls'
				subtitle={isFetching && !isLoading ? 'Updating…' : 'Newest first. Open one for who called, the endpoint, the error and a curl.'}
				actions={
					filtered && (
						<Button
							size='xs'
							variant='ghost'
							onClick={() => {
								setSearch('');
								set({ status: '', endpoint: '', who: '', q: '' });
							}}>
							Clear filters
						</Button>
					)
				}
				flush>
				{isLoading ? (
					<Box p={4}>
						<Skeleton h='120px' />
					</Box>
				) : calls.length ? (
					<>
						{calls.map(c => (
							<LogRow
								key={c._id}
								c={c}
								showEndpoint={!endpointId}
								onOpen={() => setOpen(c)}
							/>
						))}
						{data?.hasMore && (
							<Flex
								justify='center'
								p={3}
								borderTopWidth='1px'
								borderColor='border.muted'>
								{limit < MAX ? (
									<Button
										size='xs'
										variant='outline'
										loading={isFetching}
										onClick={() => setLimit(l => Math.min(l + PAGE, MAX))}>
										Show more
									</Button>
								) : (
									<Text
										fontSize='12.5px'
										color='fg.muted'>
										Showing the newest {MAX} — narrow the period or filters to see the others.
									</Text>
								)}
							</Flex>
						)}
					</>
				) : (
					<Box p={4}>
						<EmptyState
							title={filtered ? 'No calls match' : 'No calls yet'}
							description={
								filtered
									? 'Try another period, or clear the filters.'
									: `Nothing has called ${endpointId ? 'this endpoint' : 'the API'} in this period. Calls show here a moment after they’re made, and are kept 7 days.`
							}
						/>
					</Box>
				)}
			</Panel>

			<LogDialog
				call={open}
				onClose={() => setOpen(null)}
				base={apiBase()}
				fixedEndpoint={!!endpointId}
			/>
		</Flex>
	);
};

/** The Overview's glance: the last 24 hours' numbers and chart, and a way into the logs. */
export const LogsGlance: FC = () => {
	const { data, isLoading } = useGetApiRequestLogSummaryQuery({ hours: 24 }, { refetchOnMountOrArgChange: true });
	return (
		<Panel
			title='Last 24 hours'
			subtitle={
				data?.total
					? `${data.total.toLocaleString()} call${data.total === 1 ? '' : 's'}, ${data.errors.toLocaleString()} failed${data.avgMs != null ? `, typically ${ms(data.avgMs)}` : ''}.`
					: 'No calls in the last 24 hours.'
			}
			actions={
				<Flex gap={2}>
					{!!data?.errors && (
						<Button
							size='xs'
							variant='outline'
							asChild>
							<NextLink href={`${apiHref('/logs')}?status=errors`}>See what failed</NextLink>
						</Button>
					)}
					<Button
						size='xs'
						variant='ghost'
						asChild>
						<NextLink href={apiHref('/logs')}>
							Logs
							<ArrowRight size={13} />
						</NextLink>
					</Button>
				</Flex>
			}>
			{isLoading ? (
				<Skeleton h='120px' />
			) : data?.total ? (
				<LogChart
					summary={data}
					height={130}
				/>
			) : (
				<Text
					fontSize='13px'
					color='fg.muted'>
					Every call to the API shows in Logs — who called, which endpoint answered, and the error if it failed.
				</Text>
			)}
		</Panel>
	);
};
