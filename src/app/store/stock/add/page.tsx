'use client';

import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import StockIn from '@/components/library/commerce/stock/StockIn';

/** Add stock: items received into an outlet on a day (backend docs/ecommerce). */
export default function AddStockPage() {
	return (
		<Layout
			title='Add stock'
			path='store/stock/add'>
			<StoreGate>
				<StockIn />
			</StoreGate>
		</Layout>
	);
}
