'use client';

import { FC, Suspense, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Box, Button, Flex, Input, Skeleton, Switch, Text } from '@chakra-ui/react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Layout } from '@/components/library';
import { Dropdown, EmptyState, PageHeader, Panel } from '@/components/library/cl';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { ago } from '@/components/library/modals/CreateModal/CreateModal';
import { useGetApiEndpointsQuery, useToggleApiEndpointMutation } from '@/components/library/store/services/apiBuilderApi';
import type { ApiModel, Endpoint } from '@/components/library/store/services/apiBuilderApi';
import { ApiTabs, MethodBadge, WhoBadge, apiBase, apiHref } from '../_components/shared';
import GenerateDialog from '../_components/GenerateDialog';
import NewEndpointDialog from '../_components/NewEndpointDialog';

/**
 * API → Endpoints (backend docs/api-builder D11): every endpoint of the
 * project, grouped by model — method, address, who can call it, how many
 * rules, calls, an on/off switch; a row opens the endpoint's page. Generate
 * from a model makes a model's standard set; New endpoint walks through a
 * custom one.
 */

const ORDER = ['list', 'get', 'create', 'update', 'delete'];
/** The standard ones first, in the order a model's records are used; then the custom ones by address. */
const byKind = (a: Endpoint, b: Endpoint) =>
	Number(b.standard) - Number(a.standard) || (a.standard ? ORDER.indexOf(a.action) - ORDER.indexOf(b.action) : a.path.localeCompare(b.path) || ORDER.indexOf(a.action) - ORDER.indexOf(b.action));

const Row: FC<{ e: Endpoint }> = ({ e }) => {
	const [toggle, { isLoading }] = useToggleApiEndpointMutation();
	const rules = e.access.when.length + (e.action === 'list' ? e.list.filters.length : 0);
	return (
		<Flex
			align='center'
			gap={3}
			px={4}
			py={3}
			borderTopWidth='1px'
			borderColor='border.muted'
			_first={{ borderTopWidth: 0 }}
			opacity={e.enabled ? 1 : 0.6}
			_hover={{ bg: 'bg.subtle' }}>
			<NextLink
				href={apiHref(`/endpoints/${e._id}`)}
				style={{ flex: 1, minWidth: 0 }}>
				<Flex
					align='center'
					gap={3}
					minW={0}
					wrap={{ base: 'wrap', md: 'nowrap' }}>
					<MethodBadge method={e.method} />
					<Box
						minW={0}
						flex={1}>
						<Text
							fontSize='13px'
							fontFamily='mono'
							truncate>
							{e.path}
						</Text>
						<Text
							fontSize='12px'
							color='fg.muted'
							truncate>
							{e.name}
							{e.standard ? ' · standard' : ''}
							{e.stats.calls ? ` · ${e.stats.calls} call${e.stats.calls === 1 ? '' : 's'}, last ${ago(e.stats.lastCalledAt!)}` : ' · not called yet'}
						</Text>
					</Box>
					<WhoBadge
						who={e.access.who}
						rules={rules}
					/>
				</Flex>
			</NextLink>
			<Switch.Root
				size='sm'
				checked={e.enabled}
				disabled={isLoading}
				onCheckedChange={x =>
					toggle({ id: e._id, enabled: !!x.checked })
						.unwrap()
						.catch(err => toaster.create({ type: 'error', title: 'Not changed', description: err?.data?.message || 'Try again' }))
				}>
				<Switch.HiddenInput aria-label={`${e.method} ${e.path} on`} />
				<Switch.Control />
			</Switch.Root>
		</Flex>
	);
};

function EndpointsView() {
	const { project, can, isLoading: loadingSelf } = useWorkspace();
	const allowed = IS_TENANT_PANEL && can('build');
	const { data, isLoading } = useGetApiEndpointsQuery(undefined, { skip: !allowed || !project });
	const params = useSearchParams();
	const [model, setModel] = useState(params.get('model') || '');
	const [search, setSearch] = useState('');
	const [generating, setGenerating] = useState<string | null>(null);
	const [making, setMaking] = useState(false);
	const models: ApiModel[] = data?.models || [];
	const endpoints: Endpoint[] = data?.doc || [];
	const base = apiBase(project?.publicSlug);

	const groups = useMemo(() => {
		const q = search.trim().toLowerCase();
		return models
			.filter(m => !model || m.route === model)
			.map(m => ({
				m,
				list: endpoints
					.filter(e => e.model === m.route && (!q || e.path.includes(q) || e.name.toLowerCase().includes(q) || e.method.toLowerCase() === q))
					.sort(byKind),
			}))
			.filter(g => g.list.length || (!q && model));
	}, [models, endpoints, model, search]);
	const without = models.filter(m => !endpoints.some(e => e.model === m.route));

	return (
		<Layout
			title='Endpoints'
			path='public-api-endpoints'>
			<Flex
				direction='column'
				gap={5}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: apiHref(), title: 'API' },
						{ href: '#', title: 'Endpoints' },
					]}
					title='Endpoints'
					meta='Every address your site or app can call, and who may call it. Open one to set its rules, fields and filters.'
					actions={
						allowed && (
							<>
								<GuideLink section='api-endpoints' />
								<Button
									size='sm'
									variant='outline'
									disabled={!models.length}
									onClick={() => setGenerating(model || '')}>
									<Sparkles size={14} />
									Generate from a model
								</Button>
								<Button
									size='sm'
									disabled={!models.length}
									onClick={() => setMaking(true)}>
									<Plus size={14} />
									New endpoint
								</Button>
							</>
						)
					}
				/>
				<ApiTabs />
				{!loadingSelf && !allowed ? (
					<EmptyState
						title='For people who build'
						description='Roles with Build make and change the project’s API.'
					/>
				) : isLoading ? (
					<Skeleton h='200px' />
				) : !models.length ? (
					<EmptyState
						title='No models yet'
						description='The API reads and writes your models’ records. Build a model first, then generate its endpoints here.'
					/>
				) : (
					<>
						<Flex
							gap={2}
							wrap='wrap'>
							<Box w={{ base: 'full', sm: '220px' }}>
								<Dropdown
									size='sm'
									value={model}
									onChange={(v: string) => setModel(v)}
									items={[{ value: '', label: 'All models' }, ...models.map(m => ({ value: m.route, label: m.title }))]}
								/>
							</Box>
							<Flex
								align='center'
								gap={2}
								px={2.5}
								flex={{ base: '1 1 100%', sm: '0 1 280px' }}
								borderWidth='1px'
								borderColor='border'
								borderRadius='md'>
								<Search
									size={14}
									color='var(--chakra-colors-fg-muted)'
								/>
								<Input
									size='sm'
									border='none'
									bg='transparent'
									_focusVisible={{ outline: 'none', boxShadow: 'none' }}
									px={0}
									placeholder='Find by path, name or method'
									value={search}
									onChange={e => setSearch(e.target.value)}
									aria-label='Find an endpoint'
								/>
							</Flex>
						</Flex>

						{groups.length ? (
							groups.map(({ m, list }) => (
								<Panel
									key={m.route}
									title={m.title}
									subtitle={`${list.filter(e => e.enabled).length} of ${list.length} on`}
									actions={
										<Button
											size='xs'
											variant='ghost'
											onClick={() => setGenerating(m.route)}>
											<Sparkles size={13} />
											Generate
										</Button>
									}
									flush>
									{list.length ? (
										list.map(e => (
											<Row
												key={e._id}
												e={e}
											/>
										))
									) : (
										<Text
											p={4}
											fontSize='13px'
											color='fg.muted'>
											No endpoints for {m.title} yet — generate its standard ones, or make one.
										</Text>
									)}
								</Panel>
							))
						) : (
							<EmptyState
								title={search ? 'Nothing matches' : 'No endpoints yet'}
								description={
									search
										? 'Try another path, name or method.'
										: 'Generate a model’s endpoints in one go — list, read one, create, update, delete — then decide who can call each.'
								}
								action={
									!search && (
										<Button
											size='sm'
											onClick={() => setGenerating('')}>
											<Sparkles size={14} />
											Generate from a model
										</Button>
									)
								}
							/>
						)}

						{!model && !search && without.length > 0 && endpoints.length > 0 && (
							<Text
								fontSize='12.5px'
								color='fg.muted'>
								Not on the API: {without.map(m => m.title).join(', ')}.{' '}
								<Box
									as='button'
									textDecoration='underline'
									onClick={() => setGenerating(without[0].route)}>
									Generate
								</Box>
							</Text>
						)}
					</>
				)}
			</Flex>
			<GenerateDialog
				open={generating !== null}
				onClose={() => setGenerating(null)}
				models={models}
				endpoints={endpoints}
				model={generating || undefined}
			/>
			<NewEndpointDialog
				open={making}
				onClose={() => setMaking(false)}
				models={models}
				base={base}
				model={model || undefined}
			/>
		</Layout>
	);
}

// useSearchParams (?model=) needs a Suspense boundary for the static build.
export default function EndpointsPage() {
	return (
		<Suspense>
			<EndpointsView />
		</Suspense>
	);
}
