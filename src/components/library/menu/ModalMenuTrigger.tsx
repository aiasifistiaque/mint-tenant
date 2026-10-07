import { Flex, FlexProps } from '@chakra-ui/react';
import { ReactNode } from 'react';

const ModalMenuTrigger = ({ children, ...props }: FlexProps & { children: ReactNode }) => {
	return (
		<Flex
			p={4}
			py={1}
			flex={1}
			{...props}>
			{children}
		</Flex>
	);
};

export default ModalMenuTrigger;
