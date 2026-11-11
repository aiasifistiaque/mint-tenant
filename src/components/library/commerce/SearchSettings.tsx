'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { Box, Button, Flex, Grid, SegmentGroup, Skeleton, Text } from '@chakra-ui/react';
import { RefreshCw } from 'lucide-react';
import { Panel } from '../cl';
import GuideLink from '../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import {
	useGetStoreSearchSettingsQuery,
	useGetStoreSearchStatusQuery,
	useRebuildStoreSearchMutation,
	useSaveStoreSearchSettingsMutation,
	type SearchDial,
	type StoreSearchSettings,
} from '../store/services/commerceApi';
import { OnSwitch, help } from './sections';
import { SearchWordsCard, TrySearchCard } from './SearchWords';

/**
 * Store settings → Search (backend docs/search SI-06): how the store's website search matches and ranks, and the
 * search index — how many products it holds, and a rebuild. Saved through /commerce/search/settings.
 */

type Editable = Omit<StoreSearchSettings, 'defaults' | 'enabled'> & { enabled: boolean };
const editable = (s: StoreSearchSettings): Editable => ({ enabled: s.enabled === true, typos: s.typos, outOfStock: s.outOfStock, dials: { ...s.dials }, learning: s.learning, banglish: s.banglish });

const Choice: FC<{ value: string; items: { value: string; label: string }[]; onChange: (v: string) => void; label: string }> = ({ value, items, onChange, label }) => (
	<SegmentGroup.Root
		size='sm'
		value={value}
		aria-label={label}
		onValueChange={d => d.value && onChange(d.value)}
		w='fit-content'>
		<SegmentGroup.Indicator />
		<SegmentGroup.Items items={items} />
	</SegmentGroup.Root>
);

const Row: FC<{ title: string; hint: ReactNode; children: ReactNode }> = ({ title, hint, children }) => (
	<Grid
		templateColumns={{ base: '1fr', md: '220px minmax(0, 1fr)' }}
		gap={{ base: 2, md: 4 }}
		alignItems='start'
		py={3}
		borderTopWidth='1px'
		borderColor='border'
		_first={{ borderTopWidth: 0, pt: 0 }}>
		<Box>
			<Text
				fontSize='13px'
				fontWeight='600'>
				{title}
			</Text>
			<Text {...help}>{hint}</Text>
		</Box>
		<Box pt={{ md: 0.5 }}>{children}</Box>
	</Grid>
);

const DIAL_ITEMS = [
	{ value: 'off', label: 'Off' },
	{ value: 'low', label: 'Low' },
	{ value: 'normal', label: 'Normal' },
	{ value: 'high', label: 'High' },
];
const DIALS: { key: keyof Editable['dials']; title: string; hint: string }[] = [
	{ key: 'popularity', title: 'Popular products', hint: 'Best sellers, the most viewed and the most wished-for rise a little.' },
	{ key: 'freshness', title: 'New products', hint: 'Products added in the last 14 days rise a little.' },
	{ key: 'sale', title: 'On sale', hint: 'Products with a discount rise a little.' },
	{ key: 'learned', title: 'What shoppers pick', hint: 'Products shoppers click and buy after a search rise for that search — once search learning is built.' },
];

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const SettingsCard: FC = () => {
	const { data, isLoading } = useGetStoreSearchSettingsQuery();
	const [save, saving] = useSaveStoreSearchSettingsMutation();
	const [value, setValue] = useState<Editable | null>(null);
	const [problem, setProblem] = useState('');
	useEffect(() => {
		if (data) setValue(editable(data));
	}, [data]);
	if (isLoading || !data || !value) return <Skeleton h='420px' />;
	const saved = editable(data);
	const changed = JSON.stringify(value) !== JSON.stringify(saved);
	// Only what changed is sent; "on" is only sent when it changed, so a store not switched on by name stays so.
	const submit = async () => {
		const body: any = {};
		for (const k of ['typos', 'outOfStock', 'learning', 'banglish'] as const) if (value[k] !== saved[k]) body[k] = value[k];
		const dials = Object.fromEntries(Object.entries(value.dials).filter(([k, v]) => saved.dials[k as keyof Editable['dials']] !== v));
		if (Object.keys(dials).length) body.dials = dials;
		if (value.enabled !== saved.enabled) body.enabled = value.enabled;
		const res: any = await save(body);
		if ('error' in res) return setProblem(res.error?.data?.message || 'Couldn’t save — try again.');
		setProblem('');
		toaster.create({ type: 'success', title: 'Search settings saved' });
	};
	const set = (patch: Partial<Editable>) => setValue({ ...value, ...patch });
	const d = data.defaults;
	const atDefaults = value.typos === d.typos && value.outOfStock === d.outOfStock && value.learning === d.learning && value.banglish === d.banglish && JSON.stringify(value.dials) === JSON.stringify(d.dials);
	return (
		<Panel
			id='store-search-settings'
			title='Search on your website'
			subtitle='How your store finds and orders products when shoppers search — on your website and through its API.'
			actions={<GuideLink section='store-search-settings' />}>
			<Box p={4}>
				<Box mb={4}>
					<OnSwitch
						checked={value.enabled}
						onChange={enabled => set({ enabled })}
						label='Search on'
						hint={
							value.enabled
								? 'Your website’s search address answers, and a Products list searched by words is ranked the same way.'
								: data.enabled === null && !changed
									? 'Not switched on yet. Your website’s search address already answers, but a site that searches the Products list still gets the old search, which matches the letters exactly. Switch on once you’ve tried a few searches.'
									: 'Off: your website’s search address answers “search is switched off”, and the Products list searches the old way.'
						}
					/>
				</Box>
				<Row
					title='Typos'
					hint={value.typos === 'off' ? 'Words are matched as typed.' : value.typos === 'loose' ? 'One more slip forgiven — even in short words like “bga”.' : 'One slip in a word of 4–7 letters, two in longer words: “jaket” finds jackets.'}>
					<Choice
						label='Typos'
						value={value.typos}
						onChange={v => set({ typos: v as Editable['typos'] })}
						items={[
							{ value: 'off', label: 'Off' },
							{ value: 'normal', label: 'Normal' },
							{ value: 'loose', label: 'Forgiving' },
						]}
					/>
				</Row>
				<Row
					title='Bangla and Banglish'
					hint='“শাড়ি”, “saree”, “sari” and “shari” find each other.'>
					<OnSwitch
						checked={value.banglish}
						onChange={banglish => set({ banglish })}
						label={value.banglish ? 'On' : 'Off'}
					/>
				</Row>
				<Row
					title='Out of stock'
					hint={value.outOfStock === 'show' ? 'Listed after the products in stock, marked out of stock.' : 'Left out of search, suggestions and category pages until they’re back in stock.'}>
					<Choice
						label='Out of stock'
						value={value.outOfStock}
						onChange={v => set({ outOfStock: v as Editable['outOfStock'] })}
						items={[
							{ value: 'show', label: 'Show them last' },
							{ value: 'hide', label: 'Hide them' },
						]}
					/>
				</Row>
				{DIALS.map(dial => (
					<Row
						key={dial.key}
						title={dial.title}
						hint={dial.hint}>
						<Choice
							label={dial.title}
							value={value.dials[dial.key]}
							onChange={v => set({ dials: { ...value.dials, [dial.key]: v as SearchDial } })}
							items={DIAL_ITEMS}
						/>
					</Row>
				))}
				<Row
					title='Learn from shoppers'
					hint='Clicks and orders after a search teach it what people mean. Nothing is applied until enough different shoppers agree — and it starts once search learning is built.'>
					<OnSwitch
						checked={value.learning}
						onChange={learning => set({ learning })}
						label={value.learning ? 'On' : 'Off'}
					/>
				</Row>
				<Text
					{...help}
					mt={3}>
					A lift never puts a product ahead of one that matches the search better.
				</Text>
				{problem && (
					<Box
						mt={4}
						p={3}
						borderRadius='md'
						bg='red.subtle'
						color='red.fg'
						fontSize='13px'>
						{problem}
					</Box>
				)}
				<Flex
					justify='flex-end'
					gap={2}
					mt={4}
					wrap='wrap'>
					{!atDefaults && (
						<Button
							size='sm'
							variant='ghost'
							onClick={() => set({ typos: d.typos, outOfStock: d.outOfStock, learning: d.learning, banglish: d.banglish, dials: { ...d.dials } })}>
							Back to the defaults
						</Button>
					)}
					{changed && (
						<Button
							size='sm'
							variant='ghost'
							onClick={() => {
								setValue(saved);
								setProblem('');
							}}>
							Undo changes
						</Button>
					)}
					<Button
						size='sm'
						disabled={!changed}
						loading={saving.isLoading}
						onClick={submit}>
						Save
					</Button>
				</Flex>
			</Box>
		</Panel>
	);
};

const IndexCard: FC = () => {
	const [poll, setPoll] = useState(0);
	const { data, refetch } = useGetStoreSearchStatusQuery(undefined, { pollingInterval: poll });
	const [rebuild, rebuilding] = useRebuildStoreSearchMutation();
	const running = data?.rebuild?.status === 'running';
	// Poll while a rebuild runs (and briefly after starting one), then stop.
	useEffect(() => setPoll(running ? 2000 : 0), [running]);
	if (!data) return <Skeleton h='160px' />;
	const r = data.rebuild;
	const matches = data.docs === data.products;
	return (
		<Panel
			id='store-search-index'
			title='The search index'
			subtitle='What search reads: one entry per product shoppers can find, kept up to date by itself.'
			actions={<GuideLink section='store-search-index' />}>
			<Box p={4}>
				<Grid
					templateColumns={{ base: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }}
					gap={4}
					mb={4}>
					{[
						['Searchable', `${data.docs.toLocaleString()} of ${data.products.toLocaleString()}`, 'active products'],
						['Waiting', data.queued.toLocaleString(), data.queued ? 'changes, in seconds' : 'nothing to catch up'],
						['Last full build', when(data.builtAt), r?.reason === 'first' ? 'when search started' : r?.reason ? `from ${r.reason === 'panel' ? 'here' : r.reason}` : ''],
						['Last checked', when(data.sweptAt), 'every 2 minutes'],
					].map(([k, v, s]) => (
						<Box key={k}>
							<Text {...help}>{k}</Text>
							<Text
								fontSize='15px'
								fontWeight='600'
								mt={0.5}>
								{v}
							</Text>
							<Text {...help}>{s}</Text>
						</Box>
					))}
				</Grid>
				{running && (
					<Text
						fontSize='13px'
						mb={3}>
						Rebuilding… {r?.done ?? 0} of {r?.total ?? data.products} products
					</Text>
				)}
				{r?.status === 'failed' && (
					<Box
						mb={3}
						p={3}
						borderRadius='md'
						bg='red.subtle'
						color='red.fg'
						fontSize='13px'>
						The last rebuild stopped: {r.error || 'something went wrong'}. Try again; if it stops again, tell us.
					</Box>
				)}
				{!running && !matches && data.queued === 0 && (
					<Text
						fontSize='13px'
						mb={3}>
						The numbers differ — the daily check will rebuild it, or rebuild now.
					</Text>
				)}
				<Flex
					justify='space-between'
					align='center'
					gap={3}
					wrap='wrap'>
					<Text {...help}>A change to a product, its variants, category, brand, collection, stock or discount reaches search in seconds. Rebuild only if something looks wrong.</Text>
					<Button
						size='sm'
						variant='outline'
						loading={rebuilding.isLoading}
						disabled={running}
						onClick={async () => {
							const res: any = await rebuild();
							if ('error' in res) return toaster.create({ type: 'error', title: res.error?.data?.message || 'Couldn’t start the rebuild' });
							setPoll(2000);
							refetch();
						}}>
						<RefreshCw size={13} />
						Rebuild
					</Button>
				</Flex>
			</Box>
		</Panel>
	);
};

const SearchSettings: FC = () => (
	<Flex
		direction='column'
		gap={4}
		maxW='860px'>
		<Flex
			justify='space-between'
			align='baseline'
			gap={3}>
			<Text {...help}>How your website’s search matches and orders products, and the index it reads.</Text>
			<GuideLink section='store-search' />
		</Flex>
		<SettingsCard />
		<SearchWordsCard />
		<TrySearchCard />
		<IndexCard />
	</Flex>
);

export default SearchSettings;
