import { OptionFilter, optionQuery } from '../functions/optionFilters';

/**
 * A dashboard widget, as the dashboard builder saves it (backend
 * dashboard.controller.ts checks the same shape). Each reads one route:
 *
 * - stat: one number — a count, sum or average over a time range;
 * - chart: a series over time (bar / line) or a breakdown by a field (bar / donut);
 * - recent: the latest records, with chosen columns.
 *
 * `filters` are fixed-value conditions on the route's fields, sent as its
 * list filters (the same shape a record picker's optionFilters have).
 */

/** `templates`: Template Studio's overview — the super admin panel only (docs/templates T-11). */
export type WidgetType = 'stat' | 'chart' | 'recent' | 'templates';
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type Metric = 'count' | 'sum' | 'avg';
export type Range = 'all' | 'today' | '7d' | '30d' | '90d' | 'month' | '12m' | 'year';
export type Interval = 'day' | 'week' | 'month';

export type Widget = {
	id: string;
	type: WidgetType;
	route: string;
	title?: string;
	size: WidgetSize;
	filters?: OptionFilter[];
	// stat & chart
	metric?: Metric;
	field?: string;
	range?: Range;
	dateField?: string;
	prefix?: string;
	suffix?: string;
	// stat
	compare?: boolean;
	// chart
	group?: 'time' | 'field';
	chart?: 'bar' | 'line' | 'donut';
	interval?: Interval;
	by?: string;
	limit?: number;
	// recent
	columns?: string[];
	sort?: string;
};

/** Columns out of 12 on a wide screen; every widget is full width on a phone. */
export const SIZE_SPAN: Record<WidgetSize, number> = { sm: 3, md: 4, lg: 6, xl: 8, full: 12 };
export const SIZE_LABEL: Record<WidgetSize, string> = {
	sm: 'Quarter',
	md: 'Third',
	lg: 'Half',
	xl: 'Two thirds',
	full: 'Full width',
};

export const RANGE_LABEL: Record<Range, string> = {
	today: 'Today',
	'7d': 'Last 7 days',
	'30d': 'Last 30 days',
	'90d': 'Last 90 days',
	month: 'This month',
	'12m': 'Last 12 months',
	year: 'This year',
	all: 'All time',
};

export const TYPE_LABEL: Record<WidgetType, string> = { stat: 'Number', chart: 'Chart', recent: 'Recent items', templates: 'Templates overview' };

/** A donut's slices beyond these fold into "Other" — the palette's validated hues. */
export const DONUT_MAX = 7;

export const newId = () => `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const newWidget = (type: WidgetType): Widget => {
	const base = { id: newId(), type, route: '', title: '', filters: [] };
	if (type === 'templates') return { ...base, route: 'templates', size: 'full' };
	if (type === 'stat') return { ...base, size: 'sm', metric: 'count', range: 'all', dateField: 'createdAt' };
	if (type === 'chart')
		return { ...base, size: 'lg', metric: 'count', range: '30d', dateField: 'createdAt', group: 'time', chart: 'bar', interval: 'day' };
	return { ...base, size: 'lg', columns: [], limit: 5, sort: '-createdAt' };
};

/** The viewer's time zone, so "today" and each day's bar are theirs. */
export const viewerTz = () => {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	} catch {
		return 'UTC';
	}
};

/** What a stat or chart widget asks its route's /get/stats for. */
export const statsParams = (w: Widget) => {
	const p: Record<string, any> = {
		metric: w.metric || 'count',
		range: w.range || 'all',
		dateField: w.dateField || 'createdAt',
		tz: viewerTz(),
		...optionQuery(w.filters, {}).params,
	};
	if (w.metric && w.metric !== 'count' && w.field) p.field = w.field;
	if (w.type === 'stat') {
		p.group = 'none';
		if (w.compare && w.range !== 'all') p.compare = '1';
	} else {
		p.group = w.group || 'time';
		if (p.group === 'time') p.interval = w.interval || 'day';
		else {
			p.by = w.by;
			p.limit = w.chart === 'donut' ? Math.min(w.limit || 6, DONUT_MAX) : w.limit || 6;
		}
	}
	return p;
};

/** Is it complete enough to fetch? */
export const isReady = (w: Widget) => {
	if (!w.route) return false;
	if ((w.type === 'stat' || w.type === 'chart') && w.metric && w.metric !== 'count' && !w.field) return false;
	if (w.type === 'chart' && w.group === 'field' && !w.by) return false;
	return true;
};

/** 1234567 -> "1,234,567"; averages keep two decimals. */
export const formatNumber = (n: any, decimals = 2) =>
	typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: decimals }) : '—';

/** Axis ticks: 1.2k, 3.4M. */
export const formatCompact = (n: number) =>
	Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 }) : formatNumber(n, 1);

export const withUnit = (w: Pick<Widget, 'prefix' | 'suffix'>, text: string) =>
	`${w.prefix ? `${w.prefix} ` : ''}${text}${w.suffix ? ` ${w.suffix}` : ''}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A time bucket's key as people read it: "Sep 21", "Week 39", "Sep 2026". */
export const bucketLabel = (key: string, interval: Interval = 'day', long = false) => {
	const week = key.match(/^(\d{4})-W(\d{2})$/);
	if (week) return long ? `Week ${+week[2]}, ${week[1]}` : `W${+week[2]}`;
	const [y, m, d] = key.split('-').map(Number);
	if (interval === 'month' || d === undefined) return long ? `${MONTHS[m - 1]} ${y}` : `${MONTHS[m - 1]}${m === 1 ? ` ${String(y).slice(2)}` : ''}`;
	return long ? `${MONTHS[m - 1]} ${d}, ${y}` : `${MONTHS[m - 1]} ${d}`;
};

/** A readable title when none is set: "Projects · count, last 30 days". */
export const defaultTitle = (w: Widget, modelLabel?: string) => {
	if (w.type === 'templates') return 'Templates';
	const what = modelLabel || w.route || 'Pick a model';
	if (w.type === 'recent') return `Latest ${what.toLowerCase()}`;
	const metric = w.metric === 'sum' ? `Total ${w.field || ''}` : w.metric === 'avg' ? `Average ${w.field || ''}` : '';
	const by = w.type === 'chart' && w.group === 'field' && w.by ? ` by ${w.by}` : '';
	return `${metric ? `${metric.trim()} · ` : ''}${what}${by}`;
};
