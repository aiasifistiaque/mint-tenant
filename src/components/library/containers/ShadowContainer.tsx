import { Flex, FlexProps } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { sizes, shadow, radius } from '..';

const ShadowContainer = ({ children, ...props }: FlexProps & { children?: ReactNode }) => {
	return (
		<Flex
			flexDir='column'
			boxShadow={shadow.DASH}
			bg='background.light'
			_light={{
				borderColor: 'container.borderLight',
			}}
			_dark={{
				bg: 'menu.dark',
			}}
			borderRadius={radius.CONTAINER}
			gap={4}
			borderWidth={1}
			p={4}
			{...props}>
			{children}
		</Flex>
	);
};

export default ShadowContainer;
