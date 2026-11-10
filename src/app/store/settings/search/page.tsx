'use client';

import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import SearchSettings from '@/components/library/commerce/SearchSettings';

/** Store settings → Search (backend docs/search SI-06). */
export default function Page() {
	return (
		<Layout
			title='Search settings'
			path='store/settings/search'>
			<StoreGate>
				<SearchSettings />
			</StoreGate>
		</Layout>
	);
}
