import { FlexProps, Flex } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

type TableSearchContainerProps = FlexProps & {
	children: ReactNode;
};

const TableSearchContainer: FC<TableSearchContainerProps> = ({ children, ...props }) => {
	return (
		<Flex
			w={{ base: '100%', md: 'auto' }}
			align='center'
			gap={1.8}
			{...props}>
			{children}
		</Flex>
	);
};

export default TableSearchContainer;
