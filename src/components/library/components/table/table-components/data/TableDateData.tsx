import moment from 'moment';
import { FC, ReactNode } from 'react';
import { CustomTd } from '.';
import { TableCellProps } from '@chakra-ui/react';

type ComponentProps = TableCellProps & {
	children: any;
};

const TableData: FC<ComponentProps> = ({ children, ...props }) => {
	return (
		<CustomTd
			fontSize='.7rem'
			{...props}>
			{moment(children).calendar()}
		</CustomTd>
	);
};

export default TableData;
