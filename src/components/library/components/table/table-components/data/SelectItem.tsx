'use client';

import { TableCellProps, Checkbox } from '@chakra-ui/react';
import { useState, FC, useEffect } from 'react';

import { selectItem } from '../../../../store';
import { useAppDispatch, useAppSelector } from '../../../../hooks';

// Define the type for the props of the TableData component
type TableDataPropsType = TableCellProps & {
	id: string;
	isMobile?: boolean;
};

const SelectItem: FC<TableDataPropsType> = ({ id, ...props }) => {
	const [checked, setChecked] = useState(false);

	const { selectedItems }: any = useAppSelector(state => state.table);
	const dispatch = useAppDispatch();

	const handleCheck = (e: any) => {
		dispatch(selectItem({ id, isSelected: e.checked }));
		setChecked(e.checked);
	};

	useEffect(() => {
		const isSelected = selectedItems.includes(id);
		setChecked(isSelected);
	}, [selectedItems]);

	return (
		<Checkbox.Root
			size={'md'}
			checked={selectedItems.includes(id)}
			onCheckedChange={handleCheck}>
			<Checkbox.HiddenInput />
			<Checkbox.Control>
				<Checkbox.Indicator />
			</Checkbox.Control>
		</Checkbox.Root>
	);
};

export default SelectItem;
