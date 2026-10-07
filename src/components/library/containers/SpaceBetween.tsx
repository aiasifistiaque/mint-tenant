import { Flex, FlexProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

type FlexPropsType = FlexProps & {
	children?: ReactNode;
};

//Migration checked

const SpaceBetween: FC<FlexPropsType> = ({ children, ...props }) => {
	return (
		<Flex
			w='100%'
			alignItems='flex-start'
			justifyContent='space-between'
			gap={2}
			{...props}>
			{children}
		</Flex>
	);
};

export default SpaceBetween;
