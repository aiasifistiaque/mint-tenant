'use client';

import { Layout } from '@/components/library';
import StoreSettings from '@/components/library/commerce/StoreSettings';
import StoreGate from '@/components/library/commerce/StoreGate';

export default function Page() {
	return (
		<Layout
			title='Payment settings'
			path='store/settings/payments'>
			<StoreGate>
				<StoreSettings page='payments' />
			</StoreGate>
		</Layout>
	);
}
