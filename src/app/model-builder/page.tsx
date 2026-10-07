'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Flex, Link, Text } from '@chakra-ui/react';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { BookOpen, ExternalLink, Plug, Plus, Sparkles } from 'lucide-react';
import { Layout, useGetBuiltModelsQuery } from '@/components/library';
import {
	Column,
	DataTable,
	EmptyState,
	ErrorState,
	FilterInput,
	PageHeader,
	Panel,
	SortDir,
	TableSkeleton,
	when,
} from '@/components/library/cl';
import { docsPath } from '@/components/library/config/lib/constants/panel';

type Row = {
	_id: string;
	title: string;
	name: string;
	route: string;
	fields: any[];
	code?: { enabled?: boolean; prefix?: string };
	active?: boolean;
	records: number | null;
	error: string | null;
	updatedAt: string;
};

const SORT_VALUE: Record<string, (r: Row) => string | number> = {
	title: r => r.title.toLowerCase(),
	route: r => r.route,
	records: r => r.records ?? -1,
	updated: r => r.updatedAt || '',
};

/**
 * The models built in the model builder. Each is a real Mongoose model with
 * its own admin route and page; this is where they're created and changed.
 */
const ModelBuilderPage = () => {
	const router = useRouter();
	const { data, isLoading, isError, error, refetch } = useGetBuiltModelsQuery();
	const [search, setSearch] = useState('');
	const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: 'title', dir: 'asc' });

	const rows: Row[] = useMemo(() => {
		const q = search.trim().toLowerCase();
		const value = SORT_VALUE[sort.key];
		const dir = sort.dir === 'asc' ? 1 : -1;
		return (data?.doc || [])
			.filter((r: Row) => !q || [r.title, r.name, r.route].some(v => v?.toLowerCase().includes(q)))
			.sort((a: Row, b: Row) => {
				const x = value(a);
				const y = value(b);
				return (typeof x === 'number' ? x - (y as number) : String(x).localeCompare(String(y))) * dir;
			});
	}, [data, search, sort]);

	const onSort = (key: string) =>
		setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'title' || key === 'route' ? 'asc' : 'desc' }));

	const columns: Column<Row>[] = [
		{
			key: 'title',
			label: 'Model',
			sortable: true,
			render: r => (
				<Flex
					direction='column'
					minW={0}>
					<Text
						fontSize='sm'
						fontWeight='600'>
						{r.title}
					</Text>
					<Text
						fontSize='xs'
						color='fg.muted'
						fontFamily='mono'>
						{r.name}
					</Text>
				</Flex>
			),
		},
		{
			key: 'route',
			label: 'Route',
			sortable: true,
			render: r => (
				<Text
					fontSize='sm'
					fontFamily='mono'>
					/{r.route}
				</Text>
			),
		},
		{
			key: 'fields',
			label: 'Fields',
			numeric: true,
			render: r => <Text fontSize='sm'>{r.fields?.length || 0}</Text>,
		},
		{
			key: 'code',
			label: 'Code',
			render: r => (
				<Text
					fontSize='xs'
					fontFamily='mono'
					color={r.code?.enabled ? 'fg' : 'fg.subtle'}>
					{r.code?.enabled ? `${r.code.prefix ? `${r.code.prefix}-` : ''}0001` : '—'}
				</Text>
			),
		},
		{
			key: 'records',
			label: 'Records',
			numeric: true,
			sortable: true,
			render: r => <Text fontSize='sm'>{r.records ?? '—'}</Text>,
		},
		{
			key: 'status',
			label: 'Status',
			render: r =>
				r.error ? (
					<Badge
						size='xs'
						colorPalette='red'
						variant='subtle'
						title={r.error}>
						Not registered
					</Badge>
				) : r.active === false ? (
					<Badge
						size='xs'
						variant='outline'>
						Disabled
					</Badge>
				) : (
					<Text
						fontSize='xs'
						color='green.fg'>
						Live
					</Text>
				),
		},
		{
			key: 'updated',
			label: 'Updated',
			sortable: true,
			render: r => (
				<Text
					fontSize='xs'
					color='fg.muted'>
					{when(r.updatedAt)}
				</Text>
			),
		},
	];

	return (
		<Layout
			title='Models'
			path='model-builder'>
			<Flex
				direction='column'
				gap={5}
				pb={10}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '/builder', title: 'Routes' },
						{ href: '/model-builder', title: 'Models' },
					]}
					title='Models'
					meta={data ? `${data.doc.length} built model${data.doc.length === 1 ? '' : 's'}` : 'Database models built here instead of in code'}
					actions={
						<Flex
							gap={2}
							flexWrap='wrap'>
							<Button
								size='sm'
								variant='ghost'
								onClick={() => router.push('/model-builder/connect')}>
								<Plug size={14} />
								Connect your AI
							</Button>
							{/* Planned by the platform's AI; projects connect their own instead (docs/multi-tenancy D10). */}
							{!IS_TENANT_PANEL && (
								<Button
									size='sm'
									variant='outline'
									onClick={() => router.push('/model-builder/features/new')}>
									<Sparkles size={14} />
									Build a feature
								</Button>
							)}
							<Button
								size='sm'
								onClick={() => router.push('/model-builder/new')}>
								<Plus size={14} />
								New model
							</Button>
						</Flex>
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
						Build a database model from fields, without code. Saving registers it with Mongoose under a free name,
						gives it an admin route with a table, form, filters and detail page, and makes it available to link to
						from any other model. Fine-tune its pages in the route builder like any other route.
					</Text>
					<Link
						href={docsPath('/docs/builder#models')}
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
						How the model builder works
						<ExternalLink size={12} />
					</Link>
				</Flex>

				<Panel flush>
					<Flex
						gap={3}
						align='center'
						px={4}
						py={3}
						borderBottomWidth='1px'
						borderColor='border.muted'>
						<FilterInput
							value={search}
							onChange={setSearch}
							placeholder='Search models, names, routes…'
						/>
					</Flex>
					{isLoading ? (
						<TableSkeleton
							rows={5}
							cols={7}
						/>
					) : isError ? (
						<ErrorState
							error={error}
							onRetry={refetch}
						/>
					) : rows.length === 0 ? (
						<EmptyState
							title={data?.doc?.length ? 'No models match' : 'No models yet'}
							description={
								data?.doc?.length ? 'Clear the search.' : 'Create one — it gets its own admin page as soon as it’s saved.'
							}
						/>
					) : (
						<DataTable
							columns={columns}
							rows={rows}
							rowKey={r => r._id}
							sortKey={sort.key}
							sortDir={sort.dir}
							onSort={onSort}
							onRowClick={r => router.push(`/model-builder/${r._id}`)}
						/>
					)}
				</Panel>
			</Flex>
		</Layout>
	);
};

export default ModelBuilderPage;
