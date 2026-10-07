import { ReactNode } from 'react';
import { Flex as FlexComponent, FlexProps } from '@chakra-ui/react';

const Flex = ({ children, ...props }: FlexProps & { children?: ReactNode }) => {
	return <FlexComponent {...props}>{children}</FlexComponent>;
};

export default Flex;
