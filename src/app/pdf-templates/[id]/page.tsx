'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, IconButton, Spinner, Text } from '@chakra-ui/react';
import { Braces, Eye, FileDown, Redo2, Save, Sparkles, Star, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import {
	Layout,
	useGetAllQuery,
	useGetPdfFieldsQuery,
	useGetPdfRecordDataQuery,
	useGetPdfSettingsQuery,
	useGetPdfTemplateQuery,
	useSetDefaultPdfTemplateMutation,
	useUpdatePdfTemplateMutation,
	viewerZone,
} from '@/components/library';
import { ConsoleTabs, Dropdown, ErrorState, PageHeader } from '@/components/library/cl';
import { HOME } from '@/components/library/config/lib/constants/panel';
import PdfPage from '@/components/library/pdf/PdfPage';
import { recordScope, sampleScope } from '@/components/library/pdf/scope';
import {
	Block,
	BlockType,
	FieldTree,
	PdfTemplate,
	Slot,
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
import AiDialog from '../_components/AiDialog';
import RealPdfDialog from '../_components/RealPdfDialog';
import { DocLink, ICON, LIST_HREF, errorOf } from '../_components/ui';

const INSTANCE: Record<string, string> = { number: 'Number', date: 'Date', boolean: 'Boolean' };
const MAX_HISTORY = 100;

/** Waits until `value` has stopped changing for `ms`. */
const useSettled = <T,>(value: T, ms: number) => {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
};

/**
 * The designer (backend docs/pdf-templates, PT-06): the blocks on the left,
 * the page in the middle (click a block to edit it), its settings on the
 * right. The page shows a real record of the page (or sample data) the way
 * the PDF lays it out; "Real PDF" shows the file the server makes. Nothing
 * is saved until Save.
 */
const DesignerPage = ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = use(params);
	const { data, isLoading, error, refetch } = useGetPdfTemplateQuery(id);
	const { data: settings } = useGetPdfSettingsQuery();
	const [save, { isLoading: saving }] = useUpdatePdfTemplateMutation();
	const [makeDefault] = useSetDefaultPdfTemplateMutation();
	const { models } = useLinkModels();

	const [t, setT] = useState<PdfTemplate | null>(null);
	const [base, setBase] = useState<string>('');
	const [hist, setHist] = useState<{ past: PdfTemplate[]; future: PdfTemplate[] }>({ past: [], future: [] });
	const [selected, setSelected] = useState<string | null>(null);
	const [tab, setTab] = useState<'blocks' | 'page'>('blocks');
	const [mode, setMode] = useState<'values' | 'fields'>('values');
	const [zoom, setZoom] = useState(1);
	const [recordId, setRecordId] = useState('');
	const [ai, setAi] = useState(false);
	const [real, setReal] = useState(false);
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
		if (!recordId && recordList.length) setRecordId(String(recordList[0]._id));
	}, [recordList, recordId]);

	// The record's data follows the template (what it reads), once edits settle.
	const settled = useSettled(t, 700);
	const { data: recordData, isFetching: loadingRecord } = useGetPdfRecordDataQuery(
		{ route, id: recordId, template: settled, tz: viewerZone() },
		{ skip: !route || !recordId || !settled }
	);

	const scope = useMemo(() => {
		if (!t) return null;
		if (recordId && recordData) return recordScope(recordData);
		return sampleScope(t, settings, viewerZone());
	}, [t, recordId, recordData, settings]);

	// pt → px is 4/3; the column's padding (48px) stays clear.
	const fitScale = t && canvasW ? Math.min(1.2, Math.max(0.3, (canvasW - 50) / ((pageSize(t)[0] * 4) / 3))) : 0.8;
	const pages = useMemo(() => models.map(m => ({ value: mainRoute(m), label: modelLabel(m) })), [models]);
	const conditionFields = useMemo(
		() => (t ? flattenFields(tree?.fields || []).filter(f => f.type !== 'list').map(f => ({ key: `${t.alias}.${f.path}`, instance: INSTANCE[f.type] || 'String' })) : []),
		[tree, t?.alias]
	);
	const ctx = useMemo(() => (t ? { template: t, tree } : null), [t, tree]);

	const add = (slot: Slot, index: number, type: BlockType) => {
		const b = newBlock(type, t?.alias);
		edit(x => insertBlock(x, slot, index, b));
		setSelected(b.id);
		setTab('blocks');
	};
	const addAfterSelected = (type: BlockType) => {
		if (!t) return;
		const hit = findBlock(t, selected);
		if (hit) add(hit.slot, hit.index + 1, type);
		else add({ part: 'body' }, t.body.length, type);
	};
	const sel = t ? findBlock(t, selected) : null;

	// Keys: undo / redo, delete the selected block, save — not while typing.
	const keyRef = useRef<any>(null);
	keyRef.current = { undo, redo, selected, sel, edit, doSave: () => doSave() };
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
			if (typing) return;
			if (mod && e.key.toLowerCase() === 'z') {
				e.preventDefault();
				e.shiftKey ? k.redo() : k.undo();
			} else if ((e.key === 'Delete' || e.key === 'Backspace') && k.selected && k.sel) {
				e.preventDefault();
				k.edit((x: PdfTemplate) => removeBlock(x, k.selected));
				setSelected(null);
			}
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

	return (
		<Layout
			title={t?.name || 'PDF Template'}
			path='pdf-templates'>
			<Flex
				direction='column'
				gap={4}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: LIST_HREF(), title: 'PDF Templates' },
						{ href: '#', title: t?.name || '…' },
					]}
					title={t?.name || 'PDF Template'}
					badge={
						t?.isDefault ? (
							<Badge
								size='sm'
								colorPalette='green'
								variant='subtle'>
								Default
							</Badge>
						) : undefined
					}
					meta={
						!t
							? 'Loading…'
							: `${route ? `Prints /${route}` : 'No page picked yet'} · ${t.page.size} ${t.page.orientation}${dirty ? ' · not saved' : ' · saved'}`
					}
					actions={
						<>
							<IconButton
								size='sm'
								variant='ghost'
								aria-label='Undo'
								title='Undo (⌘Z)'
								disabled={!hist.past.length}
								onClick={undo}>
								<Undo2 {...ICON} />
							</IconButton>
							<IconButton
								size='sm'
								variant='ghost'
								aria-label='Redo'
								title='Redo (⇧⌘Z)'
								disabled={!hist.future.length}
								onClick={redo}>
								<Redo2 {...ICON} />
							</IconButton>
							<Button
								size='sm'
								variant='outline'
								disabled={!t?.route}
								onClick={() => setAi(true)}>
								<Sparkles {...ICON} />
								Change with your AI
							</Button>
							<Button
								size='sm'
								variant='outline'
								disabled={!t}
								onClick={() => setReal(true)}>
								<FileDown {...ICON} />
								Real PDF
							</Button>
							{t && !t.isDefault && t.route && !dirty && (
								<Button
									size='sm'
									variant='ghost'
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
								size='sm'
								disabled={!dirty}
								loading={saving}
								onClick={doSave}>
								<Save {...ICON} />
								Save
							</Button>
						</>
					}
				/>

				{problems.length > 0 && (
					<Box
						p={3}
						borderWidth='1px'
						borderColor='red.300'
						borderRadius='md'
						bg='red.subtle'
						fontSize='xs'>
						<Text fontWeight='600'>Fix these to save:</Text>
						{problems.slice(0, 8).map(p => (
							<Text key={p}>• {p}</Text>
						))}
					</Box>
				)}

				{!t || !scope || !ctx ? (
					<Flex
						justify='center'
						py={20}>
						<Spinner />
					</Flex>
				) : (
					<Grid
						templateColumns={{ base: '1fr', lg: '260px minmax(0, 1fr) 320px' }}
						gap={4}
						alignItems='start'>
						{/* Left: blocks and the template's settings */}
						<Box
							borderWidth='1px'
							borderColor='border'
							borderRadius='lg'
							bg='bg.panel'
							p={3}
							position={{ lg: 'sticky' }}
							top={{ lg: 4 }}
							maxH={{ lg: 'calc(100vh - 160px)' }}
							overflowY='auto'>
							<ConsoleTabs
								value={tab}
								onChange={v => setTab(v as any)}
								tabs={[
									{ value: 'blocks', label: 'Blocks' },
									{ value: 'page', label: 'Page' },
								]}>
								{null}
							</ConsoleTabs>
							{tab === 'blocks' ? (
								<>
									<Outline
										template={t}
										selected={selected}
										onSelect={setSelected}
										onAdd={add}
										onMove={(bid, slot, index) => edit(x => relocateBlock(x, bid, slot, index))}
									/>
									<Box mt={4}>
										<DocLink section='blocks' />
									</Box>
								</>
							) : (
								<PageSettings
									template={t}
									set={p => edit(x => ({ ...x, ...p }))}
									pages={pages}
									tree={tree}
								/>
							)}
						</Box>

						{/* Middle: the page */}
						<Box minW={0}>
							<Flex
								align='center'
								gap={2}
								mb={3}
								flexWrap='wrap'>
								<Box
									w='260px'
									maxW='100%'>
									<Dropdown
										size='xs'
										value={recordId}
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
								{loadingRecord && <Spinner size='xs' />}
								<Flex
									ml='auto'
									gap={1}
									align='center'>
									<Button
										size='xs'
										variant={mode === 'fields' ? 'solid' : 'outline'}
										onClick={() => setMode(m => (m === 'fields' ? 'values' : 'fields'))}
										title='Show which field goes where'>
										{mode === 'fields' ? <Eye {...ICON} /> : <Braces {...ICON} />}
										{mode === 'fields' ? 'Show values' : 'Show fields'}
									</Button>
									<IconButton
										size='xs'
										variant='ghost'
										aria-label='Zoom out'
										onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}>
										<ZoomOut {...ICON} />
									</IconButton>
									<Text
										fontSize='xs'
										w='38px'
										textAlign='center'>
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
							</Flex>
							<Box
								ref={canvasRef}
								bg='bg.muted'
								borderRadius='lg'
								p={{ base: 3, md: 6 }}
								overflow='auto'
								maxH={{ lg: 'calc(100vh - 200px)' }}>
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
										scale={fitScale * zoom}
									/>
								</Box>
							</Box>
						</Box>

						{/* Right: the selected block */}
						<Box
							borderWidth='1px'
							borderColor='border'
							borderRadius='lg'
							bg='bg.panel'
							p={3}
							position={{ lg: 'sticky' }}
							top={{ lg: 4 }}
							maxH={{ lg: 'calc(100vh - 160px)' }}
							overflowY='auto'>
							{sel ? (
								<Properties
									key={sel.block.id}
									block={sel.block}
									ctx={ctx}
									conditionFields={conditionFields as any}
									onChange={patch => edit(x => updateBlock(x, sel.block.id, patch as Partial<Block>))}
									onRemove={() => {
										edit(x => removeBlock(x, sel.block.id));
										setSelected(null);
									}}
									onDuplicate={() => {
										const c = cloneBlock(sel.block);
										edit(x => insertBlock(x, sel.slot, sel.index + 1, c));
										setSelected(c.id);
									}}
									onMove={by => edit(x => moveBlock(x, sel.block.id, by))}
								/>
							) : (
								<Box>
									<Text
										fontSize='sm'
										fontWeight='600'
										mb={1}>
										Nothing selected
									</Text>
									<Text
										fontSize='xs'
										color='fg.muted'
										mb={4}>
										Click a block on the page or in the list to change it. Add one:
									</Text>
									<Grid
										templateColumns='1fr 1fr'
										gap={2}>
										{(['text', 'fields', 'table', 'columns', 'box', 'image', 'divider', 'spacer'] as BlockType[]).map(type => (
											<Button
												key={type}
												size='xs'
												variant='outline'
												justifyContent='flex-start'
												onClick={() => addAfterSelected(type)}>
												{newBlockLabel(type)}
											</Button>
										))}
									</Grid>
									<Box mt={4}>
										<DocLink section='designer' />
									</Box>
								</Box>
							)}
						</Box>
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
					recordId={recordId}
				/>
			)}
		</Layout>
	);
};

const newBlockLabel = (type: BlockType) =>
	({ text: 'Text', fields: 'Label + value', table: 'Table', columns: 'Columns', box: 'Box', image: 'Image', divider: 'Line', spacer: 'Space', pageBreak: 'Page break' })[type];

export default DesignerPage;
