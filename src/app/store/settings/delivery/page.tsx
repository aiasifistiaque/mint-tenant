'use client';

import { Layout } from '@/components/library';
import StoreSettings from '@/components/library/commerce/StoreSettings';
import StoreGate from '@/components/library/commerce/StoreGate';

export default function Page() {
	return (
		<Layout
			title='Delivery settings'
			path='store/settings/delivery'>
			<StoreGate>
				<StoreSettings page='delivery' />
			</StoreGate>
		</Layout>
	);
}
