import { FC, ReactNode } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';

type LayoutWrapperProps = FlexProps & {
	children: ReactNode;
};

const LayoutWrapper: FC<LayoutWrapperProps> = ({ children, ...props }) => {
	return (
		<Flex
			bg='navbar.light'
			_dark={{ bg: 'navbar.dark' }}
			w='100%'
			flex={1}
			{...props}>
			{children}
		</Flex>
	);
};

export default LayoutWrapper;
