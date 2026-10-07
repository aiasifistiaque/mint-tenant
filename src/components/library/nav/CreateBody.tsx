import { Flex, FlexProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';
import { THEME } from '..';

type FlexPropsType = FlexProps & {
	children?: ReactNode;
};

const CreateBody: FC<FlexPropsType> = ({ children, ...props }) => {
	return (
		<Flex
			flexDir='column'
			w='100%'
			pt={10}
			minH='100vh'
			bg={THEME == 'basic' ? 'bg.muted' : 'background.light'}
			_dark={{ bg: 'sidebar.dark' }}
			px={6}
			justify='center'
			{...props}>
			{children}
		</Flex>
	);
};

export default CreateBody;
