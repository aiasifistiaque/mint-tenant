import { FC, ReactNode } from 'react';
import { Table } from '@chakra-ui/react';
import { useIsMobile } from '../../../..';

const Td: FC<{ children: ReactNode }> = ({ children }) => {
	const isMobile = useIsMobile();
	return <Table.Cell>{children}</Table.Cell>;
};

export default Td;
