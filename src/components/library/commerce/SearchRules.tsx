'use client';

import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge, Box, Button, Field, Flex, Grid, Input, Skeleton, Switch, Text } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { DataTable, Dropdown, EmptyState, Panel, type Column } from '../cl';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton, PromptDialog, VDataMenu, VDataTags } from '..';
import GuideLink from '../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { projectHref } from '../config/lib/constants/panel';
import { useDeleteByIdMutation, useGetAllQuery, usePostMutation, useUpdateByIdMutation } from '../store/services/commonApi';
import {
	useGetCommerceSettingsQuery,
	useGetStoreSearchRulesTouchingQuery,
	usePreviewStoreSearchRuleMutation,
	type StoreSearchCard,
	type StoreSearchRulePreview,
	type StoreSearchRuleTouching,
} from '../store/services/commerceApi';
import { help } from './sections';

/**
 * Store → Search rules (backend docs/search SI13, SI-15): what a search or a category page shows first, lower down or
 * not at all. A rule reads as a sentence — "When a search is exactly ‘dress’, pin these products" — and the editor shows
 * the store's real results without it and with it as you change it. Rules apply hide, show only, pin, then boost / bury;
 * pins and boosts give way to a sort the shopper picks.
 */

const WHEN = [
	{ value: 'exact', label: 'a search is exactly' },
	{ value: 'contains', label: 'a search contains' },
	{ value: 'category', label: 'a category page is' },
	{ value: 'always', label: 'anyone searches or opens a category' },
];
const ACTIONS = [
	{ value: 'pin', label: 'pin these products at the top' },
	{ value: 'boost', label: 'boost — show higher' },
	{ value: 'bury', label: 'bury — show lower' },
	{ value: 'hide', label: 'hide' },
	{ value: 'filter', label: 'show only' },
];
const STRENGTH: Record<string, { value: string; label: string }[]> = {
	boost: [
		{ value: '1.5', label: 'a little (×1.5)' },
		{ value: '2', label: 'clearly (×2)' },
		{ value: '3', label: 'a lot (×3)' },
	],
	bury: [
		{ value: '0.5', label: 'clearly (×0.5)' },
		{ value: '0.2', label: 'a lot (×0.2)' },
	],
};
const ACTION_WORD: Record<string, string> = { pin: 'Pin', boost: 'Boost', bury: 'Bury', hide: 'Hide', filter: 'Show only' };
const ACTION_TONE: Record<string, string> = { pin: 'purple', boost: 'green', bury: 'orange', hide: 'red', filter: 'blue' };

type Rule = {
	_id?: string;
	name?: string;
	when: string;
	queries: string[];
	category?: string;
	action: string;
	products: string[];
	brands: string[];
	categories: string[];
	collections: string[];
	onSale: boolean;
	strength?: string;
	active: boolean;
	startsAt?: string;
	endsAt?: string;
	hits?: number;
};

const ids = (v: any): string[] => (Array.isArray(v) ? v : v ? [v] : []).map((x: any) => String(x?._id ?? x)).filter(Boolean);
const day = (v: any) => (v ? String(v).slice(0, 10) : '');
const asRule = (r: any): Rule => ({
	_id: r?._id,
	name: r?.name || '',
	when: r?.when || 'exact',
	queries: Array.isArray(r?.queries) ? r.queries : [],
	category: r?.category ? String(r.category?._id ?? r.category) : '',
	action: r?.action || 'pin',
	products: ids(r?.products),
	brands: ids(r?.brands),
	categories: ids(r?.categories),
	collections: ids(r?.collections),
	onSale: !!r?.onSale,
	strength: r?.strength ? String(r.strength) : '',
	active: r?.active !== false,
	startsAt: day(r?.startsAt),
	endsAt: day(r?.endsAt),
	hits: r?.hits || 0,
});
/** What a rule is saved as: the fields its sentence uses, the rest emptied. */
const bodyOf = (r: Rule) => {
	const searchy = r.when === 'exact' || r.when === 'contains';
	const pin = r.action === 'pin';
	return {
		name: r.name?.trim() || '',
		when: r.when,
		queries: searchy ? r.queries : [],
		category: r.when === 'category' ? r.category || null : null,
		action: r.action,
		products: r.products,
		brands: pin ? [] : r.brands,
		categories: pin ? [] : r.categories,
		collections: pin ? [] : r.collections,
		onSale: !pin && r.onSale,
		strength: r.action === 'boost' || r.action === 'bury' ? r.strength || (r.action === 'bury' ? '0.5' : '2') : null,
		active: r.active,
		startsAt: r.startsAt || null,
		endsAt: r.endsAt || null,
	};
};
const splitQueries = (s: string) =>
	s
		.split(',')
		.map(x => x.trim())
		.filter(Boolean);

const useRoutes = () => {
	const { data } = useGetCommerceSettingsQuery();
	const i: any = data?.installed || {};
	return {
		loaded: !!data,
		rules: i.searchRule?.route as string | undefined,
		product: i.product?.route as string | undefined,
		brand: i.brand?.route as string | undefined,
		category: i.category?.route as string | undefined,
		collection: i.collection?.route as string | undefined,
	};
};

/** A link to a new rule, its sentence started: `?new=pin&q=…` (Insights' fixes) or `?new=pin&product=…`. */
export const newRuleHref = (action: string, more: { q?: string; product?: string } = {}) =>
	projectHref(`/store/search/rules?new=${action}${more.q ? `&q=${encodeURIComponent(more.q)}` : ''}${more.product ? `&product=${encodeURIComponent(more.product)}` : ''}`);

/** Insights' Low click rate fixes: pin products for the search, or boost some. */
export const RuleFixes: FC<{ q: string }> = ({ q }) => (
	<>
		<Button asChild size='xs' variant='outline'>
			<NextLink href={newRuleHref('pin', { q })}>Pin products</NextLink>
		</Button>
		<Button asChild size='xs' variant='outline'>
			<NextLink href={newRuleHref('boost', { q })}>Boost</NextLink>
		</Button>
	</>
);

/** The rules a search sets off, or that name a product — for the Insights drawer and the product's Search tab. */
export const RulesTouching: FC<{ q?: string; product?: string }> = ({ q, product }) => {
	const { data, isLoading } = useGetStoreSearchRulesTouchingQuery({ q, product }, { skip: !q && !product });
	return (
		<Box>
			<Flex align='center' justify='space-between' gap={2} mb={1}>
				<Text fontSize='13px' fontWeight='600'>
					Search rules
				</Text>
				<Button asChild size='xs' variant='ghost'>
					<NextLink href={newRuleHref('pin', { q, product })}>
						<Plus size={12} /> Add a rule
					</NextLink>
				</Button>
			</Flex>
			{isLoading ? (
				<Skeleton h='40px' />
			) : !data?.length ? (
				<Text {...help}>{q ? 'None — this search shows its results as they rank.' : 'None name it, its brand, category or collections.'}</Text>
			) : (
				<Flex direction='column' gap={1}>
					{data.map((r: StoreSearchRuleTouching) => (
						<Flex key={r._id} align='center' gap={2} fontSize='13px'>
							<Badge size='sm' colorPalette={ACTION_TONE[r.action]} variant='subtle' flexShrink={0}>
								{ACTION_WORD[r.action] || r.action}
							</Badge>
							<NextLink href={projectHref(`/store/search/rules?edit=${r._id}`)}>
								<Text as='span' _hover={{ textDecoration: 'underline' }} color={r.live ? undefined : 'fg.muted'}>
									{r.name}
								</Text>
							</NextLink>
							{!r.live && (
								<Text as='span' {...help} mt={0}>
									{!r.active ? 'off' : 'not now'}
								</Text>
							)}
						</Flex>
					))}
				</Flex>
			)}
		</Box>
	);
};

/* ----------------------------------------------------------------- editor */

const Line: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
	<Grid templateColumns={{ base: '1fr', md: '80px 1fr' }} gap={{ base: 1, md: 3 }} alignItems='start'>
		<Text fontSize='13px' fontWeight='600' pt={{ md: '7px' }}>
			{label}
		</Text>
		<Flex direction='column' gap={2} minW={0}>
			{children}
		</Flex>
	</Grid>
);

const Results: FC<{ title: string; part: StoreSearchRulePreview['before'] | null | undefined; compare?: StoreSearchCard[] }> = ({ title, part, compare }) => {
	const was = new Map((compare || []).map((d, i) => [String(d._id), i]));
	return (
		<Box minW={0}>
			<Text fontSize='12px' fontWeight='600' color='fg.muted' textTransform='uppercase' letterSpacing='0.04em' mb={1}>
				{title} {part ? `· ${part.total.toLocaleString()}` : ''}
			</Text>
			{!part ? (
				<Text {...help}>—</Text>
			) : !part.doc.length ? (
				<Text {...help}>No results.</Text>
			) : (
				<Flex direction='column' gap={1}>
					{part.doc.slice(0, 8).map((d, i) => {
						const before = compare ? was.get(String(d._id)) : undefined;
						const moved = compare && (before === undefined ? 'new' : before > i ? 'up' : before < i ? 'down' : '');
						return (
							<Flex key={d._id} align='center' gap={2} fontSize='13px' title={d.explain}>
								<Text as='span' color='fg.muted' w='18px' flexShrink={0} textAlign='end'>
									{i + 1}
								</Text>
								<Text as='span' truncate flex={1} minW={0}>
									{d.name}
								</Text>
								{d.pinned ? (
									<Badge size='xs' colorPalette='purple' variant='subtle'>
										pinned
									</Badge>
								) : moved === 'new' ? (
									<Badge size='xs' colorPalette='green' variant='subtle'>
										new
									</Badge>
								) : moved === 'up' ? (
									<Text as='span' color='green.fg' fontSize='12px'>
										▲
									</Text>
								) : moved === 'down' ? (
									<Text as='span' color='orange.fg' fontSize='12px'>
										▼
									</Text>
								) : null}
							</Flex>
						);
					})}
				</Flex>
			)}
		</Box>
	);
};

const RuleEditor: FC<{ start: Rule | null; onClose: () => void }> = ({ start, onClose }) => {
	const routes = useRoutes();
	const [rule, setRule] = useState<Rule>(start || asRule({}));
	const [queriesText, setQueriesText] = useState((start?.queries || []).join(', '));
	const [tryQ, setTryQ] = useState('');
	const [preview, { data: pv, isLoading: previewing }] = usePreviewStoreSearchRuleMutation();
	const [post, posting] = usePostMutation();
	const [update, updating] = useUpdateByIdMutation();
	const set = (p: Partial<Rule>) => setRule(r => ({ ...r, ...p }));
	const body = useMemo(() => bodyOf(rule), [rule]);
	const key = JSON.stringify([body, tryQ]);
	const timer = useRef<any>(null);
	useEffect(() => {
		clearTimeout(timer.current);
		timer.current = setTimeout(() => preview({ rule: { ...body, _id: rule._id }, q: tryQ || undefined }), 350);
		return () => clearTimeout(timer.current);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	const searchy = rule.when === 'exact' || rule.when === 'contains';
	const pin = rule.action === 'pin';
	const save = async () => {
		if (!routes.rules) return;
		const res: any = rule._id ? await update({ path: routes.rules, id: rule._id, body }) : await post({ path: routes.rules, body });
		if ('error' in res) toaster.create({ type: 'error', title: res.error?.data?.message || 'Couldn’t save the rule' });
		else {
			toaster.create({ type: 'success', title: rule._id ? 'Rule saved' : 'Rule added — searches use it now' });
			onClose();
		}
	};

	return (
		<Dialog isOpen onClose={onClose} size='xl'>
			<DialogHeader description='Read it as a sentence. The results below are your store’s real ones, without the rule and with it.'>
				{rule._id ? 'Edit search rule' : 'New search rule'}
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<Flex direction='column' gap={4} id='store-search-rule-editor'>
					<Line label='When'>
						<Dropdown value={rule.when} onChange={v => set({ when: v })} items={WHEN} />
						{searchy && (
							<Field.Root>
								<Input
									size='sm'
									value={queriesText}
									placeholder='dress, frock, eid dress'
									onChange={e => {
										setQueriesText(e.target.value);
										set({ queries: splitQueries(e.target.value) });
									}}
								/>
								<Field.HelperText fontSize='12px'>
									{rule.when === 'exact' ? 'Commas between searches. Word forms count: “dress” is “dresses” too.' : 'A search with any of these words, in this order, sets it off.'}
								</Field.HelperText>
							</Field.Root>
						)}
						{rule.when === 'category' && routes.category && (
							<VDataMenu label='' model={routes.category} name='category' value={rule.category} onChange={(e: any) => set({ category: e.target.value || '' })} />
						)}
					</Line>
					<Line label='Do'>
						<Flex gap={2} wrap='wrap'>
							<Box flex='1 1 240px'>
								<Dropdown value={rule.action} onChange={v => set({ action: v })} items={ACTIONS} />
							</Box>
							{(rule.action === 'boost' || rule.action === 'bury') && (
								<Box flex='1 1 160px'>
									<Dropdown value={rule.strength || (rule.action === 'bury' ? '0.5' : '2')} onChange={v => set({ strength: v })} items={STRENGTH[rule.action]} />
								</Box>
							)}
						</Flex>
					</Line>
					<Line label={pin ? 'Products' : 'To'}>
						{routes.product && (
							<VDataTags
								label={pin ? '' : 'Products'}
								model={routes.product}
								name='products'
								value={rule.products}
								helper={pin ? 'In the order you pick them: the first is shown first. A product the search wouldn’t find is shown too.' : undefined}
								onChange={(e: any) => set({ products: ids(e.target.value) })}
							/>
						)}
						{!pin && (
							<>
								{routes.brand && <VDataTags label='Brands' model={routes.brand} name='brands' value={rule.brands} onChange={(e: any) => set({ brands: ids(e.target.value) })} />}
								{routes.category && (
									<VDataTags label='Categories' model={routes.category} name='categories' value={rule.categories} onChange={(e: any) => set({ categories: ids(e.target.value) })} />
								)}
								{routes.collection && (
									<VDataTags label='Collections' model={routes.collection} name='collections' value={rule.collections} onChange={(e: any) => set({ collections: ids(e.target.value) })} />
								)}
								<Switch.Root size='sm' checked={rule.onSale} onCheckedChange={e => set({ onSale: !!e.checked })}>
									<Switch.HiddenInput />
									<Switch.Control />
									<Switch.Label fontSize='13px'>Products on sale</Switch.Label>
								</Switch.Root>
								<Text {...help} mt={0}>
									Any of these counts{rule.action === 'filter' ? '. If none of the results are, the rule steps aside — shoppers never get an empty page.' : '.'}
								</Text>
							</>
						)}
					</Line>
					<Line label='Dates'>
						<Flex gap={2} wrap='wrap' align='center'>
							<Input size='sm' type='date' w='160px' value={rule.startsAt || ''} onChange={e => set({ startsAt: e.target.value })} aria-label='Starts' />
							<Text fontSize='13px' color='fg.muted'>
								to
							</Text>
							<Input size='sm' type='date' w='160px' value={rule.endsAt || ''} onChange={e => set({ endsAt: e.target.value })} aria-label='Ends' />
							<Switch.Root size='sm' checked={rule.active} onCheckedChange={e => set({ active: !!e.checked })} ml={{ md: 2 }}>
								<Switch.HiddenInput />
								<Switch.Control />
								<Switch.Label fontSize='13px'>On</Switch.Label>
							</Switch.Root>
						</Flex>
						<Text {...help} mt={0}>
							Both optional. It stops at the end of its last day.
						</Text>
					</Line>
					<Line label='Name'>
						<Input size='sm' value={rule.name || ''} placeholder='Left empty, it’s the rule as a sentence' onChange={e => set({ name: e.target.value })} />
					</Line>

					<Box borderTopWidth='1px' borderColor='border' pt={4} id='store-search-rule-preview'>
						<Flex align='center' justify='space-between' gap={2} wrap='wrap' mb={3}>
							<Text fontSize='13px' fontWeight='600'>
								{rule.when === 'category' ? 'The category page' : 'Try it'}
							</Text>
							{rule.when !== 'category' && (
								<Input
									size='sm'
									maxW='260px'
									value={tryQ}
									placeholder={rule.queries[0] ? `Search: ${rule.queries[0]}` : 'Type a search'}
									onChange={e => setTryQ(e.target.value)}
									aria-label='Search to try'
								/>
							)}
						</Flex>
						{pv && !pv.ready ? (
							<Text fontSize='13px' color='fg.muted'>
								{pv.missing} to see what it does.
							</Text>
						) : pv && !pv.fires ? (
							<Text fontSize='13px' color='orange.fg' mb={2}>
								“{pv.q}” doesn’t set this rule off{rule.when === 'exact' ? ' — it isn’t exactly one of its searches' : ''}.
							</Text>
						) : null}
						<Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} opacity={previewing ? 0.6 : 1}>
							<Results title='Without the rule' part={pv?.before} />
							<Results title='With it' part={pv?.after} compare={pv?.before?.doc} />
						</Grid>
					</Box>
				</Flex>
			</DialogBody>
			<DialogFooter>
				<DiscardButton onClick={onClose}>Cancel</DiscardButton>
				<Button size='sm' loading={posting.isLoading || updating.isLoading} disabled={!pv?.ready} onClick={save}>
					{rule._id ? 'Save rule' : 'Add rule'}
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

/* ------------------------------------------------------------------- page */

const SearchRules: FC = () => {
	const routes = useRoutes();
	const params = useSearchParams();
	const router = useRouter();
	const { data, isLoading } = useGetAllQuery({ path: routes.rules || '', limit: '200', sort: '-createdAt' }, { skip: !routes.rules });
	const [update] = useUpdateByIdMutation();
	const [remove, removing] = useDeleteByIdMutation();
	const [editing, setEditing] = useState<Rule | null>(null);
	const [open, setOpen] = useState(false);
	const [askDelete, setAskDelete] = useState<Rule | null>(null);
	const rows: Rule[] = useMemo(() => ((data as any)?.doc || []).map(asRule), [data]);

	// ?new=pin&q=… / ?new=boost&q=… / ?product=… (Insights, a product's tab) or ?edit=<id> open the editor.
	const asked = useRef(false);
	useEffect(() => {
		if (asked.current || !routes.rules) return;
		const edit = params.get('edit');
		const action = params.get('new');
		if (edit) {
			if (!data) return;
			const r = rows.find(x => String(x._id) === edit);
			if (r) (setEditing(r), setOpen(true));
		} else if (action) {
			const q = params.get('q') || '';
			const product = params.get('product');
			setEditing(asRule({ when: q ? 'exact' : 'always', queries: q ? [q] : [], action, products: product ? [product] : [], strength: action === 'boost' ? '2' : undefined }));
			setOpen(true);
		} else return;
		asked.current = true;
		router.replace(projectHref('/store/search/rules'));
	}, [routes.rules, data, rows, params, router]);

	const cols: Column<Rule>[] = [
		{ key: 'name', label: 'Rule', render: r => <Text as='span'>{r.name}</Text> },
		{
			key: 'action',
			label: 'Does',
			render: r => (
				<Badge size='sm' colorPalette={ACTION_TONE[r.action]} variant='subtle'>
					{ACTION_WORD[r.action] || r.action}
				</Badge>
			),
		},
		{
			key: 'dates',
			label: 'When',
			render: r => (
				<Text as='span' fontSize='12px' color='fg.muted'>
					{r.startsAt || r.endsAt ? `${r.startsAt || '…'} – ${r.endsAt || '…'}` : 'Always'}
				</Text>
			),
		},
		{ key: 'hits', label: 'Used', numeric: true, render: r => (r.hits || 0).toLocaleString() },
		{
			key: 'active',
			label: 'On',
			render: r => (
				<Box onClick={e => e.stopPropagation()}>
					<Switch.Root
						size='sm'
						checked={r.active}
						aria-label={r.active ? 'Switch off' : 'Switch on'}
						onCheckedChange={async e => {
							const res: any = await update({ path: routes.rules!, id: r._id!, body: { active: !!e.checked } });
							if ('error' in res) toaster.create({ type: 'error', title: res.error?.data?.message || 'Couldn’t change it' });
						}}>
						<Switch.HiddenInput />
						<Switch.Control />
					</Switch.Root>
				</Box>
			),
		},
	];

	return (
		<Flex direction='column' gap={4}>
			<Flex align='center' justify='space-between' gap={3} wrap='wrap'>
				<Text {...help} maxW='640px' mt={0}>
					Decide what a search or a category page shows first, lower down or not at all. Rules apply in this order: hide, show only, pin, then boost and bury. A sort the
					shopper picks (price, newest) comes before pins and boosts.
				</Text>
				<Flex gap={2} align='center'>
					<GuideLink section='store-search-rules' />
					<Button
						size='sm'
						disabled={!routes.rules}
						onClick={() => {
							setEditing(null);
							setOpen(true);
						}}>
						<Plus size={14} /> New rule
					</Button>
				</Flex>
			</Flex>
			<Panel id='store-search-rules' title='Search rules' subtitle='Each one changes some searches, or a category page, as soon as it’s saved.'>
				{routes.loaded && !routes.rules ? (
					<Box p={4}>
						<Text fontSize='13px'>This store was set up before search rules: they come with the next store upgrade.</Text>
					</Box>
				) : isLoading || !routes.loaded ? (
					<Skeleton h='160px' m={4} />
				) : !rows.length ? (
					<Box py={8}>
						<EmptyState
							title='No rules yet'
							description='Pin your best dress to the top of “dress”, boost the Eid collection during Eid, or hide what’s being discontinued.'
						/>
					</Box>
				) : (
					<DataTable
						columns={cols}
						rows={rows}
						rowKey={r => String(r._id)}
						onRowClick={r => {
							setEditing(r);
							setOpen(true);
						}}
						rowActions={r => (
							<Button size='xs' variant='ghost' colorPalette='red' aria-label='Delete' onClick={() => setAskDelete(r)}>
								<Trash2 size={14} />
							</Button>
						)}
					/>
				)}
			</Panel>
			{open && <RuleEditor key={editing?._id || 'new'} start={editing} onClose={() => setOpen(false)} />}
			<PromptDialog
				open={!!askDelete}
				onClose={() => setAskDelete(null)}
				tone='danger'
				title='Delete this rule?'
				description={`“${askDelete?.name}” stops changing searches at once.`}
				confirmLabel='Delete'
				loading={removing.isLoading}
				onConfirm={async () => {
					const res: any = await remove({ path: routes.rules!, id: askDelete!._id! });
					if ('error' in res) toaster.create({ type: 'error', title: res.error?.data?.message || 'Couldn’t delete it' });
					setAskDelete(null);
				}}
			/>
		</Flex>
	);
};

export default SearchRules;
