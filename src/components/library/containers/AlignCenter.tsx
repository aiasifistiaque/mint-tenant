import { Flex, FlexProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

type AlignCenterProps = FlexProps & {
	children: ReactNode;
};

const AlignCenter: FC<AlignCenterProps> = ({ children, ...props }) => {
	return (
		<Flex
			align='center'
			{...props}>
			{children}
		</Flex>
	);
};

export default AlignCenter;
