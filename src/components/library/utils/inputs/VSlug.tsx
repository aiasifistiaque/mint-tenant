'use client';

import { FC } from 'react';
import { InputProps } from '@chakra-ui/react';
import { FormControl } from '../..';
import { Input } from '.';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string;
	placeholder?: any;
	onChange: any;
	// FormInput hands these to every field input; stripped before the DOM spread.
	formData?: any;
	setFormData?: any;
	setChangedData?: any;
};

const VSlug: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	onChange,
	// FormInput's form-state props — not DOM attributes, so keep them out of `...props`.
	formData: _formData,
	setFormData: _setFormData,
	setChangedData: _setChangedData,
	...props
}) => {
	const handleChange = (e: any) => {
		const lowerCaseValue = e.target.value.toLowerCase().replace(/\s/g, '-');
		onChange({
			target: {
				name: props.name,
				value: lowerCaseValue,
			},
		});
	};
	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}>
			<Input
				placeholder={placeholder ? placeholder : label}
				value={value}
				onChange={handleChange}
				{...props}
			/>
		</FormControl>
	);
};

export default VSlug;
