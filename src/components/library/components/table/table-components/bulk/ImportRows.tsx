'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	CloseButton,
	Dialog,
	Flex,
	Grid,
	Link,
	Portal,
	SegmentGroup,
	Spinner,
	Table,
	Text,
	Textarea,
} from '@chakra-ui/react';
import { Braces, Check, ChevronDown, Download, ExternalLink, FileSpreadsheet, FileText, Upload, X } from 'lucide-react';
import { toaster } from '@/components/ui/toaster';
import ModalFooter from '../../../../modals/modal-components/CustomModalFooter';
import { nounOf } from '../../../../modals/CreateModal/CreateModal';
import { radius, styles } from '../../../../config';
import {
	ImportColumn,
	ImportFormat,
	ImportResult,
	saveFile,
	useImportRowsMutation,
	useImportTemplateQuery,
} from '../../../../store/services/bulkApi';
import { docsPath } from '@/components/library/config/lib/constants/panel';

/**
 * Bulk upload — many records from an Excel, CSV or JSON file (the table
 * header's ⋯ menu, when the route's config has `bulkUpload`).
 *
 * Two steps: pick the file type and the file (or paste JSON), then Check —
 * the server reads it and checks every row the way the create form's save
 * would (backend importRows.controller.ts). Problems come back row by row and
 * nothing is saved; when every row passes, Import saves them all.
 */

const MAX_BYTES = 10 * 1024 * 1024;

const FORMATS: { value: ImportFormat; label: string; hint: string; accept: string; icon: ReactNode }[] = [
	{ value: 'xlsx', label: 'Excel', hint: '.xlsx — the first sheet', accept: '.xlsx', icon: <FileSpreadsheet size={18} strokeWidth={1.75} /> },
	{ value: 'csv', label: 'CSV', hint: '.csv — comma or semicolon', accept: '.csv,text/csv', icon: <FileText size={18} strokeWidth={1.75} /> },
	{ value: 'json', label: 'JSON', hint: 'Paste or upload a list', accept: '.json,application/json', icon: <Braces size={18} strokeWidth={1.75} /> },
];

const size = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

/** A file's contents as the server wants them: text, or base64 for Excel. */
const readFile = (file: File, format: ImportFormat) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('Could not read that file'));
		if (format === 'xlsx') {
			reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ''));
			reader.readAsDataURL(file);
		} else {
			reader.onload = () => resolve(String(reader.result));
			reader.readAsText(file);
		}
	});

const csvCell = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** A starter file with the route's columns: a CSV header row, or a JSON record. */
const downloadTemplate = (columns: ImportColumn[], format: ImportFormat, path: string) => {
	if (format === 'json') {
		const sample = Object.fromEntries(columns.map(c => [c.key, c.list ? [] : c.options?.[0] ?? '']));
		saveFile({ blob: new Blob([JSON.stringify([sample], null, 2)], { type: 'application/json' }), name: `${path}-template.json` });
	} else {
		// A CSV opens in Excel too; save it as .xlsx from there if you prefer.
		const head = columns.map(c => csvCell(c.label)).join(',');
		saveFile({ blob: new Blob([`﻿${head}\n`], { type: 'text/csv' }), name: `${path}-template.csv` });
	}
};

const Label: FC<{ children: ReactNode; aside?: ReactNode }> = ({ children, aside }) => (
	<Flex
		align='center'
		justify='space-between'
		gap={3}
		mb={2}>
		<Text
			fontSize='13px'
			fontWeight='600'>
			{children}
		</Text>
		{aside}
	</Flex>
);

/** The columns a file can have, with what each takes. */
const Columns: FC<{ columns: ImportColumn[] }> = ({ columns }) => (
	<Box
		borderWidth='1px'
		borderColor='border'
		borderRadius='md'
		maxH='220px'
		overflowY='auto'>
		<Table.Root
			size='sm'
			bg='transparent'>
			<Table.Header
				position='sticky'
				top={0}
				bg='bg.muted'
				zIndex={1}>
				<Table.Row bg='bg.muted'>
					<Table.ColumnHeader fontSize='11px'>Column</Table.ColumnHeader>
					<Table.ColumnHeader fontSize='11px'>Takes</Table.ColumnHeader>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{columns.map(c => (
					<Table.Row
						key={c.key}
						bg='transparent'>
						<Table.Cell
							fontSize='12px'
							verticalAlign='top'>
							<Text fontWeight='500'>
								{c.label}
								{c.required && (
									<Text
										as='span'
										color='red.500'>
										{' '}
										*
									</Text>
								)}
							</Text>
							<Text
								fontFamily='mono'
								fontSize='11px'
								color='fg.muted'>
								{c.key}
							</Text>
						</Table.Cell>
						<Table.Cell
							fontSize='12px'
							color='fg.muted'>
							{c.ref
								? `A ${c.ref.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()} — its name, code or id${c.list ? '; several split by ;' : ''}`
								: c.options?.length
								? `One of: ${c.options.join(', ')}`
								: c.list
								? `A list — values split by ;`
								: c.type === 'date'
								? 'A date, like 2026-09-29'
								: c.type === 'number'
								? 'A number'
								: c.type === 'boolean'
								? 'Yes or no'
								: c.type === 'mixed' || c.type === 'embedded'
								? 'JSON'
								: 'Text'}
						</Table.Cell>
					</Table.Row>
				))}
			</Table.Body>
		</Table.Root>
	</Box>
);

const cell = (v: any): string =>
	v === undefined || v === null || v === '' ? '—' : Array.isArray(v) ? v.map(cell).join(', ') : typeof v === 'object' ? JSON.stringify(v) : /^\d{4}-\d\d-\d\dT/.test(String(v)) ? String(v).slice(0, 10) : String(v);

const ImportDialog: FC<{ open: boolean; onClose: () => void; path: string; title?: string }> = ({ open, onClose, path, title }) => {
	const noun = nounOf(path);
	const [format, setFormat] = useState<ImportFormat>('xlsx');
	const [jsonMode, setJsonMode] = useState<'paste' | 'upload'>('paste');
	const [file, setFile] = useState<File | null>(null);
	const [pasted, setPasted] = useState('');
	const [over, setOver] = useState(false);
	const [showColumns, setShowColumns] = useState(false);
	const [readError, setReadError] = useState('');
	const [checked, setChecked] = useState<ImportResult | null>(null);
	const [content, setContent] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	const { data: template, isFetching: loadingTemplate } = useImportTemplateQuery(path, { skip: !open });
	const [run, { isLoading }] = useImportRowsMutation();
	const [importing, setImporting] = useState(false);

	const reset = () => {
		setFile(null);
		setPasted('');
		setReadError('');
		setChecked(null);
		setContent('');
	};

	useEffect(() => {
		if (open) {
			reset();
			setFormat('xlsx');
			setJsonMode('paste');
		}
	}, [open]);

	const fmt = FORMATS.find(f => f.value === format)!;
	const usesFile = format !== 'json' || jsonMode === 'upload';
	const ready = usesFile ? !!file : !!pasted.trim();
	const busy = isLoading || importing;

	const pick = (f?: File | null) => {
		setReadError('');
		setChecked(null);
		if (!f) return;
		if (f.size > MAX_BYTES) return setReadError(`That file is ${size(f.size)} — the most is ${size(MAX_BYTES)}.`);
		const ext = f.name.split('.').pop()?.toLowerCase();
		const want = format === 'xlsx' ? 'xlsx' : format;
		if (ext !== want) return setReadError(`That’s a .${ext} file — choose a .${want} file, or switch the file type above.`);
		setFile(f);
	};

	const check = async () => {
		setReadError('');
		setChecked(null);
		try {
			const body = usesFile ? await readFile(file!, format) : pasted;
			setContent(body);
			const r = await run({ path, format, content: body, dryRun: true }).unwrap();
			setChecked(r);
		} catch (e: any) {
			setReadError(e?.data?.message || e?.message || 'Could not check this file');
		}
	};

	const save = async () => {
		setImporting(true);
		try {
			const r = await run({ path, format, content, dryRun: false }).unwrap();
			toaster.create({ type: 'success', title: `${plural(r.created || 0, noun)} imported` });
			onClose();
		} catch (e: any) {
			// Something changed since the check (a duplicate added meanwhile): show why, nothing was saved.
			if (e?.data?.problems) setChecked(e.data);
			setReadError(e?.data?.message || 'Could not import these rows');
		} finally {
			setImporting(false);
		}
	};

	const problems = checked?.problems || [];
	const passed = checked && !problems.length;

	return (
		<Dialog.Root
			lazyMount
			unmountOnExit
			open={open}
			size='lg'
			placement='center'
			scrollBehavior='inside'
			onOpenChange={e => !e.open && !busy && onClose()}>
			<Portal>
				<Dialog.Backdrop
					_light={{ bg: styles.color.MODAL_OVERLAY.LIGHT }}
					_dark={{ bg: styles.color.MODAL_OVERLAY.DARK }}
				/>
				<Dialog.Positioner px={4}>
					<Dialog.Content
						{...(styles.MODAL as any)}
						borderRadius={radius.MODAL}
						onClick={(e: any) => e.stopPropagation()}>
						<Dialog.Header
							px={{ base: 4, md: 6 }}
							pt={{ base: 4, md: 5 }}
							pb={{ base: 3, md: 4 }}
							borderBottomWidth='1px'
							borderColor='border.muted'>
							<Flex
								align='center'
								gap={3}
								pr={10}>
								<Flex
									flexShrink={0}
									w='36px'
									h='36px'
									align='center'
									justify='center'
									borderRadius='lg'
									borderWidth='1px'
									borderColor='border'
									bg='bg.subtle'
									color='fg.muted'>
									<Upload
										size={17}
										strokeWidth={1.75}
									/>
								</Flex>
								<Box>
									<Dialog.Title
										fontSize='16px'
										fontWeight='600'>
										{title || 'Bulk upload'}
									</Dialog.Title>
									<Dialog.Description
										fontSize='13px'
										color='fg.muted'>
										{checked ? `Step 2 of 2 · Check and import` : `Step 1 of 2 · Add many ${noun} records from a file`}
									</Dialog.Description>
								</Box>
							</Flex>
						</Dialog.Header>
						<Dialog.CloseTrigger
							asChild
							top={{ base: 4, md: 5 }}
							insetEnd={3}>
							<CloseButton
								size='sm'
								borderRadius='full'
								color='fg.muted'
								disabled={busy}
							/>
						</Dialog.CloseTrigger>

						<Dialog.Body
							px={{ base: 4, md: 6 }}
							py={5}>
							<Flex
								direction='column'
								gap={5}>
								{readError && (
									<Alert.Root
										status='error'
										borderRadius='md'>
										<Alert.Indicator />
										<Alert.Content>
											<Alert.Title>{checked ? 'Nothing was imported' : 'This file can’t be used yet'}</Alert.Title>
											<Alert.Description>{readError}</Alert.Description>
										</Alert.Content>
									</Alert.Root>
								)}

								{!checked ? (
									<>
										<Box>
											<Label>File type</Label>
											<Grid
												templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }}
												gap={2}
												role='radiogroup'
												aria-label='File type'>
												{FORMATS.map(f => {
													const on = f.value === format;
													return (
														<Flex
															key={f.value}
															as='button'
															role='radio'
															aria-checked={on}
															align='flex-start'
															gap={3}
															p={3}
															textAlign='left'
															borderRadius='lg'
															borderWidth='1px'
															borderColor={on ? 'fg' : 'border'}
															boxShadow={on ? '0 0 0 1px var(--chakra-colors-fg)' : 'none'}
															bg='bg.panel'
															cursor='pointer'
															_hover={{ borderColor: on ? 'fg' : 'border.emphasized' }}
															_focusVisible={{ outline: '2px solid', outlineColor: 'fg', outlineOffset: '2px' }}
															onClick={() => {
																if (on) return;
																setFormat(f.value);
																setFile(null);
																setReadError('');
															}}>
															<Box
																color={on ? 'fg' : 'fg.muted'}
																mt='1px'>
																{f.icon}
															</Box>
															<Box
																flex={1}
																minW={0}>
																<Text
																	fontSize='13px'
																	fontWeight='600'>
																	{f.label}
																</Text>
																<Text
																	fontSize='11px'
																	color='fg.muted'>
																	{f.hint}
																</Text>
															</Box>
															<Flex
																flexShrink={0}
																w='16px'
																h='16px'
																mt='2px'
																align='center'
																justify='center'
																borderRadius='full'
																borderWidth={on ? '5px' : '1px'}
																borderColor={on ? 'fg' : 'border.emphasized'}
															/>
														</Flex>
													);
												})}
											</Grid>
										</Box>

										{format === 'json' && (
											<SegmentGroup.Root
												size='sm'
												value={jsonMode}
												onValueChange={d => {
													setJsonMode((d.value as any) || 'paste');
													setReadError('');
												}}
												w='fit-content'>
												<SegmentGroup.Indicator />
												<SegmentGroup.Items
													items={[
														{ value: 'paste', label: 'Paste JSON' },
														{ value: 'upload', label: 'Upload a file' },
													]}
												/>
											</SegmentGroup.Root>
										)}

										{usesFile ? (
											<Box>
												<Label>File</Label>
												<input
													ref={inputRef}
													type='file'
													accept={fmt.accept}
													style={{ display: 'none' }}
													onChange={e => {
														pick(e.target.files?.[0]);
														e.target.value = '';
													}}
												/>
												{file ? (
													<Flex
														align='center'
														gap={3}
														p={3}
														borderWidth='1px'
														borderColor='border'
														borderRadius='lg'
														bg='bg.subtle'>
														<Box color='fg.muted'>{fmt.icon}</Box>
														<Box
															flex={1}
															minW={0}>
															<Text
																fontSize='13px'
																fontWeight='500'
																truncate>
																{file.name}
															</Text>
															<Text
																fontSize='11px'
																color='fg.muted'>
																{size(file.size)}
															</Text>
														</Box>
														<Button
															size='xs'
															variant='ghost'
															onClick={() => inputRef.current?.click()}>
															Change
														</Button>
														<Button
															size='xs'
															variant='ghost'
															aria-label='Remove file'
															onClick={() => setFile(null)}>
															<X size={14} />
														</Button>
													</Flex>
												) : (
													<Flex
														role='button'
														tabIndex={0}
														direction='column'
														align='center'
														justify='center'
														gap={2}
														h='132px'
														borderWidth='1px'
														borderStyle='dashed'
														borderColor={over ? 'fg' : 'border.emphasized'}
														borderRadius='lg'
														bg={over ? 'bg.muted' : 'bg.subtle'}
														color='fg.muted'
														cursor='pointer'
														transition='border-color 150ms, background-color 150ms'
														_hover={{ borderColor: 'fg.muted' }}
														_focusVisible={{ outline: '2px solid', outlineColor: 'fg', outlineOffset: '2px' }}
														onClick={() => inputRef.current?.click()}
														onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current?.click())}
														onDragOver={e => {
															e.preventDefault();
															setOver(true);
														}}
														onDragLeave={() => setOver(false)}
														onDrop={e => {
															e.preventDefault();
															setOver(false);
															pick(e.dataTransfer.files?.[0]);
														}}>
														<Upload
															size={20}
															strokeWidth={1.5}
														/>
														<Text fontSize='13px'>
															<Text
																as='span'
																color='fg'
																fontWeight='500'>
																Choose {format === 'xlsx' ? 'an' : 'a'} {fmt.label} file
															</Text>{' '}
															or drop it here
														</Text>
														<Text fontSize='11px'>
															First row: the column names. Up to {(template?.maxRows || 2000).toLocaleString()} rows, {size(MAX_BYTES)}.
														</Text>
													</Flex>
												)}
											</Box>
										) : (
											<Box>
												<Label>JSON</Label>
												<Textarea
													value={pasted}
													onChange={e => {
														setPasted(e.target.value);
														setReadError('');
													}}
													rows={9}
													fontFamily='mono'
													fontSize='12px'
													spellCheck={false}
													placeholder={`[\n  { "${template?.columns?.[0]?.key || 'name'}": "…" },\n  { "${template?.columns?.[0]?.key || 'name'}": "…" }\n]`}
												/>
												<Text
													mt={1.5}
													fontSize='11px'
													color='fg.muted'>
													A list of records. Keys are the field names below (or their labels).
												</Text>
											</Box>
										)}

										<Box>
											<Label
												aside={
													template?.columns?.length ? (
														<Button
															size='xs'
															variant='ghost'
															onClick={() => downloadTemplate(template.columns, format, path)}>
															<Download size={13} />
															{format === 'json' ? 'JSON template' : 'CSV template'}
														</Button>
													) : null
												}>
												<Flex
													as='button'
													align='center'
													gap={1}
													onClick={() => setShowColumns(v => !v)}>
													Columns this table takes
													{loadingTemplate ? (
														<Spinner size='xs' />
													) : (
														<Text
															as='span'
															fontWeight='400'
															color='fg.muted'>
															· {template?.columns?.length || 0}
														</Text>
													)}
													<Box
														as='span'
														color='fg.muted'
														transform={showColumns ? 'rotate(180deg)' : 'none'}
														transition='transform 150ms'>
														<ChevronDown size={14} />
													</Box>
												</Flex>
											</Label>
											{showColumns && template?.columns && <Columns columns={template.columns} />}
										</Box>
									</>
								) : (
									<Report result={checked} />
								)}
							</Flex>
						</Dialog.Body>

						<ModalFooter>
							<Link
								href={docsPath('/docs/builder#table-upload')}
								target='_blank'
								rel='noopener noreferrer'
								mr='auto'
								display='inline-flex'
								alignItems='center'
								gap={1}
								fontSize='xs'
								color='fg.muted'
								_hover={{ color: 'fg', textDecoration: 'underline' }}>
								How it works
								<ExternalLink size={11} />
							</Link>
							{checked ? (
								<>
									<Button
										size='sm'
										px={3}
										variant='outline'
										disabled={busy}
										onClick={() => {
											setChecked(null);
											setReadError('');
										}}>
										{passed ? 'Back' : 'Choose another file'}
									</Button>
									<Button
										size='sm'
										px={3}
										disabled={!passed}
										loading={importing}
										loadingText='Importing'
										spinnerPlacement='start'
										onClick={save}>
										<Check size={15} />
										Import {plural(checked.total, 'row')}
									</Button>
								</>
							) : (
								<>
									<Button
										size='sm'
										px={3}
										variant='outline'
										disabled={busy}
										onClick={onClose}>
										Cancel
									</Button>
									<Button
										size='sm'
										px={3}
										disabled={!ready}
										loading={isLoading}
										loadingText='Checking'
										spinnerPlacement='start'
										onClick={check}>
										Check file
									</Button>
								</>
							)}
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

/** What the check found: the problems row by row, or the first rows it will import. */
const Report: FC<{ result: ImportResult }> = ({ result }) => {
	const { problems, total, invalidRows, ignored, columns, preview, moreProblems } = result;
	const count = problems.length + (moreProblems || 0);

	return (
		<>
			{problems.length ? (
				<Alert.Root
					status='error'
					borderRadius='md'>
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>
							{plural(count, 'problem')} in {plural(invalidRows, 'row')} of {total.toLocaleString()}
						</Alert.Title>
						<Alert.Description>Nothing has been imported. Fix these in the file, then choose it again.</Alert.Description>
					</Alert.Content>
				</Alert.Root>
			) : (
				<Alert.Root
					status='success'
					borderRadius='md'>
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>All {plural(total, 'row')} look right</Alert.Title>
						<Alert.Description>
							Import adds them all. If one fails to save, none are kept.
						</Alert.Description>
					</Alert.Content>
				</Alert.Root>
			)}

			{ignored?.length > 0 && (
				<Alert.Root
					status='warning'
					borderRadius='md'>
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>{plural(ignored.length, 'column')} will be skipped</Alert.Title>
						<Alert.Description>
							{ignored.join(', ')} — {ignored.length === 1 ? 'it doesn’t' : 'they don’t'} match a field. Rename{' '}
							{ignored.length === 1 ? 'it' : 'them'} to a field’s name to import {ignored.length === 1 ? 'it' : 'them'}.
						</Alert.Description>
					</Alert.Content>
				</Alert.Root>
			)}

			{problems.length ? (
				<Box>
					<Label>Problems</Label>
					<Box
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						maxH='300px'
						overflowY='auto'>
						<Table.Root
							size='sm'
							bg='transparent'>
							<Table.Header
								position='sticky'
								top={0}
								zIndex={1}>
								<Table.Row bg='bg.muted'>
									<Table.ColumnHeader
										fontSize='11px'
										w='64px'>
										Row
									</Table.ColumnHeader>
									<Table.ColumnHeader fontSize='11px'>Column</Table.ColumnHeader>
									<Table.ColumnHeader fontSize='11px'>What’s wrong</Table.ColumnHeader>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{problems.map((p, i) => (
									<Table.Row
										key={i}
										bg='transparent'>
										<Table.Cell
											fontSize='12px'
											fontFamily='mono'
											color='fg.muted'>
											{p.row}
										</Table.Cell>
										<Table.Cell
											fontSize='12px'
											fontWeight='500'>
											{p.field || '—'}
										</Table.Cell>
										<Table.Cell
											fontSize='12px'
											color='red.fg'>
											{p.message}
										</Table.Cell>
									</Table.Row>
								))}
							</Table.Body>
						</Table.Root>
					</Box>
					<Text
						mt={1.5}
						fontSize='11px'
						color='fg.muted'>
						Row numbers are the file’s: row 1 is the column names, so the first record is row 2.
						{moreProblems ? ` ${plural(moreProblems, 'more problem')} not shown.` : ''}
					</Text>
				</Box>
			) : (
				<Box>
					<Label>
						First {Math.min(preview.length, total)} of {plural(total, 'row')}
					</Label>
					<Box
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						overflowX='auto'>
						<Table.Root
							size='sm'
							bg='transparent'>
							<Table.Header>
								<Table.Row bg='bg.muted'>
									{columns.map(c => (
										<Table.ColumnHeader
											key={c.key}
											fontSize='11px'
											whiteSpace='nowrap'>
											{c.label}
										</Table.ColumnHeader>
									))}
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{preview.map((r, i) => (
									<Table.Row
										key={i}
										bg='transparent'>
										{columns.map(c => (
											<Table.Cell
												key={c.key}
												fontSize='12px'
												maxW='200px'
												truncate>
												{cell(r[c.key])}
											</Table.Cell>
										))}
									</Table.Row>
								))}
							</Table.Body>
						</Table.Root>
					</Box>
					{preview.some(r => Object.values(r).some(v => [].concat(v as any).some((x: any) => /^[a-f0-9]{24}$/i.test(String(x))))) && (
						<Text
							mt={1.5}
							fontSize='11px'
							color='fg.muted'>
							Linked records show as their ids here; they were found by the names in your file.
						</Text>
					)}
				</Box>
			)}
		</>
	);
};

export default ImportDialog;
