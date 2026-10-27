'use client';

import { Layout } from '@/components/library';
import StoreSetup from '@/components/library/commerce/StoreSetup';

/** An e-commerce project's setup wizard (backend docs/ecommerce EC-04). */
export default function StoreSetupPage() {
	return (
		<Layout
			title='Set up your store'
			path='store/setup'>
			<StoreSetup />
		</Layout>
	);
}
