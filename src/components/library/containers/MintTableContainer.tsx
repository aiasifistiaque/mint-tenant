import { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';

import { radius, shadow } from '..';

// const MintTableContainer = ({ children }: { children: ReactNode }) => (
// 	<TableContainer
// 		bg={{ base: 'transparent', md: 'menu.light' }}
// 		_dark={{ bg: { base: 'transparent', md: 'menu.dark' } }}
// 		p={{ base: 0, md: 4 }}
// 		borderRadius={sizes.CARD_RADIUS}
// 		boxShadow={{ base: 'none', md: shadow.CARD }}
// 		borderWidth={{ base: 0, md: 1 }}>
// 		{children}
// 	</TableContainer>
// );

const MintTableContainer = ({ children }: { children: ReactNode }) => (
	<Box
		bg={'background.light'}
		borderColor={'container.borderLight'}
		p={{ base: 4, md: 4 }}
		borderRadius={radius.CONTAINER}
		boxShadow={shadow.DASH}
		borderWidth={1}
		overflowX='auto'>
		{children}
	</Box>
);

export default MintTableContainer;
