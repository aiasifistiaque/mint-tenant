import { FlexProps, Flex } from '@chakra-ui/react';
import { ReactNode } from 'react';

const HEIGHT = 'calc(100vh - 52px)';

const CartContainer = ({ children, ...props }: FlexProps & { children: ReactNode }) => {
	return (
		<Flex
			flexDir='column'
			h={`calc(${HEIGHT} - 160px)`}
			overflowY='scroll'
			borderTopWidth={1}
			borderColor='stroke.deepL'
			_dark={{
				borderColor: 'stroke.deepD',
			}}
			{...props}>
			{children}
		</Flex>
	);
};

export default CartContainer;
