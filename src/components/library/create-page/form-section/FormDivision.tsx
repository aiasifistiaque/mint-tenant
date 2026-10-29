import { FC, ReactNode } from 'react';
import { Flex, FlexProps, Grid } from '@chakra-ui/react';

type FormDivisionProps = FlexProps & {
	children: ReactNode;
	isModal?: boolean;
};

const FormDivision: FC<FormDivisionProps> = ({ children, isModal = false, ...props }) => {
	return (
		<Flex
			bg={isModal ? 'menu.light' : { base: 'transparent', md: 'bg.panel' }}
			boxShadow={isModal ? 'none' : { base: 'none', md: 'md' }}
			borderWidth={isModal ? 1 : { base: 0, md: 1 }}
			borderTopWidth={isModal ? 1 : { base: '1px', md: 1 }}
			_dark={{ bg: isModal ? 'menu.dark' : { base: 'transparent', md: 'background.dark' } }}
			p={isModal ? 4 : { base: 0, md: 4 }}
			pt={isModal ? 4 : { base: 4, md: 4 }}
			borderRadius={isModal ? '12px' : { base: 0, md: '12px' }}
			{...props}>
			<Grid
				templateColumns='repeat(2, 1fr)'
				gap={8}
				w='full'
				columnGap={4}>
				{children}
			</Grid>
		</Flex>
	);
};

export default FormDivision;
