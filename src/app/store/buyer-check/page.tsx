'use client';

import { Suspense } from 'react';
import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import BuyerLookupPage from '@/components/library/commerce/couriers/BuyerLookupPage';
import { useGetCommerceSettingsQuery } from '@/components/library/store/services/commerceApi';

/** Check a buyer: any phone's delivery record (backend docs/couriers CR-23). */
export default function StoreBuyerCheckPage() {
	const { data } = useGetCommerceSettingsQuery();
	return (
		<Layout
			title='Check a buyer'
			path='store/buyer-check'>
			<StoreGate>
				<Suspense>{data && <BuyerLookupPage store={data} />}</Suspense>
			</StoreGate>
		</Layout>
	);
}
