import { FC, ReactNode } from 'react';
import { Table, FlexProps } from '@chakra-ui/react';

type TableHeadProps = any & {
	children: ReactNode;
	onClick?: () => void;
	type?: string;
};

export const TableHead: FC<TableHeadProps> = ({ children, onClick, ...props }) => {
	return <Table.ColumnHeader {...props}>{children}</Table.ColumnHeader>;
};

export default TableHead;
