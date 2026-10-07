'use client';
import { ChangeEvent, FC, useState, CSSProperties, ReactNode } from 'react';

import { CustomTd } from '.';
import { Switch } from '@chakra-ui/react';
import { useUpdateByIdMutation } from '../../../../store';
import { useCustomToast } from '../../../..';

import RowInput from '../row-components/RowInput';
import RowSelect from '../row-components/RowSelect';

// Define the props type for better readability
type EditableTableDataProps = {
	path: string;
	value: any;
	type?: string;
	id: string;
	dataKey: string;
	editType?: string;
	options?: { label: string; value: string }[];
	style?: CSSProperties; // Use CSSProperties for style prop type
};

const EditableTableData: FC<EditableTableDataProps> = props => {
	const { path, value, id, dataKey, type, editType, options, style } = props;

	const [val, setVal] = useState(value);
	const [trigger, result] = useUpdateByIdMutation();
	// const borderColor = useColorModeValue('brand.200', 'brand.200');

	useCustomToast({
		isError: result?.isError,
		isSuccess: result?.isSuccess,
		error: result?.error,
		successText: 'Information Updated',
		isLoading: result?.isLoading,
	});

	const handleSwitch = (e: any) => {
		setVal(e.checked);
		trigger({ path, id, body: { [dataKey]: e.checked } });
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setVal(e.target.value);
		trigger({ path, id, body: { [dataKey]: e.target.value } });
	};

	const renderSwitch = () => (
		<Switch.Root
			checked={val}
			colorPalette='brand'
			size={{ base: 'lg', md: 'sm' }}
			onCheckedChange={handleSwitch}>
			<Switch.HiddenInput />
			<Switch.Control>
				<Switch.Thumb />
			</Switch.Control>
		</Switch.Root>
	);

	const renderSelect = () => (
		<RowSelect
			value={val}
			onChange={handleChange}>
			{options?.map(({ label, value }) => (
				<option
					key={value}
					value={value}>
					{label}
				</option>
			))}
		</RowSelect>
	);

	const renderInput = () => (
		<RowInput
			type={editType || 'text'}
			// focusBorderColor={borderColor}
			value={val}
			css={style}
			onChange={handleChange}
		/>
	);

	return (
		<CustomTd>
			{type === 'boolean' ? renderSwitch() : editType === 'select' ? renderSelect() : renderInput()}
		</CustomTd>
	);
};

export default EditableTableData;
