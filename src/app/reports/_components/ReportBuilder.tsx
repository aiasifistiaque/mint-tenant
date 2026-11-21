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

/**
 * The report builder (docs/panel-users RP-03) — developers only (Build). Pick a
 * model and a kind: a **list** (columns, sort, a Total row for number columns),
 * a **summary** (one row per value of a field, with counts and sums) or **over
 * time** (one row per day/week/month/year of a date). Fixed filters, the date the
 * reader's From/To use and the range it opens with, and whether it can be
 * downloaded (CSV, Excel, PDF). Preview runs it without saving.
 */

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
	interval: 'month',
	sums: [],
	filters: [],
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
		const { _id, model, canDownload, updatedAt, ...rest } = report as any;
		setR({ ...BLANK, ...rest });
	}, [report?._id]);

	const model = useMemo(() => models?.doc.find(m => m.route === r.route), [models, r.route]);
	const fields = model?.fields || [];
	const numbers = fields.filter(f => f.number);
	const dates = fields.filter(f => f.date);
	const groupable = fields.filter(f => !f.number && !f.date && !['textarea', 'richtext', 'image', 'images', 'file', 'keyvalue'].includes(f.kind));
	const set = (patch: Partial<ReportInput>) => {
		setPreview(null);
		setR(prev => ({ ...prev, ...patch }));
	};
	const pickModel = (route: string) => {
		const m = models?.doc.find(x => x.route === route);
		const first = (m?.fields || []).filter(f => !['createdAt', 'updatedAt'].includes(f.key)).slice(0, 5);
		set({ route, columns: first.map(f => ({ key: f.key })), totals: [], sort: '', groupBy: '', sums: [], filters: [], dateField: m?.fields.find(f => f.date && f.key !== 'createdAt' && f.key !== 'updatedAt')?.key || 'createdAt' });
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
				subtitle='Who opens it sees only the records their role can view.'>
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
					title={r.type === 'list' ? 'Columns' : r.type === 'summary' ? 'Rows and totals' : 'Periods and totals'}>
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
									<Box>
										<Label hint='Each row is one value of it, with how many records have it'>One row per</Label>
										<Dropdown
											size='sm'
											value={r.groupBy}
											placeholder='Pick a field'
											onChange={v => set({ groupBy: v })}
											items={groupable.map(f => ({ value: f.key, label: f.label }))}
										/>
									</Box>
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
					id='report-records'
					title='Which records'>
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
								{r.filters.map((f, i) => (
									<Flex
										key={i}
										gap={2}
										align='center'
										wrap={{ base: 'wrap', md: 'nowrap' }}>
										<Box flex='1'>
											<Dropdown
												size='sm'
												value={f.field}
												onChange={v => set({ filters: r.filters.map((x, j) => (j === i ? { ...x, field: v } : x)) })}
												items={fields.map(x => ({ value: x.key, label: x.label }))}
											/>
										</Box>
										<Box w='140px'>
											<Dropdown
												size='sm'
												value={f.op}
												onChange={v => set({ filters: r.filters.map((x, j) => (j === i ? { ...x, op: v } : x)) })}
												items={OPS}
											/>
										</Box>
										{f.op !== 'exists' && (
											<Input
												flex='1'
												size='sm'
												placeholder={f.op === 'in' ? 'Comma-separated' : 'Value'}
												value={String(f.value ?? '')}
												onChange={e => set({ filters: r.filters.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })}
											/>
										)}
										<IconButton
											aria-label='Remove this condition'
											size='sm'
											variant='ghost'
											onClick={() => set({ filters: r.filters.filter((_, j) => j !== i) })}>
											<X size={15} />
										</IconButton>
									</Flex>
								))}
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
					</Flex>
				</Panel>
			)}

			{model && (
				<Panel
					id='report-download'
					title='Download'>
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
