'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge, Box, Button, Flex, Grid, IconButton, Link, Text } from '@chakra-ui/react';
import { BookOpen, Building2, Copy, Plus, Sparkles, Star, Trash2 } from 'lucide-react';
import {
	Layout,
	useAddPdfStartersMutation,
	useDeletePdfTemplateMutation,
	useDuplicatePdfTemplateMutation,
	useGetPdfGalleryQuery,
	useGetPdfSettingsQuery,
	useGetPdfTemplatesQuery,
	useSetDefaultPdfTemplateMutation,
} from '@/components/library';
import { ConfirmAction, ConsoleTabs, EmptyState, ErrorState, PageHeader, TableSkeleton } from '@/components/library/cl';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { PdfTemplate } from '@/components/library/pdf/types';
import { useLinkModels } from '@/app/builder/_components/useLinkModels';
import { toaster } from '@/components/ui/toaster';
import NewTemplateDialog from './_components/NewTemplateDialog';
import SettingsDialog from './_components/SettingsDialog';
import AiDialog from './_components/AiDialog';
import Thumb from './_components/Thumb';
import { DocLink, GUIDE, ICON, LIST_HREF, designerHref, errorOf } from './_components/ui';

/**
 * PDF templates (backend docs/pdf-templates): this panel's (or project's)
 * templates by the page they print — the default one is what Download PDF
 * uses — and the gallery of starters. The super admin keeps the gallery:
 * their templates switched "In the gallery" are what every project starts from.
 */
const PdfTemplatesPage = () => {
	const router = useRouter();
	const search = useSearchParams();
	const tab = search.get('tab') === 'gallery' ? 'gallery' : 'mine';
	const { data, isLoading, error, refetch } = useGetPdfTemplatesQuery();
	const { data: gallery } = useGetPdfGalleryQuery();
	const { data: settings } = useGetPdfSettingsQuery();
	const { models } = useLinkModels();
	const [creating, setCreating] = useState<{ route?: string } | null>(null);
	const [ai, setAi] = useState<{ route?: string } | null>(null);
	const [editingSettings, setEditingSettings] = useState(false);
	const [removing, setRemoving] = useState<PdfTemplate | null>(null);
	const [remove, { isLoading: deleting }] = useDeletePdfTemplateMutation();
	const [duplicate] = useDuplicatePdfTemplateMutation();
	const [makeDefault] = useSetDefaultPdfTemplateMutation();
	const [addStarters, { isLoading: adding }] = useAddPdfStartersMutation();

	const templates: PdfTemplate[] = data?.templates || [];
	const titleOf = useMemo(() => {
		const map = new Map<string, string>();
		for (const m of models) for (const r of m.routes) map.set(r, m.title || m.name);
		return (route: string) => (route ? map.get(route) || route : 'No page yet');
	}, [models]);
	const groups = useMemo(() => {
		const by = new Map<string, PdfTemplate[]>();
		for (const t of templates) by.set(t.route || '', [...(by.get(t.route || '') || []), t]);
		return [...by.entries()].sort((a, b) => titleOf(a[0]).localeCompare(titleOf(b[0])));
	}, [templates, titleOf]);

	const act = async (fn: () => Promise<any>, done: string) => {
		try {
			await fn();
			toaster.create({ type: 'success', title: done });
		} catch (e) {
			toaster.create({ type: 'error', title: 'That didn’t work', description: errorOf(e) });
		}
	};

	const setTab = (t: string) => router.replace(`${LIST_HREF()}${t === 'gallery' ? '?tab=gallery' : ''}`);

	const card = (t: PdfTemplate, own: boolean) => (
		<Box
			key={t._id}
			borderWidth='1px'
			borderColor='border'
			borderRadius='lg'
			overflow='hidden'
			bg='bg.panel'
			display='flex'
			flexDirection='column'>
			<Box
				as='button'
				textAlign='left'
				cursor='pointer'
				onClick={() => (own ? router.push(designerHref(t._id!)) : setCreating({}))}
				_hover={{ opacity: 0.92 }}>
				<Thumb
					template={t}
					settings={settings}
				/>
			</Box>
			<Flex
				p={3}
				gap={2}
				align='flex-start'
				flex='1'>
				<Box
					minW={0}
					flex='1'>
					<Flex
						align='center'
						gap={2}
						minW={0}>
						<Text
							fontSize='sm'
							fontWeight='600'
							truncate>
							{t.name}
						</Text>
						{own && t.isDefault && (
							<Badge
								size='xs'
								colorPalette='green'
								variant='subtle'>
								Default
							</Badge>
						)}
						{!IS_TENANT_PANEL && own && t.gallery?.published && (
							<Badge
								size='xs'
								colorPalette='purple'
								variant='subtle'>
								In the gallery
							</Badge>
						)}
					</Flex>
					<Text
						fontSize='xs'
						color='fg.muted'
						mt={0.5}
						lineClamp={2}>
						{own ? t.description || `${t.page?.size || 'A4'} · ${t.kind}` : t.description}
					</Text>
				</Box>
				{own && (
					<Flex gap={0.5}>
						{!t.isDefault && t.route && (
							<IconButton
								size='2xs'
								variant='ghost'
								aria-label='Make it the default'
								title='Make it this page’s Download PDF'
								onClick={() => act(() => makeDefault(t._id!).unwrap(), `${t.name} is the default now`)}>
								<Star {...ICON} />
							</IconButton>
						)}
						<IconButton
							size='2xs'
							variant='ghost'
							aria-label='Duplicate'
							title='Duplicate'
							onClick={() => act(() => duplicate(t._id!).unwrap(), 'Copied')}>
							<Copy {...ICON} />
						</IconButton>
						<IconButton
							size='2xs'
							variant='ghost'
							aria-label='Delete'
							title='Delete'
							color='red.500'
							_dark={{ color: 'red.300' }}
							onClick={() => setRemoving(t)}>
							<Trash2 {...ICON} />
						</IconButton>
					</Flex>
				)}
			</Flex>
		</Box>
	);

	const grid = (children: any) => (
		<Grid
			templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }}
			gap={4}>
			{children}
		</Grid>
	);

	const mine = isLoading ? (
		<TableSkeleton />
	) : error ? (
		<ErrorState
			error={error}
			onRetry={refetch}
		/>
	) : !templates.length ? (
		<EmptyState
			title='No PDF templates yet'
			description='Start from an invoice, bill or receipt in the gallery and match it to your page’s fields — or build one from nothing, or describe it to AI.'
			action={
				<Button
					size='sm'
					onClick={() => setCreating({})}>
					<Plus {...ICON} />
					New template
				</Button>
			}
		/>
	) : (
		<Flex
			direction='column'
			gap={7}>
			{groups.map(([route, list]) => (
				<Box key={route || '-'}>
					<Flex
						align='baseline'
						gap={3}
						mb={3}>
						<Text
							fontSize='sm'
							fontWeight='600'>
							{titleOf(route)}
						</Text>
						{route && (
							<Text
								fontSize='xs'
								color='fg.muted'>
								/{route} · {list.length} template{list.length === 1 ? '' : 's'}
							</Text>
						)}
						{route && (
							<Button
								size='2xs'
								variant='ghost'
								ml='auto'
								onClick={() => setCreating({ route })}>
								<Plus {...ICON} />
								Add for this page
							</Button>
						)}
					</Flex>
					{grid(list.map(t => card(t, true)))}
				</Box>
			))}
		</Flex>
	);

	const galleryTab = (
		<Flex
			direction='column'
			gap={4}>
			<Flex
				align='center'
				gap={3}
				flexWrap='wrap'>
				<Text
					fontSize='sm'
					color='fg.muted'>
					{IS_TENANT_PANEL
						? 'Designs to start from. Using one copies it into this project — change it as much as you like.'
						: gallery?.builtIn
						? 'The built-in starters show until you add templates to the gallery. Add them to edit them, or switch any of your templates to “In the gallery” in its designer.'
						: 'What every project sees when it makes a template: your templates switched to “In the gallery”.'}
				</Text>
				{!IS_TENANT_PANEL && gallery?.builtIn && (
					<Button
						size='xs'
						variant='outline'
						loading={adding}
						onClick={() => act(async () => {
							const r = await addStarters().unwrap();
							refetch();
							return r;
						}, 'The built-in starters are your templates now — edit them like any other')}>
						<Plus {...ICON} />
						Add the built-in starters
					</Button>
				)}
				<DocLink section='gallery' />
			</Flex>
			{grid((gallery?.templates || []).map(t => card(t, false)))}
		</Flex>
	);

	return (
		<Layout
			title='PDF Templates'
			path='pdf-templates'>
			<Flex
				direction='column'
				gap={5}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: LIST_HREF(), title: 'PDF Templates' },
					]}
					title='PDF Templates'
					meta='Invoices, bills and receipts your records download as PDFs'
					actions={
						<>
							<Button
								size='sm'
								variant='outline'
								onClick={() => setEditingSettings(true)}>
								<Building2 {...ICON} />
								Business details
							</Button>
							<Button
								size='sm'
								variant='outline'
								onClick={() => setAi({})}>
								<Sparkles {...ICON} />
								Build with your AI
							</Button>
							<Button
								size='sm'
								onClick={() => setCreating({})}>
								<Plus {...ICON} />
								New template
							</Button>
							<Link
								href={GUIDE}
								target='_blank'
								rel='noopener noreferrer'>
								<Button
									size='sm'
									variant='ghost'>
									<BookOpen {...ICON} />
									Guide
								</Button>
							</Link>
						</>
					}
				/>
				{!settings?.business?.name && !isLoading && (
					<Flex
						align='center'
						gap={3}
						p={3}
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						bg='bg.subtle'
						fontSize='sm'>
						<Building2 {...ICON} />
						<Text flex='1'>Add your business name, logo and address once — every template prints them.</Text>
						<Button
							size='xs'
							variant='outline'
							onClick={() => setEditingSettings(true)}>
							Add them
						</Button>
					</Flex>
				)}
				<ConsoleTabs
					value={tab}
					onChange={setTab}
					tabs={[
						{ value: 'mine', label: `${IS_TENANT_PANEL ? 'This project’s' : 'Your templates'}${templates.length ? ` · ${templates.length}` : ''}` },
						{ value: 'gallery', label: `Gallery${gallery?.templates?.length ? ` · ${gallery.templates.length}` : ''}` },
					]}>
					{null}
				</ConsoleTabs>
				{tab === 'gallery' ? galleryTab : mine}
			</Flex>

			<NewTemplateDialog
				open={!!creating}
				route={creating?.route}
				onClose={() => setCreating(null)}
				onAi={route => {
					setCreating(null);
					setAi({ route });
				}}
			/>
			<AiDialog
				open={!!ai}
				route={ai?.route}
				onClose={() => setAi(null)}
				onReload={refetch}
			/>
			<SettingsDialog
				open={editingSettings}
				onClose={() => setEditingSettings(false)}
			/>
			<ConfirmAction
				isOpen={!!removing}
				onClose={() => setRemoving(null)}
				title={`Delete ${removing?.name || 'this template'}?`}
				consequence={
					removing?.isDefault
						? 'It’s this page’s default — Download PDF moves to its next template, or goes away if it has none. This can’t be undone.'
						: 'The template is gone for good. Records aren’t touched.'
				}
				confirmLabel='Delete'
				destructive
				isLoading={deleting}
				onConfirm={() =>
					act(async () => {
						await remove(removing!._id!).unwrap();
						setRemoving(null);
					}, 'Deleted')
				}
			/>
		</Layout>
	);
};

// useSearchParams needs a Suspense boundary to build.
const Page = () => (
	<Suspense fallback={null}>
		<PdfTemplatesPage />
	</Suspense>
);

export default Page;
