'use client';
import { FC } from 'react';
import { FormControl, SelectContainer, useGetSelectDataQuery } from '../..';

type InputContainerProps = any & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: any;
	model: string;
	placeholder?: any;
	valueKey?: string;
	labelKey?: string;
};

const VDataSelect: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	model,
	valueKey = '_id',
	labelKey = 'name',
	// FormInput's form-state props — not DOM attributes, so keep them out of `...props`.
	formData: _formData,
	setFormData: _setFormData,
	setChangedData: _setChangedData,
	...props
}) => {
	const { data } = useGetSelectDataQuery(model);
	const selectValue = typeof value === 'object' && value !== null ? value?._id : value;

	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}>
			<SelectContainer
				value={selectValue}
				{...props}>
				{data?.doc?.map((item: any, i: number) => (
					<option
						key={i}
						value={item?.[valueKey]}>
						{item?.[labelKey]}
					</option>
				))}
			</SelectContainer>
		</FormControl>
	);
};

export default VDataSelect;
