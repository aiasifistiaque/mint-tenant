'use client';

import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Button, Checkbox, Flex, Input, Skeleton, Switch, Tabs, Text, Textarea } from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import { Layout, PromptDialog } from '@/components/library';
import { ConsoleTabs, CopyValue, Dropdown, EmptyState, PageHeader, Panel } from '@/components/library/cl';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { ago } from '@/components/library/modals/CreateModal/CreateModal';
import { toaster } from '@/components/ui/toaster';
import {
	useDeleteApiEndpointMutation,
	useGetApiEndpointQuery,
	useToggleApiEndpointMutation,
	useUpdateApiEndpointMutation,
} from '@/components/library/store/services/apiBuilderApi';
import type { ApiModel, Endpoint, EndpointCondition } from '@/components/library/store/services/apiBuilderApi';
import { ApiTabs, MethodBadge, WhoBadge, actionOf, apiBase, apiHref, errorOf } from '../../_components/shared';
import WhoCards from '../../_components/WhoCards';
import RuleEditor from '../../_components/RuleEditor';
import ApiTester, { Trial } from '../../_components/ApiTester';
import ExampleRequest from '../../_components/ExampleRequest';
import { exampleOf } from '../../_components/api';
import { ApiLogs } from '../../_components/logs';

/**
 * API → Endpoints → one endpoint (backend docs/api-builder AB-04): who can call
 * it and which records it reaches (Access), which fields go out and which a
 * call may write (Fields), a list's fixed filters, order and page sizes
 * (Filters), a live request (Try it), and the code to call it (Code). Edits
 * stay a draft until Save; on/off and Delete act at once. A read also picks the
 * links a caller may fill with ?populate= (Fields → Linked records, docs/cms CMS-09).
 */

type Draft = Pick<Endpoint, 'name' | 'note' | 'path' | 'access' | 'fields' | 'list' | 'populate'>;
const draftOf = (e: Endpoint): Draft => ({ name: e.name, note: e.note, path: e.path, access: e.access, fields: e.fields, list: e.list, populate: e.populate ?? null });
const OWNER: EndpointCondition = { field: '_customer', op: 'is', value: { ref: 'customer' } };
const isOwner = (c: EndpointCondition) => c.field === '_customer' && c.op === 'is' && (c.value as any)?.ref === 'customer';
const NO_FIELDS = new Set(['section', 'sectionlist']);

const Section: FC<{ title: string; hint?: ReactNode; guide?: string; children: ReactNode }> = ({ title, hint, guide, children }) => (
	<Panel
		title={title}
		subtitle={hint}
		actions={guide ? <GuideLink section={guide} /> : undefined}>
		{children}
	</Panel>
);

/**
 * Which links a read may fill (?populate=): by default every link one step
 * away; or exactly the ones ticked — two links deep too, through a linked
 * model that has a public API.
 */
const LinkedRecords: FC<{ model: ApiModel; value: string[] | null; onChange: (v: string[] | null) => void; error?: string }> = ({ model, value, onChange, error }) => {
	const options = model.populate || [];
	const byDefault = value === null;
	const picked = new Set(byDefault ? model.populateDefault || [] : value);
	const toggle = (path: string) => onChange(picked.has(path) ? [...picked].filter(p => p !== path) : [...picked, path]);
	return (
		<Section
			title='Linked records'
			hint={
				<>
					A caller can ask for a link filled in instead of its id —{' '}
					<Text
						as='span'
						fontFamily='mono'
						fontSize='inherit'>
						?populate={options[0]?.path || 'author'}
					</Text>{' '}
					(or{' '}
					<Text
						as='span'
						fontFamily='mono'
						fontSize='inherit'>
						*
					</Text>{' '}
					for all of these). Each comes out as its own model’s API shows it.
				</>
			}
			guide='api-populate'>
			{!options.length ? (
				<Text
					fontSize='12.5px'
					color='fg.muted'>
					{model.title} has no links to other models.
				</Text>
			) : (
				<Flex
					direction='column'
					gap={3}>
					<Flex
						align='center'
						justify='space-between'
						gap={3}
						p={3}
						borderRadius='lg'
						bg='bg.subtle'>
						<Box>
							<Text
								fontSize='13.5px'
								fontWeight='500'>
								Every link one step away
							</Text>
							<Text
								fontSize='12px'
								color='fg.muted'>
								Off: only the ones ticked below — links of linked records too.
							</Text>
						</Box>
						<Switch.Root
							size='sm'
							checked={byDefault}
							onCheckedChange={x => onChange(x.checked ? null : [...(model.populateDefault || [])])}>
							<Switch.HiddenInput aria-label='Every link one step away' />
							<Switch.Control />
						</Switch.Root>
					</Flex>
					<Box
						borderWidth='1px'
						borderColor='border.muted'
						borderRadius='md'
						overflow='hidden'>
						{options.map((o, i) => (
							<Flex
								key={o.path}
								px={3}
								py={2}
								gap={3}
								align='center'
								borderTopWidth={i ? '1px' : 0}
								borderColor='border.muted'
								opacity={byDefault && !picked.has(o.path) ? 0.55 : 1}>
								<Checkbox.Root
									size='sm'
									checked={picked.has(o.path)}
									disabled={byDefault}
									onCheckedChange={() => toggle(o.path)}>
									<Checkbox.HiddenInput aria-label={`Fill ${o.label}`} />
									<Checkbox.Control />
								</Checkbox.Root>
								<Box
									flex={1}
									minW={0}>
									<Text
										fontSize='13px'
										truncate>
										{o.label}
										<Text
											as='span'
											fontSize='inherit'
											color='fg.muted'>
											{' '}
											→ {o.target}
										</Text>
									</Text>
									<Text
										fontSize='11.5px'
										fontFamily='mono'
										color='fg.muted'
										truncate>
										{o.path}
									</Text>
								</Box>
								<Text
									fontSize='11.5px'
									color='fg.muted'
									flexShrink={0}
									textAlign='right'>
									{o.full ? (o.links > 1 ? 'two links deep' : 'the whole record') : 'name only — no public API'}
								</Text>
							</Flex>
						))}
					</Box>
				</Flex>
			)}
			{error && <Text {...errCss}>{error}</Text>}
		</Section>
	);
};

/** The "n" in `access.when.n` / `list.filters.n` — which rule row the server's message is about. */
const rowOf = (on: string | undefined, prefix: string) => {
	if (!on?.startsWith(prefix)) return null;
	const n = Number(on.slice(prefix.length + 1));
	return Number.isFinite(n) ? n : null;
};

export default function EndpointPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { project, can, isLoading: loadingSelf } = useWorkspace();
	const allowed = IS_TENANT_PANEL && can('build');
	const { data, isLoading, isError } = useGetApiEndpointQuery(id, { skip: !allowed || !project || !id });
	const [update, updating] = useUpdateApiEndpointMutation();
	const [toggle, toggling] = useToggleApiEndpointMutation();
	const [remove, removing] = useDeleteApiEndpointMutation();
	const [draft, setDraft] = useState<Draft | null>(null);
	const [tab, setTab] = useState('access');
	// ?tab=logs (from a log's "Open the endpoint", or a shared link).
	useEffect(() => {
		const t = new URLSearchParams(window.location.search).get('tab');
		if (t) setTab(t);
	}, []);
	const [error, setError] = useState<{ message: string; on?: string } | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [trial, setTrial] = useState<Trial | null>(null);

	const saved = useMemo(() => (data ? draftOf(data) : null), [data]);
	const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved);
	// Load the saved endpoint into the draft — and again after a save, or when it changes elsewhere while nothing is unsaved.
	useEffect(() => {
		if (saved && (!draft || !dirty)) setDraft(saved);
	}, [saved]);

	const model: ApiModel | null = data?.modelInfo || null;
	const base = apiBase(project?.publicSlug);
	const a = actionOf(data?.action || 'list');
	const writes = data?.action === 'create' || data?.action === 'update';
	const isList = data?.action === 'list';

	// Try it: this endpoint, with an example body when it writes.
	const exampleBody = useMemo(() => {
		if (!model || !writes || !draft) return undefined;
		const readOnly = new Set(draft.fields.readOnly);
		const sendable = model.fields.filter(f => !NO_FIELDS.has(f.kind) && f.kind !== 'formula' && !readOnly.has(f.key));
		return Object.fromEntries((data?.action === 'update' ? sendable.slice(0, 2) : sendable).map(f => [f.key, exampleOf({ ...f, options: f.options?.map(o => o.value) } as any)]));
	}, [model, draft?.fields.readOnly.join(), data?.action]);
	useEffect(() => {
		if (data && tab === 'try') setTrial({ method: data.method, path: data.path, body: exampleBody, customer: data.access.who === 'customer', nonce: Date.now() });
	}, [tab, data?._id]);

	if (!loadingSelf && !allowed)
		return (
			<Layout
				title='Endpoint'
				path='public-api-endpoints'>
				<EmptyState
					title='For people who build'
					description='Roles with Build make and change the project’s API.'
				/>
			</Layout>
		);

	const set = (patch: Partial<Draft>) => {
		setDraft(d => (d ? { ...d, ...patch } : d));
		if (error) setError(null);
	};
	const setAccess = (patch: Partial<Draft['access']>) => draft && set({ access: { ...draft.access, ...patch } });
	const setFields = (patch: Partial<Draft['fields']>) => draft && set({ fields: { ...draft.fields, ...patch } });
	const setList = (patch: Partial<Draft['list']>) => draft && set({ list: { ...draft.list, ...patch } });

	const save = async () => {
		if (!draft || !data) return;
		setError(null);
		const res = await update({ id: data._id, ...draft, path: data.standard ? undefined : draft.path });
		if ('error' in res) {
			const e = errorOf(res.error);
			setError(e);
			const on = e.on || '';
			setTab(on.startsWith('access') ? 'access' : on.startsWith('fields') || on === 'populate' ? 'fields' : on.startsWith('list') ? 'filters' : 'details');
			return;
		}
		toaster.create({ type: 'success', title: 'Saved' });
	};

	const owner = !!draft?.access.when.some(isOwner);
	const fieldRows = (model?.fields || []).filter(f => !NO_FIELDS.has(f.kind));
	const outAll = !draft?.fields.out;
	const isOut = (key: string) => outAll || !!draft?.fields.out?.includes(key);
	const toggleOut = (key: string) => {
		if (!draft) return;
		const current = outAll ? fieldRows.map(f => f.key) : draft.fields.out || [];
		const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
		setFields({ out: next.length === fieldRows.length ? null : next });
	};
	const isWritten = (key: string) => !draft?.fields.readOnly.includes(key) && (!draft?.fields.write || draft.fields.write.includes(key));
	const toggleWritten = (key: string) => {
		if (!draft) return;
		const ro = draft.fields.readOnly;
		setFields({ readOnly: ro.includes(key) ? ro.filter(k => k !== key) : [...ro, key], write: null });
	};

	const header = data && (
		<PageHeader
			breadcrumbs={[
				{ href: HOME, title: 'Home' },
				{ href: apiHref(), title: 'API' },
				{ href: apiHref('/endpoints'), title: 'Endpoints' },
				{ href: '#', title: data.name },
			]}
			title={data.name}
			meta={`${a.label} · ${model?.title || data.model}${data.standard ? ' · standard' : ''} · ${
				data.stats.calls ? `${data.stats.calls} call${data.stats.calls === 1 ? '' : 's'}, last ${ago(data.stats.lastCalledAt!)}` : 'not called yet'
			}`}
			actions={
				<>
					<GuideLink section='api-endpoints' />
					<Switch.Root
						size='sm'
						checked={data.enabled}
						disabled={toggling.isLoading}
						onCheckedChange={x =>
							toggle({ id: data._id, enabled: !!x.checked })
								.unwrap()
								.catch(err => toaster.create({ type: 'error', title: 'Not changed', description: err?.data?.message || 'Try again' }))
						}>
						<Switch.HiddenInput aria-label='Endpoint on' />
						<Switch.Control />
						<Switch.Label fontSize='12.5px'>{data.enabled ? 'On' : 'Off'}</Switch.Label>
					</Switch.Root>
					<Button
						size='sm'
						variant='outline'
						onClick={() => setDeleting(true)}>
						<Trash2 size={14} />
						Delete
					</Button>
				</>
			}
		/>
	);

	return (
		<Layout
			title={data?.name || 'Endpoint'}
			path='public-api-endpoints'>
			<Flex
				direction='column'
				gap={5}>
				{header}
				<ApiTabs />
				{isError ? (
					<EmptyState
						title='Endpoint not found'
						description='It may have been deleted.'
						action={
							<Button
								size='sm'
								onClick={() => router.push(apiHref('/endpoints'))}>
								All endpoints
							</Button>
						}
					/>
				) : isLoading || !data || !draft || !model ? (
					<Skeleton h='320px' />
				) : (
					<>
						<Flex
							align='center'
							gap={3}
							p={3}
							borderWidth='1px'
							borderColor='border'
							borderRadius='lg'
							wrap='wrap'>
							<MethodBadge
								method={data.method}
								size='md'
							/>
							<Box
								flex={{ base: '1 1 100%', md: 1 }}
								order={{ base: 3, md: 0 }}
								minW={0}
								wordBreak='break-all'>
								<CopyValue value={`${base}${data.path}`} />
							</Box>
							<WhoBadge
								who={draft.access.who}
								rules={draft.access.when.length + (isList ? draft.list.filters.length : 0)}
							/>
						</Flex>

						<ConsoleTabs
							value={tab}
							onChange={setTab}
							tabs={[
								{ value: 'access', label: 'Access' },
								{ value: 'fields', label: 'Fields' },
								...(isList ? [{ value: 'filters', label: 'Filters' }] : []),
								{ value: 'try', label: 'Try it' },
								{ value: 'code', label: 'Code' },
								{ value: 'logs', label: 'Logs' },
								{ value: 'details', label: 'Details' },
							]}>
							<Tabs.Content value='access'>
								<Flex
									direction='column'
									gap={4}>
									<Section
										title='Who can call it'
										guide='api-access'>
										<WhoCards
											value={draft.access.who}
											onChange={who =>
												setAccess({
													who,
													// Rules about the customer only make sense on a customers' endpoint.
													when: who === 'customer' ? draft.access.when : draft.access.when.filter(c => c.field !== '_customer' && !(c.value as any)?.ref),
												})
											}
										/>
										{error?.on === 'access.who' && <Text {...errCss}>{error.message}</Text>}
									</Section>
									<Section
										title='Which records it reaches'
										hint={
											data.action === 'create'
												? 'A new record must meet these, or the call is refused (403).'
												: 'Records outside these don’t exist for this endpoint — a call for one answers Not found.'
										}
										guide='api-conditions'>
										{draft.access.who === 'customer' && data.action !== 'create' && (
											<Flex
												align='center'
												justify='space-between'
												gap={3}
												p={3}
												mb={3}
												borderRadius='lg'
												bg='bg.subtle'>
												<Box>
													<Text
														fontSize='13.5px'
														fontWeight='500'>
														Only their own records
													</Text>
													<Text
														fontSize='12px'
														color='fg.muted'>
														Each customer reaches only the records they created through the API.
													</Text>
												</Box>
												<Switch.Root
													size='sm'
													checked={owner}
													onCheckedChange={x =>
														setAccess({ when: x.checked ? [OWNER, ...draft.access.when.filter(c => !isOwner(c))] : draft.access.when.filter(c => !isOwner(c)) })
													}>
													<Switch.HiddenInput aria-label='Only their own records' />
													<Switch.Control />
												</Switch.Root>
											</Flex>
										)}
										{draft.access.who === 'customer' && data.action === 'create' && (
											<Text
												fontSize='12.5px'
												color='fg.muted'
												mb={3}>
												A record made by a signed-in customer is theirs — their own-records endpoints reach it.
											</Text>
										)}
										<RuleEditor
											model={model}
											value={draft.access.when.filter(c => !isOwner(c) || draft.access.who !== 'customer' || data.action === 'create')}
											onChange={when => setAccess({ when: owner && data.action !== 'create' ? [OWNER, ...when] : when })}
											match={draft.access.match}
											onMatchChange={match => setAccess({ match })}
											customer={draft.access.who === 'customer'}
											errorAt={(() => {
												const n = rowOf(error?.on, 'access.when');
												return n === null ? null : { index: owner && data.action !== 'create' ? n - 1 : n, message: error!.message };
											})()}
											addLabel={draft.access.when.length ? 'Add a rule' : 'Add a rule — e.g. status is published'}
										/>
									</Section>
								</Flex>
							</Tabs.Content>

							<Tabs.Content value='fields'>
								<Flex
									direction='column'
									gap={4}>
									<Section
										title='Fields'
										hint={
											writes
												? 'What comes back, and what a call may write. Unticked “Written” fields are set by your team — sent, they’re ignored.'
												: model.drafts
												? 'What comes back — as last published, with publishedAt. _id always does. A server key can ask for drafts: ?status=draft.'
												: 'What comes back. _id always does.'
										}
										guide='api-fields'>
										<Box
											borderWidth='1px'
											borderColor='border.muted'
											borderRadius='md'
											overflow='hidden'>
											<Flex
												px={3}
												py={2}
												gap={3}
												bg='bg.subtle'
												fontSize='12px'
												color='fg.muted'>
												<Text flex={1}>Field</Text>
												<Text w='90px'>Sent back</Text>
												{writes && <Text w='90px'>Written</Text>}
											</Flex>
											{fieldRows.map(f => (
												<Flex
													key={f.key}
													px={3}
													py={2}
													gap={3}
													align='center'
													borderTopWidth='1px'
													borderColor='border.muted'>
													<Box
														flex={1}
														minW={0}>
														<Text
															fontSize='13px'
															truncate>
															{f.label}
															{f.required && (
																<Text
																	as='span'
																	color='fg.muted'>
																	{' '}
																	· required
																</Text>
															)}
														</Text>
														<Text
															fontSize='11.5px'
															fontFamily='mono'
															color='fg.muted'>
															{f.key} · {f.kind}
														</Text>
													</Box>
													<Box w='90px'>
														<Checkbox.Root
															size='sm'
															checked={isOut(f.key)}
															onCheckedChange={() => toggleOut(f.key)}>
															<Checkbox.HiddenInput aria-label={`${f.label} sent back`} />
															<Checkbox.Control />
														</Checkbox.Root>
													</Box>
													{writes && (
														<Box w='90px'>
															{f.kind === 'formula' ? (
																<Text
																	fontSize='11.5px'
																	color='fg.muted'>
																	worked out
																</Text>
															) : (
																<Checkbox.Root
																	size='sm'
																	checked={isWritten(f.key)}
																	onCheckedChange={() => toggleWritten(f.key)}>
																	<Checkbox.HiddenInput aria-label={`${f.label} written`} />
																	<Checkbox.Control />
																</Checkbox.Root>
															)}
														</Box>
													)}
												</Flex>
											))}
										</Box>
										{data.action === 'create' && fieldRows.some(f => f.required && !isWritten(f.key)) && (
											<Text
												fontSize='12.5px'
												color='orange.fg'
												mt={2}>
												A required field isn’t written by calls — creating will fail unless it has a default.
											</Text>
										)}
										{error?.on?.startsWith('fields') && <Text {...errCss}>{error.message}</Text>}
									</Section>
									{(data.action === 'list' || data.action === 'get') && (
										<LinkedRecords
											model={model}
											value={draft.populate}
											onChange={populate => set({ populate })}
											error={error?.on === 'populate' ? error.message : undefined}
										/>
									)}
								</Flex>
							</Tabs.Content>

							{isList && (
								<Tabs.Content value='filters'>
									<Flex
										direction='column'
										gap={4}>
										<Section
											title='Always filtered by'
											hint='On top of the access rules: the list only ever holds these records — “featured is Yes”, “stock is more than 0”.'
											guide='api-filters'>
											<RuleEditor
												model={model}
												value={draft.list.filters}
												onChange={filters => setList({ filters })}
												match='all'
												customer={draft.access.who === 'customer'}
												errorAt={(() => {
													const n = rowOf(error?.on, 'list.filters');
													return n === null ? null : { index: n, message: error!.message };
												})()}
												addLabel='Add a filter'
											/>
										</Section>
										<Section title='What callers can do'>
											<Flex
												align='center'
												justify='space-between'
												gap={3}>
												<Box>
													<Text
														fontSize='13.5px'
														fontWeight='500'>
														Let callers filter, search and sort
													</Text>
													<Text
														fontSize='12px'
														color='fg.muted'>
														Off: the list is exactly as set here — only page, limit and fields are read.
													</Text>
												</Box>
												<Switch.Root
													size='sm'
													checked={draft.list.callerFilters}
													onCheckedChange={x => setList({ callerFilters: !!x.checked })}>
													<Switch.HiddenInput aria-label='Callers can filter' />
													<Switch.Control />
												</Switch.Root>
											</Flex>
											<Flex
												gap={4}
												mt={4}
												wrap='wrap'>
												<Box w={{ base: 'full', sm: '220px' }}>
													<Text {...labelCss}>Order</Text>
													<Dropdown
														size='sm'
														value={draft.list.sort.replace(/^-/, '') || 'createdAt'}
														onChange={(v: string) => setList({ sort: `${draft.list.sort.startsWith('-') || !draft.list.sort ? '-' : ''}${v}` })}
														items={model.sort.map(k => ({
															value: k,
															label: model.fields.find(f => f.key === k)?.label || { createdAt: 'Created', updatedAt: 'Last changed', _id: 'Id', code: 'Code' }[k] || k,
														}))}
													/>
												</Box>
												<Box w={{ base: 'full', sm: '220px' }}>
													<Text {...labelCss}>Direction</Text>
													<Dropdown
														size='sm'
														value={draft.list.sort.startsWith('-') || !draft.list.sort ? 'desc' : 'asc'}
														onChange={(v: string) => setList({ sort: `${v === 'desc' ? '-' : ''}${draft.list.sort.replace(/^-/, '') || 'createdAt'}` })}
														items={[
															{ value: 'desc', label: 'Newest / highest first' },
															{ value: 'asc', label: 'Oldest / lowest first' },
														]}
													/>
												</Box>
												<Box w='120px'>
													<Text {...labelCss}>Page size</Text>
													<Input
														size='sm'
														type='number'
														min={1}
														max={draft.list.maxLimit}
														value={draft.list.limit}
														onChange={e => setList({ limit: Number(e.target.value) || 1 })}
														aria-label='Page size'
													/>
												</Box>
												<Box w='120px'>
													<Text {...labelCss}>Largest page</Text>
													<Input
														size='sm'
														type='number'
														min={1}
														max={100}
														value={draft.list.maxLimit}
														onChange={e => setList({ maxLimit: Math.min(Number(e.target.value) || 1, 100) })}
														aria-label='Largest page'
													/>
												</Box>
											</Flex>
										</Section>
									</Flex>
								</Tabs.Content>
							)}

							<Tabs.Content value='try'>
								<Flex
									direction='column'
									gap={3}>
									{dirty && (
										<Text
											fontSize='12.5px'
											color='orange.fg'>
											Save first — the live API still has the endpoint as it was saved.
										</Text>
									)}
									{draft.access.who !== 'anyone' && (
										<Text
											fontSize='12.5px'
											color='fg.muted'>
											{draft.access.who === 'key'
												? 'Paste a server key from Keys into the token field below.'
												: 'Sign a customer in first — send POST /auth/login in the tester; its token is kept for the next request.'}
										</Text>
									)}
									<ApiTester
										base={base}
										trial={trial}
									/>
								</Flex>
							</Tabs.Content>

							<Tabs.Content value='code'>
								<Section
									title='Call it'
									hint={
										draft.access.who === 'key'
											? 'From your server — keep the key in an environment variable.'
											: draft.access.who === 'customer'
											? 'With the signed-in customer’s token (MintAuth.fetch sends it for you).'
											: 'From any site or app.'
									}
									guide='examples'>
									<ExampleRequest
										base={base}
										e={{
											method: data.method,
											path: data.path,
											summary: data.name,
											customer: draft.access.who === 'customer',
											key: draft.access.who === 'key',
											...(exampleBody && Object.keys(exampleBody).length && { body: exampleBody }),
										}}
									/>
									{draft.access.who === 'customer' && (
										<Box
											as='pre'
											mt={3}
											p={3}
											m={0}
											fontSize='12px'
											fontFamily='mono'
											whiteSpace='pre-wrap'
											bg='bg.subtle'
											borderWidth='1px'
											borderColor='border'
											borderRadius='md'>
											{`// With the sign-in widget on the page:\nconst data = await MintAuth.fetch('${data.path.replace(/^\//, '')}'${
												data.method !== 'GET' ? `, { method: '${data.method}'${exampleBody ? `, body: ${JSON.stringify(exampleBody)}` : ''} }` : ''
											});`}
										</Box>
									)}
								</Section>
							</Tabs.Content>

							<Tabs.Content value='logs'>
								{/* Mounted only while open: it polls when Live is on. */}
								{tab === 'logs' && <ApiLogs endpointId={id} />}
							</Tabs.Content>

							<Tabs.Content value='details'>
								<Section title='Details'>
									<Flex
										direction='column'
										gap={4}>
										<Box>
											<Text {...labelCss}>Name</Text>
											<Input
												size='sm'
												value={draft.name}
												maxLength={80}
												onChange={e => set({ name: e.target.value })}
												aria-label='Name'
											/>
											{error?.on === 'name' && <Text {...errCss}>{error.message}</Text>}
										</Box>
										<Box>
											<Text {...labelCss}>What it’s for</Text>
											<Textarea
												size='sm'
												rows={2}
												maxLength={300}
												value={draft.note}
												onChange={e => set({ note: e.target.value })}
												placeholder='Shown in the reference — “The shop’s product grid”'
												aria-label='Note'
											/>
										</Box>
										<Box>
											<Text {...labelCss}>Address</Text>
											{data.standard ? (
												<Text
													fontSize='12.5px'
													color='fg.muted'>
													<Text
														as='span'
														fontFamily='mono'
														color='fg'>
														{data.path}
													</Text>{' '}
													— a standard endpoint stays at its model’s own address. Make a new endpoint for another one.
												</Text>
											) : (
												<>
													<Input
														size='sm'
														fontFamily='mono'
														value={draft.path}
														onChange={e => set({ path: e.target.value })}
														aria-label='Path'
													/>
													<Text
														fontSize='12px'
														color='fg.muted'
														mt={1}>
														Whatever calls the old address stops working when you change it.
													</Text>
												</>
											)}
											{error?.on === 'path' && <Text {...errCss}>{error.message}</Text>}
										</Box>
										{error && !error.on && <Text {...errCss}>{error.message}</Text>}
									</Flex>
								</Section>
							</Tabs.Content>
						</ConsoleTabs>
					</>
				)}
				{dirty && (
					<Flex
						position='sticky'
						bottom={0}
						zIndex={20}
						borderRadius='lg'
						borderWidth='1px'
						boxShadow='0 -6px 24px rgb(0 0 0 / 0.08)'
						justify='flex-end'
						align='center'
						gap={2}
						px={4}
						py={3}
						bg='bg.panel'
						borderColor='border'>
						<Text
							fontSize='12.5px'
							color='fg.muted'
							mr='auto'>
							Unsaved changes
						</Text>
						<Button
							size='sm'
							variant='outline'
							px={3}
							onClick={() => {
								setDraft(saved);
								setError(null);
							}}>
							Discard
						</Button>
						<Button
							size='sm'
							px={3}
							loading={updating.isLoading}
							onClick={save}>
							Save changes
						</Button>
					</Flex>
				)}
			</Flex>

			<PromptDialog
				open={deleting}
				onClose={() => setDeleting(false)}
				onConfirm={async () => {
					const res = await remove(id);
					if ('data' in res) {
						toaster.create({ type: 'success', title: 'Endpoint deleted' });
						router.push(apiHref('/endpoints'));
					}
				}}
				title={`Delete ${data?.method} ${data?.path}?`}
				description={
					data?.standard
						? 'Calls to it answer Not found from now on. You can generate it again from its model.'
						: 'Calls to it answer Not found from now on. This can’t be undone — turn it off instead to keep it.'
				}
				loading={removing.isLoading}
				confirmLabel='Delete'
			/>
		</Layout>
	);
}

const labelCss: any = { fontSize: '12.5px', fontWeight: '500', mb: 1.5 };
const errCss: any = { fontSize: '12.5px', color: 'red.fg', mt: 1.5 };
