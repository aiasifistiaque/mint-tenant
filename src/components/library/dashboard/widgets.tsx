'use client';

import { DragEvent, FC, ReactNode } from 'react';
import NextLink from 'next/link';
import { Box, Flex, Grid, GridItem, Skeleton, Table, Text } from '@chakra-ui/react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, ExternalLink } from 'lucide-react';
import { radius, useGetAllQuery, useGetConfigQuery, useGetStatsQuery } from '..';
import { humanizeKey, optionQuery } from '../functions/optionFilters';
import { labelOf, viewHrefOf } from '../components/view/utils/record-link/linked';
import { BarList, ColumnChart, DonutChart, LineChart } from './charts';
import {
	RANGE_LABEL,
	SIZE_SPAN,
	Widget,
	defaultTitle,
	formatNumber,
	isReady,
	statsParams,
	withUnit,
} from './types';
import { pagePath } from '../config/lib/constants/panel';
import { useGetTemplateStatsQuery } from '../store/services/templatesApi';
import type { TemplateStatRow } from '../store/services/templatesApi';

/**
 * The dashboard's widgets and the grid they sit in — used by the dashboard
 * (app/page.tsx) and, with `editing`, by the dashboard builder's live preview.
 * Each widget fetches its own route's numbers under the viewer's permissions;
 * one the viewer may not read is left off the dashboard (the builder says so).
 */

type Editing = {
	/** Controls drawn in the widget's header: edit, remove. */
	actions: (w: Widget, index: number) => ReactNode;
	dragIndex: number | null;
	overIndex: number | null;
	onDragStart: (index: number) => void;
	onDragOver: (index: number) => void;
	onDrop: (index: number) => void;
	onDragEnd: () => void;
};

/** `preview`: the builder's dialog — notes instead of hiding, no links out. */
type WidgetProps = { w: Widget; index: number; editing?: Editing; preview?: boolean };

const titleOf = (w: Widget) => w.title?.trim() || defaultTitle(w, humanizeKey(w.route));

/** A route's list page, when the widget has one to link to. */
const pageHref = (w: Widget) => (w.route ? pagePath(w.route) : undefined);

const errorStatus = (error: any) => error?.status ?? error?.originalStatus;
const errorText = (error: any) => error?.data?.message || 'Couldn’t load this widget';

/** The card every widget is drawn in, spanning its share of the grid. */
const Frame: FC<{
	w: Widget;
	index: number;
	editing?: Editing;
	subtitle?: ReactNode;
	children: ReactNode;
}> = ({ w, index, editing, subtitle, children }) => {
	const span = SIZE_SPAN[w.size] || 6;
	const href = pageHref(w);
	const dragging = editing?.dragIndex === index;
	const target = editing && editing.overIndex === index && editing.dragIndex !== null && editing.dragIndex !== index;
	return (
		<GridItem
			colSpan={{ base: 1, md: Math.min(6, span <= 4 ? 3 : 6), xl: span }}
			minW={0}>
			<Flex
				direction='column'
				h='full'
				gap={3}
				p={4}
				bg='bg.panel'
				borderWidth='1px'
				borderStyle={target ? 'dashed' : 'solid'}
				borderColor={target ? 'fg' : 'border'}
				borderRadius={radius.CONTAINER}
				opacity={dragging ? 0.4 : 1}
				draggable={!!editing}
				onDragStart={(e: DragEvent) => {
					if (!editing) return;
					editing.onDragStart(index);
					e.dataTransfer.effectAllowed = 'move';
					e.dataTransfer.setData('text/plain', w.id);
				}}
				onDragOver={(e: DragEvent) => {
					if (!editing) return;
					e.preventDefault();
					editing.onDragOver(index);
				}}
				onDrop={(e: DragEvent) => {
					if (!editing) return;
					e.preventDefault();
					editing.onDrop(index);
				}}
				onDragEnd={editing?.onDragEnd}
				cursor={editing ? 'grab' : undefined}>
				<Flex
					align='flex-start'
					justify='space-between'
					gap={2}>
					<Box minW={0}>
						<Text
							fontSize='sm'
							fontWeight='600'
							truncate
							title={titleOf(w)}>
							{titleOf(w)}
						</Text>
						{subtitle && (
							<Text
								fontSize='xs'
								color='fg.muted'
								truncate>
								{subtitle}
							</Text>
						)}
					</Box>
					<Flex
						gap={1}
						flexShrink={0}
						align='center'>
						{editing
							? editing.actions(w, index)
							: href && (
									<NextLink
										href={href}
										aria-label={`Open ${humanizeKey(w.route)}`}
										title={`Open ${humanizeKey(w.route)}`}>
										<Box
											color='fg.subtle'
											_hover={{ color: 'fg' }}
											p={1}>
											<ExternalLink size={13} />
										</Box>
									</NextLink>
							  )}
					</Flex>
				</Flex>
				<Box
					flex='1'
					minH={0}>
					{children}
				</Box>
			</Flex>
		</GridItem>
	);
};

/** What a widget shows instead of data: not set up yet, no access, or an error. */
const Note: FC<{ children: ReactNode; tone?: 'error' }> = ({ children, tone }) => (
	<Text
		fontSize='xs'
		color={tone === 'error' ? 'red.fg' : 'fg.muted'}>
		{children}
	</Text>
);

/** Loading, errors and the not-set-up case, shared by the three kinds. */
const gateOf = (w: Widget, explain: boolean, query: { isLoading: boolean; error?: any }) => {
	if (!isReady(w)) return { hide: false, node: <Note>{w.route ? 'Finish setting it up — edit it.' : 'Pick the model it reads — edit it.'}</Note> };
	const status = errorStatus(query.error);
	if (status === 403 || status === 401)
		return explain ? { hide: false, node: <Note>You can’t read /{w.route} — admins without access won’t see this widget.</Note> } : { hide: true, node: null };
	if (query.error) return { hide: false, node: <Note tone='error'>{errorText(query.error)}</Note> };
	if (query.isLoading) return { hide: false, node: <Skeleton h='60px' /> };
	return null;
};

const StatWidget: FC<WidgetProps> = ({ w, index, editing, preview }) => {
	const q = useGetStatsQuery({ route: w.route, params: statsParams(w) }, { skip: !isReady(w) });
	const gate = gateOf(w, !!(editing || preview), q);
	if (gate?.hide) return null;
	const value = q.data?.value;
	const previous = q.data?.previous;
	const delta = typeof previous === 'number' && typeof value === 'number' ? value - previous : null;
	const pct = delta !== null && previous ? Math.round((delta / previous) * 100) : null;
	return (
		<Frame
			w={w}
			index={index}
			editing={editing}
			subtitle={RANGE_LABEL[w.range || 'all']}>
			{gate?.node || (
				<Flex
					direction='column'
					gap={1}>
					<Text
						fontSize='2xl'
						fontWeight='700'
						lineHeight='1.1'>
						{withUnit(w, formatNumber(value))}
					</Text>
					{delta !== null && (
						// Direction by arrow and words, not colour: more isn't always better.
						<Flex
							align='center'
							gap={1}
							fontSize='xs'
							color='fg.muted'>
							{delta > 0 ? <ArrowUpRight size={13} /> : delta < 0 ? <ArrowDownRight size={13} /> : <ArrowRight size={13} />}
							<Text>
								{delta === 0
									? 'Same as the period before'
									: `${pct !== null ? `${Math.abs(pct)}% ` : ''}${delta > 0 ? 'up' : 'down'} on the period before (${withUnit(w, formatNumber(previous))})`}
							</Text>
						</Flex>
					)}
				</Flex>
			)}
		</Frame>
	);
};

const ChartWidget: FC<WidgetProps> = ({ w, index, editing, preview }) => {
	const q = useGetStatsQuery({ route: w.route, params: statsParams(w) }, { skip: !isReady(w) });
	const gate = gateOf(w, !!(editing || preview), q);
	if (gate?.hide) return null;
	const title = titleOf(w);
	const format = (v: number) => withUnit(w, formatNumber(v));
	const byField = w.group === 'field';
	const slices = [
		...(q.data?.points || []).map((p: any) => ({ key: p.key, label: p.label, value: p.value })),
		...(q.data?.other ? [{ key: '__other', label: `Other (${q.data.otherCount})`, value: q.data.other, other: true }] : []),
	];
	const empty = byField ? !slices.length : !(q.data?.points || []).some((p: any) => p.value);
	const subtitle = `${RANGE_LABEL[w.range || '30d']}${
		!byField && q.data?.total !== null && q.data?.total !== undefined ? ` · ${format(q.data.total)} in all` : ''
	}`;
	return (
		<Frame
			w={w}
			index={index}
			editing={editing}
			subtitle={subtitle}>
			{gate?.node ||
				(empty ? (
					<Note>Nothing in this range yet.</Note>
				) : byField ? (
					w.chart === 'donut' ? (
						<DonutChart
							slices={slices}
							format={format}
							title={title}
						/>
					) : (
						<BarList
							slices={slices}
							format={format}
							title={title}
						/>
					)
				) : w.chart === 'line' ? (
					<LineChart
						points={q.data.points}
						interval={w.interval || 'day'}
						format={format}
						title={title}
					/>
				) : (
					<ColumnChart
						points={q.data.points}
						interval={w.interval || 'day'}
						format={format}
						title={title}
					/>
				))}
		</Frame>
	);
};

const valueAt = (doc: any, path: string) =>
	String(path || '')
		.split('.')
		.reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), doc);

const DATE_TYPES = ['date', 'date-only', 'datetime'];

/** A cell's value as short text: linked records by name, dates as dates. */
const cellText = (v: any, type?: string, key?: string) => {
	if (v === undefined || v === null || v === '') return '—';
	if (Array.isArray(v)) return v.map(x => (x && typeof x === 'object' ? labelOf(x) : String(x))).filter(Boolean).join(', ') || '—';
	if (typeof v === 'object') return labelOf(v) || '—';
	if (typeof v === 'boolean') return v ? 'Yes' : 'No';
	if (typeof v === 'number') return formatNumber(v);
	if (DATE_TYPES.includes(type || '') || /(At|Date)$/.test(key || '')) {
		const d = new Date(v);
		if (!Number.isNaN(+d)) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
	}
	return String(v);
};

const RecentWidget: FC<WidgetProps> = ({ w, index, editing, preview }) => {
	const list = useGetAllQuery(
		{ path: w.route, limit: w.limit || 5, sort: w.sort || '-createdAt', filters: optionQuery(w.filters, {}).params },
		{ skip: !isReady(w) }
	);
	const config = useGetConfigQuery(w.route, { skip: !w.route });
	const gate = gateOf(w, !!(editing || preview), list);
	if (gate?.hide) return null;
	const schema = config.data?.schema || {};
	const keys = w.columns?.length
		? w.columns
		: (config.data?.table || []).filter((c: any) => c.dataKey && c.type !== 'menu').slice(0, 3).map((c: any) => c.dataKey);
	const columns = (keys.length ? keys : ['name']).map((key: string) => {
		const s = schema[key] || {};
		return { key, title: s.tableLabel || s.label || s.title || humanizeKey(key), dataKey: s.tableKey || key, type: s.tableType || s.type };
	});
	const docs: any[] = list.data?.doc || [];
	return (
		<Frame
			w={w}
			index={index}
			editing={editing}
			subtitle={`${list.data?.totalDocs ?? '—'} in all`}>
			{gate?.node ||
				(!docs.length ? (
					<Note>No records yet.</Note>
				) : (
					<Box
						overflowX='auto'
						mx={-1}>
						<Table.Root
							size='sm'
							variant='line'>
							<Table.Header>
								<Table.Row>
									{columns.map((c: any) => (
										<Table.ColumnHeader
											key={c.key}
											fontSize='xs'
											color='fg.muted'
											px={1}>
											{c.title}
										</Table.ColumnHeader>
									))}
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{docs.map(doc => (
									<Table.Row key={doc._id}>
										{columns.map((c: any, ci: number) => {
											const text = cellText(valueAt(doc, c.dataKey), c.type, c.key);
											return (
												<Table.Cell
													key={c.key}
													fontSize='xs'
													px={1}
													maxW='220px'
													truncate
													title={text}>
													{ci === 0 && !editing && !preview ? (
														<NextLink href={viewHrefOf(w.route, doc._id)}>
															<Text
																as='span'
																fontWeight='500'
																_hover={{ textDecoration: 'underline' }}>
																{text}
															</Text>
														</NextLink>
													) : (
														text
													)}
												</Table.Cell>
											);
										})}
									</Table.Row>
								))}
							</Table.Body>
						</Table.Root>
					</Box>
				))}
		</Frame>
	);
};

const TYPE_WORD: Record<string, string> = { app: 'App', api: 'API', website: 'Website' };

const TemplateRows: FC<{ title: string; rows: TemplateStatRow[]; aside: (t: TemplateStatRow) => ReactNode; empty: string; links: boolean }> = ({ title, rows, aside, empty, links }) => (
	<Box minW={0}>
		<Text
			fontSize='xs'
			fontWeight='600'
			color='fg.muted'
			mb={1}>
			{title}
		</Text>
		{!rows.length && <Note>{empty}</Note>}
		{rows.map(t => (
			<Flex
				key={t.key}
				align='center'
				gap={2}
				py={1}
				fontSize='xs'
				borderTopWidth='1px'
				borderColor='border.muted'
				_first={{ borderTopWidth: 0 }}>
				<Text
					flex={1}
					truncate
					fontWeight='500'>
					{links ? (
						<NextLink href={`/templates/${t.key}`}>
							<Text
								as='span'
								_hover={{ textDecoration: 'underline' }}>
								{t.name}
							</Text>
						</NextLink>
					) : (
						t.name
					)}
				</Text>
				<Text color='fg.muted'>{TYPE_WORD[t.type] || t.type}</Text>
				{aside(t)}
			</Flex>
		))}
	</Box>
);

/** Template Studio at a glance (docs/templates T-11): counts, the most used, the recently changed. */
const TemplatesWidget: FC<WidgetProps> = ({ w, index, editing, preview }) => {
	const q = useGetTemplateStatsQuery();
	const explain = !!(editing || preview);
	const status = errorStatus(q.error);
	if ((status === 403 || status === 401) && !explain) return null;
	const d = q.data;
	const links = !editing && !preview;
	const tiles: [string, number | undefined, string?][] = [
		['Published', d?.published],
		['Drafts', d?.drafts],
		['With problems', d?.withProblems, d?.withProblems ? 'red.fg' : undefined],
		['Archived', d?.archived],
	];
	return (
		<Frame
			w={{ ...w, route: links ? 'templates' : '' }}
			index={index}
			editing={editing}
			subtitle='Blueprints tenants start projects from'>
			{status === 403 || status === 401 ? (
				<Note>You can’t view templates — admins without access won’t see this widget.</Note>
			) : q.error ? (
				<Note tone='error'>{errorText(q.error)}</Note>
			) : !d ? (
				<Skeleton h='120px' />
			) : (
				<Flex
					direction='column'
					gap={4}>
					<Grid
						templateColumns='repeat(4, minmax(0, 1fr))'
						gap={3}>
						{tiles.map(([label, n, color]) => (
							<Box key={label}>
								<Text
									fontSize='2xl'
									fontWeight='600'
									lineHeight='1.1'
									color={color}>
									{formatNumber(n ?? 0)}
								</Text>
								<Text
									fontSize='xs'
									color='fg.muted'>
									{label}
								</Text>
							</Box>
						))}
					</Grid>
					<Grid
						templateColumns={{ base: '1fr', md: '1fr 1fr' }}
						gap={4}>
						<TemplateRows
							title='Most used'
							rows={d.mostUsed}
							links={links}
							empty='Nothing published yet.'
							aside={t => (
								<Text
									color='fg.muted'
									whiteSpace='nowrap'>
									{t.applied} project{t.applied === 1 ? '' : 's'} · {t.previews} preview{t.previews === 1 ? '' : 's'}
								</Text>
							)}
						/>
						<TemplateRows
							title='Recently changed'
							rows={d.recent}
							links={links}
							empty='No templates yet.'
							aside={t => (
								<Text
									whiteSpace='nowrap'
									color={t.errors ? 'red.fg' : 'fg.muted'}>
									{t.errors ? `${t.errors} to fix · ` : ''}
									{t.status === 'published' ? `v${t.version}` : t.status} · {new Date(t.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
								</Text>
							)}
						/>
					</Grid>
				</Flex>
			)}
		</Frame>
	);
};

export const WidgetView: FC<WidgetProps> = props =>
	props.w.type === 'templates' ? (
		<TemplatesWidget {...props} />
	) : props.w.type === 'stat' ? (
		<StatWidget {...props} />
	) : props.w.type === 'chart' ? (
		<ChartWidget {...props} />
	) : (
		<RecentWidget {...props} />
	);

/** The dashboard's grid: 12 columns wide, 6 on a tablet, one on a phone. */
export const DashboardGrid: FC<{ widgets: Widget[]; editing?: Editing; preview?: boolean }> = ({ widgets, editing, preview }) => (
	<Grid
		templateColumns={{ base: '1fr', md: 'repeat(6, minmax(0, 1fr))', xl: 'repeat(12, minmax(0, 1fr))' }}
		gap={3}
		alignItems='stretch'>
		{widgets.map((w, i) => (
			<WidgetView
				key={w.id}
				w={w}
				index={i}
				editing={editing}
				preview={preview}
			/>
		))}
	</Grid>
);
