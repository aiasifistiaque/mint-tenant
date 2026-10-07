'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Box, Button, Checkbox, Flex, Grid, IconButton, RadioGroup, SegmentGroup, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, Download, FileText, Printer } from 'lucide-react';
import { MenuItem } from '../../../../menu';
import { toaster } from '@/components/ui/toaster';
import { useGetConfigQuery } from '../../../../store/services/commonApi';
import { useDownloadMutation } from '../../../../store/services/bulkApi';
import { useAppSelector } from '../../../../hooks/useReduxHooks';
import { BulkDialog, BulkProps, COMPACT, CancelButton, errorOf, rows } from './shared';

type Format = 'csv' | 'xlsx' | 'pdf';
const FORMATS: { value: Format; label: string }[] = [
	{ value: 'xlsx', label: 'Excel' },
	{ value: 'csv', label: 'CSV' },
	{ value: 'pdf', label: 'PDF' },
];

/**
 * Export the table: pick the columns and their order, the format (Excel, CSV,
 * PDF), and whether it's the ticked rows or every row the table's current
 * filters and search match — not just the page on screen. Opened from the
 * selection bar or the page header's Export button.
 */
export const ExportDialog: FC<{ open: boolean; onClose: () => void; path: string; ids?: string[] }> = ({
	open,
	onClose,
	path,
	ids = [],
}) => {
	const table = useAppSelector((s: any) => s.table);
	const { data: config } = useGetConfigQuery(path, { skip: !open || !path });
	const all = useMemo(
		() =>
			(Array.isArray(config?.table) ? config.table : [])
				.filter((c: any) => c?.dataKey && c.type !== 'menu')
				.map((c: any) => ({ key: c.dataKey as string, label: String(c.title || c.dataKey) })),
		[config]
	);
	const [order, setOrder] = useState<string[]>([]);
	const [picked, setPicked] = useState<Set<string>>(new Set());
	const [format, setFormat] = useState<Format>('xlsx');
	const [scope, setScope] = useState<'selected' | 'all'>(ids.length ? 'selected' : 'all');
	const [download, { isLoading }] = useDownloadMutation();

	// Columns start as the table shows them: the admin's visible columns first, in order.
	useEffect(() => {
		if (!open || !all.length) return;
		const visible: string[] = (table?.preferences || []).filter((k: string) => all.some((c: { key: string }) => c.key === k));
		const keys = [...visible, ...all.map((c: { key: string }) => c.key).filter((k: string) => !visible.includes(k))];
		setOrder(keys);
		setPicked(new Set(visible.length ? visible : keys));
		setScope(ids.length ? 'selected' : 'all');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, all.length]);

	const labelOf = (k: string) => all.find((c: { key: string }) => c.key === k)?.label || k;
	const move = (i: number, d: -1 | 1) =>
		setOrder(o => {
			const next = [...o];
			[next[i], next[i + d]] = [next[i + d], next[i]];
			return next;
		});

	const run = async () => {
		try {
			const columns = order.filter(k => picked.has(k)).map(k => ({ key: k, label: labelOf(k) }));
			const params =
				scope === 'all'
					? { sort: table?.sort, search: table?.search || undefined, ...(table?.filters || {}) }
					: { sort: table?.sort };
			const file = await download({
				url: `${path}/export/rows`,
				body: { columns, format, ids: scope === 'selected' ? ids : undefined },
				params,
				fallbackName: `${path}.${format}`,
			}).unwrap();
			toaster.create({
				type: 'success',
				title: `Exported ${file.rows === null ? '' : rows(file.rows)}`.trim(),
				description: file.rows === 20000 ? 'That’s the limit — narrow the filters for the rest.' : file.name,
			});
			onClose();
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not export', description: errorOf(e, '') });
		}
	};

	const count = picked.size;

	return (
		<BulkDialog
			open={open}
			onClose={onClose}
			busy={isLoading}
			title='Export'
			footer={
				<>
					<CancelButton
						onClick={onClose}
						disabled={isLoading}
					/>
					<Button
						{...COMPACT}
						loading={isLoading}
						loadingText='Exporting'
						disabled={!count}
						onClick={run}>
						<Download size={13} />
						Export {FORMATS.find(f => f.value === format)?.label}
					</Button>
				</>
			}>
			<Flex
				direction='column'
				gap={5}>
				<Box>
					<Text
						fontSize='xs'
						fontWeight='600'
						mb={2}>
						Rows
					</Text>
					<RadioGroup.Root
						size='sm'
						value={scope}
						onValueChange={e => setScope(e.value as any)}>
						<Flex
							direction='column'
							gap={2}>
							{ids.length > 0 && (
								<RadioGroup.Item value='selected'>
									<RadioGroup.ItemHiddenInput />
									<RadioGroup.ItemIndicator />
									<RadioGroup.ItemText fontSize='sm'>The {rows(ids.length)} ticked</RadioGroup.ItemText>
								</RadioGroup.Item>
							)}
							<RadioGroup.Item value='all'>
								<RadioGroup.ItemHiddenInput />
								<RadioGroup.ItemIndicator />
								<RadioGroup.ItemText fontSize='sm'>
									Every row matching the table’s filters and search
									<Text
										as='span'
										color='fg.muted'>
										{' '}
										— not just this page, up to 20,000
									</Text>
								</RadioGroup.ItemText>
							</RadioGroup.Item>
						</Flex>
					</RadioGroup.Root>
				</Box>

				<Box>
					<Text
						fontSize='xs'
						fontWeight='600'
						mb={2}>
						Format
					</Text>
					<SegmentGroup.Root
						size='sm'
						value={format}
						onValueChange={e => setFormat(e.value as Format)}>
						<SegmentGroup.Indicator />
						<SegmentGroup.Items items={FORMATS} />
					</SegmentGroup.Root>
				</Box>

				<Box>
					<Flex
						justify='space-between'
						align='center'
						mb={2}>
						<Text
							fontSize='xs'
							fontWeight='600'>
							Columns · {count} of {order.length}
						</Text>
						<Flex gap={3}>
							<Button
								size='2xs'
								variant='plain'
								px={0}
								onClick={() => setPicked(new Set(order))}>
								All
							</Button>
							<Button
								size='2xs'
								variant='plain'
								px={0}
								onClick={() => setPicked(new Set())}>
								None
							</Button>
						</Flex>
					</Flex>
					<Box
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						maxH='260px'
						overflowY='auto'>
						{order.map((k, i) => (
							<Grid
								key={k}
								templateColumns='minmax(0, 1fr) auto'
								alignItems='center'
								px={3}
								py={1}
								borderBottomWidth='1px'
								borderColor='border.muted'
								_last={{ borderBottomWidth: 0 }}>
								<Checkbox.Root
									size='sm'
									checked={picked.has(k)}
									onCheckedChange={e =>
										setPicked(p => {
											const next = new Set(p);
											e.checked ? next.add(k) : next.delete(k);
											return next;
										})
									}>
									<Checkbox.HiddenInput />
									<Checkbox.Control />
									<Checkbox.Label fontSize='sm'>{labelOf(k)}</Checkbox.Label>
								</Checkbox.Root>
								<Flex>
									<IconButton
										size='2xs'
										variant='ghost'
										aria-label='Move up'
										disabled={i === 0}
										onClick={() => move(i, -1)}>
										<ArrowUp size={12} />
									</IconButton>
									<IconButton
										size='2xs'
										variant='ghost'
										aria-label='Move down'
										disabled={i === order.length - 1}
										onClick={() => move(i, 1)}>
										<ArrowDown size={12} />
									</IconButton>
								</Flex>
							</Grid>
						))}
					</Box>
				</Box>
			</Flex>
		</BulkDialog>
	);
};

/** The selection bar's "Export". */
export const ExportRows: FC<BulkProps> = ({ path, items, title }) => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<MenuItem onClick={() => setOpen(true)}>{title || 'Export'}</MenuItem>
			<ExportDialog
				open={open}
				onClose={() => setOpen(false)}
				path={path}
				ids={items}
			/>
		</>
	);
};

/**
 * Print / PDF of the ticked records, one per page: the print view (laid out
 * like the view page — "Save as PDF" in the browser's dialog makes the file),
 * or a PDF straight from the server.
 */
export const PrintRows: FC<BulkProps> = ({ path, items, title }) => {
	const [open, setOpen] = useState(false);
	const [download, { isLoading }] = useDownloadMutation();

	const printView = () => {
		window.open(`/print/${path}?ids=${items.join(',')}`, '_blank', 'noopener');
		setOpen(false);
	};
	const pdf = async () => {
		try {
			const file = await download({ url: `${path}/export/records`, body: { ids: items }, fallbackName: `${path}.pdf` }).unwrap();
			setOpen(false);
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not make the PDF', description: errorOf(e, '') });
		}
	};

	const option = (icon: any, heading: string, text: string, onClick: () => void, loading?: boolean) => (
		<Box
			as='button'
			textAlign='left'
			p={4}
			borderWidth='1px'
			borderColor='border'
			borderRadius='lg'
			cursor='pointer'
			opacity={loading ? 0.6 : 1}
			_hover={{ bg: 'bg.subtle', borderColor: 'border.emphasized' }}
			onClick={onClick}>
			<Flex
				gap={3}
				align='flex-start'>
				<Box
					mt={0.5}
					color='fg.muted'>
					{icon}
				</Box>
				<Box>
					<Text
						fontSize='sm'
						fontWeight='600'>
						{loading ? 'Making the PDF…' : heading}
					</Text>
					<Text
						fontSize='xs'
						color='fg.muted'
						mt={0.5}>
						{text}
					</Text>
				</Box>
			</Flex>
		</Box>
	);

	return (
		<>
			<MenuItem onClick={() => setOpen(true)}>{title || 'Print / PDF'}</MenuItem>
			<BulkDialog
				open={open}
				onClose={() => setOpen(false)}
				busy={isLoading}
				title={`Print ${rows(items.length, 'record')}`}
				footer={<CancelButton onClick={() => setOpen(false)} />}>
				<Grid
					templateColumns={{ base: '1fr', md: '1fr 1fr' }}
					gap={3}>
					{option(
						<Printer size={18} />,
						'Print view',
						'Each record on its own page, laid out like its view page — images and formatting included. Choose “Save as PDF” in the print dialog for a file.',
						printView
					)}
					{option(
						<FileText size={18} />,
						'Download PDF',
						'A PDF file straight away, one record per page. Plainer: text only.',
						pdf,
						isLoading
					)}
				</Grid>
			</BulkDialog>
		</>
	);
};

/** The page header's Export button: every row the table's filters match. */
export const ExportButton: FC<{ path: string }> = ({ path }) => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button
				onClick={() => setOpen(true)}
				size='sm'
				px={3}
				variant='outline'>
				<Download size={15} />
				<Box
					as='span'
					display={{ base: 'none', md: 'inline' }}>
					Export
				</Box>
			</Button>
			<ExportDialog
				open={open}
				onClose={() => setOpen(false)}
				path={path}
			/>
		</>
	);
};
