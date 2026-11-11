'use client';

import { Suspense } from 'react';
import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import SearchRules from '@/components/library/commerce/SearchRules';

/** Store → Search rules (backend docs/search SI-15). */
export default function Page() {
	return (
		<Layout
			title='Search rules'
			path='store/search/rules'>
			<StoreGate>
				<Suspense>
					<SearchRules />
				</Suspense>
			</StoreGate>
		</Layout>
	);
}
