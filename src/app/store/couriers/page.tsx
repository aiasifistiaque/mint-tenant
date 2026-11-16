'use client';

import { Box } from '@chakra-ui/react';
import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import CourierList from '@/components/library/commerce/couriers/CourierList';

/**
 * The store's couriers on a page of their own — what a commerce panel's store
 * login opens (backend docs/commerce-panel D6): connect, test and remove its
 * courier accounts without the rest of Delivery settings.
 */
export default function CouriersPage() {
	return (
		<Layout
			title='Couriers'
			path='store/couriers'>
			<StoreGate>
				<Box
					w='full'
					maxW='760px'
					mx='auto'>
					<CourierList />
				</Box>
			</StoreGate>
		</Layout>
	);
}
