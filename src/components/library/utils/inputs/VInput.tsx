'use client';

import { FC } from 'react';
import { InputProps } from '@chakra-ui/react';
import { FormControl, Input } from '.';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string | number | undefined;
	placeholder?: any;
	// FormInput hands these to every field input; stripped before the DOM spread.
	formData?: any;
	setFormData?: any;
	setChangedData?: any;
};

const VInput: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	// FormInput's form-state props — not DOM attributes, so keep them out of `...props`.
	formData: _formData,
	setFormData: _setFormData,
	setChangedData: _setChangedData,
	...props
}) => {
	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}>
			<Input
				size='sm'
				px={3}
				placeholder={placeholder ? placeholder : label}
				value={value}
				{...props}
			/>
		</FormControl>
	);
};

export default VInput;
