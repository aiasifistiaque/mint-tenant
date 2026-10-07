'use client';

import { FC, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Label,
	Pie,
	PieChart,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Interval, bucketLabel, formatCompact } from './types';

/**
 * The dashboard's charts, on Chakra UI Charts (Recharts underneath, with
 * Chakra's tooltip, tokens and colour mode):
 *
 * - ColumnChart: a series over time as columns;
 * - LineChart: the same as a line over a soft area, with a crosshair;
 * - BarList: a breakdown as horizontal bars, labelled and valued;
 * - DonutChart: a breakdown as a ring, with a legend of values and shares.
 *
 * Marks follow the data-viz spec: columns at most 28px wide with a 4px
 * rounded top on a square baseline, a 2px line, a recessive dashed grid, a 2px
 * gap between slices, a tooltip on every mark, and a screen-reader table.
 * Colours are the marketing website's tones (below), so the dashboard reads
 * as colourful as the site; the legend carries each series' name, so no hue
 * has to be told apart by colour alone.
 */

// The website's tones (theme/tones.ts, mint-webpage lib/tones.ts) in its
// order — emerald, sky, violet, amber, rose, cyan — then indigo; 500s by day,
// 400s at night, as the site draws its charts.
export const PALETTE_CSS: any = {
	'--series-1': '#10b981',
	'--series-2': '#0ea5e9',
	'--series-3': '#8b5cf6',
	'--series-4': '#f59e0b',
	'--series-5': '#f43f5e',
	'--series-6': '#06b6d4',
	'--series-7': '#6366f1',
	'--series-other': '#9298a8',
	'--surface': 'var(--chakra-colors-bg-panel)',
	_dark: {
		'--series-1': '#34d399',
		'--series-2': '#38bdf8',
		'--series-3': '#a78bfa',
		'--series-4': '#fbbf24',
		'--series-5': '#fb7185',
		'--series-6': '#22d3ee',
		'--series-7': '#818cf8',
		'--series-other': '#75736d',
	},
};

export const seriesColor = (i: number) => `var(--series-${(i % 7) + 1})`;

type Point = { key: string; value: number };
type Slice = { key: string | null; label: string; value: number; other?: boolean };

/** The numbers behind a chart, for screen readers. */
const SrTable: FC<{ caption: string; rows: [string, string][] }> = ({ caption, rows }) => (
	<Box
		as='table'
		srOnly>
		<caption>{caption}</caption>
		<tbody>
			{rows.map(([k, v], i) => (
				<tr key={i}>
					<th scope='row'>{k}</th>
					<td>{v}</td>
				</tr>
			))}
		</tbody>
	</Box>
);

type SeriesProps = {
	points: Point[];
	interval: Interval;
	/** A value as the tooltip shows it, with its unit. */
	format: (v: number) => string;
	title: string;
	height?: number;
};

const AXIS_TICK = { fontSize: 11, fill: 'var(--chakra-colors-fg-muted)' };
const GRID = 'var(--chakra-colors-border-muted)';
const ANIMATION_MS = 500;
const FILL = { width: '100%', height: '100%' };

/** The shared chart state for a time series: one `value` series in the first palette colour. */
const useSeries = (points: Point[], title: string) =>
	useChart({
		data: points.map(p => ({ key: p.key, value: p.value })),
		series: [{ name: 'value', color: 'var(--series-1)', label: title }],
	});

/** Axes and grid shared by the column and line charts. */
const cartesianParts = (interval: Interval) => [
	<CartesianGrid
		key='grid'
		stroke={GRID}
		strokeDasharray='3 3'
		vertical={false}
	/>,
	<XAxis
		key='x'
		dataKey='key'
		axisLine={false}
		tickLine={false}
		tickMargin={8}
		minTickGap={18}
		tick={AXIS_TICK}
		tickFormatter={(k: string) => bucketLabel(k, interval)}
	/>,
	<YAxis
		key='y'
		axisLine={false}
		tickLine={false}
		width={40}
		allowDecimals={false}
		tick={AXIS_TICK}
		tickFormatter={(v: number) => formatCompact(v)}
	/>,
];

/** The tooltip for both: the bucket's full date over the value. */
const seriesTooltip = (interval: Interval, format: (v: number) => string, cursor: any) => (
	<Tooltip
		cursor={cursor}
		animationDuration={100}
		labelFormatter={(k: any) => bucketLabel(String(k), interval, true)}
		formatter={(v: any) => format(Number(v))}
		content={<Chart.Tooltip hideSeriesLabel />}
	/>
);

export const ColumnChart: FC<SeriesProps> = ({ points, interval, format, title, height = 200 }) => {
	const chart = useSeries(points, title);
	const gradient = `${chart.id}-column`;
	return (
		<Box css={PALETTE_CSS}>
			<Chart.Root
				chart={chart}
				w='full'
				h={`${height}px`}
				aspectRatio='auto'
				aria-label={title}>
				<BarChart
					// Sizes itself to Chart.Root with plain CSS (Recharts 3), no ResponsiveContainer.
					responsive
					style={FILL}
					data={chart.data}
					margin={{ top: 8, right: 4, left: -4, bottom: 0 }}>
					<defs>
						<linearGradient
							id={gradient}
							x1='0'
							y1='0'
							x2='0'
							y2='1'>
							<stop
								offset='0%'
								stopColor='var(--series-1)'
								stopOpacity={1}
							/>
							<stop
								offset='100%'
								stopColor='var(--series-1)'
								stopOpacity={0.7}
							/>
						</linearGradient>
					</defs>
					{cartesianParts(interval)}
					{seriesTooltip(interval, format, { fill: 'var(--chakra-colors-bg-muted)', radius: 4 })}
					<Bar
						dataKey='value'
						name={title}
						fill={`url(#${gradient})`}
						radius={[4, 4, 0, 0]}
						maxBarSize={28}
						animationDuration={ANIMATION_MS}
					/>
				</BarChart>
			</Chart.Root>
			<SrTable
				caption={title}
				rows={points.map(p => [bucketLabel(p.key, interval, true), format(p.value)])}
			/>
		</Box>
	);
};

export const LineChart: FC<SeriesProps> = ({ points, interval, format, title, height = 200 }) => {
	const chart = useSeries(points, title);
	const gradient = `${chart.id}-area`;
	return (
		<Box css={PALETTE_CSS}>
			<Chart.Root
				chart={chart}
				w='full'
				h={`${height}px`}
				aspectRatio='auto'
				aria-label={title}>
				<AreaChart
					// Sizes itself to Chart.Root with plain CSS (Recharts 3), no ResponsiveContainer.
					responsive
					style={FILL}
					data={chart.data}
					margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
					<defs>
						<Chart.Gradient
							id={gradient}
							stops={[
								{ offset: '0%', color: 'var(--series-1)', opacity: 0.4 },
								{ offset: '100%', color: 'var(--series-1)', opacity: 0.03 },
							]}
						/>
					</defs>
					{cartesianParts(interval)}
					{seriesTooltip(interval, format, { stroke: 'var(--chakra-colors-border-emphasized)', strokeWidth: 1 })}
					<Area
						type='monotone'
						dataKey='value'
						name={title}
						stroke='var(--series-1)'
						strokeWidth={2}
						fill={`url(#${gradient})`}
						dot={false}
						// A surface ring keeps the marker clear of the line it sits on.
						activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)', fill: 'var(--series-1)' }}
						animationDuration={ANIMATION_MS}
					/>
				</AreaChart>
			</Chart.Root>
			<SrTable
				caption={title}
				rows={points.map(p => [bucketLabel(p.key, interval, true), format(p.value)])}
			/>
		</Box>
	);
};

type BreakdownProps = { slices: Slice[]; format: (v: number) => string; title: string };

const colorOf = (s: Slice, i: number) => (s.other ? 'var(--series-other)' : seriesColor(i));
const shareOf = (value: number, sum: number) => (sum ? `${Math.round((value / sum) * 100)}%` : '—');

/** A breakdown as labelled horizontal bars, biggest first. */
export const BarList: FC<BreakdownProps> = ({ slices, format, title }) => {
	const max = Math.max(0, ...slices.map(s => s.value));
	const sum = slices.reduce((a, s) => a + s.value, 0);
	return (
		<Flex
			direction='column'
			gap={2.5}
			css={PALETTE_CSS}>
			{slices.map((s, i) => (
				<Box
					key={`${s.key}-${i}`}
					title={`${s.label}: ${format(s.value)} (${shareOf(s.value, sum)})`}
					role='group'>
					<Flex
						justify='space-between'
						align='baseline'
						gap={3}
						fontSize='xs'
						mb={1.5}>
						<Text
							truncate
							color={s.other ? 'fg.muted' : 'fg'}>
							{s.label}
						</Text>
						<Flex
							gap={2}
							flexShrink={0}
							align='baseline'>
							<Text fontWeight='600'>{format(s.value)}</Text>
							<Text
								color='fg.muted'
								w='34px'
								textAlign='right'>
								{shareOf(s.value, sum)}
							</Text>
						</Flex>
					</Flex>
					<Box
						h='8px'
						bg='bg.muted'
						borderRadius='full'
						overflow='hidden'>
						<Box
							h='full'
							w={`${max ? Math.max(1.5, (s.value / max) * 100) : 0}%`}
							bg={s.other ? 'var(--series-other)' : 'var(--series-1)'}
							borderRadius='full'
							transition='width .5s ease, filter .15s ease'
							_groupHover={{ filter: 'brightness(1.1)' }}
						/>
					</Box>
				</Box>
			))}
			<SrTable
				caption={title}
				rows={slices.map(s => [s.label, format(s.value)])}
			/>
		</Flex>
	);
};

export const DonutChart: FC<BreakdownProps & { total?: number }> = ({ slices, format, title, total }) => {
	const [hover, setHover] = useState<number | null>(null);
	const sum = slices.reduce((a, s) => a + s.value, 0);
	const chart = useChart({
		data: slices.map((s, i) => ({ name: s.label, value: s.value, color: colorOf(s, i) })),
	});
	const shown = hover !== null ? slices[hover] : null;
	const size = 168;
	return (
		<Flex
			gap={5}
			align='center'
			flexWrap='wrap'
			justify='center'
			css={PALETTE_CSS}>
			<Chart.Root
				chart={chart}
				boxSize={`${size}px`}
				aspectRatio='square'
				flexShrink={0}
				aria-label={title}>
				<PieChart
					responsive
					style={FILL}>
					{/* No floating tooltip: the hovered slice's value and name show in the
					    centre, and its legend row lights up. */}
					<Pie
						data={sum ? chart.data : [{ name: '', value: 1, color: 'var(--chakra-colors-bg-muted)' }]}
						dataKey='value'
						nameKey='name'
						innerRadius='64%'
						outerRadius='100%'
						paddingAngle={sum && slices.length > 1 ? 2 : 0}
						cornerRadius={4}
						stroke='none'
						startAngle={90}
						endAngle={-270}
						animationDuration={ANIMATION_MS}
						onMouseEnter={(_: any, i: number) => sum && setHover(i)}
						onMouseLeave={() => setHover(null)}>
						{(sum ? chart.data : [{ color: 'var(--chakra-colors-bg-muted)' }]).map((d: any, i: number) => (
							<Cell
								key={i}
								fill={d.color}
								opacity={hover === null || hover === i ? 1 : 0.4}
								style={{ transition: 'opacity .15s ease', outline: 'none' }}
							/>
						))}
						<Label
							content={({ viewBox }: any) => (
								<Chart.RadialText
									viewBox={viewBox}
									title={format(shown ? shown.value : total ?? sum)}
									description={shown ? shown.label : 'Total'}
								/>
							)}
						/>
					</Pie>
				</PieChart>
			</Chart.Root>
			<Flex
				as='ul'
				direction='column'
				gap={1}
				flex='1'
				minW='160px'
				listStyleType='none'>
				{slices.map((s, i) => (
					<Flex
						as='li'
						key={`${s.key}-${i}`}
						align='center'
						gap={2}
						fontSize='xs'
						px={1.5}
						py={1}
						borderRadius='md'
						bg={hover === i ? 'bg.muted' : undefined}
						transition='background-color .12s ease'
						onMouseEnter={() => setHover(i)}
						onMouseLeave={() => setHover(null)}>
						<Box
							w='10px'
							h='10px'
							borderRadius='full'
							flexShrink={0}
							bg={colorOf(s, i)}
						/>
						<Text
							truncate
							flex='1'
							color={s.other ? 'fg.muted' : 'fg'}>
							{s.label}
						</Text>
						<Text fontWeight='600'>{format(s.value)}</Text>
						<Text
							color='fg.muted'
							w='34px'
							textAlign='right'>
							{shareOf(s.value, sum)}
						</Text>
					</Flex>
				))}
			</Flex>
			<SrTable
				caption={title}
				rows={slices.map(s => [s.label, format(s.value)])}
			/>
		</Flex>
	);
};
