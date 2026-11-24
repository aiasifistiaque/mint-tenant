'use client';

import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Checkbox, Flex, Grid, IconButton, Input, Skeleton, Switch, Text } from '@chakra-ui/react';
import { Eye, Plus, Trash2, X } from 'lucide-react';
import { Layout, PromptDialog } from '@/components/library';
import { Dropdown, EmptyState, Panel } from '@/components/library/cl';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import { toaster } from '@/components/ui/toaster';
import {
	useAddSavedReportMutation,
	useGetReportModelsQuery,
	usePreviewSavedReportMutation,
	useRemoveSavedReportMutation,
	useUpdateSavedReportMutation,
} from '@/components/library/store/services/tenantApi';
import type { ReportInput, ReportRun, SavedReport } from '@/components/library/store/services/tenantApi';
import ReportTable from './ReportTable';
import { FORMATS, KIND, RANGES, TZ, rangeDates } from './kinds';
import GuideLink from '@/components/library/tenant/GuideLink';
import ConditionValue, { opsFor } from './ConditionValue';

/**
 * The report builder (docs/panel-users RP-03) — developers only (Build). Pick a
 * model and a kind: a **list** (columns, sort, a Total row for number columns),
 * a **summary** (one row per value of a field, with counts and sums) or **over
 * time** (one row per day/week/month/year of a date). Fixed filters, the date the
 * reader's From/To use and the range it opens with, and whether it can be
 * downloaded (CSV, Excel, PDF). Preview runs it without saving.
 *
 * Report rules: a summary can be one row per pair of fields (Then per), show
 * values of the linked record a row is (a leave type's days per year), list every
 * pair even with nothing counted, and any kind adds calculated columns — a
 * formula on each row (Left = days per year − days taken).
 */

/** A calculated column's key from its title: "Days left" → daysLeft. */
const keyFrom = (label: string, taken: string[]) => {
	const words = label.replace(/[^a-zA-Z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
	let base = words.map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('') || 'calc';
	if (!/^[a-zA-Z]/.test(base)) base = `c${base}`;
	let key = base;
	for (let n = 2; taken.includes(key); n++) key = `${base}${n}`;
	return key;
};

const OPS = [
	{ value: 'eq', label: 'is' },
	{ value: 'ne', label: 'is not' },
	{ value: 'in', label: 'is one of' },
	{ value: 'gt', label: 'more than' },
	{ value: 'gte', label: 'at least' },
	{ value: 'lt', label: 'less than' },
	{ value: 'lte', label: 'at most' },
	{ value: 'exists', label: 'is filled' },
];

const BLANK: ReportInput = {
	name: '',
	description: '',
	category: '',
	route: '',
	type: 'list',
	columns: [],
	sort: '',
	totals: [],
	groupBy: '',
	thenBy: '',
	lookups: [],
	allRows: false,
	calcs: [],
	interval: 'month',
	sums: [],
	filters: [],
	readerFilters: [],
	dateField: 'createdAt',
	range: 'all',
	exportable: true,
	formats: ['csv', 'xlsx', 'pdf'],
	order: 0,
};

const Label: FC<{ children: ReactNode; hint?: string }> = ({ children, hint }) => (
	<Box mb={1.5}>
		<Text
			fontSize='13px'
			fontWeight='600'>
			{children}
		</Text>
		{hint && (
			<Text
				fontSize='12px'
				color='fg.muted'>
				{hint}
			</Text>
		)}
	</Box>
);

const Tick: FC<{ checked: boolean; onChange: (on: boolean) => void; children: ReactNode }> = ({ checked, onChange, children }) => (
	<Checkbox.Root
		size='sm'
		checked={checked}
		onCheckedChange={e => onChange(!!e.checked)}>
		<Checkbox.HiddenInput />
		<Checkbox.Control />
		<Checkbox.Label fontSize='13px'>{children}</Checkbox.Label>
	</Checkbox.Root>
);

const ReportBuilder: FC<{ report?: SavedReport | null }> = ({ report }) => {
	const router = useRouter();
	const { data: models, isLoading, isError } = useGetReportModelsQuery();
	const [r, setR] = useState<ReportInput>(BLANK);
	const [preview, setPreview] = useState<ReportRun | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [runPreview, previewing] = usePreviewSavedReportMutation();
	const [add, adding] = useAddSavedReportMutation();
	const [update, updating] = useUpdateSavedReportMutation();
	const [remove, removing] = useRemoveSavedReportMutation();

	useEffect(() => {
		if (!report) return;
		const { _id, model, canDownload, updatedAt, readerFilterFields, ...rest } = report as any;
		setR({ ...BLANK, ...rest });
	}, [report?._id]);

	const model = useMemo(() => models?.doc.find(m => m.route === r.route), [models, r.route]);
	const fields = model?.fields || [];
	const numbers = fields.filter(f => f.number);
	const dates = fields.filter(f => f.date);
	const groupable = fields.filter(f => !f.number && !f.date && !['textarea', 'richtext', 'image', 'images', 'file', 'keyvalue'].includes(f.kind));
	const lookups = r.lookups || [];
	const calcs = r.calcs || [];
	// The summary's grouped fields that are links, and the number fields of the records they pick.
	const grouped = [r.groupBy, r.thenBy].filter(Boolean) as string[];
	const linkedGroups = grouped
		.map(key => {
			const f = fields.find(x => x.key === key);
			const target = f?.ref ? models?.doc.find(m => (m.model || m.name) === f.ref) : null;
			return f && target ? { key, label: f.label, target } : null;
		})
		.filter(Boolean) as { key: string; label: string; target: NonNullable<typeof model> }[];
	// What a calculated column's formula can use, by name.
	const calcNames: { name: string; label: string }[] =
		r.type === 'list'
			? r.columns.map(c => ({ name: c.key, label: c.label || fields.find(f => f.key === c.key)?.label || c.key }))
			: [
					{ name: 'count', label: 'Records' },
					...r.sums.map(x => ({ name: x.field, label: x.label || x.field })),
					...(r.type === 'summary' ? lookups.map(l => ({ name: l.key, label: l.label || l.key })) : []),
				];
	const set = (patch: Partial<ReportInput>) => {
		setPreview(null);
		setR(prev => ({ ...prev, ...patch }));
	};
	const pickModel = (route: string) => {
		const m = models?.doc.find(x => x.route === route);
		const first = (m?.fields || []).filter(f => !['createdAt', 'updatedAt'].includes(f.key)).slice(0, 5);
		set({ route, columns: first.map(f => ({ key: f.key })), totals: [], sort: '', groupBy: '', thenBy: '', lookups: [], allRows: false, calcs: [], sums: [], filters: [], readerFilters: [], dateField: m?.fields.find(f => f.date && f.key !== 'createdAt' && f.key !== 'updatedAt')?.key || 'createdAt' });
	};
	const hasColumn = (key: string) => r.columns.some(c => c.key === key);
	const sortDir = r.sort.startsWith('-') ? '-' : '';
	const sortKey = r.sort.replace(/^-/, '');

	const fail = (e: any, fallback: string) => toaster.create({ type: 'error', title: e?.data?.message || fallback });
	const doPreview = async () => {
		try {
			setPreview(await runPreview({ ...r, ...rangeDates(r.range), tz: TZ }).unwrap());
		} catch (e) {
			fail(e, 'The preview didn’t run.');
		}
	};
	const save = async () => {
		try {
			const out = report ? await update({ id: report._id, ...r }).unwrap() : await add(r).unwrap();
			toaster.create({ type: 'success', title: 'Report saved.' });
			router.push(projectHref(`/reports/${out._id}`));
		} catch (e) {
			fail(e, 'Not saved — try again.');
		}
	};

	if (isError)
		return (
			<EmptyState
				title='Only developers make reports'
				description='Ask someone with Build on this project.'
			/>
		);
	if (isLoading || !models) return <Skeleton h='400px' />;

	return (
		<Flex
			direction='column'
			gap={4}>
			<Panel
				id='report-basics'
				title={report ? `Edit “${report.name}”` : 'New report'}
				subtitle='Nothing is generated ahead or on a schedule: a report is worked out from the current records each time someone opens or downloads it. Who opens it sees only the records their role can view.'
				actions={<GuideLink section='build-report' />}>
				<Grid
					templateColumns={{ base: '1fr', md: '1fr 1fr' }}
					gap={4}>
					<Box>
						<Label>Name</Label>
						<Input
							size='sm'
							maxLength={80}
							placeholder='Milk collection'
							value={r.name}
							onChange={e => set({ name: e.target.value })}
						/>
					</Box>
					<Box>
						<Label hint='Reports are grouped under it'>Category</Label>
						<Input
							size='sm'
							maxLength={60}
							placeholder='Milk'
							value={r.category}
							onChange={e => set({ category: e.target.value })}
						/>
					</Box>
					<Box gridColumn={{ md: 'span 2' }}>
						<Label>Description</Label>
						<Input
							size='sm'
							maxLength={300}
							placeholder='Optional — shown on the reports page'
							value={r.description}
							onChange={e => set({ description: e.target.value })}
						/>
					</Box>
					<Box>
						<Label>Model</Label>
						<Dropdown
							size='sm'
							value={r.route}
							placeholder='Pick a model'
							onChange={pickModel}
							items={models.doc.map(m => ({ value: m.route, label: m.name }))}
						/>
					</Box>
					<Box>
						<Label hint={KIND[r.type].hint}>Kind</Label>
						<Dropdown
							size='sm'
							value={r.type}
							onChange={v => set({ type: v as any })}
							items={Object.entries(KIND).map(([value, k]) => ({ value, label: k.label }))}
						/>
					</Box>
				</Grid>
			</Panel>

			{model && (
				<Panel
					id='report-shape'
					title={r.type === 'list' ? 'Columns' : r.type === 'summary' ? 'Rows and totals' : 'Periods and totals'}
					actions={<GuideLink section='report-kinds' />}>
					{r.type === 'list' && (
						<Flex
							direction='column'
							gap={4}>
							<Box>
								<Label hint='In the order you tick them. Linked records show their name.'>Columns</Label>
								<Flex
									gap={3}
									wrap='wrap'>
									{fields.map(f => (
										<Tick
											key={f.key}
											checked={hasColumn(f.key)}
											onChange={on => set({ columns: on ? [...r.columns, { key: f.key }] : r.columns.filter(c => c.key !== f.key), totals: on ? r.totals : r.totals.filter(t => t !== f.key) })}>
											{f.label}
										</Tick>
									))}
								</Flex>
							</Box>
							{r.columns.length > 0 && (
								<Box>
									<Label hint='Rename a column for this report'>Column titles</Label>
									<Grid
										templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
										gap={2}>
										{r.columns.map((c, i) => (
											<Input
												key={c.key}
												size='sm'
												placeholder={fields.find(f => f.key === c.key)?.label || c.key}
												value={c.label || ''}
												onChange={e => set({ columns: r.columns.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
											/>
										))}
									</Grid>
								</Box>
							)}
							<Grid
								templateColumns={{ base: '1fr', md: '1fr 1fr' }}
								gap={4}>
								<Box>
									<Label>Sort by</Label>
									<Flex gap={2}>
										<Dropdown
											size='sm'
											value={sortKey}
											onChange={v => set({ sort: v ? `${sortDir}${v}` : '' })}
											items={[{ value: '', label: 'Newest first' }, ...fields.map(f => ({ value: f.key, label: f.label }))]}
										/>
										{sortKey && (
											<Dropdown
												size='sm'
												value={sortDir}
												onChange={v => set({ sort: `${v}${sortKey}` })}
												items={[
													{ value: '', label: 'A → Z, low → high' },
													{ value: '-', label: 'Z → A, high → low' },
												]}
											/>
										)}
									</Flex>
								</Box>
								<Box>
									<Label hint='Number columns summed in a Total row'>Totals</Label>
									<Flex
										gap={3}
										wrap='wrap'>
										{numbers.filter(f => hasColumn(f.key)).length === 0 ? (
											<Text
												fontSize='13px'
												color='fg.muted'>
												Tick a number column first.
											</Text>
										) : (
											numbers
												.filter(f => hasColumn(f.key))
												.map(f => (
													<Tick
														key={f.key}
														checked={r.totals.includes(f.key)}
														onChange={on => set({ totals: on ? [...r.totals, f.key] : r.totals.filter(t => t !== f.key) })}>
														{f.label}
													</Tick>
												))
										)}
									</Flex>
								</Box>
							</Grid>
						</Flex>
					)}
					{r.type !== 'list' && (
						<Flex
							direction='column'
							gap={4}>
							<Grid
								templateColumns={{ base: '1fr', md: '1fr 1fr' }}
								gap={4}>
								{r.type === 'summary' ? (
									<>
										<Box>
											<Label hint='Each row is one value of it, with how many records have it'>One row per</Label>
											<Dropdown
												size='sm'
												value={r.groupBy}
												placeholder='Pick a field'
												onChange={v => set({ groupBy: v, thenBy: r.thenBy === v ? '' : r.thenBy, lookups: lookups.filter(l => [v, r.thenBy].includes(l.key.split('.')[0])) })}
												items={groupable.map(f => ({ value: f.key, label: f.label }))}
											/>
										</Box>
										<Box>
											<Label hint='Optional — one row per pair, e.g. per employee and leave type'>Then per</Label>
											<Dropdown
												size='sm'
												value={r.thenBy || ''}
												onChange={v => set({ thenBy: v, lookups: lookups.filter(l => [r.groupBy, v].includes(l.key.split('.')[0])), allRows: v || r.allRows ? r.allRows : false })}
												items={[{ value: '', label: 'Nothing else' }, ...groupable.filter(f => f.key !== r.groupBy).map(f => ({ value: f.key, label: f.label }))]}
											/>
										</Box>
									</>
								) : (
									<Box>
										<Label>One row per</Label>
										<Dropdown
											size='sm'
											value={r.interval}
											onChange={v => set({ interval: v as any })}
											items={[
												{ value: 'day', label: 'Day' },
												{ value: 'week', label: 'Week' },
												{ value: 'month', label: 'Month' },
												{ value: 'year', label: 'Year' },
											]}
										/>
									</Box>
								)}
							</Grid>
							{r.type === 'summary' && linkedGroups.length > 0 && (
								<Box>
									<Label hint={`Shown on each row from the ${linkedGroups.map(g => g.label.toLowerCase()).join(' / ')} it is — e.g. a leave type’s days per year`}>Values of the linked record</Label>
									<Flex
										direction='column'
										gap={2}>
										{linkedGroups.map(g => {
											const nums = g.target.fields.filter(f => f.number);
											return (
												<Flex
													key={g.key}
													gap={3}
													wrap='wrap'
													align='center'>
													<Text
														fontSize='12px'
														color='fg.muted'
														minW='110px'>
														{g.label}:
													</Text>
													{nums.length === 0 ? (
														<Text
															fontSize='13px'
															color='fg.muted'>
															No number fields.
														</Text>
													) : (
														nums.map(f => {
															const key = `${g.key}.${f.key}`;
															return (
																<Tick
																	key={key}
																	checked={lookups.some(l => l.key === key)}
																	onChange={on => set({ lookups: on ? [...lookups, { key, label: f.label }] : lookups.filter(l => l.key !== key) })}>
																	{f.label}
																</Tick>
															);
														})
													)}
												</Flex>
											);
										})}
										{linkedGroups.length === grouped.length && (
											<Switch.Root
												size='sm'
												checked={!!r.allRows}
												onCheckedChange={e => set({ allRows: !!e.checked })}>
												<Switch.HiddenInput />
												<Switch.Control />
												<Switch.Label fontSize='13px'>
													Every {grouped.length === 2 ? 'pair' : linkedGroups[0].label.toLowerCase()}, even with no records — e.g. an employee who took no leave of a type
												</Switch.Label>
											</Switch.Root>
										)}
									</Flex>
								</Box>
							)}
							<Box>
								<Label hint='Summed on each row, next to the count'>Totals of</Label>
								{numbers.length === 0 ? (
									<Text
										fontSize='13px'
										color='fg.muted'>
										This model has no number fields — the report counts records.
									</Text>
								) : (
									<Flex
										gap={3}
										wrap='wrap'>
										{numbers.map(f => (
											<Tick
												key={f.key}
												checked={r.sums.some(s => s.field === f.key)}
												onChange={on => set({ sums: on ? [...r.sums, { field: f.key, label: f.label }] : r.sums.filter(s => s.field !== f.key) })}>
												{f.label}
											</Tick>
										))}
									</Flex>
								)}
							</Box>
						</Flex>
					)}
				</Panel>
			)}

			{model && (
				<Panel
					id='report-calcs'
					title='Calculated columns'
					subtitle='A number worked out on each row from the others — Left = days per year − days taken. The same formulas as formula fields: + − × ÷, round(), max(), min(), if(…).'
					actions={<GuideLink section='report-calcs' />}>
					<Flex
						direction='column'
						gap={3}>
						{calcs.map((c, i) => {
							const setAt = (patch: Partial<typeof c>) => set({ calcs: calcs.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
							return (
								<Flex
									key={i}
									gap={2}
									align='flex-start'
									wrap={{ base: 'wrap', md: 'nowrap' }}>
									<Box w={{ base: '100%', md: '200px' }}>
										<Input
											size='sm'
											maxLength={80}
											placeholder='Column title'
											value={c.label || ''}
											onChange={e => setAt({ label: e.target.value, key: keyFrom(e.target.value, calcs.filter((_, j) => j !== i).map(x => x.key)) })}
										/>
										<Text
											fontSize='11px'
											color='fg.muted'
											mt={1}>
											Used in later formulas as <code>{c.key}</code>
										</Text>
									</Box>
									<Input
										flex='1'
										size='sm'
										fontFamily='mono'
										placeholder={r.type === 'list' ? 'total - paid' : 'leaveType.daysPerYear - approvedDays'}
										value={c.formula}
										onChange={e => setAt({ formula: e.target.value })}
									/>
									<IconButton
										aria-label='Remove this column'
										size='sm'
										variant='ghost'
										onClick={() => set({ calcs: calcs.filter((_, j) => j !== i) })}>
										<X size={15} />
									</IconButton>
								</Flex>
							);
						})}
						{calcNames.length > 0 && (
							<Flex
								gap={1.5}
								wrap='wrap'
								align='center'>
								<Text
									fontSize='12px'
									color='fg.muted'>
									Names you can use (click to add to the last formula):
								</Text>
								{[...calcNames, ...calcs.slice(0, -1).map(c => ({ name: c.key, label: c.label || c.key }))].map(n => (
									<Button
										key={n.name}
										size='2xs'
										variant='subtle'
										fontFamily='mono'
										title={n.label}
										disabled={!calcs.length}
										onClick={() => {
											const last = calcs.length - 1;
											set({ calcs: calcs.map((x, j) => (j === last ? { ...x, formula: `${x.formula}${x.formula && !/\s$/.test(x.formula) ? ' ' : ''}${n.name}` } : x)) });
										}}>
										{n.name}
									</Button>
								))}
							</Flex>
						)}
						<Box>
							<Button
								size='xs'
								variant='outline'
								disabled={calcs.length >= 10}
								onClick={() => set({ calcs: [...calcs, { key: keyFrom('Calculated', calcs.map(x => x.key)), label: '', formula: '' }] })}>
								<Plus size={13} /> Add a calculated column
							</Button>
						</Box>
					</Flex>
				</Panel>
			)}

			{model && (
				<Panel
					id='report-records'
					title='Which records'
					actions={<GuideLink section='build-report' />}>
					<Flex
						direction='column'
						gap={4}>
						<Grid
							templateColumns={{ base: '1fr', md: '1fr 1fr' }}
							gap={4}>
							<Box>
								<Label hint={r.type === 'timeline' ? 'Its periods, and the From / To dates' : 'What the From / To dates look at'}>Date</Label>
								<Dropdown
									size='sm'
									value={r.dateField}
									onChange={v => set({ dateField: v })}
									items={dates.map(f => ({ value: f.key, label: f.label }))}
								/>
							</Box>
							<Box>
								<Label hint='The reader can pick other dates'>Opens with</Label>
								<Dropdown
									size='sm'
									value={r.range}
									onChange={v => set({ range: v })}
									items={RANGES}
								/>
							</Box>
						</Grid>
						<Box>
							<Label hint='Always applied — e.g. only animals whose status is Sold'>Only records where</Label>
							<Flex
								direction='column'
								gap={2}>
								{r.filters.map((f, i) => {
									const field = fields.find(x => x.key === f.field);
									const ops = opsFor(field, OPS);
									const setAt = (patch: Partial<typeof f>) => set({ filters: r.filters.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
									return (
										<Flex
											key={i}
											gap={2}
											align='flex-start'
											wrap={{ base: 'wrap', md: 'nowrap' }}>
											<Box flex='1'>
												<Dropdown
													size='sm'
													value={f.field}
													onChange={v => {
														const next = fields.find(x => x.key === v);
														setAt({ field: v, value: '', op: opsFor(next, OPS).some(o => o.value === f.op) ? f.op : 'eq' });
													}}
													items={fields.map(x => ({ value: x.key, label: x.label }))}
												/>
											</Box>
											<Box w='140px'>
												<Dropdown
													size='sm'
													value={f.op}
													onChange={v => setAt({ op: v, ...(v === 'in' || f.op === 'in' ? { value: '' } : {}) })}
													items={ops}
												/>
											</Box>
											<ConditionValue
												field={field}
												models={models.doc}
												op={f.op}
												value={f.value}
												onChange={v => setAt({ value: v })}
											/>
											<IconButton
												aria-label='Remove this condition'
												size='sm'
												variant='ghost'
												onClick={() => set({ filters: r.filters.filter((_, j) => j !== i) })}>
												<X size={15} />
											</IconButton>
										</Flex>
									);
								})}
								<Box>
									<Button
										size='xs'
										variant='outline'
										onClick={() => set({ filters: [...r.filters, { field: fields[0]?.key || '', op: 'eq', value: '' }] })}>
										<Plus size={13} /> Add a condition
									</Button>
								</Box>
							</Flex>
						</Box>
						<Box>
							<Label hint={`Whoever opens the report picks a value for each, next to the dates — e.g. one employee. Up to 6.`}>Filters for the reader</Label>
							{groupable.filter(f => !['createdAt', 'updatedAt'].includes(f.key)).length === 0 ? (
								<Text
									fontSize='13px'
									color='fg.muted'>
									This model has no fields to filter by.
								</Text>
							) : (
								<Flex
									gap={3}
									wrap='wrap'>
									{groupable
										.filter(f => !['createdAt', 'updatedAt'].includes(f.key))
										.map(f => {
											const on = r.readerFilters.includes(f.key);
											return (
												<Tick
													key={f.key}
													checked={on}
													onChange={next =>
														set({ readerFilters: next ? (r.readerFilters.length < 6 ? [...r.readerFilters, f.key] : r.readerFilters) : r.readerFilters.filter(k => k !== f.key) })
													}>
													{f.label}
												</Tick>
											);
										})}
								</Flex>
							)}
						</Box>
					</Flex>
				</Panel>
			)}

			{model && (
				<Panel
					id='report-download'
					title='Download'
					actions={<GuideLink section='run-report' />}>
					<Flex
						direction='column'
						gap={3}>
						<Switch.Root
							size='sm'
							checked={r.exportable}
							onCheckedChange={e => set({ exportable: !!e.checked, formats: e.checked && !r.formats.length ? ['csv', 'xlsx', 'pdf'] : r.formats })}>
							<Switch.HiddenInput />
							<Switch.Control />
							<Switch.Label fontSize='13px'>Can be downloaded</Switch.Label>
						</Switch.Root>
						{r.exportable && (
							<Flex gap={4}>
								{FORMATS.map(f => (
									<Tick
										key={f.value}
										checked={r.formats.includes(f.value)}
										onChange={on => set({ formats: on ? [...r.formats, f.value] : r.formats.filter(x => x !== f.value) })}>
										{f.label}
									</Tick>
								))}
							</Flex>
						)}
						<Text
							fontSize='12px'
							color='fg.muted'>
							Panel users download only when their panel role has Download reports.
						</Text>
					</Flex>
				</Panel>
			)}

			<Flex
				gap={2}
				justify='flex-end'
				wrap='wrap'>
				{report && (
					<Button
						size='sm'
						variant='ghost'
						colorPalette='red'
						mr='auto'
						onClick={() => setDeleting(true)}>
						<Trash2 size={14} /> Delete
					</Button>
				)}
				<Button
					size='sm'
					variant='outline'
					onClick={() => router.push(projectHref(report ? `/reports/${report._id}` : '/reports'))}>
					Cancel
				</Button>
				<Button
					size='sm'
					variant='outline'
					disabled={!r.route}
					loading={previewing.isLoading}
					onClick={doPreview}>
					<Eye size={14} /> Preview
				</Button>
				<Button
					size='sm'
					disabled={!r.route || !r.name.trim()}
					loading={adding.isLoading || updating.isLoading}
					onClick={save}>
					{report ? 'Save' : 'Save the report'}
				</Button>
			</Flex>

			{preview && (
				<Panel
					id='report-preview'
					title='Preview'
					subtitle={`Not saved · ${preview.count} ${r.type === 'list' ? 'records' : 'rows'}${preview.truncated ? ', the first ones shown' : ''}`}>
					<ReportTable run={preview} />
				</Panel>
			)}

			<PromptDialog
				open={deleting}
				onClose={() => setDeleting(false)}
				tone='danger'
				title='Delete this report?'
				subject={report?.name}
				description='Nobody can open it any more. The records stay as they are.'
				confirmLabel='Delete'
				loading={removing.isLoading}
				onConfirm={async () => {
					if (!report) return;
					try {
						await remove(report._id).unwrap();
						router.push(projectHref('/reports'));
					} catch (e) {
						fail(e, 'Not deleted — try again.');
					}
				}}
			/>
		</Flex>
	);
};

export const BuilderPage: FC<{ report?: SavedReport | null; loading?: boolean }> = ({ report, loading }) => (
	<Layout
		title={report ? `Edit ${report.name}` : 'New report'}
		path='reports'>
		<Box pt={2}>{loading ? <Skeleton h='400px' /> : <ReportBuilder report={report} />}</Box>
	</Layout>
);

export default ReportBuilder;
