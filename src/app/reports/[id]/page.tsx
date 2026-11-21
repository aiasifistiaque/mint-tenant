'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import { Box, Button, Flex, Input, Skeleton, Text } from '@chakra-ui/react';
import { Download, Pencil, Play } from 'lucide-react';
import { Layout } from '@/components/library';
import { Dropdown, EmptyState, Panel } from '@/components/library/cl';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import { toaster } from '@/components/ui/toaster';
import { useExportSavedReportMutation, useGetSavedReportQuery, useGetSavedReportsQuery, useRunSavedReportMutation } from '@/components/library/store/services/tenantApi';
import type { ReportFormat, ReportRun } from '@/components/library/store/services/tenantApi';
import ReportTable from '../_components/ReportTable';
import { FORMATS, RANGES, TZ, describe, rangeDates } from '../_components/kinds';

/**
 * One report (docs/panel-users RP-03): pick the dates (it opens on its own
 * range), see its rows and totals, download it as CSV, Excel or PDF where it
 * allows that. Developers get Edit.
 */

export default function ReportPage() {
	const { id } = useParams() as { id: string };
	const { data: report, isLoading, isError, error } = useGetSavedReportQuery(id);
	const { data: list } = useGetSavedReportsQuery();
	const [range, setRange] = useState('all');
	const [dates, setDates] = useState({ from: '', to: '' });
	const [run, running] = useRunSavedReportMutation();
	const [download, downloading] = useExportSavedReportMutation();
	const [result, setResult] = useState<ReportRun | null>(null);
	const [format, setFormat] = useState<ReportFormat | null>(null);

	const go = async (d = dates) => {
		try {
			setResult(await run({ id, from: d.from || undefined, to: d.to || undefined, tz: TZ }).unwrap());
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'The report didn’t run — try again.' });
		}
	};

	useEffect(() => {
		if (!report) return;
		const d = rangeDates(report.range);
		setRange(report.range);
		setDates(d);
		go(d);
	}, [report?._id, report?.updatedAt]);

	const save = async (f: ReportFormat) => {
		setFormat(f);
		try {
			const out: any = await download({ id, format: f, from: dates.from || undefined, to: dates.to || undefined, tz: TZ }).unwrap();
			if (out?.message) throw { data: out };
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Not downloaded — try again.' });
		}
		setFormat(null);
	};

	return (
		<Layout
			title={report?.name || 'Report'}
			path='reports'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				{isError ? (
					<EmptyState
						title={(error as any)?.status === 403 ? 'Your role can’t open this report' : 'Report not found'}
						description='Ask your project’s developers or a super admin.'
					/>
				) : isLoading || !report ? (
					<Skeleton h='320px' />
				) : (
					<Panel
						id='report'
						title={report.name}
						subtitle={report.description || describe(report)}
						actions={
							list?.canBuild && (
								<Button
									asChild
									size='sm'
									variant='outline'>
									<NextLink href={projectHref(`/reports/${id}/edit`)}>
										<Pencil size={14} /> Edit
									</NextLink>
								</Button>
							)
						}>
						<Flex
							gap={3}
							align='flex-end'
							wrap='wrap'
							mb={4}>
							<Box w={{ base: '100%', sm: '170px' }}>
								<Text
									fontSize='12px'
									color='fg.muted'
									mb={1}>
									Dates
								</Text>
								<Dropdown
									size='sm'
									value={range}
									onChange={v => {
										setRange(v);
										const d = rangeDates(v);
										setDates(d);
										go(d);
									}}
									items={[...RANGES, ...(range === 'custom' ? [{ value: 'custom', label: 'Custom' }] : [])]}
								/>
							</Box>
							<Box>
								<Text
									fontSize='12px'
									color='fg.muted'
									mb={1}>
									From
								</Text>
								<Input
									size='sm'
									type='date'
									value={dates.from}
									onChange={e => {
										setRange('custom');
										setDates({ ...dates, from: e.target.value });
									}}
								/>
							</Box>
							<Box>
								<Text
									fontSize='12px'
									color='fg.muted'
									mb={1}>
									To
								</Text>
								<Input
									size='sm'
									type='date'
									value={dates.to}
									onChange={e => {
										setRange('custom');
										setDates({ ...dates, to: e.target.value });
									}}
								/>
							</Box>
							<Button
								size='sm'
								loading={running.isLoading}
								onClick={() => go()}>
								<Play size={14} /> Run
							</Button>
							<Box flex='1' />
							{report.canDownload &&
								FORMATS.filter(f => report.formats.includes(f.value)).map(f => (
									<Button
										key={f.value}
										size='sm'
										variant='outline'
										loading={downloading.isLoading && format === f.value}
										onClick={() => save(f.value)}>
										<Download size={14} /> {f.label}
									</Button>
								))}
						</Flex>
						{!result ? (
							<Skeleton h='200px' />
						) : (
							<>
								<Text
									fontSize='12.5px'
									color='fg.muted'
									mb={2}>
									{result.count.toLocaleString()} {report.type === 'list' ? 'records' : 'rows'}
									{result.truncated ? ' — showing the first ones; download it for all' : ''}
									{report.dateField && (dates.from || dates.to) ? ` · by ${report.dateField}` : ''}
								</Text>
								<ReportTable run={result} />
							</>
						)}
					</Panel>
				)}
			</Flex>
		</Layout>
	);
}
