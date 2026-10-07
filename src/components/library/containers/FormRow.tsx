import { Flex, FlexProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

type FormRowProps = FlexProps & {
	children: ReactNode;
};

const FormRow: FC<FormRowProps> = ({ children, ...props }) => {
	return (
		<Flex
			gap={4}
			alignItems='center'
			{...props}>
			{children}
		</Flex>
	);
};

export default FormRow;
