'use client';

import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import ReturnsPage from '@/components/library/commerce/orders/ReturnsPage';
import { useGetCommerceSettingsQuery } from '@/components/library/store/services/commerceApi';

/** The store's Returns (backend docs/ecommerce EC-09). */
export default function StoreReturnsPage() {
	const { data } = useGetCommerceSettingsQuery();
	return (
		<Layout
			title='Returns'
			path='store/returns'>
			<StoreGate>{data && <ReturnsPage store={data} />}</StoreGate>
		</Layout>
	);
}
