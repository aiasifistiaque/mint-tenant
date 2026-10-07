import { FC, ReactNode } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';

import { useIsMobile, useAppSelector } from '../../../..';

type ResultContainerProps = FlexProps & {
	children: ReactNode;
};

const StickyBottomContainer: FC<ResultContainerProps> = ({ children, ...props }) => {
	const { selectedItems } = useAppSelector(state => state.table);
	const isMobile = useIsMobile();

	if (selectedItems.length > 0) {
		return null;
	}

	return (
		<Flex
			borderTop='1px solid'
			borderTopColor='stroke.deepL'
			alignItems='center'
			justify='center'
			zIndex={10}
			gap={4}
			position='fixed'
			bottom={0}
			bg='container.light'
			_dark={{ bg: 'container.dark', borderTopColor: 'stroke.deepD' }}
			overflow='scroll'
			maxW='100%'
			fontSize='.9rem'
			// left={isMobile ? 0 : sizes.HOME_NAV_LEFT}
			// w={isMobile ? '100vw' : sizes.HOME_NAV_MAX_WIDTH}
			w='100%'
			px={isMobile ? 4 : 4}
			pb={isMobile ? 4 : 0}
			{...props}>
			{children}
		</Flex>
	);
};

export default StickyBottomContainer;
