'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { Plug, Plus } from 'lucide-react';
import { Layout, useGetBuiltFeaturesQuery } from '@/components/library';
import { EmptyState, ErrorState, PageHeader, Panel, TableSkeleton, when } from '@/components/library/cl';
import { DocLink } from '@/app/builder/_components/ui';

/**
 * Features built so far — by the feature wizard or an AI client over MCP —
 * newest first, with the pages each one made and changed.
 */
const FeaturesPage = () => {
	const router = useRouter();
	const { data, isLoading, isError, refetch } = useGetBuiltFeaturesQuery();
	const rows = data?.doc || [];

	return (
		<Layout
			title='Features'
			path='model-builder'>
			<Flex
				direction='column'
				gap={5}
				pb={10}
				maxW='960px'>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '/model-builder', title: 'Models' },
						{ href: '/model-builder/features', title: 'Features' },
					]}
					title='Features'
					meta='Several models and their links, built together'
					actions={
						<Flex gap={2}>
							<Button
								size='sm'
								variant='outline'
								asChild>
								<NextLink href='/model-builder/connect'>
									<Plug size={14} />
									Connect your AI
								</NextLink>
							</Button>
							{!IS_TENANT_PANEL && (
								<Button
									size='sm'
									onClick={() => router.push('/model-builder/features/new')}>
									<Plus size={14} />
									New feature
								</Button>
							)}
						</Flex>
					}
				/>
				<Panel
					title='Built'
					actions={<DocLink section='features' />}
					flush>
					{isLoading ? (
						<Box p={4}>
							<TableSkeleton rows={4} />
						</Box>
					) : isError ? (
						<Box p={4}>
							<ErrorState
								message='Could not load the features'
								onRetry={refetch}
							/>
						</Box>
					) : !rows.length ? (
						<Box p={4}>
							<EmptyState
								title='Nothing built yet'
								description={
									IS_TENANT_PANEL
										? 'Connect your own AI and describe a feature — it builds several linked models in this project at once.'
										: 'Describe a feature and build several linked models at once — here, or from your own AI.'
								}
								action={
									IS_TENANT_PANEL ? (
										<Button
											size='sm'
											asChild>
											<NextLink href='/model-builder/connect'>
												<Plug size={14} />
												Connect your AI
											</NextLink>
										</Button>
									) : (
										<Button
											size='sm'
											onClick={() => router.push('/model-builder/features/new')}>
											<Plus size={14} />
											New feature
										</Button>
									)
								}
							/>
						</Box>
					) : (
						rows.map((f: any, i: number) => (
							<Box
								key={f._id}
								px={4}
								py={3}
								borderTopWidth={i ? '1px' : 0}
								borderColor='border.muted'>
								<Flex
									align='center'
									gap={2}
									flexWrap='wrap'>
									<Text
										fontSize='sm'
										fontWeight='600'>
										{f.title}
									</Text>
									<Badge
										size='sm'
										variant='outline'>
										{f.source === 'mcp' ? `AI client${f.apiKey?.name ? ` · ${f.apiKey.name}` : ''}` : 'Wizard'}
									</Badge>
									<Text
										fontSize='xs'
										color='fg.muted'>
										{when(f.createdAt)} · {f.createdBy?.name || f.createdBy?.email || ''}
									</Text>
								</Flex>
								{f.summary && (
									<Text
										fontSize='xs'
										color='fg.muted'
										mt={1}>
										{f.summary}
									</Text>
								)}
								<Flex
									gap={1.5}
									mt={2}
									flexWrap='wrap'>
									{(f.result?.created || []).map((c: any) => (
										<Button
											key={c.id}
											size='2xs'
											variant='subtle'
											asChild>
											<NextLink href={`/${c.route}`}>{c.title}</NextLink>
										</Button>
									))}
									{(f.result?.updated || []).map((u: any) => (
										<Button
											key={u.name}
											size='2xs'
											variant='outline'
											asChild>
											<NextLink href={`/${u.route}`}>{u.title} (changed)</NextLink>
										</Button>
									))}
								</Flex>
							</Box>
						))
					)}
				</Panel>
			</Flex>
		</Layout>
	);
};

export default FeaturesPage;
