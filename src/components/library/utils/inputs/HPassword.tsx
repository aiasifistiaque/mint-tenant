'use client';

import { FC } from 'react';
import { PasswordInput } from '../../../../components/ui/password-input';
import { HInputProps } from './util';

import { InputContainer } from '../..';

const HPassword: FC<HInputProps> = ({ label, isRequired, placeholder, value, ...props }) => {
	return (
		<InputContainer
			label={label}
			isRequired={isRequired}>
			<PasswordInput
				placeholder={placeholder ? placeholder : label}
				value={value}
				{...props}
			/>
		</InputContainer>
	);
};

export default HPassword;
