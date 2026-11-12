'use client';

import { FC, useState } from 'react';
import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react';
import { Wand2 } from 'lucide-react';
import { Panel } from '../cl';
import { toaster } from '@/components/ui/toaster';
import GuideLink from '../tenant/GuideLink';
import {
	useAcceptStoreSearchSuggestionMutation,
	useDismissStoreSearchSuggestionMutation,
	useGetStoreSearchSuggestionsQuery,
	useLearnStoreSearchMutation,
	type StoreSearchSuggestion,
} from '../store/services/commerceApi';
import { help } from './sections';

/**
 * Suggested fixes on Search insights (backend docs/search SI-16, SI-18): synonyms, redirects and search rules waiting
 * for the owner's yes. Learned ones come from what shoppers did (searched one word, found nothing, searched another and
 * found it; kept opening a product far down); "From your AI" ones were drafted by the owner's own AI over MCP. Accept
 * makes the record (marked as a suggestion) and searches use it at once; Dismiss means it isn't suggested again.
 */

const KIND = { synonym: 'Synonym', redirect: 'Redirect', rule: 'Search rule' } as const;

const Row: FC<{ s: StoreSearchSuggestion }> = ({ s }) => {
	const [accept, a] = useAcceptStoreSearchSuggestionMutation();
	const [dismiss, d] = useDismissStoreSearchSuggestionMutation();
	const run = async (yes: boolean) => {
		const res: any = yes ? await accept(s._id) : await dismiss(s._id);
		if ('error' in res) toaster.create({ type: 'error', title: res.error?.data?.message || 'Couldn’t do that' });
		else toaster.create({ type: 'success', title: yes ? `${KIND[s.kind]} added — searches use it now` : 'Dismissed — it won’t be suggested again' });
	};
	return (
		<Flex gap={3} align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} py={3} borderTopWidth='1px' borderColor='border' _first={{ borderTopWidth: 0 }}>
			<Box flex='1' minW={0}>
				<Flex gap={2} align='center' wrap='wrap'>
					<Text fontSize='14px' fontWeight='600'>
						{s.title}
					</Text>
					<Badge size='sm' variant='subtle'>
						{KIND[s.kind]}
					</Badge>
					<Badge size='sm' variant='subtle' colorPalette={s.source === 'your-ai' ? 'purple' : 'blue'}>
						{s.source === 'your-ai' ? 'From your AI' : 'Learned from shoppers'}
					</Badge>
				</Flex>
				{s.why && (
					<Text {...help} mt={1}>
						{s.why}
					</Text>
				)}
			</Box>
			<Flex gap={2} flexShrink={0}>
				<Button size='sm' variant='ghost' onClick={() => run(false)} loading={d.isLoading} disabled={a.isLoading}>
					Dismiss
				</Button>
				<Button size='sm' onClick={() => run(true)} loading={a.isLoading} disabled={d.isLoading}>
					Accept
				</Button>
			</Flex>
		</Flex>
	);
};

const SearchSuggestions: FC = () => {
	const { data } = useGetStoreSearchSuggestionsQuery();
	const [learn, l] = useLearnStoreSearchMutation();
	const [all, setAll] = useState(false);
	const list = data?.doc || [];
	const shown = all ? list : list.slice(0, 5);
	const lookNow = async () => {
		const res: any = await learn();
		if ('error' in res) toaster.create({ type: 'error', title: res.error?.data?.message || 'Couldn’t look just now' });
		else if (res.data?.skipped) toaster.create({ type: 'info', title: res.data.skipped });
		else toaster.create({ type: 'success', title: res.data?.suggestions ? `${res.data.suggestions} new suggestion${res.data.suggestions === 1 ? '' : 's'}` : 'Nothing new to suggest yet' });
	};
	return (
		<Panel
			id='store-search-suggestions'
			title={`Suggested fixes${data?.open ? ` · ${data.open}` : ''}`}
			subtitle='From what shoppers did, and from your AI. Nothing changes until you accept.'
			actions={
				<Flex align='center' gap={2}>
					<Button size='xs' variant='outline' onClick={lookNow} loading={l.isLoading}>
						<Wand2 size={13} /> Look for fixes now
					</Button>
					<GuideLink section='store-search-suggestions' />
				</Flex>
			}
		>
			{!list.length ? (
				<Text {...help}>
					Nothing to fix right now. Search learns from what shoppers do each night: when people search one word, find nothing and search another, it suggests a synonym here. Your
					own AI can suggest fixes too (Fix with your AI).
				</Text>
			) : (
				<>
					{shown.map(s => (
						<Row key={s._id} s={s} />
					))}
					{list.length > 5 && (
						<Button size='xs' variant='ghost' mt={1} onClick={() => setAll(!all)}>
							{all ? 'Show fewer' : `Show all ${list.length}`}
						</Button>
					)}
				</>
			)}
		</Panel>
	);
};

export default SearchSuggestions;
