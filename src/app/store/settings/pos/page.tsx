'use client';

import { Layout } from '@/components/library';
import StoreSettings from '@/components/library/commerce/StoreSettings';
import StoreGate from '@/components/library/commerce/StoreGate';

export default function Page() {
	return (
		<Layout
			title='POS settings'
			path='store/settings/pos'>
			<StoreGate>
				<StoreSettings page='pos' />
			</StoreGate>
		</Layout>
	);
}
