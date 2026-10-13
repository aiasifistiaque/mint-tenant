'use client';

import { FC, ReactNode, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, Flex, Grid, IconButton, Spinner, Text } from '@chakra-ui/react';
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	Braces,
	Building2,
	Copy,
	CornerLeftUp,
	Eye,
	FileDown,
	Redo2,
	Save,
	ScanEye,
	Sparkles,
	Star,
	Trash2,
	Undo2,
	ZoomIn,
	ZoomOut,
} from 'lucide-react';
import {
	Layout,
	useGetAllQuery,
	useGetPdfFieldsQuery,
	useGetPdfPreviewDataQuery,
	useGetPdfRecordDataQuery,
	useGetPdfSettingsQuery,
	useGetPdfTemplateQuery,
	useSetDefaultPdfTemplateMutation,
	useUpdatePdfTemplateMutation,
	viewerZone,
} from '@/components/library';
import { ConsoleTabs, Dropdown, ErrorState } from '@/components/library/cl';
import PdfPage from '@/components/library/pdf/PdfPage';
import { recordScope, sampleScope } from '@/components/library/pdf/scope';
import {
	Block,
	FieldTree,
	PdfTemplate,
	Slot,
	blockLabel,
	cloneBlock,
	findBlock,
	flattenFields,
	insertBlock,
	pageSize,
	moveBlock,
	newBlock,
	relocateBlock,
	removeBlock,
	updateBlock,
} from '@/components/library/pdf/types';
import { mainRoute, modelLabel, useLinkModels } from '@/app/builder/_components/useLinkModels';
import { toaster } from '@/components/ui/toaster';
import Outline from '../_components/designer/Outline';
import PageSettings from '../_components/designer/PageSettings';
import Properties from '../_components/designer/Properties';
import AddPanel from '../_components/designer/AddPanel';
import AiDialog from '../_components/AiDialog';
import RealPdfDialog from '../_components/RealPdfDialog';
import SettingsDialog from '../_components/SettingsDialog';
import { DocLink, ICON, LIST_HREF, errorOf, openPreview } from '../_components/ui';

const INSTANCE: Record<string, string> = { number: 'Number', date: 'Date', boolean: 'Boolean' };
const MAX_HISTORY = 100;
const ACCENT = '#4f46e5';

/** Waits until `value` has stopped changing for `ms`. */
const useSettled = <T,>(value: T, ms: number) => {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
};

/** A thin rule between toolbar groups. */
const Sep: FC = () => (
	<Box
		w='1px'
		h='20px'
		bg='border'
		mx={0.5}
		display={{ base: 'none', md: 'block' }}
	/>
);

/** A side panel: its own scroll, a border to the page. */
const Side: FC<{ side: 'left' | 'right'; children: ReactNode }> = ({ side, children }) => (
	<Box
		h={{ lg: 'full' }}
		minH={0}
		overflowY='auto'
		bg='bg.panel'
		borderColor='border'
		{...(side === 'left' ? { borderRightWidth: { lg: '1px' } } : { borderLeftWidth: { lg: '1px' } })}
		p={3}>
		{children}
	</Box>
);

/** The selected block's tools, on the page above it. */
const BarButton: FC<{ label: string; onClick: () => void; children: ReactNode }> = ({ label, onClick, children }) => (
	<button
		type='button'
		aria-label={label}
		title={label}
		onClick={onClick}
		style={{ background: 'transparent', border: 0, color: '#fff', padding: '3px 4px', cursor: 'pointer', display: 'inline-flex', borderRadius: 3 }}
		onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
		onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
		{children}
	</button>
);

/**
 * The designer (backend docs/pdf-templates PT-06, reorganised in PT-16 / D17):
 * a full-page tool — one toolbar; on the left what to add (blocks, ready-made
 * pieces, saved texts) and the layers; the page in the middle (click a block,
 * its tools sit on it; an empty business detail says "Add phone" — click to
 * fill it in); on the right the selected block, or the document when none is.
 * The page shows a record of the page (or sample data) the way the PDF lays
 * it out; Preview and Real PDF show the file itself. Nothing is saved until Save.
 */
const DesignerPage = ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = use(params);
	const { data, error, refetch } = useGetPdfTemplateQuery(id);
	const { data: settings } = useGetPdfSettingsQuery();
	const [save, { isLoading: saving }] = useUpdatePdfTemplateMutation();
	const [makeDefault] = useSetDefaultPdfTemplateMutation();
	const { models } = useLinkModels();

	const [t, setT] = useState<PdfTemplate | null>(null);
	const [base, setBase] = useState<string>('');
	const [hist, setHist] = useState<{ past: PdfTemplate[]; future: PdfTemplate[] }>({ past: [], future: [] });
	const [selected, setSelected] = useState<string | null>(null);
	const [tab, setTab] = useState<'add' | 'layers'>('add');
	const [mode, setMode] = useState<'values' | 'fields'>('values');
	const [zoom, setZoom] = useState(1);
	// null: not picked yet (the first record shows); '': Sample data, picked.
	const [recordId, setRecordId] = useState<string | null>(null);
	const [ai, setAi] = useState(false);
	const [real, setReal] = useState(false);
	const [business, setBusiness] = useState<{ open: boolean; focus: string | null }>({ open: false, focus: null });
	const [problems, setProblems] = useState<string[]>([]);
	// The page fits the middle column; zoom is relative to that.
	const canvasRef = useRef<HTMLDivElement>(null);
	const [canvasW, setCanvasW] = useState(0);
	useEffect(() => {
		const el = canvasRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => setCanvasW(el.clientWidth));
		ro.observe(el);
		setCanvasW(el.clientWidth);
		return () => ro.disconnect();
		// The canvas mounts once the template has loaded.
	}, [!!t]);

	// A fresh load (first visit, or after a save) replaces the working copy.
	useEffect(() => {
		if (!data) return;
		setT(data);
		setBase(JSON.stringify(data));
		setHist({ past: [], future: [] });
	}, [data]);

	const dirty = !!t && JSON.stringify(t) !== base;
	useEffect(() => {
		if (!dirty) return;
		const warn = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [dirty]);

	/** Every change goes through here, so it can be undone. */
	const edit = useCallback((fn: (t: PdfTemplate) => PdfTemplate) => {
		setT(cur => {
			if (!cur) return cur;
			const next = fn(cur);
			if (next === cur) return cur;
			setHist(h => ({ past: [...h.past.slice(-MAX_HISTORY), cur], future: [] }));
			return next;
		});
	}, []);
	const undo = () =>
		setHist(h => {
			if (!h.past.length || !t) return h;
			const prev = h.past[h.past.length - 1];
			setT(prev);
			return { past: h.past.slice(0, -1), future: [t, ...h.future] };
		});
	const redo = () =>
		setHist(h => {
			if (!h.future.length || !t) return h;
			const [next, ...rest] = h.future;
			setT(next);
			return { past: [...h.past, t], future: rest };
		});

	const route = t?.route || '';
	const { data: tree } = useGetPdfFieldsQuery(route, { skip: !route }) as { data?: FieldTree };
	const { data: records } = useGetAllQuery({ path: route, limit: 25 }, { skip: !route });
	const recordList: any[] = records?.doc || [];
	useEffect(() => {
		if (recordId === null && recordList.length) setRecordId(String(recordList[0]._id));
	}, [recordList, recordId]);

	// The record's data follows the template (what it reads), once edits settle.
	const settled = useSettled(t, 700);
	const {
		data: recordData,
		isFetching: loadingRecord,
		refetch: refetchRecord,
	} = useGetPdfRecordDataQuery({ route, id: recordId || '', template: settled, tz: viewerZone() }, { skip: !route || !recordId || !settled });

	// "Sample data": every field filled like Preview; the business details and saved texts as they are, the empty ones as "Add phone".
	const { data: previewData, isFetching: loadingPreview } = useGetPdfPreviewDataQuery({ template: settled, tz: viewerZone() }, { skip: !!recordId || !settled });
	const scope = useMemo(() => {
		if (!t) return null;
		if (recordId && recordData) return recordScope(recordData);
		if (!recordId && previewData) return recordScope(previewData);
		return sampleScope(t, settings, viewerZone(), undefined, true);
	}, [t, recordId, recordData, previewData, settings]);

	// pt → px is 4/3; the column's padding (48px) stays clear.
	const fitScale = t && canvasW ? Math.min(1.2, Math.max(0.3, (canvasW - 64) / ((pageSize(t)[0] * 4) / 3))) : 0.8;
	const scale = fitScale * zoom;
	const pages = useMemo(() => models.map(m => ({ value: mainRoute(m), label: modelLabel(m) })), [models]);
	const conditionFields = useMemo(
		() => (t ? flattenFields(tree?.fields || []).filter(f => f.type !== 'list').map(f => ({ key: `${t.alias}.${f.path}`, instance: INSTANCE[f.type] || 'String' })) : []),
		[tree, t?.alias]
	);
	const ctx = useMemo(() => (t ? { template: t, tree } : null), [t, tree]);
	const sel = t ? findBlock(t, selected) : null;

	/** A new block: after the selected one, or at the end of the body. */
	const addBlock = (b: Block) => {
		if (!t) return;
		const hit = findBlock(t, selected);
		edit(x => (hit ? insertBlock(x, hit.slot, hit.index + 1, b) : insertBlock(x, { part: 'body' }, x.body.length, b)));
		setSelected(b.id);
		requestAnimationFrame(() => document.querySelector(`[data-block="${b.id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
	};
	const addAt = (slot: Slot, index: number, b: Block) => {
		edit(x => insertBlock(x, slot, index, b));
		setSelected(b.id);
	};
	const remove = (bid: string) => {
		edit(x => removeBlock(x, bid));
		setSelected(null);
	};
	const duplicate = () => {
		if (!sel) return;
		const c = cloneBlock(sel.block);
		edit(x => insertBlock(x, sel.slot, sel.index + 1, c));
		setSelected(c.id);
	};
	const openBusiness = (focus: string | null = null) => setBusiness({ open: true, focus });

	// Keys: undo / redo, delete the selected block, save — not while typing.
	const keyRef = useRef<any>(null);
	keyRef.current = { undo, redo, selected, sel, remove, doSave: () => doSave() };
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const k = keyRef.current;
			const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable;
			const mod = e.metaKey || e.ctrlKey;
			if (mod && e.key.toLowerCase() === 's') {
				e.preventDefault();
				k.doSave();
				return;
			}
			if (typing || document.querySelector('[role=dialog]')) return;
			if (mod && e.key.toLowerCase() === 'z') {
				e.preventDefault();
				e.shiftKey ? k.redo() : k.undo();
			} else if ((e.key === 'Delete' || e.key === 'Backspace') && k.selected && k.sel) {
				e.preventDefault();
				k.remove(k.selected);
			} else if (e.key === 'Escape') setSelected(null);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	const doSave = async () => {
		if (!t || saving) return;
		try {
			const doc = await save({ id, body: t }).unwrap();
			setProblems([]);
			setT(doc);
			setBase(JSON.stringify(doc));
			toaster.create({ type: 'success', title: 'Saved' });
		} catch (e: any) {
			setProblems(e?.data?.errors || [errorOf(e)]);
			toaster.create({ type: 'error', title: 'Not saved', description: errorOf(e) });
		}
	};

	if (error)
		return (
			<Layout
				title='PDF Template'
				path='pdf-templates'>
				<ErrorState
					error={error}
					onRetry={refetch}
				/>
			</Layout>
		);

	const blockBar = sel && (
		<Flex
			align='center'
			bg={ACCENT}
			color='white'
			borderRadius='4px'
			px={1}
			py={0.5}
			gap={0.5}
			boxShadow='0 2px 6px rgba(0,0,0,.18)'
			whiteSpace='nowrap'>
			<Text
				fontSize='11px'
				fontWeight='600'
				px={1}>
				{blockLabel(sel.block.type)}
			</Text>
			{sel.slot.parent && (
				<BarButton
					label={`Select the ${blockLabel(findBlock(t!, sel.slot.parent)?.block.type || 'box').toLowerCase()} around it`}
					onClick={() => setSelected(sel.slot.parent!)}>
					<CornerLeftUp size={13} />
				</BarButton>
			)}
			<BarButton
				label='Move up'
				onClick={() => edit(x => moveBlock(x, sel.block.id, -1))}>
				<ArrowUp size={13} />
			</BarButton>
			<BarButton
				label='Move down'
				onClick={() => edit(x => moveBlock(x, sel.block.id, 1))}>
				<ArrowDown size={13} />
			</BarButton>
			<BarButton
				label='Duplicate'
				onClick={duplicate}>
				<Copy size={13} />
			</BarButton>
			<BarButton
				label='Delete (⌫)'
				onClick={() => remove(sel.block.id)}>
				<Trash2 size={13} />
			</BarButton>
		</Flex>
	);

	return (
		<Layout
			title={t?.name || 'PDF Template'}
			path='pdf-templates'
			type='pos'
			fullBleed>
			<Flex
				direction='column'
				h={{ lg: 'calc(100dvh - var(--chakra-spacing-14))' }}>
				{/* One toolbar: the template, undo, what the page shows, then what to do with it. */}
				<Flex
					align='center'
					gap={1.5}
					px={3}
					py={2}
					borderBottomWidth='1px'
					borderColor='border'
					bg='bg.panel'
					flexWrap='wrap'
					flexShrink={0}>
					<NextLink href={LIST_HREF()}>
						<IconButton
							size='xs'
							variant='ghost'
							aria-label='All templates'
							title='All templates'>
							<ArrowLeft {...ICON} />
						</IconButton>
					</NextLink>
					<Box
						minW={0}
						maxW='260px'
						mr={1}>
						<Flex
							align='center'
							gap={1.5}>
							<Text
								fontSize='sm'
								fontWeight='600'
								truncate>
								{t?.name || '…'}
							</Text>
							{t?.isDefault && (
								<Badge
									size='xs'
									colorPalette='green'
									variant='subtle'>
									Default
								</Badge>
							)}
						</Flex>
						<Text
							fontSize='11px'
							color={dirty ? 'orange.fg' : 'fg.muted'}
							truncate>
							{route ? `Prints /${route}` : 'No page picked yet'} · {dirty ? 'Unsaved changes' : 'Saved'}
						</Text>
					</Box>
					<Sep />
					<IconButton
						size='xs'
						variant='ghost'
						aria-label='Undo'
						title='Undo (⌘Z)'
						disabled={!hist.past.length}
						onClick={undo}>
						<Undo2 {...ICON} />
					</IconButton>
					<IconButton
						size='xs'
						variant='ghost'
						aria-label='Redo'
						title='Redo (⇧⌘Z)'
						disabled={!hist.future.length}
						onClick={redo}>
						<Redo2 {...ICON} />
					</IconButton>
					<Sep />
					<Box
						w='210px'
						maxW='100%'>
						<Dropdown
							size='xs'
							value={recordId || ''}
							searchable
							placeholder={route ? (recordList.length ? 'Show a record' : 'No records yet — sample data') : 'Pick the page first'}
							onChange={setRecordId}>
							<option value=''>Sample data</option>
							{recordList.map((r: any) => (
								<option
									key={r._id}
									value={String(r._id)}>
									{String(r.name || r.title || r.code || r.number || r._id)}
								</option>
							))}
						</Dropdown>
					</Box>
					{(loadingRecord || loadingPreview) && <Spinner size='xs' />}
					<Button
						size='xs'
						variant={mode === 'fields' ? 'solid' : 'ghost'}
						onClick={() => setMode(m => (m === 'fields' ? 'values' : 'fields'))}
						title='Show which field goes where'>
						{mode === 'fields' ? <Eye {...ICON} /> : <Braces {...ICON} />}
						{mode === 'fields' ? 'Values' : 'Fields'}
					</Button>
					<Flex
						align='center'
						gap={0}>
						<IconButton
							size='xs'
							variant='ghost'
							aria-label='Zoom out'
							onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}>
							<ZoomOut {...ICON} />
						</IconButton>
						<Text
							as='button'
							fontSize='xs'
							w='38px'
							textAlign='center'
							title='Fit the width'
							onClick={() => setZoom(1)}>
							{Math.round(zoom * 100)}%
						</Text>
						<IconButton
							size='xs'
							variant='ghost'
							aria-label='Zoom in'
							onClick={() => setZoom(z => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}>
							<ZoomIn {...ICON} />
						</IconButton>
					</Flex>
					<Box flex='1' />
					<Button
						size='xs'
						variant='ghost'
						onClick={() => openBusiness()}>
						<Building2 {...ICON} />
						Business details
					</Button>
					<Button
						size='xs'
						variant='ghost'
						disabled={!t?.route}
						onClick={() => setAi(true)}>
						<Sparkles {...ICON} />
						Your AI
					</Button>
					<Sep />
					<Button
						size='xs'
						variant='outline'
						disabled={!t}
						title='The PDF in a new tab, every field filled with sample data'
						onClick={() => t && openPreview(id, dirty ? t : undefined)}>
						<ScanEye {...ICON} />
						Preview
					</Button>
					<Button
						size='xs'
						variant='outline'
						disabled={!t}
						title='The PDF of the record shown, with your unsaved changes'
						onClick={() => setReal(true)}>
						<FileDown {...ICON} />
						Real PDF
					</Button>
					{t && !t.isDefault && t.route && !dirty && (
						<Button
							size='xs'
							variant='ghost'
							title='Make it this page’s Download PDF'
							onClick={async () => {
								try {
									await makeDefault(id).unwrap();
									toaster.create({ type: 'success', title: 'It’s this page’s Download PDF now' });
								} catch (e) {
									toaster.create({ type: 'error', title: 'That didn’t work', description: errorOf(e) });
								}
							}}>
							<Star {...ICON} />
							Make default
						</Button>
					)}
					<Button
						size='xs'
						disabled={!dirty}
						loading={saving}
						onClick={doSave}>
						<Save {...ICON} />
						Save
					</Button>
				</Flex>

				{problems.length > 0 && (
					<Box
						px={4}
						py={2}
						borderBottomWidth='1px'
						borderColor='red.300'
						bg='red.subtle'
						fontSize='xs'
						flexShrink={0}>
						<Text fontWeight='600'>Fix these to save:</Text>
						{problems.slice(0, 8).map(p => (
							<Text key={p}>• {p}</Text>
						))}
					</Box>
				)}

				{!t || !scope || !ctx ? (
					<Flex
						flex='1'
						justify='center'
						align='center'
						py={20}>
						<Spinner />
					</Flex>
				) : (
					<Grid
						flex='1'
						minH={0}
						templateColumns={{ base: '1fr', lg: '280px minmax(0, 1fr) 330px' }}>
						{/* Left: what to add, and the layers */}
						<Side side='left'>
							<ConsoleTabs
								value={tab}
								onChange={v => setTab(v as any)}
								tabs={[
									{ value: 'add', label: 'Add' },
									{ value: 'layers', label: 'Layers' },
								]}>
								{null}
							</ConsoleTabs>
							<Box pt={3}>
								{tab === 'add' ? (
									<AddPanel
										where={sel ? `after the selected ${blockLabel(sel.block.type).toLowerCase()}` : 'at the end of the body — select a block to add after it'}
										onAdd={addBlock}
										alias={t.alias}
										texts={settings?.texts || []}
										onTexts={focus => openBusiness(focus || 'texts.')}
									/>
								) : (
									<>
										<Outline
											template={t}
											selected={selected}
											onSelect={setSelected}
											onAdd={(slot, index, type) => addAt(slot, index, newBlock(type, t.alias))}
											onMove={(bid, slot, index) => edit(x => relocateBlock(x, bid, slot, index))}
										/>
										<Box mt={4}>
											<DocLink section='blocks' />
										</Box>
									</>
								)}
							</Box>
						</Side>

						{/* Middle: the page */}
						<Box
							ref={canvasRef}
							minW={0}
							h={{ lg: 'full' }}
							overflow='auto'
							bg='bg.muted'
							px={{ base: 3, md: 8 }}
							py={{ base: 4, md: 8 }}
							onClick={() => setSelected(null)}>
							<Box
								mx='auto'
								w='fit-content'
								boxShadow='0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08)'
								css={{ '& .pdf-block:hover': { outline: '1px dashed rgba(79,70,229,.5)', outlineOffset: '2px' } }}>
								<PdfPage
									template={t}
									scope={scope}
									mode={mode}
									selected={selected}
									onSelect={i => setSelected(i || null)}
									scale={scale}
									onFix={path => openBusiness(path)}
									blockBar={blockBar}
								/>
							</Box>
							<Text
								fontSize='11px'
								color='fg.subtle'
								textAlign='center'
								mt={3}>
								One long page here — Preview and Real PDF show it split into pages, with page numbers.
							</Text>
						</Box>

						{/* Right: the selected block, or the document */}
						<Side side='right'>
							{sel ? (
								<Properties
									key={sel.block.id}
									block={sel.block}
									ctx={ctx}
									conditionFields={conditionFields as any}
									onChange={patch => edit(x => updateBlock(x, sel.block.id, patch as Partial<Block>))}
									onRemove={() => remove(sel.block.id)}
									onDuplicate={duplicate}
									onMove={by => edit(x => moveBlock(x, sel.block.id, by))}
								/>
							) : (
								<Box>
									<Text
										fontSize='sm'
										fontWeight='600'>
										Document
									</Text>
									<Text
										fontSize='xs'
										color='fg.muted'
										mb={3}>
										The whole template. Click a block on the page to change it instead.
									</Text>
									<PageSettings
										template={t}
										set={p => edit(x => ({ ...x, ...p }))}
										pages={pages}
										tree={tree}
									/>
								</Box>
							)}
						</Side>
					</Grid>
				)}
			</Flex>

			{t && (
				<AiDialog
					open={ai}
					onClose={() => setAi(false)}
					template={t}
					dirty={dirty}
					onReload={refetch}
				/>
			)}
			{t && (
				<RealPdfDialog
					open={real}
					onClose={() => setReal(false)}
					template={t}
					recordId={recordId || undefined}
				/>
			)}
			<SettingsDialog
				open={business.open}
				focus={business.focus}
				onClose={() => {
					setBusiness({ open: false, focus: null });
					// The record's data carries the business details: fetch it again.
					if (route && recordId) refetchRecord();
				}}
			/>
		</Layout>
	);
};

export default DesignerPage;
