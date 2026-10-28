'use client';

import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import Pos from '@/components/library/commerce/pos/Pos';
import { useGetCommerceSettingsQuery } from '@/components/library/store/services/commerceApi';

/** The store's till (backend docs/ecommerce EC-07): full screen, no sidebar. */
export default function PosPage() {
	const { data } = useGetCommerceSettingsQuery();
	return (
		<Layout
			title='POS'
			path='store/pos'
			type='pos'
			fullBleed>
			<StoreGate>{data && <Pos store={data} />}</StoreGate>
		</Layout>
	);
}
