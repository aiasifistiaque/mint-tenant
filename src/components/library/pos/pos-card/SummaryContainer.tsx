import { ReactNode } from 'react';

import { Flex, FlexProps } from '@chakra-ui/react';

const HEIGHT = 'calc(100vh - 52px)';

const SummaryContainer = ({ children, ...props }: FlexProps & { children: ReactNode }) => {
	return (
		<Flex
			flexDir='column'
			display={{ base: 'none', md: 'flex' }}
			h={HEIGHT}
			bg='bg.panel'
			w='350px'
			_dark={{ bg: 'background.dark' }}
			_light={{
				borderLeft: '1px solid',
				borderLeftColor: 'container.borderLight',
			}}
			{...props}>
			{children}
		</Flex>
	);
};

export default SummaryContainer;
