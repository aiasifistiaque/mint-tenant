'use client';

import { FC } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Flex, Grid, Skeleton, Text } from '@chakra-ui/react';
import { ChevronRight, FileText, Globe, Layers, SquareStack } from 'lucide-react';
import { Layout, useGetContentOverviewQuery } from '@/components/library';
import type { ContentModelSummary, ContentSingleSummary } from '@/components/library';
import { EmptyState, ErrorState, PageHeader, Panel } from '@/components/library/cl';
import { HOME, projectHref } from '@/components/library/config/lib/constants/panel';
import { PublishBadge } from '@/components/library/components/view/record/PublishControls';
import { ago } from '@/components/library/modals/CreateModal/CreateModal';
import GuideLink from '@/components/library/tenant/GuideLink';

/**
 * All content (backend docs/cms CMS-07): the project's content in one place —
 * the website's Contents, its single types (site-wide records like Settings or
 * About), and the collections whose records are drafts until published, each
 * with how many records there are and how many aren't live yet. Each opens
 * where it's edited; a filter there shows the ones waiting.
 */

const Waiting: FC<{ n: number; draft: number; modified: number }> = ({ n, draft, modified }) =>
	n ? (
		<Badge
			size='sm'
			variant='subtle'
			colorPalette='orange'
			title={`${draft} never published, ${modified} changed since publishing`}>
			{n} not live
		</Badge>
	) : (
		<Badge
			size='sm'
			variant='subtle'
			colorPalette='green'>
			All live
		</Badge>
	);

const Tile: FC<{ href: string; icon: React.ReactNode; title: string; meta: React.ReactNode; badge?: React.ReactNode }> = ({ href, icon, title, meta, badge }) => (
	<NextLink href={href}>
		<Flex
			gap={3}
			p={4}
			h='full'
			align='flex-start'
			borderWidth='1px'
			borderColor='border'
			borderRadius='xl'
			bg='bg.panel'
			_hover={{ borderColor: 'border.emphasized', bg: 'bg.subtle' }}>
			<Flex
				boxSize='34px'
				flexShrink={0}
				align='center'
				justify='center'
				borderRadius='lg'
				bg='violet.subtle'
				color='violet.fg'>
				{icon}
			</Flex>
			<Box
				flex={1}
				minW={0}>
				<Flex
					align='center'
					gap={2}
					wrap='wrap'>
					<Text
						fontSize='14px'
						fontWeight='600'>
						{title}
					</Text>
					{badge}
				</Flex>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					mt={0.5}>
					{meta}
				</Text>
			</Box>
			<ChevronRight size={15} />
		</Flex>
	</NextLink>
);

const singleBadge = (s: ContentSingleSummary) =>
	!s.exists ? (
		<Badge
			size='sm'
			variant='outline'>
			Not filled in
		</Badge>
	) : s.status && s.status !== 'live' ? (
		<PublishBadge status={s.status} />
	) : null;

const Row: FC<{ c: ContentModelSummary; href: string }> = ({ c, href }) => (
	<NextLink href={href}>
		<Flex
			align='center'
			gap={3}
			px={4}
			py={3}
			borderTopWidth='1px'
			borderColor='border.muted'
			_hover={{ bg: 'bg.subtle' }}>
			<Box
				flex={1}
				minW={0}>
				<Flex
					align='center'
					gap={2}
					wrap='wrap'>
					<Text
						fontSize='13.5px'
						fontWeight='600'>
						{c.title}
					</Text>
					<Waiting
						n={c.waiting}
						draft={c.draft}
						modified={c.modified}
					/>
				</Flex>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					truncate>
					{c.total.toLocaleString()} record{c.total === 1 ? '' : 's'}
					{c.last ? ` · last changed ${ago(c.last.updatedAt)}${c.last.name ? ` — ${c.last.name}` : ''}` : ''}
				</Text>
			</Box>
			<ChevronRight size={15} />
		</Flex>
	</NextLink>
);

export default function ContentPage() {
	const { data, isLoading, isError, error, refetch } = useGetContentOverviewQuery();
	const nothing = data && !data.website && !data.singles.length && !data.collections.length;
	const waiting = (data?.website?.waiting || 0) + (data?.collections || []).reduce((n, c) => n + c.waiting, 0);

	return (
		<Layout
			title='All content'
			path='content'>
			<Flex
				direction='column'
				gap={5}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '#', title: 'All content' },
					]}
					title='All content'
					meta={waiting ? `${waiting} change${waiting === 1 ? '' : 's'} waiting to be published.` : 'Everything your site and API publish, in one place.'}
					actions={<GuideLink section='models-drafts' />}
				/>
				{isLoading ? (
					<Skeleton h='260px' />
				) : isError ? (
					<ErrorState
						error={error}
						onRetry={refetch}
					/>
				) : nothing ? (
					<EmptyState
						title='No content models yet'
						description='Turn on “Records are drafts until published” in a model’s Settings, or make a single type — they’re listed here.'
					/>
				) : (
					<>
						{(data?.website || !!data?.singles.length) && (
							<Grid
								templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }}
								gap={3}>
								{data?.website && (
									<Tile
										href={projectHref('/t/web-contents')}
										icon={<Globe size={17} />}
										title='Website contents'
										meta={`${data.website.total} piece${data.website.total === 1 ? '' : 's'}, page by page`}
										badge={
											<Waiting
												n={data.website.waiting}
												draft={data.website.draft}
												modified={data.website.modified}
											/>
										}
									/>
								)}
								{data?.singles.map(s => (
									<Tile
										key={s.route}
										href={projectHref(`/t/${s.route}`)}
										icon={<FileText size={17} />}
										title={s.title}
										meta={s.updatedAt ? `One record · changed ${ago(s.updatedAt)}` : 'One record — not filled in yet'}
										badge={singleBadge(s)}
									/>
								))}
							</Grid>
						)}
						{!!data?.collections.length && (
							<Panel
								title={
									<Flex
										align='center'
										gap={2}>
										<Layers size={15} />
										Collections
									</Flex>
								}
								subtitle='Records here are drafts until published. Open one to publish them, or tick several in the table and Publish.'
								flush>
								<Box mt='-1px'>
									{data.collections.map(c => (
										<Row
											key={c.route}
											c={c}
											href={projectHref(`/t/${c.route}${c.waiting ? '?publishStatus=' + (c.modified ? 'modified' : 'draft') : ''}`)}
										/>
									))}
								</Box>
							</Panel>
						)}
						{!data?.collections.length && (
							<Flex
								align='center'
								gap={2}
								fontSize='12.5px'
								color='fg.muted'>
								<SquareStack size={14} />
								<Text
									fontSize='inherit'
									color='inherit'>
									Collections show here when a model’s records are drafts until published (Build → Models → Settings).
								</Text>
							</Flex>
						)}
					</>
				)}
			</Flex>
		</Layout>
	);
}
