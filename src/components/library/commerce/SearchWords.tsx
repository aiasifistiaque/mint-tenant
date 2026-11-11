'use client';

import { FC, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, Input, Text } from '@chakra-ui/react';
import { ChevronRight } from 'lucide-react';
import { Panel } from '../cl';
import GuideLink from '../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { projectHref } from '../config/lib/constants/panel';
import { useGetCommerceSettingsQuery, useGetStoreSearchPacksQuery, useLazyTryStoreSearchQuery, useSetStoreSearchPackMutation } from '../store/services/commerceApi';
import { OnSwitch, help } from './sections';

/**
 * Store settings → Search: the store's words (backend docs/search SI-10) — the starter synonym packs to switch on, the
 * Search synonyms and Search redirects tables, and a box to try a search as shoppers get it, explained.
 */

export const SearchWordsCard: FC = () => {
	const { data: settings } = useGetCommerceSettingsQuery();
	const { data: packs } = useGetStoreSearchPacksQuery();
	const [setPack] = useSetStoreSearchPackMutation();
	const [busy, setBusy] = useState('');
	const synonyms = settings?.installed?.searchSynonym?.route;
	const redirects = settings?.installed?.searchRedirect?.route;
	return (
		<Panel
			id='store-search-words'
			title='Words and redirects'
			subtitle='Words your shoppers use for the same thing, and searches that should open a page instead.'
			actions={<GuideLink section='store-search-words' />}>
			<Box p={4}>
				{!synonyms ? (
					<Text fontSize='13px'>This store was set up before synonyms: they come with the next store upgrade.</Text>
				) : (
					<>
						<Text
							fontSize='13px'
							fontWeight='600'
							mb={1}>
							Starter packs
						</Text>
						<Text
							{...help}
							mb={3}>
							Switch one on and its words become your own synonyms — edit or switch off any of them in the table. Switching a pack off removes
							the ones it added.
						</Text>
						<Grid
							templateColumns={{ base: '1fr', md: '1fr 1fr' }}
							gap={3}
							mb={4}>
							{(packs || []).map(p => (
								<Box
									key={p.id}
									p={3}
									borderWidth='1px'
									borderColor='border'
									borderRadius='md'>
									<OnSwitch
										checked={p.on}
										disabled={busy === p.id}
										label={
											<>
												{p.name}{' '}
												{p.on && (
													<Badge
														size='sm'
														variant='subtle'>
														{p.installed} in use
													</Badge>
												)}
											</>
										}
										hint={`${p.about} (${p.size} groups)`}
										onChange={async on => {
											setBusy(p.id);
											const res: any = await setPack({ id: p.id, on });
											setBusy('');
											if ('error' in res) toaster.create({ type: 'error', title: res.error?.data?.message || 'Couldn’t change the pack' });
											else toaster.create({ type: 'success', title: on ? `${p.name} switched on` : `${p.name} switched off` });
										}}
									/>
								</Box>
							))}
						</Grid>
						<Flex
							gap={2}
							wrap='wrap'>
							<Button
								asChild
								size='sm'
								variant='outline'>
								<a href={projectHref(`/t/${synonyms}`)}>
									Search synonyms
									<ChevronRight size={13} />
								</a>
							</Button>
							{redirects && (
								<Button
									asChild
									size='sm'
									variant='outline'>
									<a href={projectHref(`/t/${redirects}`)}>
										Search redirects
										<ChevronRight size={13} />
									</a>
								</Button>
							)}
						</Flex>
					</>
				)}
			</Box>
		</Panel>
	);
};

const chip = (text: string, key: string) => (
	<Badge
		key={key}
		size='sm'
		variant='surface'>
		{text}
	</Badge>
);

export const TrySearchCard: FC = () => {
	const [q, setQ] = useState('');
	const [run, { data, isFetching }] = useLazyTryStoreSearchQuery();
	const u = data?.understood;
	const chips = [
		...(u?.price ? [chip(u.price.gte != null && u.price.lte != null ? `Price ${u.price.gte}–${u.price.lte}` : u.price.lte != null ? `Price ≤ ${u.price.lte}` : `Price ≥ ${u.price.gte}`, 'p')] : []),
		...(u?.sort ? [chip(`Sorted: ${u.sort}`, 's')] : []),
		...(u?.inStock ? [chip('In stock', 'i')] : []),
		...(u?.onSale ? [chip('On sale', 'o')] : []),
		...(u?.brand ? [chip(`Brand: ${u.brand.name}`, 'b')] : []),
		...(u?.category ? [chip(`Lifts ${u.category.name}`, 'c')] : []),
		...(u?.options || []).map((o: any, i: number) => chip(`${o.name} ${o.value}${o.as === 'boost' ? ' (lift)' : ''}`, `o${i}`)),
		...(data?.query?.synonyms || []).map((s: any, i: number) => chip(`${s.word} → ${s.with.join(', ')}`, `y${i}`)),
		...(data?.query?.typos || []).map((t: any, i: number) => chip(`${t.word} → ${t.tried[0]}?`, `t${i}`)),
	];
	return (
		<Panel
			id='store-search-try'
			title='Try a search'
			subtitle='As your shoppers get it — and why each product is where it is.'
			actions={<GuideLink section='store-search-words' />}>
			<Box p={4}>
				<Flex
					as='form'
					gap={2}
					onSubmit={(e: any) => {
						e.preventDefault();
						if (q.trim()) run(q.trim());
					}}>
					<Input
						size='sm'
						value={q}
						onChange={e => setQ(e.target.value)}
						placeholder='red dress under 2000'
						aria-label='Search to try'
					/>
					<Button
						size='sm'
						type='submit'
						loading={isFetching}
						disabled={!q.trim()}>
						Try
					</Button>
				</Flex>
				{data && (
					<Box mt={4}>
						<Text fontSize='13px'>
							{data.total} result{data.total === 1 ? '' : 's'}
							{u?.words !== undefined && u.words !== q.trim() ? ` for “${u.words || 'everything'}”` : ''} · {data.ms} ms
						</Text>
						{data.showing && (
							<Text
								fontSize='13px'
								mt={1}>
								{data.showing.reason === 'some words'
									? 'No product has every word: showing the ones with some of them'
									: `No exact results: showing results for “${data.showing.q}”`}
								{data.showing.dropped?.length ? ` (left out: ${data.showing.dropped.join(', ')})` : ''}
							</Text>
						)}
						{u?.relaxed && data.total > 0 && (
							<Text
								fontSize='13px'
								mt={1}>
								What the words asked for (a price, brand or size) left nothing, so it was set aside
							</Text>
						)}
						{data.didYouMean && (
							<Text
								fontSize='13px'
								mt={1}>
								Did you mean{' '}
								<Box
									as='button'
									{...({ type: 'button' } as any)}
									textDecoration='underline'
									fontWeight='600'
									onClick={() => {
										setQ(data.didYouMean);
										run(data.didYouMean);
									}}>
									{data.didYouMean}
								</Box>
								?
							</Text>
						)}
						{data.fallback?.doc?.length > 0 && (
							<Text
								{...help}
								mt={1}>
								Shoppers see {data.fallback.kind === 'category' ? `popular products in ${data.fallback.category?.name}` : 'your popular products'} instead:{' '}
								{data.fallback.doc.map((d: any) => d.name).join(', ')}
							</Text>
						)}
						{data.redirect && (
							<Text
								fontSize='13px'
								mt={1}>
								Opens <strong>{data.redirect.url}</strong> (a redirect)
							</Text>
						)}
						{chips.length > 0 && (
							<Flex
								gap={1.5}
								wrap='wrap'
								mt={2}>
								{chips}
							</Flex>
						)}
						<Box
							as='ol'
							mt={3}
							pl={5}
							display='flex'
							flexDirection='column'
							gap={2}>
							{(data.doc || []).map((d: any) => (
								<li key={d._id}>
									<Text
										fontSize='13px'
										fontWeight='500'>
										{d.name}
										{d.inStock === false && ' · out of stock'}
									</Text>
									<Text
										{...help}
										mt={0}
										fontFamily='mono'
										fontSize='11px'>
										{d.explain}
									</Text>
								</li>
							))}
						</Box>
					</Box>
				)}
			</Box>
		</Panel>
	);
};
