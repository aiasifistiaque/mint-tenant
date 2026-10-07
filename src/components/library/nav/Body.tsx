import { Flex, FlexProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

type FlexPropsType = FlexProps & {
	children: ReactNode;
};

const Body: FC<FlexPropsType> = ({ children, ...props }) => {
	return (
		<Flex
			w='100%'
			minH='100vh'
			{...props}>
			{children}
		</Flex>
	);
};

export default Body;
