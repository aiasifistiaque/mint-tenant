'use client';

import { TableCellProps, Flex } from '@chakra-ui/react';
import { Checkbox } from '@chakra-ui/react';
import { useState, FC, useEffect } from 'react';
import { CustomTd } from '.';
import { selectItem } from '../../../../store';
import { useAppDispatch, useAppSelector } from '../../../../hooks';

// Define the type for the props of the TableData component
type TableDataPropsType = TableCellProps & {
	id: string;
	isMobile?: boolean;
};

const TableSelectItem: FC<TableDataPropsType> = ({ id, isMobile = false, ...props }) => {
	const [checked, setChecked] = useState(false);

	const { selectedItems }: any = useAppSelector(state => state.table);
	const dispatch = useAppDispatch();

	const handleCheck = (details: any) => {
		dispatch(selectItem({ id, isSelected: details.checked }));
		setChecked(details.checked);
	};

	useEffect(() => {
		const isSelected = selectedItems.includes(id);
		setChecked(isSelected);
	}, [selectedItems]);

	return (
		<>
			<CustomTd
				type='selectMenu'
				mb={{ base: -4, md: 0 }}
				alignItems='center'
				{...props}>
				<Checkbox.Root
					size='sm'
					checked={selectedItems.includes(id)}
					onCheckedChange={handleCheck}>
					<Checkbox.HiddenInput />
					<Checkbox.Control />
				</Checkbox.Root>
			</CustomTd>
			{isMobile && <Flex h={0}>{null}</Flex>}
		</>
	);
};

export default TableSelectItem;
