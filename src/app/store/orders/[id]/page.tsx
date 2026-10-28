'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import OrderPage from '@/components/library/commerce/orders/OrderPage';
import { useGetCommerceSettingsQuery } from '@/components/library/store/services/commerceApi';

/** One order's page (backend docs/ecommerce EC-09). */
export default function StoreOrderPage() {
	const { id }: { id: string } = useParams();
	const { data } = useGetCommerceSettingsQuery();
	return (
		<Layout
			title='Order'
			path='store/orders'>
			<StoreGate>
				<Suspense>
					{data && (
						<OrderPage
							id={id}
							store={data}
						/>
					)}
				</Suspense>
			</StoreGate>
		</Layout>
	);
}
