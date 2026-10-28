'use client';

import { Suspense } from 'react';
import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import OrdersPage from '@/components/library/commerce/orders/OrdersPage';
import { useGetCommerceSettingsQuery } from '@/components/library/store/services/commerceApi';

/** The store's Orders (backend docs/ecommerce EC-09): the table with quick filters. */
export default function StoreOrdersPage() {
	const { data } = useGetCommerceSettingsQuery();
	return (
		<Layout
			title='Orders'
			path='store/orders'>
			<StoreGate>
				<Suspense>{data && <OrdersPage store={data} />}</Suspense>
			</StoreGate>
		</Layout>
	);
}
