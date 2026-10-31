'use client';

import { Suspense } from 'react';
import { Box, Skeleton } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '@/components/library';
import StoreGate from '@/components/library/commerce/StoreGate';
import { ConnectPage } from '@/components/library/commerce/couriers/CourierList';

const Body = () => {
	const id = useSearchParams().get('courier') || '';
	return (
		<Box
			w='full'
			maxW='760px'
			mx='auto'>
			<ConnectPage id={id} />
		</Box>
	);
};

/** A phone's "Connect a courier": the steps and keys as a page of its own. */
export default function ConnectCourierPage() {
	return (
		<Layout
			title='Connect a courier'
			path='store/settings/delivery'>
			<StoreGate>
				<Suspense fallback={<Skeleton h='320px' />}>
					<Body />
				</Suspense>
			</StoreGate>
		</Layout>
	);
}
