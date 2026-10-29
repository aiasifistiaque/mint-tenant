'use client';

import { FC, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge, Box, Button, Flex, IconButton, Skeleton, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Send, Table2, Trash2 } from 'lucide-react';
import {
	Layout,
	PromptDialog,
	useIsMobile,
	useGetSiteContentsQuery,
	useGetSiteContentTypesQuery,
	useOrderSiteContentsMutation,
	usePublishSiteContentsMutation,
	useRemoveSiteContentMutation,
} from '@/components/library';
import type { SiteContent } from '@/components/library';
import { Dropdown, EmptyState, ErrorState, PageHeader, Panel } from '@/components/library/cl';
import { HOME, projectHref } from '@/components/library/config/lib/constants/panel';
import { PublishBadge } from '@/components/library/components/view/record/PublishControls';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { CopyText } from './ContentAddress';
import ContentDialog from './ContentDialog';
import { typeIcon } from './typeIcon';

/**
 * A website's Contents (backend docs/cms D1, CMS-06): pick a page — or the
 * whole site, for the header and footer — and see what's on it, in order.
 * Each piece has a type (Hero, Cards, Questions, a List of projects…) chosen
 * when it's added; its form asks only for that type's fields. Pieces move up
 * and down; contents from before types (one word per record) are listed
 * below, opened in the table. The table of the same records is one click away.
 */

const SITE = 'site';

const Row: FC<{
	c: SiteContent;
	first: boolean;
	last: boolean;
	canEdit: boolean;
	canDelete: boolean;
	canPublish: boolean;
	publishing: boolean;
	onEdit: () => void;
	onMove: (by: number) => void;
	onRemove: () => void;
	onPublish: () => void;
}> = ({ c, first, last, canEdit, canDelete, canPublish, publishing, onEdit, onMove, onRemove, onPublish }) => {
	const Icon = typeIcon(c.icon);
	return (
		<Flex
			align='center'
			gap={3}
			px={4}
			py={3}
			borderTopWidth='1px'
			borderColor='border.muted'>
			<Flex
				boxSize='32px'
				flexShrink={0}
				align='center'
				justify='center'
				borderRadius='lg'
				bg='violet.subtle'
				color='violet.fg'>
				<Icon size={16} />
			</Flex>
			<Box
				flex={1}
				minW={0}
				as='button'
				textAlign='left'
				cursor={canEdit ? 'pointer' : 'default'}
				onClick={canEdit ? onEdit : undefined}>
				<Flex
					align='center'
					gap={2}
					wrap='wrap'>
					<Text
						fontSize='13.5px'
						fontWeight='600'>
						{c.name}
					</Text>
					<Badge
						size='sm'
						variant='subtle'>
						{c.typeTitle}
					</Badge>
					{!!c.more?.length && (
						<Badge
							size='sm'
							variant='outline'>
							+{c.more.length} {c.more.length === 1 ? 'block' : 'blocks'}
						</Badge>
					)}
					{c.status && (
						<PublishBadge
							status={c.status}
							publishedAt={c.publishedAt}
						/>
					)}
				</Flex>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					truncate>
					{c.preview || 'Nothing written yet'}
				</Text>
			</Box>
			{c.slug && (
				<Flex
					display={{ base: 'none', md: 'flex' }}
					align='center'
					flexShrink={0}
					maxW='220px'
					color='fg.muted'>
					<Box
						as='code'
						fontSize='11.5px'
						fontFamily='mono'
						whiteSpace='nowrap'
						overflow='hidden'
						textOverflow='ellipsis'
						title={`Slug — how your site and the API find it: ${c.slug}`}>
						{c.slug}
					</Box>
					<CopyText
						text={c.slug}
						label='Copy the slug'
					/>
				</Flex>
			)}
			<Flex
				gap={0.5}
				flexShrink={0}
				align='center'>
				{canPublish && c.status && c.status !== 'published' && (
					<Button
						size='xs'
						variant='ghost'
						colorPalette='green'
						loading={publishing}
						onClick={onPublish}>
						<Send size={13} />
						Publish
					</Button>
				)}
				{canEdit && (
					<>
						<IconButton
							size='xs'
							variant='ghost'
							aria-label='Move up'
							disabled={first}
							onClick={() => onMove(-1)}>
							<ArrowUp size={14} />
						</IconButton>
						<IconButton
							size='xs'
							variant='ghost'
							aria-label='Move down'
							disabled={last}
							onClick={() => onMove(1)}>
							<ArrowDown size={14} />
						</IconButton>
						<IconButton
							size='xs'
							variant='ghost'
							aria-label='Edit'
							onClick={onEdit}>
							<Pencil size={14} />
						</IconButton>
					</>
				)}
				{canDelete && (
					<IconButton
						size='xs'
						variant='ghost'
						aria-label='Remove'
						onClick={onRemove}>
						<Trash2 size={14} />
					</IconButton>
				)}
			</Flex>
		</Flex>
	);
};

const LegacyRow: FC<{ c: SiteContent }> = ({ c }) => (
	<NextLink href={projectHref(`/web-contents/${c._id}`)}>
		<Flex
			align='center'
			gap={3}
			px={4}
			py={2.5}
			borderTopWidth='1px'
			borderColor='border.muted'
			_hover={{ bg: 'bg.subtle' }}>
			<Box
				flex={1}
				minW={0}>
				<Text
					fontSize='13px'
					fontWeight='500'
					truncate>
					{c.name || c.slug}
				</Text>
				<Text
					fontSize='12px'
					color='fg.muted'
					truncate>
					{c.preview || c.slug}
				</Text>
			</Box>
			{c.category && (
				<Badge
					size='sm'
					variant='outline'>
					{c.category}
				</Badge>
			)}
			<ExternalLink size={13} />
		</Flex>
	</NextLink>
);

const ContentsScreen: FC = () => {
	const router = useRouter();
	const params = useSearchParams();
	const { can } = useWorkspace();
	const asked = params.get('page') || '';
	const [page, setPage] = useState(asked || SITE);
	const { data, isLoading, isError, error, refetch } = useGetSiteContentsQuery(page);
	const { data: typesData } = useGetSiteContentTypesQuery();
	const [order] = useOrderSiteContentsMutation();
	const [remove, removing] = useRemoveSiteContentMutation();
	const [publish, publishing] = usePublishSiteContentsMutation();
	const [publishingId, setPublishingId] = useState<string | null>(null);
	const [editing, setEditing] = useState<SiteContent | null>(null);
	const [adding, setAdding] = useState(false);
	const isMobile = useIsMobile();
	// A phone adds on a page of its own; a bigger screen in the window.
	const startAdding = () => (isMobile ? router.push(projectHref(`/t/web-contents/new?page=${page}`)) : setAdding(true));
	const [removingOne, setRemovingOne] = useState<SiteContent | null>(null);
	const [local, setLocal] = useState<SiteContent[] | null>(null);

	// No page in the address: the home page, once the pages are known.
	useEffect(() => {
		if (asked || !data?.pages?.length || page !== SITE) return;
		const home = data.pages.find(p => p.path === '/') || data.pages[0];
		if (home) setPage(home._id);
	}, [data?.pages?.length]);
	useEffect(() => setLocal(null), [data]);

	const choose = (v: string) => {
		setPage(v);
		router.replace(`?page=${v}`, { scroll: false });
	};

	const all = local || data?.doc || [];
	const typed = all.filter(c => !c.legacy);
	const legacy = all.filter(c => c.legacy);
	const pageName = page === SITE ? 'Whole site' : data?.pages.find(p => p._id === page)?.name || 'This page';
	const canAdd = can('create-web-contents');
	const canEdit = can('edit-web-contents');
	const canDelete = can('delete-web-contents');
	const canPublish = can('publish-web-contents');
	const waiting = typed.filter(c => c.status && c.status !== 'published').length;

	/** Puts one piece live, or every piece of the page that isn't (Contents keep drafts until published, docs/cms D5). */
	const goLive = async (ids?: string[]) => {
		setPublishingId(ids?.[0] || 'page');
		const res: any = await publish(ids ? { ids } : { page });
		setPublishingId(null);
		if ('error' in res) return toaster.create({ type: 'error', title: 'Not published', description: res.error?.data?.message });
		toaster.create({ type: 'success', title: res.data.published ? `${res.data.published} published` : 'Already live', description: res.data.published ? 'It’s on your site and API now.' : undefined });
	};

	const move = async (i: number, by: number) => {
		const next = [...typed];
		const j = i + by;
		if (j < 0 || j >= next.length) return;
		[next[i], next[j]] = [next[j], next[i]];
		setLocal([...next, ...legacy]);
		const res: any = await order({ ids: next.map(c => c._id) });
		if ('error' in res) {
			setLocal(null);
			toaster.create({ type: 'error', title: 'Not moved', description: res.error?.data?.message });
		}
	};

	return (
		<Layout
			title='Contents'
			path='web-contents'>
			<Flex
				direction='column'
				gap={5}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '#', title: 'Contents' },
					]}
					title='Contents'
					meta='Everything your site says, page by page. Pick a page, then add what’s on it — each piece has a type, and asks only for its own words.'
					actions={
						<>
							<GuideLink section='site-contents' />
							<Button
								size='sm'
								variant='outline'
								asChild>
								<NextLink href='?view=table'>
									<Table2 size={14} />
									Table
								</NextLink>
							</Button>
							{canAdd && (
								<Button
									size='sm'
									disabled={!typesData}
									onClick={startAdding}>
									<Plus size={14} />
									New content
								</Button>
							)}
						</>
					}
				/>
				<Flex
					align='center'
					gap={3}
					wrap='wrap'>
					<Text
						fontSize='13px'
						fontWeight='500'>
						Page
					</Text>
					<Dropdown
						size='sm'
						w={{ base: 'full', md: '340px' }}
						value={page}
						onChange={choose}
						items={[
							{ value: SITE, label: `Whole site — header, footer, every page (${data?.site ?? 0})` },
							...(data?.pages || []).map(p => ({ value: p._id, label: `${p.name} · ${p.path} (${p.count})` })),
						]}
					/>
				</Flex>
				{isLoading ? (
					<Skeleton h='240px' />
				) : isError ? (
					<ErrorState
						error={error}
						onRetry={refetch}
					/>
				) : (
					<>
						<Panel
							title={pageName}
							subtitle={
								typed.length
									? data?.drafts
										? `In the order they show — top first. Changes are drafts until published${waiting ? ` · ${waiting} not live` : ''}.`
										: 'In the order they show — top first.'
									: undefined
							}
							actions={
								canPublish &&
								waiting > 0 && (
									<Button
										size='xs'
										colorPalette='green'
										loading={publishing.isLoading && publishingId === 'page'}
										onClick={() => goLive()}>
										<Send size={13} />
										Publish {page === SITE ? 'these' : 'the page'} ({waiting})
									</Button>
								)
							}
							flush>
							{typed.length ? (
								<Box mt='-1px'>
									{typed.map((c, i) => (
										<Row
											key={c._id}
											c={c}
											first={i === 0}
											last={i === typed.length - 1}
											canEdit={canEdit}
											canDelete={canDelete}
											onEdit={() => setEditing(c)}
											onMove={by => move(i, by)}
											onRemove={() => setRemovingOne(c)}
											canPublish={canPublish}
											publishing={publishing.isLoading && publishingId === c._id}
											onPublish={() => goLive([c._id])}
										/>
									))}
								</Box>
							) : (
								<Box p={4}>
									<EmptyState
										title={`Nothing on ${pageName} yet`}
										description={page === SITE ? 'Add the header and footer here — they show on every page.' : 'Add a hero, some cards, questions, or a list of your records.'}
										action={
											canAdd && (
												<Button
													size='sm'
													disabled={!typesData}
													onClick={startAdding}>
													<Plus size={14} />
													New content
												</Button>
											)
										}
									/>
								</Box>
							)}
						</Panel>
						{legacy.length > 0 && (
							<Panel
								title='From before content types'
								subtitle='One word or picture each, as the site builder made them. Open one to change it in the table.'
								flush>
								<Box mt='-1px'>
									{legacy.map(c => (
										<LegacyRow
											key={c._id}
											c={c}
										/>
									))}
								</Box>
							</Panel>
						)}
					</>
				)}
			</Flex>
			<ContentDialog
				open={adding || !!editing}
				onClose={() => {
					setAdding(false);
					setEditing(null);
				}}
				types={typesData?.types || []}
				models={typesData?.models || []}
				pages={data?.pages || []}
				page={page}
				content={editing}
				drafts={!!data?.drafts}
				onPage={typed.map(c => c.type || '')}
				start={typesData?.start}
			/>
			<PromptDialog
				open={!!removingOne}
				onClose={() => setRemovingOne(null)}
				onConfirm={async () => {
					const res: any = removingOne && (await remove(removingOne._id));
					if (res && 'error' in res) toaster.create({ type: 'error', title: 'Not removed', description: res.error?.data?.message });
					else toaster.create({ type: 'success', title: 'Removed', description: 'It’s archived — the table’s Archived view brings it back.' });
					setRemovingOne(null);
				}}
				title={`Remove ${removingOne?.name || 'this content'}?`}
				description='It leaves the page and is archived; the table’s Archived view brings it back.'
				loading={removing.isLoading}
				confirmLabel='Remove'
			/>
		</Layout>
	);
};

export default ContentsScreen;
