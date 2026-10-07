import { FC, ReactNode } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';

const ColRow: FC<FlexProps & { children: ReactNode }> = ({ children, ...props }) => {
	return (
		<Flex
			flexDir={{ base: 'column', md: 'row' }}
			gap={1}
			w='full'
			{...props}>
			{children}
		</Flex>
	);
};

export default ColRow;
