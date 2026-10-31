'use client';

import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import DeliveriesPage from '@/components/library/commerce/couriers/DeliveriesPage';
import { useGetCommerceSettingsQuery } from '@/components/library/store/services/commerceApi';

/** The store's Deliveries (backend docs/couriers CR-07). */
export default function StoreDeliveriesPage() {
	const { data } = useGetCommerceSettingsQuery();
	return (
		<Layout
			title='Deliveries'
			path='store/deliveries'>
			<StoreGate>{data && <DeliveriesPage store={data} />}</StoreGate>
		</Layout>
	);
}
