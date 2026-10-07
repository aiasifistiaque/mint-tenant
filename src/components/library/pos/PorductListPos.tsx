'use client';
import { Flex } from '@chakra-ui/react';

import { PosResultContainer, NoDataFound, useAppSelector, useGetAllQuery } from '../';

import { PosCard } from '.';
import PosCart from './PosCart';
import PosCartDrawer from './PosDrawerCart';

const PorductListPos = () => {
	const { page, limit, search, sort, filters } = useAppSelector((state: any) => state.table);

	const { data } = useGetAllQuery({
		page,
		limit,
		search,
		sort,
		filters,
		path: 'products',
	});

	// Render product cards
	const renderProductCards = data?.doc?.map((item: any, i: number) => (
		<PosCard
			key={i}
			item={item}
		/>
	));

	return (
		<>
			<Flex
				w='100%'
				display={{ base: 'grid', md: 'flex' }}
				gridTemplateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }}
				bg='sidebar.light'
				_dark={{ bg: 'sidebar.dark' }}
				flexWrap='wrap'
				gap={3}
				p={4}
				pt={0}
				pb={{ base: '160px', md: '64px' }}
				maxH={{ base: 'calc(100vh - 52px - 128px)', md: 'calc(100vh - 52px - 24px)' }}
				overflowY='scroll'
				justifyContent='space-between'>
				{renderProductCards}
				{data?.doc?.length === 0 && <NoDataFound />}
			</Flex>
			<PosResultContainer
				data={data}
				cart={data && <PosCartDrawer />}
			/>
		</>
	);
};

export default PorductListPos;
