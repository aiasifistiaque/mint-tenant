'use client';

import { FC } from 'react';
import { Skeleton, Text } from '@chakra-ui/react';
import { useGetCommerceSettingsQuery } from '../store/services/commerceApi';

/** The store's setup wizard (backend docs/ecommerce EC-04) — its steps come in EC-04. */
const StoreSetup: FC = () => {
	const { data, isLoading } = useGetCommerceSettingsQuery();
	if (isLoading || !data) return <Skeleton h='200px' />;
	return <Text color='fg.muted'>Your store is {data.status === 'ready' ? 'set up' : 'not set up yet'}.</Text>;
};

export default StoreSetup;
