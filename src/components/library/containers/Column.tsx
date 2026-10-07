import { Flex, FlexProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

const Column: FC<FlexProps & { children: ReactNode }> = ({ children, ...props }) => {
	return (
		<Flex
			flexDir='column'
			gap={1}
			{...props}>
			{children}
		</Flex>
	);
};

export default Column;
