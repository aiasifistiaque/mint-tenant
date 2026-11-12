'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, Flex, Grid, Image, Input, Text } from '@chakra-ui/react';
import { ChevronDown, ChevronRight, Pin } from 'lucide-react';
import { Dropdown, EmptyState, Panel } from '../cl';
import GuideLink from '../tenant/GuideLink';
import { projectHref } from '../config/lib/constants/panel';
import { useGetCommerceSettingsQuery, useLazyTryStoreSearchPageQuery } from '../store/services/commerceApi';
import { help } from './sections';

/**
 * Try search (backend docs/search README §6, SI-17): the store's search exactly as shoppers get it, with the reasons
 * shown — what the engine understood (chips), the synonyms and spellings it used, the search rules that fired, how
 * long it took, and for each result its score taken apart: which words matched where and how well, and every
 * multiplier (all words found, in stock, popular, new, on sale, learned from shoppers, a rule). The same for every
 * shopper: no one's history changes it. `?q=` opens it with a search tried.
 */

const SORTS = [
	{ value: 'relevance', label: 'Best match' },
	{ value: 'popular', label: 'Popular' },
	{ value: 'price', label: 'Price, low to high' },
	{ value: '-price', label: 'Price, high to low' },
	{ value: 'newest', label: 'Newest' },
	{ value: 'name', label: 'Name' },
];
const PER = 24;

const PART = { name: 'Name', brand: 'Brand', category: 'Category', keyword: 'Search words', option: 'Option', collection: 'Collection', custom: 'Other field', description: 'Description', code: 'SKU / barcode' } as Record<string, string>;
const KIND = {
	exact: 'exact',
	'word form': 'word form (plural, -ing…)',
	synonym: 'a synonym',
	'starts with': 'starts with (as you type)',
	'sounds like': 'sounds like (Banglish)',
	'1 typo': '1 typo',
	'2 typos': '2 typos',
	code: 'the code',
} as Record<string, string>;
const MULT: Record<string, string> = {
	'phrase in the name': 'The words are together in the name',
	'all words in the name': 'Every word is in the name',
	'the name itself': 'The name is the search',
	'out of stock': 'Out of stock: listed after the ones in stock',
	popular: 'Popular (sold, viewed, wished for in 30 days)',
	new: 'New in the last 14 days',
	'on sale': 'On sale',
	learned: 'Learned: shoppers choose it for this search more than its place would say',
};

/** "name exact “dress” 10 · coverage 1/1 ×1 · learned ×1.16 · = 9.94" → its parts. */
export const parseExplain = (s: string) => {
	const parts = String(s || '').split(' · ');
	const matches: { part: string; kind: string; word: string; points: number }[] = [];
	const mults: { name: string; x: number }[] = [];
	let score: number | null = null;
	let other: string[] = [];
	for (const p of parts) {
		const eq = p.match(/^= ([\d.]+)$/);
		if (eq) {
			score = Number(eq[1]);
			continue;
		}
		const mx = p.match(/^(.*) ×([\d.]+)$/);
		if (mx) {
			mults.push({ name: mx[1], x: Number(mx[2]) });
			continue;
		}
		const mm = p.match(/^(\w+) (.+?) “(.+)” ([\d.]+)$/);
		if (mm) {
			matches.push({ part: mm[1], kind: mm[2], word: mm[3], points: Number(mm[4]) });
			continue;
		}
		other.push(p);
	}
	return { matches, mults, score, other };
};

const multLabel = (name: string) => {
	if (MULT[name]) return MULT[name];
	if (name.startsWith('coverage ')) return `Words found: ${name.slice(9)}`;
	if (name.startsWith('rule ')) return `Search rule ${name.slice(5)}`;
	if (name.startsWith('in ')) return `In the category the search named (${name.slice(3)})`;
	return name;
};

const Chip: FC<{ children: ReactNode; tone?: string }> = ({ children, tone }) => (
	<Badge size='sm' variant='surface' colorPalette={tone}>
		{children}
	</Badge>
);

const Why: FC<{ explain?: string; pinned?: number }> = ({ explain, pinned }) => {
	const e = parseExplain(explain || '');
	return (
		<Box mt={2} p={3} bg='bg.muted' borderRadius='md' fontSize='12px'>
			{pinned ? (
				<Flex align='center' gap={1} mb={e.matches.length ? 2 : 0}>
					<Pin size={12} /> Pinned #{pinned} by a search rule
				</Flex>
			) : null}
			{e.matches.length > 0 && (
				<Box as='table' w='full' mb={2} css={{ '& td': { padding: '2px 8px 2px 0', verticalAlign: 'top' } }}>
					<tbody>
						{e.matches.map((m, i) => (
							<tr key={i}>
								<td>
									<strong>“{m.word}”</strong>
								</td>
								<td>in the {(PART[m.part] || m.part).toLowerCase()}</td>
								<td>{KIND[m.kind] || m.kind}</td>
								<Box as='td' textAlign='right' fontVariantNumeric='tabular-nums'>
									{m.points}
								</Box>
							</tr>
						))}
					</tbody>
				</Box>
			)}
			{e.mults.length > 0 && (
				<Flex direction='column' gap={0.5} mb={2}>
					{e.mults.map((m, i) => (
						<Flex key={i} justify='space-between' gap={3} color={m.name === 'learned' ? 'blue.fg' : m.name.startsWith('rule ') ? 'purple.fg' : undefined}>
							<Text fontSize='12px'>{multLabel(m.name)}</Text>
							<Text fontSize='12px' fontVariantNumeric='tabular-nums'>×{m.x}</Text>
						</Flex>
					))}
				</Flex>
			)}
			{e.score != null && (
				<Flex justify='space-between' fontWeight='600' borderTopWidth='1px' borderColor='border' pt={1}>
					<Text fontSize='12px'>Score</Text>
					<Text fontSize='12px' fontVariantNumeric='tabular-nums'>{e.score}</Text>
				</Flex>
			)}
			{e.other.length > 0 && <Text fontSize='12px' color='fg.muted'>{e.other.join(' · ')}</Text>}
		</Box>
	);
};

const SearchTry: FC = () => {
	const [q, setQ] = useState('');
	const [sort, setSort] = useState('relevance');
	const [page, setPage] = useState(1);
	const [open, setOpen] = useState<Record<string, boolean>>({});
	const [all, setAll] = useState(false);
	const [run, { data, isFetching, error }] = useLazyTryStoreSearchPageQuery();
	const { data: settings } = useGetCommerceSettingsQuery();
	const currency = (settings?.answers as any)?.store?.currency || '';
	const go = (text: string, p = 1, s = sort) => {
		const t = text.trim().slice(0, 100);
		setPage(p);
		setOpen({});
		run({ q: t, page: p, limit: PER, sort: s });
		try {
			const u = new URL(window.location.href);
			if (t) u.searchParams.set('q', t);
			else u.searchParams.delete('q');
			window.history.replaceState(null, '', u.toString());
		} catch {}
	};
	useEffect(() => {
		const asked = new URLSearchParams(window.location.search).get('q')?.trim().slice(0, 100);
		if (asked) {
			setQ(asked);
			go(asked);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const u = data?.understood;
	const chips: ReactNode[] = [
		...(u?.price ? [<Chip key='p'>{u.price.gte != null && u.price.lte != null ? `Price ${u.price.gte}–${u.price.lte}` : u.price.lte != null ? `Price up to ${u.price.lte}` : `Price from ${u.price.gte}`}</Chip>] : []),
		...(u?.sort ? [<Chip key='s'>Sorted: {u.sort}</Chip>] : []),
		...(u?.inStock ? [<Chip key='i'>In stock</Chip>] : []),
		...(u?.onSale ? [<Chip key='o'>On sale</Chip>] : []),
		...(u?.brand ? [<Chip key='b'>Brand: {u.brand.name}</Chip>] : []),
		...(u?.category ? [<Chip key='c'>Lifts {u.category.name}</Chip>] : []),
		...(u?.options || []).map((o: any, i: number) => (
			<Chip key={`o${i}`}>
				{o.name} {o.value}
				{o.as === 'boost' ? ' (lift)' : ''}
			</Chip>
		)),
		...(u?.dropped || []).map((w: string, i: number) => <Chip key={`d${i}`}>Ignored: {w}</Chip>),
	];
	const words: ReactNode[] = [
		...(data?.query?.synonyms || []).map((s: any, i: number) => (
			<Chip key={`y${i}`} tone='green'>
				{s.word} also finds {s.with.join(', ')}
			</Chip>
		)),
		...(data?.query?.typos || []).map((t: any, i: number) => (
			<Chip key={`t${i}`} tone='orange'>
				{t.word} → {t.tried.slice(0, 3).join(', ')}
			</Chip>
		)),
	];
	const docs: any[] = data?.doc || [];
	const toggle = (id: string) => setOpen(o => ({ ...o, [id]: !o[id] }));
	const money = (n?: number) => (n == null ? '' : `${currency ? `${currency} ` : ''}${Math.round(n).toLocaleString()}`);

	return (
		<Flex direction='column' gap={4}>
			<Flex align='center' justify='space-between' gap={3} wrap='wrap'>
				<Text {...help} maxW='640px'>
					Your website’s search as every shopper gets it, with the reasons: what it understood, the words it matched, and why each product is where it is.
				</Text>
				<GuideLink section='store-search-try' />
			</Flex>
			<Panel id='store-search-try-page'>
				<Flex
					as='form'
					gap={2}
					wrap='wrap'
					onSubmit={(e: any) => {
						e.preventDefault();
						go(q);
					}}>
					<Input flex='1' minW='220px' size='sm' value={q} onChange={e => setQ(e.target.value)} placeholder='red dress under 2000' aria-label='Search to try' />
					<Box w='190px'>
						<Dropdown
							size='sm'
							aria-label='Sort'
							value={sort}
							items={SORTS}
							onChange={v => {
								setSort(v);
								if (data) go(q, 1, v);
							}}
						/>
					</Box>
					<Button size='sm' type='submit' loading={isFetching}>
						Try
					</Button>
				</Flex>
				<Text {...help}>Leave it empty to see a page of everything, as a category page shows it.</Text>
			</Panel>

			{error ? (
				<EmptyState title='Couldn’t search' description={(error as any)?.data?.message || 'Try again in a moment.'} />
			) : data ? (
				<Grid templateColumns={{ base: '1fr', lg: '1fr 300px' }} gap={4} alignItems='start'>
					<Panel
						title={`${data.total.toLocaleString()} result${data.total === 1 ? '' : 's'}`}
						subtitle={u?.words !== undefined && u.words !== q.trim() ? `Searched for “${u.words || 'everything'}”` : undefined}
						actions={
							docs.some(d => d.explain) ? (
								<Button
									size='xs'
									variant='ghost'
									onClick={() => {
										setAll(!all);
										setOpen({});
									}}>
									{all ? 'Hide every why' : 'Show every why'}
								</Button>
							) : null
						}>
						{data.redirect && (
							<Text fontSize='13px' mb={2}>
								Shoppers are sent to <strong>{data.redirect.url}</strong> instead (a search redirect). These are the results they’d see without it.
							</Text>
						)}
						{data.showing && (
							<Text fontSize='13px' mb={2}>
								{data.showing.reason === 'meaning'
									? 'No product has these words: showing the products closest in meaning'
									: data.showing.reason === 'some words'
										? 'No product has every word: showing the ones with some of them'
										: `No exact results: showing results for “${data.showing.q}”`}
								{data.showing.dropped?.length ? ` (left out: ${data.showing.dropped.join(', ')})` : ''}
							</Text>
						)}
						{data.didYouMean && (
							<Text fontSize='13px' mb={2}>
								Shoppers see “Did you mean{' '}
								<Box
									as='button'
									{...({ type: 'button' } as any)}
									textDecoration='underline'
									fontWeight='600'
									onClick={() => {
										setQ(data.didYouMean);
										go(data.didYouMean);
									}}>
									{data.didYouMean}
								</Box>
								?”
							</Text>
						)}
						{!docs.length ? (
							data.fallback?.doc?.length ? (
								<Text {...help}>
									Nothing found. Shoppers see {data.fallback.kind === 'category' ? `popular products in ${data.fallback.category?.name}` : 'your popular products'} instead:{' '}
									{data.fallback.doc.map((d: any) => d.name).join(', ')}.
								</Text>
							) : (
								<Text {...help}>Nothing found.</Text>
							)
						) : (
							<Flex direction='column'>
								{docs.map((d, i) => {
									const shown = all || open[d._id];
									const pos = (page - 1) * PER + i + 1;
									return (
										<Box key={d._id} py={2.5} borderTopWidth={i ? '1px' : 0} borderColor='border'>
											<Flex gap={3} align='center'>
												<Text w='28px' flexShrink={0} fontSize='12px' color='fg.muted' textAlign='right' fontVariantNumeric='tabular-nums'>
													{pos}
												</Text>
												{d.image ? (
													<Image src={d.image} alt='' w='40px' h='40px' objectFit='cover' borderRadius='md' flexShrink={0} />
												) : (
													<Box w='40px' h='40px' borderRadius='md' bg='bg.muted' flexShrink={0} />
												)}
												<Box flex='1' minW={0}>
													<Flex gap={2} align='center' wrap='wrap'>
														<Text fontSize='13px' fontWeight='500' truncate>
															{d.name}
														</Text>
														{d.pinned ? (
															<Chip tone='purple'>
																<Pin size={10} /> pinned
															</Chip>
														) : null}
														{d.inStock === false && <Chip tone='orange'>out of stock</Chip>}
														{/learned ×/.test(d.explain || '') && <Chip tone='blue'>learned</Chip>}
													</Flex>
													<Text fontSize='12px' color='fg.muted'>
														{d.salePrice != null && d.salePrice < (d.price ?? Infinity) ? `${money(d.salePrice)} (was ${money(d.price)})` : money(d.price)}
														{d.score != null && ` · score ${Math.round(d.score * 100) / 100}`}
													</Text>
												</Box>
												{(d.explain || d.pinned) && (
													<Button size='xs' variant='ghost' onClick={() => toggle(d._id)} aria-expanded={!!shown} aria-label={`Why ${d.name} is here`}>
														Why {shown ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
													</Button>
												)}
											</Flex>
											{shown && (
												<Box pl={{ base: 0, md: '80px' }}>
													<Why explain={d.explain} pinned={d.pinned} />
												</Box>
											)}
										</Box>
									);
								})}
							</Flex>
						)}
						{data.totalPages > 1 && (
							<Flex justify='space-between' align='center' mt={3}>
								<Button size='xs' variant='outline' disabled={page <= 1 || isFetching} onClick={() => go(q, page - 1)}>
									Previous
								</Button>
								<Text fontSize='12px' color='fg.muted'>
									Page {page} of {data.totalPages}
								</Text>
								<Button size='xs' variant='outline' disabled={page >= data.totalPages || isFetching} onClick={() => go(q, page + 1)}>
									Next
								</Button>
							</Flex>
						)}
					</Panel>

					<Flex direction='column' gap={4}>
						<Panel title='How it read the search'>
							<Flex direction='column' gap={3} fontSize='13px'>
								<Box>
									<Text fontWeight='600' fontSize='12px' mb={1}>
										Time
									</Text>
									<Text>{data.ms} ms</Text>
								</Box>
								<Box>
									<Text fontWeight='600' fontSize='12px' mb={1}>
										Words matched
									</Text>
									<Text>{data.query?.words?.length ? data.query.words.join(' · ') : '—'}</Text>
								</Box>
								<Box>
									<Text fontWeight='600' fontSize='12px' mb={1}>
										Understood
									</Text>
									{chips.length ? (
										<Flex gap={1.5} wrap='wrap'>
											{chips}
										</Flex>
									) : (
										<Text color='fg.muted'>Just words</Text>
									)}
									{u?.relaxed && <Text {...help}>What the words asked for left nothing, so it was set aside.</Text>}
								</Box>
								{words.length > 0 && (
									<Box>
										<Text fontWeight='600' fontSize='12px' mb={1}>
											Synonyms and spellings
										</Text>
										<Flex gap={1.5} wrap='wrap'>
											{words}
										</Flex>
									</Box>
								)}
								{data.meaning && (
									<Box>
										<Text fontWeight='600' fontSize='12px' mb={1}>
											By meaning
										</Text>
										<Text color={data.meaning.used === 'no' ? 'fg.muted' : undefined}>
											{data.meaning.used === 'reranked'
												? `Ordered the top results${data.meaning.moved ? ` (${data.meaning.moved} moved)` : ''}`
												: data.meaning.used === 'nearest'
													? 'Found these by meaning'
													: `Not used — ${data.meaning.why}`}
										</Text>
									</Box>
								)}
								<Box>
									<Text fontWeight='600' fontSize='12px' mb={1}>
										Search rules that fired
									</Text>
									{data.rules?.length ? (
										<Flex direction='column' gap={1}>
											{data.rules.map((r: any) => (
												<NextLink key={r._id} href={projectHref(`/store/search/rules?edit=${r._id}`)}>
													<Text textDecoration='underline' fontSize='13px'>
														{r.name}
													</Text>
												</NextLink>
											))}
											{data.pinned ? <Text {...help}>{data.pinned} pinned at the top</Text> : null}
										</Flex>
									) : (
										<Text color='fg.muted'>None</Text>
									)}
								</Box>
							</Flex>
						</Panel>
						<Panel title='Change what it shows'>
							<Flex direction='column' gap={2}>
								<Button asChild size='xs' variant='outline'>
									<NextLink href={projectHref(`/store/search/rules?new=pin&q=${encodeURIComponent(q.trim())}`)}>Pin products for this search</NextLink>
								</Button>
								<Button asChild size='xs' variant='outline'>
									<NextLink href={projectHref(`/store/search/rules?new=boost&q=${encodeURIComponent(q.trim())}`)}>Boost or bury</NextLink>
								</Button>
								<Button asChild size='xs' variant='outline'>
									<NextLink href={projectHref('/store/settings/search#store-search-words')}>Synonyms and redirects</NextLink>
								</Button>
								<Button asChild size='xs' variant='outline'>
									<NextLink href={projectHref('/store/settings/search')}>Search settings (typos, dials, learning)</NextLink>
								</Button>
							</Flex>
						</Panel>
					</Flex>
				</Grid>
			) : (
				<EmptyState title='Type a search' description='See what your shoppers get for it, and why.' />
			)}
		</Flex>
	);
};

export default SearchTry;
