import { ReactNode } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';

const BottomContainer = ({ children, ...props }: FlexProps & { children: ReactNode }) => (
	<Flex
		align='center'
		justify='space-between'
		w='full'
		py={2}
		borderTop='1px dashed'
		borderTopColor='border.emphasized'
		_dark={{ borderTopColor: 'stroke.deepD' }}
		{...props}>
		{children}
	</Flex>
);

export default BottomContainer;
