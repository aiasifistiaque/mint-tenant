'use client';

import { FC, Fragment, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, Center, Flex, Input, Link, Skeleton, Text } from '@chakra-ui/react';
import { ChevronDown, ChevronRight, History as HistoryIcon, Search } from 'lucide-react';
import moment from 'moment';
import { Layout, useGetHistoryFacetsQuery, useGetProjectHistoryQuery } from '@/components/library';
import { Dropdown, Panel } from '@/components/library/cl';
import { IS_TENANT_PANEL, pagePath, projectHref } from '@/components/library/config/lib/constants/panel';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { HistoryEntry } from '@/components/library/store/services/tenantApi';

/**
 * A project's History (WO-36; backend routes-tenant/history.router.ts): who
 * created, changed or deleted what — records, models, the public API, the
 * site setup — newest first, by day, with each change's before and after.
 * Each record's own timeline is on its page (the History tab).
 *
 * At /activity because the super-admin panel's /history is its own table.
 */

const PAGE = 50;
const DAY = 24 * 60 * 60 * 1000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

const RANGES = [
	{ value: '', label: 'Any time' },
	{ value: '1', label: 'Today' },
	{ value: '7', label: 'Last 7 days' },
	{ value: '30', label: 'Last 30 days' },
	{ value: '90', label: 'Last 90 days' },
];
const ACTIONS = [
	{ value: '', label: 'Anything' },
	{ value: 'create', label: 'Created' },
	{ value: 'update', label: 'Changed' },
	{ value: 'delete', label: 'Deleted' },
];
const TONE: Record<string, string> = { create: 'green', update: 'orange', delete: 'red' };
const VERB: Record<string, string> = { create: 'Created', update: 'Changed', delete: 'Deleted' };

const dayLabel = (date: string) => {
	const m = moment(date);
	if (m.isSame(moment(), 'day')) return 'Today';
	if (m.isSame(moment().subtract(1, 'day'), 'day')) return 'Yesterday';
	return m.format(m.isSame(moment(), 'year') ? 'dddd, D MMMM' : 'D MMMM YYYY');
};

const initials = (name = '') =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(p => p[0]?.toUpperCase())
		.join('') || '?';

const shown = (v: string) => {
	if (!v || v === 'empty') return '—';
	const plain = /<\/?[a-z][^>]*>/i.test(v) ? v.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : v;
	return plain.length > 160 ? `${plain.slice(0, 160)}…` : plain;
};

/** Where an entry opens: the record (unless deleted), or the project page it's about. */
const hrefOf = (e: HistoryEntry): string | null => {
	if (e.action === 'delete' || !e.document) return null;
	if (e.model === 'Model') return projectHref(`/model-builder/${e.document}`);
	if (e.model === 'Feature') return projectHref('/model-builder/features');
	if (e.model === 'Site setup') return projectHref('/site-setup');
	if (e.model === 'Public API') return projectHref('/public-api');
	return e.modelPath ? pagePath(`${e.modelPath}/${e.document}`) : null;
};

const Entry: FC<{ e: HistoryEntry }> = ({ e }) => {
	const [open, setOpen] = useState(false);
	const href = hrefOf(e);
	const name = e.user?.name || e.userName || 'Someone';
	return (
		<Box
			px={4}
			py={3}
			borderTopWidth='1px'
			borderColor='border.muted'>
			<Flex
				gap={3}
				align='flex-start'>
				<Center
					boxSize='28px'
					borderRadius='full'
					bg='bg.muted'
					fontSize='11px'
					fontWeight='600'
					flexShrink={0}>
					{initials(name)}
				</Center>
				<Box
					flex={1}
					minW={0}>
					<Text
						fontSize='13px'
						lineHeight='1.5'>
						{e.text}
					</Text>
					<Flex
						align='center'
						gap={2}
						mt={1}
						wrap='wrap'
						fontSize='12px'
						color='fg.muted'>
						<Badge
							size='sm'
							variant='subtle'
							colorPalette={TONE[e.action]}>
							{VERB[e.action]}
						</Badge>
						<Text>{e.model}</Text>
						<Text>·</Text>
						<Text title={moment(e.createdAt).format('D MMM YYYY, h:mm:ss A')}>{moment(e.createdAt).format('h:mm A')}</Text>
						{href && (
							<>
								<Text>·</Text>
								<Link
									asChild
									color='fg.muted'
									_hover={{ color: 'fg' }}>
									<NextLink href={href}>Open</NextLink>
								</Link>
							</>
						)}
						{e.changes.length > 0 && (
							<>
								<Text>·</Text>
								<Button
									size='2xs'
									variant='ghost'
									px={1}
									color='fg.muted'
									onClick={() => setOpen(o => !o)}>
									{open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
									{e.changes.length} change{e.changes.length === 1 ? '' : 's'}
								</Button>
							</>
						)}
					</Flex>
					{open && (
						<Box
							mt={2}
							borderWidth='1px'
							borderColor='border.muted'
							borderRadius='md'
							overflow='hidden'>
							{e.changes.map(c => (
								<Flex
									key={c.field}
									gap={3}
									px={3}
									py={1.5}
									fontSize='12.5px'
									borderTopWidth='1px'
									borderColor='border.muted'
									_first={{ borderTopWidth: 0 }}
									wrap={{ base: 'wrap', md: 'nowrap' }}>
									<Text
										fontWeight='600'
										minW='140px'>
										{c.label}
									</Text>
									<Text
										color='fg.muted'
										textDecoration='line-through'
										flex={1}>
										{shown(c.from)}
									</Text>
									<Text flex={1}>{shown(c.to)}</Text>
								</Flex>
							))}
						</Box>
					)}
				</Box>
			</Flex>
		</Box>
	);
};

export default function ActivityPage() {
	const [search, setSearch] = useState('');
	const [typed, setTyped] = useState('');
	const [model, setModel] = useState('');
	const [action, setAction] = useState('');
	const [user, setUser] = useState('');
	const [range, setRange] = useState('');
	const [limit, setLimit] = useState(PAGE);
	const from = range ? iso(new Date(Date.now() - (Number(range) - 1) * DAY)) : '';
	const args = { model, action, user, search, from, limit };
	const { data, isLoading, isFetching, isError } = useGetProjectHistoryQuery(args, { skip: !IS_TENANT_PANEL });
	const { data: facets } = useGetHistoryFacetsQuery(undefined, { skip: !IS_TENANT_PANEL });
	const entries = data?.doc || [];
	const filtered = !!(search || model || action || user || range);

	const models = useMemo(() => [{ value: '', label: 'Everything' }, ...(facets?.models || []).map(m => ({ value: m, label: m }))], [facets]);
	const people = useMemo(() => [{ value: '', label: 'Anyone' }, ...(facets?.people || []).map(p => ({ value: p._id, label: p.name }))], [facets]);
	const reset = (fn: (v: string) => void) => (v: string) => {
		setLimit(PAGE);
		fn(v);
	};

	return (
		<Layout
			title='History'
			path='activity'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				<Flex
					align='center'
					justify='space-between'
					gap={3}
					wrap='wrap'>
					<Box>
						<Text
							fontSize='18px'
							fontWeight='600'>
							History
						</Text>
						<Text
							fontSize='12.5px'
							color='fg.muted'>
							Everything done in this project — records, models, the public API and the site setup.
						</Text>
					</Box>
					<GuideLink section='history' />
				</Flex>

				<Flex
					as='form'
					gap={2}
					wrap='wrap'
					onSubmit={(ev: any) => {
						ev.preventDefault();
						setLimit(PAGE);
						setSearch(typed.trim());
					}}>
					<Flex
						flex='1 1 220px'
						align='center'
						gap={2}
						px={2.5}
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'>
						<Search size={14} />
						<Input
							size='sm'
							border='none'
							px={0}
							placeholder='Search — a name, a code, a word'
							value={typed}
							onChange={e => setTyped(e.target.value)}
							onBlur={() => typed.trim() !== search && (setLimit(PAGE), setSearch(typed.trim()))}
						/>
					</Flex>
					{[
						{ value: model, set: setModel, items: models, w: '170px' },
						{ value: action, set: setAction, items: ACTIONS, w: '140px' },
						{ value: user, set: setUser, items: people, w: '170px' },
						{ value: range, set: setRange, items: RANGES, w: '150px' },
					].map((f, i) => (
						<Box
							key={i}
							w={{ base: 'calc(50% - 4px)', md: f.w }}>
							<Dropdown
								size='sm'
								value={f.value}
								onChange={reset(f.set)}
								items={f.items}
							/>
						</Box>
					))}
				</Flex>

				<Panel
					flush
					title={data ? `${data.totalDocs.toLocaleString()} ${data.totalDocs === 1 ? 'entry' : 'entries'}` : 'Entries'}
					subtitle={filtered ? 'Filtered' : 'Newest first'}>
					{isLoading ? (
						<Box p={4}>
							<Skeleton h='240px' />
						</Box>
					) : isError ? (
						<Text
							p={4}
							fontSize='13px'
							color='red.fg'>
							History couldn’t be loaded — your role needs Records: View.
						</Text>
					) : entries.length ? (
						entries.map((e, i) => (
							<Fragment key={e._id}>
								{(i === 0 || !moment(e.createdAt).isSame(entries[i - 1].createdAt, 'day')) && (
									<Text
										px={4}
										pt={4}
										pb={1}
										fontSize='11.5px'
										fontWeight='600'
										color='fg.muted'
										textTransform='uppercase'
										letterSpacing='0.04em'
										borderTopWidth={i === 0 ? 0 : '1px'}
										borderColor='border.muted'>
										{dayLabel(e.createdAt)}
									</Text>
								)}
								<Entry e={e} />
							</Fragment>
						))
					) : (
						<Flex
							direction='column'
							align='center'
							gap={2}
							py={12}
							color='fg.muted'>
							<HistoryIcon size={20} />
							<Text fontSize='13px'>{filtered ? 'Nothing matches these filters.' : 'Nothing has happened in this project yet.'}</Text>
						</Flex>
					)}
					{data && entries.length < data.totalDocs && (
						<Flex
							justify='center'
							p={3}
							borderTopWidth='1px'
							borderColor='border.muted'>
							<Button
								size='sm'
								variant='outline'
								loading={isFetching}
								onClick={() => setLimit(l => l + PAGE)}>
								Show more
							</Button>
						</Flex>
					)}
				</Panel>
			</Flex>
		</Layout>
	);
}
