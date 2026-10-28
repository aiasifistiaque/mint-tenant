'use client';

import { useParams } from 'next/navigation';
import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import ReturnPage from '@/components/library/commerce/orders/ReturnPage';
import { useGetCommerceSettingsQuery } from '@/components/library/store/services/commerceApi';

/** One return's page (backend docs/ecommerce EC-09). */
export default function StoreReturnPage() {
	const { id }: { id: string } = useParams();
	const { data } = useGetCommerceSettingsQuery();
	return (
		<Layout
			title='Return'
			path='store/returns'>
			<StoreGate>
				{data && (
					<ReturnPage
						id={id}
						store={data}
					/>
				)}
			</StoreGate>
		</Layout>
	);
}
