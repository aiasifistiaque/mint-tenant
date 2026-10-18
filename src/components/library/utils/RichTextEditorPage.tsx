'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Button, Center, Flex, IconButton, Spinner, Text } from '@chakra-ui/react';
import { ArrowLeft, Check, Printer, Save } from 'lucide-react';
import { AuthWrapper } from '../wrappers';
import { useWorkspace } from '../tenant/useWorkspace';
import { useGetByIdQuery, useGetRouteQuery, useGetSchemaQuery, useUpdateByIdMutation } from '../store/services/commonApi';
import { IS_TENANT_PANEL, getProjectSlug, pagePath, projectHref, tabTitle } from '../config/lib/constants/panel';
import { DownloadRichTextMenu } from './DownloadRichText';
import { printRichText } from './printRichText';
import DocumentEditor, { PageSize, isPageSize } from './inputs/editor/DocumentEditor';
import PromptDialog from '../modals/modal-components/PromptDialog';
import { toaster } from '@/components/ui/toaster';

/**
 * One record's rich-text field on a page of its own, like a document: the
 * full toolbar over a sheet of paper. Save (or ⌘S / Ctrl+S) writes that one
 * field and nothing else; Export downloads it as Word, PDF, Markdown or text,
 * saving unsaved words first; Print (or ⌘P) prints the words on the chosen
 * paper, as they are in the editor. Opened from the row menu's "Open in editor"
 * and the field's panel on the record page — /write/<route>/<id>/<field>.
 * It fills the window: no sidebar, just its own bar on top, the editor's
 * toolbar under it, and the paper (inputs/editor/DocumentEditor).
 */

const RICH = new Set(['editor', 'basic-editor']);
/** The top bar's height; the editor's toolbar sticks just under it. */
const BAR = 56;
const humanize = (s: string) => (s || '').replace(/[-_]+/g, ' ').replace(/^./, c => c.toUpperCase());

const RichTextEditorPage: FC<{ slug: string; id: string; field: string }> = ({ slug, id, field }) => {
	const { data: doc, isLoading, isError, error } = useGetByIdQuery({ path: slug, id }, { skip: !slug || !id });
	const { data: schema, isLoading: schemaLoading } = useGetSchemaQuery(slug, { skip: !slug });
	const { data: routeInfo } = useGetRouteQuery(slug, { skip: !slug });
	const [update, { isLoading: saving }] = useUpdateByIdMutation();

	const def = schema?.[field];
	const label: string = def?.label || humanize(field);
	const routeTitle: string = routeInfo?.title || humanize(slug);
	const name: string = (typeof doc?.name === 'string' && doc.name) || (typeof doc?.title === 'string' && doc.title) || doc?.code || id;
	const stored: string = typeof doc?.[field] === 'string' ? doc[field] : '';

	// What's in the editor (null: untouched) and what was last written, so the
	// page knows it's saved before the record comes back from the server.
	const [value, setValue] = useState<string | null>(null);
	const [written, setWritten] = useState<string | null>(null);
	const current = value ?? stored;
	const dirty = value !== null && value !== (written ?? stored);

	const save = useCallback(async (): Promise<boolean> => {
		if (!dirty || value === null) return true;
		try {
			await update({ path: slug, id, body: { [field]: value }, invalidate: ['history', 'config'] }).unwrap();
			setWritten(value);
			return true;
		} catch (e: any) {
			toaster.create({ type: 'error', title: `Could not save ${label}`, description: e?.data?.message || e?.message || '' });
			return false;
		}
	}, [dirty, value, update, slug, id, field, label]);

	// ⌘S / Ctrl+S saves, ⌘P / Ctrl+P prints the paper (not the whole panel),
	// and leaving with unsaved words asks first.
	const saveRef = useRef(save);
	saveRef.current = save;
	const printRef = useRef<(() => void) | null>(null);
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const key = (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase();
			if (key === 's') {
				e.preventDefault();
				saveRef.current();
			} else if (key === 'p' && printRef.current) {
				e.preventDefault();
				printRef.current();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);
	useEffect(() => {
		if (!dirty) return;
		const onLeave = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', onLeave);
		return () => window.removeEventListener('beforeunload', onLeave);
	}, [dirty]);

	const recordHref = projectHref(`/view/${slug}/${id}`);

	// Paper: Infinite unless this field was last written on a page size (kept in this browser).
	const sizeKey = `mint.docPage.${slug}.${field}`;
	const [pageSize, setPageSize] = useState<PageSize>('infinite');
	useEffect(() => {
		try {
			const saved = localStorage.getItem(sizeKey);
			if (isPageSize(saved)) setPageSize(saved);
		} catch {}
	}, [sizeKey]);
	const choosePageSize = (size: PageSize) => {
		setPageSize(size);
		try {
			localStorage.setItem(sizeKey, size);
		} catch {}
	};

	// The page's own links leave without the browser asking, so unsaved words
	// ask here first: keep editing, save and leave, or leave without saving.
	const router = useRouter();
	const [leaving, setLeaving] = useState<string | null>(null);
	const guard = (href: string) => (e: any) => {
		if (!dirty) return;
		e.preventDefault();
		setLeaving(href);
	};
	const ready = !!doc && !!schema;
	const problem = isError
		? (error as any)?.status === 404
			? 'This record isn’t there any more.'
			: (error as any)?.data?.message || 'Could not open this record.'
		: ready && !def
			? `This page has no field “${field}”.`
			: ready && !RICH.has(def.type)
				? `“${label}” isn’t a rich-text field, so it can’t open here.`
				: '';

	const status = saving ? 'Saving…' : dirty ? 'Unsaved changes' : written !== null ? 'Saved' : '';

	// The tab's title, as panel pages have it: "Body · Hello world · Blog · MINT".
	// Next writes its default ("MINT") into a rebuilt <head> some time after a
	// reload, so the title is checked again every second while the editor is open.
	const { project, organization } = useWorkspace({ skip: !IS_TENANT_PANEL });
	const pageTitle = IS_TENANT_PANEL ? tabTitle(`${label} · ${name}`, project?.name || (getProjectSlug() ? '' : organization?.name)) : `${label} · ${name}`;
	useEffect(() => {
		const apply = () => {
			if (document.title !== pageTitle) document.title = pageTitle;
		};
		apply();
		const timer = window.setInterval(apply, 1000);
		return () => window.clearInterval(timer);
	}, [pageTitle]);

	const recordName = (routeInfo?.single && routeTitle) || name;

	const print = () => printRichText({ html: current, title: `${recordName} · ${label}`, pageSize });
	printRef.current = ready && !problem ? print : null;

	// No sidebar or navbar: a writing page. Its own bar on top — back to the
	// record, where this is, how saving stands, Export and Save — with the
	// editor's toolbar held just under it.
	return (
		<AuthWrapper>
			<Flex
				direction='column'
				minH='100vh'
				w='full'
				bg='background.light'
				_dark={{ bg: 'background.dark' }}
				css={{ '--doc-toolbar-top': `${BAR}px` }}>
				<Flex
					as='header'
					position='sticky'
					top={0}
					zIndex={10}
					h={`${BAR}px`}
					flexShrink={0}
					align='center'
					gap={3}
					px={{ base: 3, md: 5 }}
					bg='bg.panel'
					borderBottomWidth='1px'
					borderColor='border'>
					<IconButton
						asChild
						size='sm'
						variant='ghost'
						aria-label='Back to the record'
						title='Back to the record'>
						<NextLink
							href={recordHref}
							onClick={guard(recordHref)}>
							<ArrowLeft size={16} />
						</NextLink>
					</IconButton>
					<Flex
						direction='column'
						minW={0}
						flex={1}
						lineHeight='1.25'>
						<Text
							fontSize='14px'
							fontWeight='600'
							truncate>
							{label}
						</Text>
						<Flex
							fontSize='12px'
							color='fg.muted'
							gap={1}
							minW={0}
							overflow='hidden'
							whiteSpace='nowrap'
							align='center'>
							{!routeInfo?.single && (
								<>
									<NextLink
										href={pagePath(slug)}
										onClick={guard(pagePath(slug))}>
										<Text
											as='span'
											color='inherit'
											_hover={{ color: 'fg' }}
											truncate>
											{routeTitle}
										</Text>
									</NextLink>
									<span>/</span>
								</>
							)}
							<NextLink
								href={recordHref}
								onClick={guard(recordHref)}>
								<Text
									as='span'
									color='inherit'
									_hover={{ color: 'fg' }}
									truncate>
									{recordName}
								</Text>
							</NextLink>
							{routeInfo?.draftAndPublish && (
								<Text
									as='span'
									flexShrink={0}
									display={{ base: 'none', md: 'inline' }}
									title='Saving updates the draft; publish it from the record page.'>
									· Draft until published
								</Text>
							)}
							{status && (
								<Flex
									as='span'
									align='center'
									gap={1}
									flexShrink={0}
									color={dirty ? 'orange.fg' : 'fg.muted'}>
									<span>·</span>
									{status === 'Saved' && <Check size={12} />}
									{status}
								</Flex>
							)}
						</Flex>
					</Flex>
					{ready && !problem && (
						<Flex
							gap={2}
							flexShrink={0}>
							<DownloadRichTextMenu
								route={slug}
								id={id}
								field={field}
								pageSize={pageSize === 'infinite' ? undefined : pageSize}
								label={
									<Box
										as='span'
										display={{ base: 'none', sm: 'inline' }}>
										Export
									</Box>
								}
								size='sm'
								variant='outline'
								before={save}
							/>
							<Button
								size='sm'
								variant='outline'
								title='Print (⌘P)'
								aria-label='Print'
								onClick={print}>
								<Printer size={14} />
								<Box
									as='span'
									display={{ base: 'none', sm: 'inline' }}>
									Print
								</Box>
							</Button>
							<Button
								size='sm'
								colorPalette='brand'
								loading={saving}
								disabled={!dirty}
								onClick={save}>
								<Save size={14} />
								Save
							</Button>
						</Flex>
					)}
				</Flex>

				{problem ? (
					<Center
						flexDirection='column'
						gap={3}
						py={24}
						textAlign='center'>
						<Text color='fg.muted'>{problem}</Text>
						<Button
							asChild
							size='sm'
							variant='outline'>
							<NextLink href={recordHref}>Back to the record</NextLink>
						</Button>
					</Center>
				) : isLoading || schemaLoading || !ready ? (
					<Center py={24}>
						<Spinner color='fg.muted' />
					</Center>
				) : (
					<DocumentEditor
						value={current}
						onChange={setValue}
						pageSize={pageSize}
						onPageSize={choosePageSize}
						top={BAR}
					/>
				)}
			</Flex>
			<PromptDialog
				open={!!leaving}
				onClose={() => setLeaving(null)}
				onConfirm={() => leaving && router.push(leaving)}
				tone='warning'
				title='Leave without saving?'
				description={`Your changes to ${label} aren’t saved yet.`}
				confirmLabel='Leave without saving'
				cancelLabel='Keep editing'
				aside={
					<Button
						size='sm'
						variant='ghost'
						loading={saving}
						onClick={async () => {
							if (leaving && (await save())) router.push(leaving);
						}}>
						Save and leave
					</Button>
				}
			/>
		</AuthWrapper>
	);
};

export default RichTextEditorPage;
