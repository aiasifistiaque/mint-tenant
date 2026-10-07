'use client';

import { FC } from 'react';
import {
	Input,
	InputProps,
	Flex,
} from '@chakra-ui/react';
import { FormControl } from '..';
import Dropdown from '../../../cl/Dropdown';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string | number | undefined;
	placeholder?: any;
	options: number[];
	// FormInput hands these to every field input; stripped before the DOM spread.
	formData?: any;
	setFormData?: any;
	setChangedData?: any;
};

const VFontSize: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	options,
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
			<Flex {...inputGroupCss}>
				<Input
					{...inputCss}
					placeholder={placeholder ? placeholder : label}
					value={value}
					{...props}
				/>

				<Dropdown
					{...selectCss}
					hideValue
					value=''
					onChange={v => props.onChange?.({ target: { name: props.name, value: v } } as any)}>
					{options.map((option: any, i: number) => (
						<option
							key={i}
							value={option}>
							{option}
						</option>
					))}
				</Dropdown>
			</Flex>
		</FormControl>
	);
};

const inputGroupCss: any = {
	borderRadius: 'lg',
	size: 'sm',
	alignItems: 'center',
};

const inputCss: any = {
	px: 3,
	borderLeftRadius: 'lg',
	borderRightWidth: 0,
};

const selectCss: any = {
	w: '44px',
	flexShrink: 0,
};

//const options = [10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 32, 36, 40, 48, 64, 96, 128];

export default VFontSize;
