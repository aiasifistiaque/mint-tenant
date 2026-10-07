import { ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';

const CartPriceContainer = ({ children }: { children: ReactNode }) => {
	return (
		<Flex
			flexDir='column'
			p={2}
			m={2}
			mt={0}
			border='1px dashed'
			borderRadius={8}
			bg='bg.subtle'
			_dark={{
				bg: 'sidebar.dark',
				borderColor: 'stroke.deepD',
			}}
			borderColor='stroke.deepL'>
			{children}
		</Flex>
	);
};

export default CartPriceContainer;
