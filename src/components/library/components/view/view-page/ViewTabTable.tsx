'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Button, Center, Flex, Grid, Image, Input, InputGroup, Spinner, Text } from '@chakra-ui/react';
import { ImageOff, Plus, Search, X } from 'lucide-react';
import { useGetConfigQuery, useGetViewTabQuery } from '../../../store';
import { BackendCreateModal } from '../../../modals';
import { defaultAddLabel } from './addLabel';
import Panel from '../../../cl/Panel';
import DataTable from '../../../cl/DataTable';
import { EmptyState, ErrorState, TableSkeleton } from '../../../cl/States';
import { cellNode, cellText, firstImage, isImageKind } from './cells';
import { pagePath, projectHref } from '../../../config/lib/constants/panel';

/**
 * One tab of a view page after Overview: the records of another route linked
 * to this one, as configured in the route builder's view tabs — a table or
 * cards, a page at a time, with a search box. Each record opens its own view
 * page. Images show as images.
 */

type Props = {
	/** This record's route and id. */
	path: string;
	id: string;
	/** The tab's position in the route's `viewTabs`. */
	index: number;
	title: string;
};

const useDebounced = (value: string, ms = 300) => {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
};

const Cards: FC<{ columns: any[]; rows: any[]; onOpen: (r: any) => void }> = ({ columns, rows, onOpen }) => {
	const imageCol = columns.find(c => isImageKind(c.kind));
	const [headCol, ...rest] = columns.filter(c => c !== imageCol);
	return (
		<Grid
			templateColumns='repeat(auto-fill, minmax(220px, 1fr))'
			gap={3}
			p={4}>
			{rows.map(r => {
				const src = imageCol && firstImage(r[imageCol.key]);
				return (
					<Box
						key={r._id}
						role='link'
						tabIndex={0}
						cursor='pointer'
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						overflow='hidden'
						bg='bg'
						transition='border-color 0.15s, box-shadow 0.15s'
						_hover={{ borderColor: 'border.emphasized', boxShadow: 'sm' }}
						onClick={() => onOpen(r)}
						onKeyDown={e => e.key === 'Enter' && onOpen(r)}>
						{imageCol &&
							(src ? (
								<Image
									src={src}
									alt=''
									w='full'
									h='150px'
									objectFit='cover'
									bg='bg.muted'
									loading='lazy'
								/>
							) : (
								<Center
									h='150px'
									bg='bg.muted'
									color='fg.subtle'>
									<ImageOff size={20} />
								</Center>
							))}
						<Box p={3}>
							{headCol && (
								<Text
									fontSize='sm'
									fontWeight='600'
									truncate
									mb={rest.length ? 1.5 : 0}>
									{cellText(r[headCol.key])}
								</Text>
							)}
							{rest.map(c => (
								<Flex
									key={c.key}
									gap={2}
									fontSize='xs'
									align='center'
									minH='20px'>
									<Text
										color='fg.muted'
										flexShrink={0}>
										{c.label}
									</Text>
									<Box
										minW={0}
										ml='auto'
										textAlign='right'
										css={{ '& p': { fontSize: 'xs' } }}>
										{isImageKind(c.kind) ? cellNode(r[c.key], c.kind) : <Text truncate>{cellText(r[c.key])}</Text>}
									</Box>
								</Flex>
							))}
						</Box>
					</Box>
				);
			})}
		</Grid>
	);
};

/**
 * Disabled, with the reason on hover, for someone without create permission on
 * the tab's route — the button still says what the tab can do. Also muted on a
 * tab that reaches its records through another route (a client's documents,
 * through its projects): a new one would need one of those picked.
 */
const AddButton: FC<{
	label: string;
	allowed: boolean;
	ready: boolean;
	name: string;
	path: string;
	fields: any[];
	defaults: Record<string, any>;
	/** Set on a tab through another route: why the button is muted. */
	reason?: string;
}> = ({ label, allowed, ready, name, path, fields, defaults, reason }) => {
	const button = (
		<Button
			size='xs'
			disabled={!allowed || !ready}>
			<Plus size={14} />
			{label}
		</Button>
	);
	// A disabled button gets no pointer events, so the reason sits on a wrapper.
	if (!allowed)
		return (
			<Box
				as='span'
				display='inline-flex'
				cursor='not-allowed'
				title={reason || `You don’t have permission to add ${name.toLowerCase()}`}>
				{button}
			</Box>
		);
	if (!ready) return button;
	return (
		<BackendCreateModal
			type='post'
			path={path}
			data={fields}
			defaults={defaults}
			title={label}
			// Refreshes this tab's rows and the record's tab counts.
			invalidate={['config']}
			trigger={button}
		/>
	);
};

const ViewTabTable: FC<Props> = ({ path, id, index, title }) => {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [typed, setTyped] = useState('');
	const search = useDebounced(typed.trim());
	useEffect(() => setPage(1), [search]);

	const { data, isLoading, isFetching, isError, error, refetch } = useGetViewTabQuery({
		path,
		id,
		index,
		page,
		...(search && { search }),
	});

	// The add button (route builder: the tab's "Add button"). Its form is the
	// related route's own create form, with the link to this record filled in
	// and its field hidden — on this page that link is already decided.
	const add = data?.allowed === false ? null : data?.add;
	const { data: config } = useGetConfigQuery(data?.route, { skip: !add?.allowed });
	const addFields = useMemo(
		() =>
			(Array.isArray(config?.form) ? config.form : []).map((f: any) =>
				f?.name === add?.field ? { ...f, isRequired: false, renderCondition: () => false } : f
			),
		[config, add?.field]
	);

	if (isLoading)
		return (
			<Panel flush>
				<Box p={4}>
					<TableSkeleton
						rows={5}
						cols={3}
					/>
				</Box>
			</Panel>
		);

	if (isError)
		return (
			<ErrorState
				error={error}
				onRetry={refetch}
			/>
		);

	const rows: any[] = data?.rows || [];
	const columns: any[] = data?.columns || [];
	const total: number = data?.total || 0;
	const limit: number = data?.limit || rows.length || 1;
	const totalPages: number = data?.totalPages || 1;
	const from = total ? (page - 1) * limit + 1 : 0;
	const to = Math.min(total, (page - 1) * limit + rows.length);
	const name = data?.title || title;
	const open = (r: any) => router.push(projectHref(`/view/${data.route}/${r._id}`));

	if (data?.allowed === false)
		return (
			<Panel
				title={name}
				subtitle={data?.description || undefined}>
				<Text
					fontSize='sm'
					color='fg.muted'>
					You don’t have access to {name.toLowerCase()}. Ask an admin for view permission on it.
				</Text>
			</Panel>
		);

	return (
		<Panel
			flush
			title={name}
			subtitle={data?.description || undefined}
			actions={
				<Flex
					align='center'
					gap={3}>
					<Link href={pagePath(data?.route)}>
						<Text
							fontSize='xs'
							color='fg.muted'
							_hover={{ color: 'fg' }}>
							Open {name} →
						</Text>
					</Link>
					{add && (
						<AddButton
							label={add.label || defaultAddLabel(name)}
							allowed={add.allowed}
							ready={addFields.length > 0}
							name={name}
							path={data.route}
							fields={addFields}
							// The tab's "is" conditions too: "Add bill" on Due bills adds a due bill.
							defaults={{ ...(add.defaults || {}), [add.field]: add.many ? [id] : id }}
							reason={
								add.nested
									? `These ${name.toLowerCase()} belong to this record’s ${add.via} — add one from one of those, where it’s linked for you`
									: undefined
							}
						/>
					)}
				</Flex>
			}>
			<Flex
				align='center'
				gap={3}
				px={4}
				py={2.5}
				borderBottomWidth='1px'
				borderColor='border.muted'>
				<InputGroup
					maxW='320px'
					startElement={<Search size={14} />}
					endElement={
						typed ? (
							<Box
								as='button'
								aria-label='Clear search'
								color='fg.muted'
								_hover={{ color: 'fg' }}
								onClick={() => setTyped('')}>
								<X size={14} />
							</Box>
						) : isFetching && search ? (
							<Spinner size='xs' />
						) : undefined
					}>
					<Input
						size='sm'
						placeholder={`Search ${name.toLowerCase()}`}
						value={typed}
						onChange={e => setTyped(e.target.value)}
					/>
				</InputGroup>
				<Text
					fontSize='xs'
					color='fg.muted'
					ml='auto'
					flexShrink={0}>
					{search
						? `${total.toLocaleString()} match${total === 1 ? '' : 'es'}`
						: `${total.toLocaleString()} record${total === 1 ? '' : 's'}`}
				</Text>
			</Flex>

			{rows.length === 0 ? (
				<Box p={4}>
					<EmptyState
						title={search ? `Nothing matches “${search}”` : `No ${name.toLowerCase()} yet`}
						description={search ? 'Try another word, or clear the search.' : 'Records linked to this one show up here.'}
					/>
				</Box>
			) : (
				<Box opacity={isFetching ? 0.6 : 1}>
					{data?.display === 'cards' ? (
						<Cards
							columns={columns}
							rows={rows}
							onOpen={open}
						/>
					) : (
						<DataTable
							columns={columns.map((c: any) => ({
								key: c.key,
								label: c.label,
								numeric: c.kind === 'number',
								width: isImageKind(c.kind) ? '72px' : undefined,
								render: (r: any) => cellNode(r[c.key], c.kind),
							}))}
							rows={rows}
							rowKey={(r: any) => r._id}
							onRowClick={open}
						/>
					)}
					{totalPages > 1 && (
						<Flex
							align='center'
							justify='space-between'
							px={4}
							py={2.5}
							borderTopWidth='1px'
							borderColor='border.muted'>
							<Text
								fontSize='xs'
								color='fg.muted'>
								{from}–{to} of {total.toLocaleString()}
							</Text>
							<Flex gap={2}>
								<Button
									size='xs'
									variant='outline'
									disabled={page <= 1 || isFetching}
									onClick={() => setPage(p => p - 1)}>
									Previous
								</Button>
								<Button
									size='xs'
									variant='outline'
									disabled={page >= totalPages || isFetching}
									onClick={() => setPage(p => p + 1)}>
									Next
								</Button>
							</Flex>
						</Flex>
					)}
				</Box>
			)}
		</Panel>
	);
};

export default ViewTabTable;
