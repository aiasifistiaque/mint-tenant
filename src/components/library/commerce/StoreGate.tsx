'use client';

import { FC, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Spinner } from '@chakra-ui/react';
import { projectHref } from '../config/lib/constants/panel';
import { useGetCommerceSettingsQuery } from '../store/services/commerceApi';

/**
 * An e-commerce project's pages before its store is built (backend
 * docs/ecommerce EC2): everything goes to the setup wizard until the store is
 * ready. `children` shows once it is.
 */
const StoreGate: FC<{ children: ReactNode }> = ({ children }) => {
	const router = useRouter();
	const { data } = useGetCommerceSettingsQuery();
	const ready = data?.status === 'ready';
	useEffect(() => {
		if (data && !ready) router.replace(projectHref('/store/setup'));
	}, [data, ready]);
	if (!ready)
		return (
			<Center py={20}>
				<Spinner size='sm' />
			</Center>
		);
	return <>{children}</>;
};

export default StoreGate;
