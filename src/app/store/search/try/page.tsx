'use client';

import { Suspense } from 'react';
import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import SearchTry from '@/components/library/commerce/SearchTry';

/** Store → Try search (backend docs/search SI-17). */
export default function Page() {
	return (
		<Layout
			title='Try search'
			path='store/search/try'>
			<StoreGate>
				<Suspense>
					<SearchTry />
				</Suspense>
			</StoreGate>
		</Layout>
	);
}
