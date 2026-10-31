'use client';

import { Layout } from '@/components/library';
import StoreSettings from '@/components/library/commerce/StoreSettings';
import StoreGate from '@/components/library/commerce/StoreGate';

export default function Page() {
	return (
		<Layout
			title='Printer settings'
			path='store/settings/printer'>
			<StoreGate>
				<StoreSettings page='printer' />
			</StoreGate>
		</Layout>
	);
}
