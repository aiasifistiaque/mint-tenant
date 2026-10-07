'use client';
import { FC, ReactNode, useEffect, useState } from 'react';
import { Flex, FlexProps, Grid, Heading, Text } from '@chakra-ui/react';

import { sizes, currency, useAppSelector, Pagination, FlexChild, SpaceBetween } from '../..';
import OrderModal from '../../pos/OrderModal';
import CartDrawer from '../../pos/CartDrawer';

type ResultContainerProps = FlexProps & {
	data: any;
	cart?: ReactNode;
};

const PosResultContainer: FC<ResultContainerProps> = ({ data, cart, ...props }) => {
	const { cartItems, total } = useAppSelector(state => state.cart);
	const [count, setCount] = useState<number>(0);

	useEffect(() => {
		setCount(count + 1);
	}, [cartItems]);

	return (
		<Container {...props}>
			<Grid
				gridTemplateColumns={{ base: sizes.POS_RATIO_BASE, md: sizes.POS_RATIO }}
				w='full'
				alignItems='center'
				h='100%'>
				<SpaceBetween
					gap={4}
					w='full'
					px={6}>
					<Text>
						<b>{data?.totalDocs}</b> results
					</Text>
					<Pagination data={data && data} />
				</SpaceBetween>
				<Flex
					display={{ base: 'flex', md: 'none' }}
					flex={1}
					justify='flex-end'
					px={2}>
					<CartDrawer
						cart={cart || <></>}
						footer={
							<SpaceBetween
								pl={4}
								w='350px'
								flex={1}
								h='100%'>
								<Heading size='sm'>Total: {`${currency.symbol}${total?.toLocaleString()}`}</Heading>
								<OrderModal />
							</SpaceBetween>
						}
					/>
				</Flex>
				<Footer>
					<Heading size='sm'>Total: {`${currency.symbol}${total?.toLocaleString()}`}</Heading>
					<OrderModal />
				</Footer>
			</Grid>
		</Container>
	);
};

const Footer = ({ children }: FlexChild) => (
	<Flex
		display={{ base: 'none', md: 'flex' }}
		pl={4}
		w='350px'
		justify='space-between'
		align='center'
		flex={1}
		h='100%'>
		{children}
	</Flex>
);

const Container = ({ children, ...props }: FlexChild) => (
	<Flex
		align='center'
		borderTop='1px solid'
		borderTopColor='stroke.deepL'
		zIndex={10}
		position='fixed'
		bottom={0}
		left={0}
		bg='container.light'
		w='full'
		_dark={{ bg: 'container.dark', borderTopColor: 'stroke.deepD' }}
		overflow='scroll'
		fontSize='.9rem'
		h='52px'
		{...props}>
		{children}
	</Flex>
);

export default PosResultContainer;
