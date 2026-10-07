'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, Grid, Link, Text } from '@chakra-ui/react';
import { BookOpen, ExternalLink, Plus, RotateCcw, Save } from 'lucide-react';
import {
	Layout,
	mainApi,
	useAppDispatch,
	useDeleteByIdMutation,
	useGetAllQuery,
	useGetQuery,
	usePostMutation,
	useUpdateByIdMutation,
} from '@/components/library';
import { ConfirmAction, DetailSkeleton, EmptyState, ErrorState, PageHeader, Panel } from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import { describe, diff, emptyItem, emptySection, Item, itemProblem, Op, Section, toSections } from './_components/draft';
import ItemDialog, { PermissionGroup } from './_components/ItemDialog';
import SectionCard, { Drag, Over } from './_components/SectionCard';
import SectionDialog from './_components/SectionDialog';
import SidebarPreview from './_components/SidebarPreview';
import { DocLink, GUIDE } from './_components/ui';
import { HOME } from '@/components/library/config/lib/constants/panel';

const SIDEBAR_TAG = `/sidebar/crm/${process.env.NEXT_PUBLIC_SIDEBAR_TYPE || 'generic'}`;
const ALL = { page: 1, limit: 1000, sort: '-priority' };

type Editing = { item: Item; section: string; isNew: boolean } | null;
type Removing = { kind: 'section'; section: Section } | { kind: 'item'; item: Item; section: string } | null;

/**
 * An easier way to arrange the admin sidebar than the Sidebar Items and
 * Sidebar Categories tables: sections and their pages on one screen, dragged
 * into order, with the result previewed beside them.
 *
 * Nothing new on the server — it reads and writes the same SidebarCategory /
 * SidebarItem records through their usual CRUD routes. Edits stay local until
 * Save, which sends only what changed (see draft.ts).
 */
const SidebarBuilderPage = () => {
	const dispatch = useAppDispatch();
	const categories = useGetAllQuery({ path: 'sidebarcategories', ...ALL });
	const items = useGetAllQuery({ path: 'sidebaritems', ...ALL });
	const { data: permissionList } = useGetQuery({ path: 'permissionlist' });
	const [post] = usePostMutation();
	const [update] = useUpdateByIdMutation();
	const [remove] = useDeleteByIdMutation();

	const base = useMemo(
		() => (categories.data?.doc && items.data?.doc ? toSections(categories.data.doc, items.data.doc) : null),
		[categories.data, items.data]
	);
	const [sections, setSections] = useState<Section[]>([]);
	const [saving, setSaving] = useState<string | null>(null);
	const [discarding, setDiscarding] = useState(false);

	// A fresh load (first visit, or after a save) replaces the working copy.
	useEffect(() => {
		if (base) setSections(base);
	}, [base]);

	const ops = useMemo(() => (base ? diff(base, sections) : []), [base, sections]);
	const dirty = ops.length > 0;

	// Which rows to badge. A reorder renumbers a whole list, so "Edited" is
	// only for rows whose own fields or section changed, not their priority.
	const { edited, created } = useMemo(() => {
		const edited = new Set<string>();
		const created = new Set<string>();
		ops.forEach(op => {
			if (op.kind === 'create-section') created.add(op.section.key);
			if (op.kind === 'create-item') created.add(op.item.key);
			if (op.kind !== 'update-item' && op.kind !== 'update-section') return;
			const moved = op.kind === 'update-item' && !!op.sectionKey;
			if (moved || Object.keys(op.body).some(k => k !== 'priority')) edited.add(op.id);
		});
		return { edited, created };
	}, [ops]);

	// Leaving with unsaved changes asks first.
	useEffect(() => {
		if (!dirty) return;
		const warn = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [dirty]);

	/* ---------- editing ---------- */

	const [editingItem, setEditingItem] = useState<Editing>(null);
	const [editingSection, setEditingSection] = useState<{ section: Section; isNew: boolean } | null>(null);
	const [removing, setRemoving] = useState<Removing>(null);

	const mapSection = (key: string, fn: (s: Section) => Section) => setSections(list => list.map(s => (s.key === key ? fn(s) : s)));
	const sectionOf = (itemKey: string) => sections.find(s => s.items.some(i => i.key === itemKey))!;

	const saveItem = (item: Item, sectionKey: string) => {
		setSections(list => {
			const from = list.find(s => s.items.some(i => i.key === item.key));
			return list.map(s => {
				if (s.key === sectionKey) {
					// Same section: in place. Moved or new: on top, where it's seen.
					if (from?.key === sectionKey) return { ...s, items: s.items.map(i => (i.key === item.key ? item : i)) };
					return { ...s, items: [item, ...s.items] };
				}
				if (s.key === from?.key) return { ...s, items: s.items.filter(i => i.key !== item.key) };
				return s;
			});
		});
		setEditingItem(null);
	};

	const saveSection = (section: Section) => {
		setSections(list => (list.some(s => s.key === section.key) ? list.map(s => (s.key === section.key ? section : s)) : [section, ...list]));
		setEditingSection(null);
	};

	const move = <T,>(list: T[], from: number, to: number) => {
		const next = [...list];
		const [x] = next.splice(from, 1);
		next.splice(to, 0, x);
		return next;
	};

	const moveSection = (key: string, delta: number) =>
		setSections(list => {
			const i = list.findIndex(s => s.key === key);
			const j = i + delta;
			return j < 0 || j >= list.length ? list : move(list, i, j);
		});

	const moveItem = (item: Item, delta: number) =>
		mapSection(sectionOf(item.key).key, s => {
			const i = s.items.findIndex(x => x.key === item.key);
			const j = i + delta;
			return j < 0 || j >= s.items.length ? s : { ...s, items: move(s.items, i, j) };
		});

	const confirmRemove = () => {
		if (!removing) return;
		if (removing.kind === 'section') setSections(list => list.filter(s => s.key !== removing.section.key));
		else mapSection(removing.section, s => ({ ...s, items: s.items.filter(i => i.key !== removing.item.key) }));
		setRemoving(null);
	};

	/* ---------- drag and drop ---------- */

	const [drag, setDrag] = useState<Drag>(null);
	const [over, setOver] = useState<Over>(null);
	const endDrag = () => {
		setDrag(null);
		setOver(null);
	};

	const drop = () => {
		if (!drag || !over) return endDrag();
		if (drag.type === 'section' && over.type === 'section') {
			setSections(list => {
				const from = list.findIndex(s => s.key === drag.key);
				// The slot index counts the dragged section itself; removing it first shifts later slots down.
				const to = over.index > from ? over.index - 1 : over.index;
				return from === to ? list : move(list, from, to);
			});
		}
		if (drag.type === 'item' && over.type === 'item') {
			setSections(list => {
				const fromSection = list.find(s => s.items.some(i => i.key === drag.key));
				if (!fromSection) return list;
				const fromIndex = fromSection.items.findIndex(i => i.key === drag.key);
				const item = fromSection.items[fromIndex];
				let to = over.index;
				if (fromSection.key === over.section && to > fromIndex) to -= 1;
				return list.map(s => {
					let next = s.items;
					if (s.key === fromSection.key) next = next.filter(i => i.key !== drag.key);
					if (s.key === over.section) next = [...next.slice(0, to), item, ...next.slice(to)];
					return next === s.items ? s : { ...s, items: next };
				});
			});
		}
		endDrag();
	};

	/* ---------- saving ---------- */

	const problems = sections.flatMap(s =>
		s.items.map(i => itemProblem(i) && `“${i.name || 'Untitled page'}” in ${s.name || 'a section'} ${itemProblem(i)}`).filter(Boolean)
	) as string[];

	const run = async (op: Op, ids: Record<string, string>) => {
		switch (op.kind) {
			case 'create-section': {
				const res: any = await post({ path: 'sidebarcategories', body: op.body }).unwrap();
				ids[op.section.key] = res?.doc?._id;
				return;
			}
			case 'create-item':
				await post({ path: 'sidebaritems', body: { ...op.body, category: ids[op.sectionKey] } }).unwrap();
				return;
			case 'update-section':
				await update({ path: 'sidebarcategories', id: op.id, body: op.body }).unwrap();
				return;
			case 'update-item':
				await update({
					path: 'sidebaritems',
					id: op.id,
					body: op.sectionKey ? { ...op.body, category: ids[op.sectionKey] } : op.body,
				}).unwrap();
				return;
			case 'delete-item':
				await remove({ path: 'sidebaritems', id: op.id }).unwrap();
				return;
			case 'delete-section':
				await remove({ path: 'sidebarcategories', id: op.id }).unwrap();
		}
	};

	const save = async () => {
		if (problems.length) {
			toaster.create({ title: 'Some pages are incomplete', description: problems[0], type: 'error' });
			return;
		}
		// Section ids by key: the loaded ones, plus each new one once created.
		const ids: Record<string, string> = Object.fromEntries(sections.filter(s => s._id).map(s => [s.key, s._id!]));
		let done = 0;
		try {
			for (const op of ops) {
				setSaving(`Saving ${++done} of ${ops.length}…`);
				await run(op, ids);
			}
			toaster.create({ title: 'Sidebar saved', description: `${describe(ops)} applied. The sidebar is updated.`, type: 'success' });
		} catch (e: any) {
			toaster.create({
				title: `Stopped after ${done - 1} of ${ops.length} changes`,
				description: `${e?.data?.message || 'The server refused a change.'} What was saved is shown now; redo the rest.`,
				type: 'error',
				duration: 10000,
			});
		} finally {
			setSaving(null);
			// Reload both lists (resetting the working copy to what's saved) and
			// the live sidebar.
			dispatch(mainApi.util.invalidateTags(['sidebarcategories', 'sidebaritems', SIDEBAR_TAG] as any));
		}
	};

	/* ---------- page ---------- */

	const isLoading = categories.isLoading || items.isLoading;
	const error = categories.error || items.error;
	const pageCount = sections.reduce((n, s) => n + s.items.length, 0);

	return (
		<Layout
			title='Sidebar Builder'
			path='sidebar-builder'>
			<Flex
				direction='column'
				gap={5}
				pb={24}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '/sidebar-builder', title: 'Sidebar Builder' },
					]}
					title='Sidebar Builder'
					meta={
						base
							? `${sections.length} sections · ${pageCount} pages${dirty ? ` · ${describe(ops)} not saved` : ' · everything saved'}`
							: 'Arrange the admin sidebar'
					}
					actions={
						<>
							<Button
								size='sm'
								variant='outline'
								disabled={!base || !!saving}
								onClick={() => setEditingSection({ section: emptySection(), isNew: true })}>
								<Plus size={14} />
								Add section
							</Button>
							<Button
								size='sm'
								variant='outline'
								disabled={!base || !sections.length || !!saving}
								onClick={() => setEditingItem({ item: emptyItem(), section: sections[0].key, isNew: true })}>
								<Plus size={14} />
								Add page
							</Button>
						</>
					}
				/>

				<Flex
					align={{ base: 'flex-start', md: 'center' }}
					justify='space-between'
					direction={{ base: 'column', md: 'row' }}
					gap={3}>
					<Text
						fontSize='sm'
						color='fg.muted'
						maxW='720px'>
						Drag sections and pages into the order you want, click one to rename it or change who sees it, and
						watch the preview. Nothing changes for anyone until you press <strong>Save changes</strong>.
					</Text>
					<Link
						href={GUIDE}
						target='_blank'
						rel='noopener noreferrer'
						display='inline-flex'
						alignItems='center'
						gap={1.5}
						fontSize='sm'
						fontWeight='500'
						flexShrink={0}
						color='fg'
						_hover={{ textDecoration: 'underline' }}>
						<BookOpen size={14} />
						Sidebar builder guide
						<ExternalLink size={12} />
					</Link>
				</Flex>

				{isLoading ? (
					<Panel>
						<DetailSkeleton rows={8} />
					</Panel>
				) : error ? (
					<Panel>
						<ErrorState
							error={error}
							onRetry={() => {
								categories.refetch();
								items.refetch();
							}}
						/>
					</Panel>
				) : (
					<Grid
						templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 290px' }}
						gap={5}
						alignItems='start'>
						<Panel
							title='Sections and pages'
							subtitle='Top to bottom, as they appear in the sidebar. Drag the grip to move; use ⋯ for more.'
							actions={<DocLink section='arrange' />}
							onDragLeave={(e: any) => {
								if (!e.currentTarget.contains(e.relatedTarget)) setOver(null);
							}}>
							{sections.length ? (
								<Flex
									direction='column'
									gap={3}>
									{sections.map((s, i) => (
										<Box key={s.key}>
											{over?.type === 'section' && over.index === i && <SectionDropLine />}
											<SectionCard
												section={s}
												index={i}
												total={sections.length}
												drag={drag}
												over={over}
												edited={edited}
												created={created}
												onDragStart={setDrag}
												onDragOver={setOver}
												onDrop={drop}
												onDragEnd={endDrag}
												onEdit={() => setEditingSection({ section: s, isNew: false })}
												onToggle={() => mapSection(s.key, x => ({ ...x, isActive: !x.isActive }))}
												onDelete={() => setRemoving({ kind: 'section', section: s })}
												onMove={d => moveSection(s.key, d)}
												onAddItem={() => setEditingItem({ item: emptyItem(), section: s.key, isNew: true })}
												onEditItem={item => setEditingItem({ item, section: s.key, isNew: false })}
												onToggleItem={item =>
													mapSection(s.key, x => ({
														...x,
														items: x.items.map(i => (i.key === item.key ? { ...i, isActive: !i.isActive } : i)),
													}))
												}
												onDeleteItem={item => setRemoving({ kind: 'item', item, section: s.key })}
												onMoveItem={moveItem}
											/>
										</Box>
									))}
									{over?.type === 'section' && over.index === sections.length && <SectionDropLine />}
								</Flex>
							) : (
								<EmptyState
									title='No sections yet'
									description='Add a section, then add pages to it.'
								/>
							)}
						</Panel>

						<Panel
							title='Preview'
							subtitle='What people will see after you save.'
							actions={<DocLink section='preview' />}>
							<SidebarPreview sections={sections} />
						</Panel>
					</Grid>
				)}
			</Flex>

			{/* Save bar — only while something is unsaved. */}
			{dirty && (
				<Flex
					position='fixed'
					bottom={4}
					left='50%'
					transform='translateX(-50%)'
					zIndex={20}
					align='center'
					gap={3}
					px={4}
					py={2.5}
					bg='bg.panel'
					borderWidth='1px'
					borderColor='border'
					borderRadius='lg'
					boxShadow='lg'
					maxW='calc(100vw - 32px)'>
					<Text
						fontSize='sm'
						fontWeight='500'>
						{saving || `${describe(ops)} not saved`}
					</Text>
					<DocLink
						section='saving'
						label='What happens?'
					/>
					<Button
						size='sm'
						variant='ghost'
						disabled={!!saving}
						onClick={() => setDiscarding(true)}>
						<RotateCcw size={14} />
						Discard
					</Button>
					<Button
						size='sm'
						loading={!!saving}
						onClick={save}>
						<Save size={14} />
						Save changes
					</Button>
				</Flex>
			)}

			<ItemDialog
				item={editingItem?.item || null}
				sectionKey={editingItem?.section || ''}
				isNew={!!editingItem?.isNew}
				sections={sections}
				permissions={(permissionList as PermissionGroup[]) || []}
				onClose={() => setEditingItem(null)}
				onSave={saveItem}
			/>

			<SectionDialog
				section={editingSection?.section || null}
				isNew={!!editingSection?.isNew}
				onClose={() => setEditingSection(null)}
				onSave={saveSection}
			/>

			<ConfirmAction
				isOpen={!!removing}
				onClose={() => setRemoving(null)}
				onConfirm={confirmRemove}
				destructive
				title={removing?.kind === 'section' ? 'Delete this section?' : 'Delete this page?'}
				confirmLabel='Delete'
				consequence={
					removing?.kind === 'section'
						? `“${removing.section.name || 'Untitled section'}” and its ${removing.section.items.length} page${
								removing.section.items.length === 1 ? '' : 's'
						  } will be removed from the sidebar when you save. To keep a page, drag it to another section first — or hide the section instead.`
						: removing?.kind === 'item'
						? `“${removing.item.name || 'Untitled page'}” will be removed from the sidebar when you save. The page itself keeps working; only the link goes. To keep it for later, hide it instead.`
						: ''
				}
			/>

			<ConfirmAction
				isOpen={discarding}
				onClose={() => setDiscarding(false)}
				onConfirm={() => {
					if (base) setSections(base);
					setDiscarding(false);
				}}
				title='Discard your changes?'
				confirmLabel='Discard'
				destructive
				consequence={`The ${describe(ops)} you made since the last save will be thrown away. The sidebar stays as it is.`}
			/>
		</Layout>
	);
};

const SectionDropLine = () => (
	<Box
		h='3px'
		mb={3}
		mt={-1.5}
		bg='blue.solid'
		borderRadius='full'
	/>
);

export default SidebarBuilderPage;
