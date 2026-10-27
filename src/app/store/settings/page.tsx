'use client';

import { Layout } from '@/components/library';
import StoreSettings from '@/components/library/commerce/StoreSettings';
import StoreGate from '@/components/library/commerce/StoreGate';

/** A built store's settings (backend docs/ecommerce EC-04): the wizard's answers, a card each. */
export default function StoreSettingsPage() {
	return (
		<Layout
			title='Store settings'
			path='store/settings'>
			<StoreGate>
				<StoreSettings />
			</StoreGate>
		</Layout>
	);
}
