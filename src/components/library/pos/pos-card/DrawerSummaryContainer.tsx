import { ReactNode } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';

const HEIGHT = 'calc(100vh - 52px - 52px)';

const DrawerSummaryContainer = ({ children, ...props }: FlexProps & { children: ReactNode }) => {
	return (
		<Flex
			flexDir='column'
			h={HEIGHT}
			bg='bg.panel'
			_dark={{ bg: 'background.dark' }}
			{...props}>
			{children}
		</Flex>
	);
};

export default DrawerSummaryContainer;
