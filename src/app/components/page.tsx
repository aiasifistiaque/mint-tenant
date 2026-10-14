'use client';

import NextLink from 'next/link';
import { Badge, Box, Button, Flex, Skeleton, Text } from '@chakra-ui/react';
import { Plus, Puzzle } from 'lucide-react';
import { Layout, useGetModelComponentsQuery } from '@/components/library';
import type { ModelComponent } from '@/components/library';
import { EmptyState, ErrorState, PageHeader, Panel } from '@/components/library/cl';
import { HOME, projectHref } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { kindLabel } from '@/app/model-builder/_components/modelKinds';

/**
 * Build → Components (backend docs/cms D3, CMS-03): groups of fields made
 * once — a Button, an SEO block, a Card, a Hero — and used by any model as a
 * field of kind Component, once or as a list. Grouped by category; each
 * says which models use it.
 */

const Row = ({ c }: { c: ModelComponent }) => (
	<NextLink href={projectHref(`/components/${c._id}`)}>
		<Flex
			align='center'
			gap={3}
			px={4}
			py={3}
			borderTopWidth='1px'
			borderColor='border.muted'
			_hover={{ bg: 'bg.subtle' }}>
			<Flex
				boxSize='32px'
				flexShrink={0}
				align='center'
				justify='center'
				borderRadius='lg'
				bg='violet.subtle'
				color='violet.fg'>
				<Puzzle size={16} />
			</Flex>
			<Box
				flex={1}
				minW={0}>
				<Flex
					align='baseline'
					gap={2}
					wrap='wrap'>
					<Text
						fontSize='13.5px'
						fontWeight='600'>
						{c.title}
					</Text>
					<Text
						fontSize='12px'
						fontFamily='mono'
						color='fg.muted'>
						{c.uid}
					</Text>
				</Flex>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					truncate>
					{c.fields.map(f => `${f.label || f.key} (${kindLabel(f.kind).toLowerCase()})`).join(' · ') || 'No fields'}
				</Text>
			</Box>
			<Badge
				size='sm'
				variant='subtle'
				colorPalette={c.usedBy.length ? 'green' : 'gray'}
				flexShrink={0}>
				{c.usedBy.length ? `Used in ${new Set(c.usedBy.map(u => u._id)).size} model${new Set(c.usedBy.map(u => u._id)).size === 1 ? '' : 's'}` : 'Not used yet'}
			</Badge>
		</Flex>
	</NextLink>
);

export default function ComponentsPage() {
	const { can, isLoading: loadingSelf } = useWorkspace();
	const allowed = can('build');
	const { data, isLoading, isError, error, refetch } = useGetModelComponentsQuery(undefined, { skip: !allowed });
	const comps = data?.doc || [];
	const categories = [...new Set(comps.map(c => c.category))];
	const newHref = projectHref('/components/new');

	return (
		<Layout
			title='Components'
			path='components'>
			<Flex
				direction='column'
				gap={5}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '#', title: 'Components' },
					]}
					title='Components'
					meta='Groups of fields made once and used by any model — a button, an SEO block, a card. Change one, and every model using it follows.'
					actions={
						allowed && (
							<>
								<GuideLink section='models-components' />
								<Button
									size='sm'
									asChild>
									<NextLink href={newHref}>
										<Plus size={14} />
										New component
									</NextLink>
								</Button>
							</>
						)
					}
				/>
				{!loadingSelf && !allowed ? (
					<EmptyState
						title='For people who build'
						description='Roles with Build make and change components.'
					/>
				) : isLoading ? (
					<Skeleton h='200px' />
				) : isError ? (
					<ErrorState
						error={error}
						onRetry={refetch}
					/>
				) : !comps.length ? (
					<EmptyState
						title='No components yet'
						description='Make one when several models need the same group of fields — then add it to a model as a field of the kind Component.'
						action={
							<Button
								size='sm'
								asChild>
								<NextLink href={newHref}>
									<Plus size={14} />
									New component
								</NextLink>
							</Button>
						}
					/>
				) : (
					categories.map(cat => (
						<Panel
							key={cat}
							title={cat[0].toUpperCase() + cat.slice(1)}
							flush>
							<Box mt='-1px'>
								{comps
									.filter(c => c.category === cat)
									.map(c => (
										<Row
											key={c._id}
											c={c}
										/>
									))}
							</Box>
						</Panel>
					))
				)}
			</Flex>
		</Layout>
	);
}
