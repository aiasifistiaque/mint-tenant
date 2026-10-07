import { ReactNode } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';

const StaticPage = ({ children, ...props }: FlexProps & { children: ReactNode }) => {
	return (
		<Flex
			flexDir='column'
			pt={{ base: 4, md: 6 }}
			pb='32px'
			gap={{ base: 4, md: 8 }}
			{...props}>
			{children}
		</Flex>
	);
};

export default StaticPage;
