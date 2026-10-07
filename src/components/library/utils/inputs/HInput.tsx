import { FC } from 'react';
import { Input } from '@chakra-ui/react';
import { styles, HInputProps } from './util';

import { InputContainer } from '../..';

const HInput: FC<HInputProps> = ({ label, isRequired, placeholder, value, ...props }) => {
	return (
		<InputContainer
			label={label}
			isRequired={isRequired}>
			<Input
				css={styles.input}
				placeholder={placeholder ? placeholder : label}
				value={value}
				required={isRequired}
				{...props}
			/>
		</InputContainer>
	);
};

export default HInput;
