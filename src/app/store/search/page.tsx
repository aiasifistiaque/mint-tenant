'use client';

import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import SearchInsights from '@/components/library/commerce/SearchInsights';

/** Store → Search insights (backend docs/search SI-14). */
export default function Page() {
	return (
		<Layout
			title='Search insights'
			path='store/search'>
			<StoreGate>
				<SearchInsights />
			</StoreGate>
		</Layout>
	);
}
