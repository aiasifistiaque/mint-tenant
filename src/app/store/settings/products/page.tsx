'use client';

import { Layout } from '@/components/library';
import StoreSettings from '@/components/library/commerce/StoreSettings';
import StoreGate from '@/components/library/commerce/StoreGate';

export default function Page() {
	return (
		<Layout
			title='Product settings'
			path='store/settings/products'>
			<StoreGate>
				<StoreSettings page='products' />
			</StoreGate>
		</Layout>
	);
}
