import { FC, ReactNode } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';

type ScrollProps = FlexProps & {
	children: ReactNode;
};

export const scrollContainerCss: FlexProps = {
	overflowX: 'hidden',
	w: '100%',
	overflowY: 'scroll',
	flexDir: 'column',
};

const Scroll: FC<ScrollProps> = ({ children, ...props }) => (
	<Flex
		{...scrollContainerCss}
		{...props}>
		{children}
	</Flex>
);

export default Scroll;
