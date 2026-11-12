'use client';

import { FC } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Panel } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import Snippet from '@/app/public-api/_components/Snippet';
import type { Filled } from './snippets';

/**
 * Website setup → Store search (backend docs/search SI-05): the two search addresses with this store's key filled in —
 * results with filters, and suggestions as the shopper types.
 */
const StoreSearch: FC<{ filled: Filled }> = ({ filled }) => {
	const base = `${filled.api}/store/search`;
	const search = `const res = await fetch(
  '${base}?apiKey=${filled.key}' +
    '&q=' + encodeURIComponent(words) +
    '&category=shoes&option.Size=42&price[lte]=5000&sort=relevance&facets=1&limit=24' +
    '&visitor=' + visitorId   // any id you keep per browser: it lets the store learn from clicks
);
const r = await res.json();
// r.doc: [{ _id, name, slug, image, price, salePrice, compareAtPrice, discountPercent, category, brand, inStock }]
// r.facets: { categories, collections, brands, price: { buckets }, options: [{ name, values: [{ value, count }] }], inStock, onSale }
// r.searchId: send it back with clicks (below)
if (r.redirect) location.href = r.redirect.url;               // a search redirect you made
if (r.showing?.reason === 'meaning') note('No exact match — these are close in meaning');
else if (r.showing) note('Showing results for “' + r.showing.q + '”');  // typos, fewer words, some words
if (r.didYouMean) note('Did you mean ' + r.didYouMean + '?');
if (!r.total && r.fallback) show(r.fallback.doc);             // popular products instead of an empty page
// r.understood: what it read from the words (price, brand, size…) — show as chips the shopper can remove`;
	const suggest = `// As the shopper types (wait ~120 ms after the last key)
const res = await fetch('${base}/suggest?apiKey=${filled.key}&q=' + encodeURIComponent(typed));
const { queries, products, categories, brands } = await res.json();`;
	const events = `// A shopper opens or adds a product from the results: the store learns from it
navigator.sendBeacon('${base}/events?apiKey=${filled.key}', JSON.stringify({
  visitor: visitorId,
  events: [{ type: 'click', searchId: r.searchId, product: productId }],   // or type: 'cart'
}));`;
	const category = `// A category page: no words — the same filters, counts and sorting
fetch('${base}?apiKey=${filled.key}&category=eid-collection&sort=-price&facets=1')`;
	return (
		<Panel
			title='Store search'
			subtitle='Your store ranks searches itself — typos, Bangla and Banglish, meaning, filters with counts. Call these from your site, or add the Search widget instead.'
			actions={<GuideLink section='store-search' />}>
			<Flex
				direction='column'
				gap={5}>
				<Box>
					<Text
						fontSize='12.5px'
						fontWeight='500'
						mb={2}>
						Search results
					</Text>
					<Snippet
						label='search results code'
						code={search}
					/>
				</Box>
				<Box>
					<Text
						fontSize='12.5px'
						fontWeight='500'
						mb={2}>
						Suggestions
					</Text>
					<Snippet
						label='suggestions code'
						code={suggest}
					/>
				</Box>
				<Box>
					<Text
						fontSize='12.5px'
						fontWeight='500'
						mb={2}>
						Clicks and adds to bag
					</Text>
					<Snippet
						label='search events code'
						code={events}
					/>
				</Box>
				<Box>
					<Text
						fontSize='12.5px'
						fontWeight='500'
						mb={2}>
						Category pages
					</Text>
					<Snippet
						label='category page code'
						code={category}
					/>
				</Box>
				<Text
					fontSize='12.5px'
					color='fg.muted'>
					Answers may be cached for 30 seconds; a product you change reaches search in seconds. Categories and collections go by web
					address or id, brands by name, sizes and colours as you wrote them. Up to 120 searches a minute from one IP address.
				</Text>
			</Flex>
		</Panel>
	);
};

export default StoreSearch;
