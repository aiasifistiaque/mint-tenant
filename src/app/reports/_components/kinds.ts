import { ChartColumn, List, Rows3 } from 'lucide-react';

/** The three kinds of report (docs/panel-users D7), in the words the panels use. */
export const KIND = {
	list: { label: 'List', icon: List, hint: 'Records as rows, with the columns you pick and a Total row' },
	summary: { label: 'Summary', icon: Rows3, hint: 'One row per value of a field — per shed, per breed — with counts and totals' },
	timeline: { label: 'Over time', icon: ChartColumn, hint: 'One row per day, week, month or year, with counts and totals' },
} as const;

export const RANGES = [
	{ value: 'all', label: 'All time' },
	{ value: 'today', label: 'Today' },
	{ value: '7d', label: 'Last 7 days' },
	{ value: '30d', label: 'Last 30 days' },
	{ value: '90d', label: 'Last 90 days' },
	{ value: 'month', label: 'This month' },
	{ value: 'year', label: 'This year' },
];

export const FORMATS = [
	{ value: 'csv', label: 'CSV' },
	{ value: 'xlsx', label: 'Excel' },
	{ value: 'pdf', label: 'PDF' },
] as const;

/** YYYY-MM-DD in the reader's own time zone. */
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The dates a range opens with, for the From / To boxes. */
export const rangeDates = (range: string): { from: string; to: string } => {
	const now = new Date();
	const back = (n: number) => ymd(new Date(+now - n * 86400000));
	switch (range) {
		case 'today':
			return { from: ymd(now), to: ymd(now) };
		case '7d':
			return { from: back(6), to: ymd(now) };
		case '30d':
			return { from: back(29), to: ymd(now) };
		case '90d':
			return { from: back(89), to: ymd(now) };
		case 'month':
			return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(now) };
		case 'year':
			return { from: ymd(new Date(now.getFullYear(), 0, 1)), to: ymd(now) };
		default:
			return { from: '', to: '' };
	}
};

export const TZ = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

/** A report's line when it has no description of its own: "Animals by shed", "Animals per month". */
export const describe = (r: { type: string; model: string; groupBy?: string; interval?: string; dateField?: string }) =>
	r.type === 'summary' ? `${r.model} by ${r.groupBy || '…'}` : r.type === 'timeline' ? `${r.model} per ${r.interval || 'month'}` : `List of ${r.model}`;
