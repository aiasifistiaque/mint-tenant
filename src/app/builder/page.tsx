'use client';

import { ReactNode, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Flex, Link, SegmentGroup, Text } from '@chakra-ui/react';
import { BookOpen, Boxes, ExternalLink } from 'lucide-react';
import { Layout, useGetBuilderRoutesQuery, useSetBuilderStateMutation } from '@/components/library';
import { toaster } from '@/components/ui/toaster';
import {
	Column,
	ConfirmAction,
	DataTable,
	EmptyState,
	ErrorState,
	FilterInput,
	PageHeader,
	Panel,
	SortDir,
	StatusDot,
	TableSkeleton,
	when,
} from '@/components/library/cl';
import { HOME, docsPath, projectHref } from '@/components/library/config/lib/constants/panel';
import { AREAS, AreaIcon, AreaTabLabel } from './_components/areas';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';

type Row = {
	route: string;
	title: string | null;
	model: string | null;
	kind: 'generic' | 'resource' | 'custom';
	protected: boolean;
	/** Built in the model builder rather than in code. */
	built?: boolean;
	settings: State | null;
	config: State | null;
};
type State = {
	version: number;
	publishedAt: string | null;
	hasDraft: boolean;
	draftUpdatedAt: string | null;
	source: 'inherit' | 'db' | 'code';
	serving: 'db' | 'code';
};

const KIND_LABEL: Record<Row['kind'], string> = {
	generic: 'Table page',
	resource: 'API only',
	custom: 'Custom page',
};

const KIND_HINT: Record<Row['kind'], string> = {
	generic: 'A table of records with its form and a page per record — all arranged here',
	resource: 'Built by defineRoutes; its admin page is hand-written',
	custom: 'Hand-written route; only its filters are configurable',
};

/** A project's model names carry the project's id (T<id>_Invoice); people know it as Invoice. */
const modelLabel = (model: string | null) => String(model || '').replace(/^T[0-9a-f]{24}_/, '') || '—';

/** One status for a page in a project: live (and which version), or not published yet — and a waiting draft. */
const StatusCell = ({ r }: { r: Row }): ReactNode => {
	const v = r.config?.version || r.settings?.version || 0;
	const draft = r.config?.hasDraft || r.settings?.hasDraft;
	return (
		<Flex
			gap={2}
			align='center'>
			<StatusDot
				tone={v ? 'running' : 'idle'}
				label={v ? `Published · version ${v}` : 'Starting setup'}
				title={v ? 'Runs on what was last published' : 'Not changed in the builder yet'}
			/>
			{draft && (
				<Badge
					size='xs'
					colorPalette='orange'
					variant='subtle'>
					Draft waiting
				</Badge>
			)}
		</Flex>
	);
};

/** Where a file comes from right now: code, a published version, a draft on top. */
const StateCell = ({ state, na }: { state: State | null; na?: boolean }): ReactNode => {
	if (na)
		return (
			<Text
				fontSize='xs'
				color='fg.subtle'>
				—
			</Text>
		);
	const pinned = state?.source && state.source !== 'inherit';
	return (
		<Flex
			gap={1.5}
			align='center'>
			{state?.serving === 'db' ? (
				<Text
					fontSize='xs'
					fontFamily='mono'
					color='green.fg'>
					DB v{state.version}
				</Text>
			) : (
				<Text
					fontSize='xs'
					color='fg.muted'>
					Code{state?.version ? ` (v${state.version} unused)` : ''}
				</Text>
			)}
			{pinned && (
				<Badge
					size='xs'
					variant='outline'
					title='This route ignores the global switch'>
					pinned
				</Badge>
			)}
			{state?.hasDraft && (
				<Badge
					size='xs'
					colorPalette='orange'
					variant='subtle'>
					Draft
				</Badge>
			)}
		</Flex>
	);
};

/** What each sortable column sorts by. Blanks sort last in either direction. */
const lastPublished = (r: Row) => [r.settings?.publishedAt, r.config?.publishedAt].filter(Boolean).sort().pop() || '';
const SORT_VALUE: Record<string, (r: Row) => string> = {
	route: r => (r.title || r.route).toLowerCase(),
	model: r => modelLabel(r.model).toLowerCase(),
	kind: r => KIND_LABEL[r.kind],
	published: lastPublished,
};

const FILTERS = [
	{ value: 'all', label: 'All' },
	{ value: 'drafts', label: 'With drafts' },
	{ value: 'generic', label: 'Table pages' },
];

/**
 * Every admin route the builder can configure. A route runs on its published
 * DB copy when it has one and on its code files otherwise; this is where to
 * see which, and whether an unpublished draft is waiting.
 */
const BuilderPage = () => {
	const router = useRouter();
	const { data, isLoading, isError, error, refetch } = useGetBuilderRoutesQuery();
	const [search, setSearch] = useState('');
	const [show, setShow] = useState('all');
	const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: 'route', dir: 'asc' });
	const [pending, setPending] = useState<null | { kind: 'settings' | 'config'; to: 'db' | 'code' }>(null);
	const [setState, { isLoading: switching }] = useSetBuilderStateMutation();
	const global = data?.global || { settings: 'db', config: 'db' };

	const applySwitch = async () => {
		if (!pending) return;
		try {
			await setState({ [pending.kind]: pending.to }).unwrap();
			toaster.create({
				title: `All routes: ${pending.kind} from ${pending.to === 'db' ? 'the DB copies' : 'the code files'}`,
				description: 'Live now. Pinned routes are unaffected.',
				type: 'success',
			});
		} catch (e: any) {
			toaster.create({ title: 'Could not switch', description: e?.data?.message, type: 'error' });
		}
		setPending(null);
	};

	const rows: Row[] = useMemo(() => {
		const q = search.trim().toLowerCase();
		const value = SORT_VALUE[sort.key];
		const dir = sort.dir === 'asc' ? 1 : -1;
		return (data?.doc || [])
			.filter((r: Row) => {
				if (show === 'drafts' && !r.settings?.hasDraft && !r.config?.hasDraft) return false;
				if (show === 'generic' && r.kind !== 'generic') return false;
				if (!q) return true;
				return [r.route, r.title, r.model].some(v => v?.toLowerCase().includes(q));
			})
			.sort((a: Row, b: Row) => {
				const x = value(a);
				const y = value(b);
				if (!x || !y) return x === y ? 0 : x ? -1 : 1;
				return x.localeCompare(y) * dir || a.route.localeCompare(b.route);
			});
	}, [data, search, show, sort]);

	const onSort = (key: string) =>
		setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'published' ? 'desc' : 'asc' }));

	const drafts = (data?.doc || []).filter((r: Row) => r.settings?.hasDraft || r.config?.hasDraft).length;

	const columns: Column<Row>[] = [
		{
			key: 'route',
			label: IS_TENANT_PANEL ? 'Page' : 'Route',
			sortable: true,
			render: r => (
				<Flex
					align='center'
					gap={3}
					minW={0}>
					<AreaIcon area={r.kind === 'generic' ? 'table' : 'overview'} />
					<Flex
						direction='column'
						minW={0}>
						<Text
							fontSize='sm'
							fontWeight='600'>
							{r.title || r.route}
						</Text>
						<Text
							fontSize='xs'
							color='fg.muted'
							fontFamily='mono'>
							/{r.route}
						</Text>
					</Flex>
				</Flex>
			),
		},
		{
			key: 'model',
			label: 'Model',
			sortable: true,
			render: r => (
				<Text
					fontSize='sm'
					fontFamily='mono'>
					{modelLabel(r.model)}
				</Text>
			),
		},
		{
			key: 'kind',
			label: 'Type',
			sortable: true,
			render: r => (
				<Flex
					gap={1.5}
					align='center'
					title={KIND_HINT[r.kind]}>
					<Text fontSize='sm'>{KIND_LABEL[r.kind]}</Text>
					{r.built && (
						<Badge
							size='xs'
							colorPalette='purple'
							variant='subtle'
							title='Built in the model builder — its fields are edited there'>
							Built model
						</Badge>
					)}
					{r.protected && (
						<Badge
							size='xs'
							variant='outline'
							title='Settings stay as in code: this route controls access'>
							Locked settings
						</Badge>
					)}
				</Flex>
			),
		},
		// Projects have no code files: one status says it all there.
		...(IS_TENANT_PANEL
			? [{ key: 'status', label: 'Status', render: (r: Row) => <StatusCell r={r} /> }]
			: [
					{
						key: 'settings',
						label: 'Settings',
						render: (r: Row) => (
							<StateCell
								state={r.settings}
								na={r.kind === 'custom'}
							/>
						),
					},
					{ key: 'config', label: 'Config', render: (r: Row) => <StateCell state={r.config} /> },
			  ]),
		{
			key: 'published',
			label: 'Last published',
			sortable: true,
			render: r => {
				const at = lastPublished(r);
				return (
					<Text
						fontSize='xs'
						color='fg.muted'>
						{at ? when(at) : '—'}
					</Text>
				);
			},
		},
	];

	return (
		<Layout
			title={IS_TENANT_PANEL ? 'Pages' : 'Routes'}
			path='builder'>
			<Flex
				direction='column'
				gap={5}
				pb={10}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: projectHref('/builder'), title: IS_TENANT_PANEL ? 'Pages' : 'Routes' },
					]}
					title={IS_TENANT_PANEL ? 'Pages' : 'Routes'}
					meta={
						data
							? `${data.doc.length} ${IS_TENANT_PANEL ? 'pages' : 'admin routes'}${drafts ? ` · ${drafts} with unpublished drafts` : ''} · changes go live when published`
							: 'The table, form and record page of every route'
					}
					actions={
						<Button
							size='sm'
							variant='outline'
							onClick={() => router.push(projectHref('/model-builder'))}>
							<Boxes size={14} />
							Models
						</Button>
					}
				/>

				<Flex
					align={{ base: 'flex-start', md: 'center' }}
					justify='space-between'
					direction={{ base: 'column', md: 'row' }}
					gap={3}>
					{IS_TENANT_PANEL ? (
						<Flex
							direction='column'
							gap={2}
							maxW='760px'>
							<Text
								fontSize='sm'
								color='fg.muted'>
								Each of your models has pages here: a <b>table</b> of its records, the <b>form</b> to add and edit
								them, and a <b>page for each record</b>. Open one to arrange them — preview as you go, save a draft,
								then publish when it’s ready.
							</Text>
							<Flex
								gap={2}
								flexWrap='wrap'>
								{(['table', 'form', 'view', 'filters'] as const).map(k => (
									<Flex
										key={k}
										align='center'
										px={2.5}
										py={1}
										borderRadius='full'
										bg={`${AREAS[k].palette}.subtle`}
										color={`${AREAS[k].palette}.fg`}
										fontSize='xs'
										fontWeight='500'>
										<AreaTabLabel area={k} />
									</Flex>
								))}
							</Flex>
						</Flex>
					) : (
						<Text
							fontSize='sm'
							color='fg.muted'
							maxW='720px'>
							Every admin route runs on a settings file (fields, validation, what can be edited) and a config file
							(table, filters, form, view). The builder keeps a copy of both in the database, so a route can be
							changed here — saved as a draft, then published — without a deploy. The code files stay as the
							fallback.
						</Text>
					)}
					<Link
						href={docsPath('/docs/builder')}
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
						How the builder works
						<ExternalLink size={12} />
					</Link>
				</Flex>

				{/* Projects have no code files: every route runs on its DB copy (multi-tenancy). */}
				{!IS_TENANT_PANEL && (
					<Panel
						title='Source for every route'
						subtitle='Whether routes run on their published DB copies or on the code files. A route can pin its own choice. Routes without a published copy always use code.'>
						<Flex
							gap={6}
							flexWrap='wrap'>
							{(['settings', 'config'] as const).map(kind => (
								<Flex
									key={kind}
									align='center'
									gap={3}>
									<Text
										fontSize='sm'
										fontWeight='500'
										w='64px'>
										{kind === 'settings' ? 'Settings' : 'Config'}
									</Text>
									<SegmentGroup.Root
										size='sm'
										disabled={!data || switching}
										value={global[kind]}
										onValueChange={e => e.value && e.value !== global[kind] && setPending({ kind, to: e.value as any })}>
										<SegmentGroup.Indicator />
										<SegmentGroup.Items
											items={[
												{ value: 'db', label: 'DB copies' },
												{ value: 'code', label: 'Code files' },
											]}
										/>
									</SegmentGroup.Root>
								</Flex>
							))}
						</Flex>
					</Panel>
				)}

				<Panel flush>
					<Flex
						gap={3}
						align='center'
						flexWrap='wrap'
						px={4}
						py={3}
						borderBottomWidth='1px'
						borderColor='border.muted'>
						<FilterInput
							value={search}
							onChange={setSearch}
							placeholder={IS_TENANT_PANEL ? 'Search pages and models…' : 'Search routes, titles, models…'}
						/>
						<SegmentGroup.Root
							size='xs'
							value={show}
							onValueChange={e => setShow(e.value || 'all')}>
							<SegmentGroup.Indicator />
							<SegmentGroup.Items items={FILTERS} />
						</SegmentGroup.Root>
					</Flex>
					{isLoading ? (
						<TableSkeleton
							rows={8}
							cols={6}
						/>
					) : isError ? (
						<ErrorState
							error={error}
							onRetry={refetch}
						/>
					) : rows.length === 0 ? (
						<EmptyState
							title='No routes match'
							description='Clear the search or switch back to All.'
						/>
					) : (
						<DataTable
							columns={columns}
							rows={rows}
							rowKey={r => r.route}
							sortKey={sort.key}
							sortDir={sort.dir}
							onSort={onSort}
							onRowClick={r => router.push(projectHref(`/builder/${r.route}`))}
						/>
					)}
				</Panel>
			</Flex>

			<ConfirmAction
				isOpen={!!pending}
				onClose={() => setPending(null)}
				onConfirm={applySwitch}
				isLoading={switching}
				title={`Switch every route's ${pending?.kind} to ${pending?.to === 'db' ? 'the DB copies' : 'the code files'}?`}
				consequence={
					pending?.to === 'code'
						? `Every route that follows the global switch stops using its published ${pending?.kind} and runs on its code file, straight away. Nothing is deleted — switch back to DB to restore them.`
						: `Every route that follows the global switch runs on its published ${pending?.kind} again, straight away. Routes without a published copy stay on code.`
				}
				confirmLabel='Switch'
				destructive={pending?.to === 'code'}
			/>
		</Layout>
	);
};

export default BuilderPage;
