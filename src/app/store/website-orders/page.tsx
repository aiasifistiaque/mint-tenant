'use client';

import { Suspense } from 'react';
import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import OrdersPage from '@/components/library/commerce/orders/OrdersPage';
import { useGetCommerceSettingsQuery } from '@/components/library/store/services/commerceApi';

/** The store's website orders (backend docs/ecommerce EC-24): the same orders as the POS's, from the website, with where they go. */
export default function StoreWebsiteOrdersPage() {
	const { data } = useGetCommerceSettingsQuery();
	return (
		<Layout
			title='Website orders'
			path='store/website-orders'>
			<StoreGate>
				<Suspense>{data && (
					<OrdersPage
						store={data}
						website
					/>
				)}</Suspense>
			</StoreGate>
		</Layout>
	);
}
