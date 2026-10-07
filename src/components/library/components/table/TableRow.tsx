'use client';

import { ReactNode, FC } from 'react';
import { Table } from '@chakra-ui/react';
import { RowContainerBase, RowContainerMd, TableSelectItem } from '../../components/table';
import { useIsCardView } from '../../hooks';

type TableRowProps = {
	children: ReactNode;
	actions?: ReactNode;
	selectable?: boolean;
	id?: string;
};

// type SelectableTableRowProps = {
// 	selectable: true;
// 	id: string;
// };

const TableRow: FC<TableRowProps> = ({ children, actions, selectable, id, ...props }) => {
	const isCardView = useIsCardView();

	const row = (
		<>
			{selectable && (
				<TableSelectItem
					id={id || ''}
					isMobile={isCardView}
				/>
			)}
			{children}
		</>
	);

	if (isCardView) {
		// The card is a <div> grid, which can't sit directly inside <tbody> —
		// a <tr>/<td> pair around it keeps the table valid HTML (and avoids
		// the hydration mismatch that nesting produced) without giving up the
		// grid layout the card relies on.
		return (
			<Table.Row border='none'>
				<Table.Cell
					colSpan={100}
					p={0}
					border='none'>
					<RowContainerBase {...props}>{row}</RowContainerBase>
				</Table.Cell>
			</Table.Row>
		);
	}

	return <RowContainerMd {...props}>{row}</RowContainerMd>;
};

export default TableRow;
