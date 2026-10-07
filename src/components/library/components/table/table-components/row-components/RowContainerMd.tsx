import { FC, ReactNode } from 'react';
import { Table, TextProps } from '@chakra-ui/react';
import { theme } from '../../../..';

const { TABLE } = theme;

type RowContainerMdProps = TextProps & {
	children: ReactNode;
};

const RowContainerMd: FC<RowContainerMdProps> = ({ children, ...props }) => {
	return (
		<Table.Row
			h={TABLE.row.height}
			bg='table.row.light'
			transition='background-color .12s ease'
			_hover={{
				bg: TABLE.row.hover.light,
				_dark: { bg: TABLE.row.hover.dark },
			}}
			_dark={{
				bg: 'table.row.dark',
				borderBottomColor: 'table.innerBorder.dark',
			}}
			_notLast={{
				borderBottom: '1px solid',
				borderBottomColor: 'table.innerBorder.light',
				_dark: {
					borderBottomColor: 'table.innerBorder.dark',
				},
			}}
			{...props}>
			{children}
		</Table.Row>
	);
};

export default RowContainerMd;
