import { ReactNode } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';

const Container = ({ children, ...props }: FlexProps & { children: ReactNode }) => (
	<Flex
		flexDir='column'
		w='full'
		pr={3}
		py={2}
		borderTop='1px dashed'
		borderTopColor='border.emphasized'
		_dark={{ borderTopColor: 'stroke.deepD' }}
		{...props}>
		{children}
	</Flex>
);

export default Container;
