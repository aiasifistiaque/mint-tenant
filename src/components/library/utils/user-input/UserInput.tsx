'use client';
import { FC } from 'react';
import { Input, InputProps, Stack } from '@chakra-ui/react';
import { HelperText, FormControl } from '../..';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string;
	placeholder?: any;
};

const UserInput: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	...props
}) => {
	// const borderColor = useColorModeValue('brand.500', 'brand.200');

	return (
		<FormControl
			isRequired={isRequired}
			gap={4}>
			<Stack
				gap={2}
				w='full'>
				{/* <Label>{label}</Label> */}

				<Stack
					gap={1}
					w='full'>
					<Input
						h='64px'
						px={3}
						borderColor='border.muted'
						borderRadius='sm'
						// focusBorderColor={'#555'}
						color='fg'
						bg='bg.muted'
						placeholder={label}
						_placeholder={{ fontSize: 16, fontWeight: '500', letterSpacing: '1px', color: 'fg.subtle' }}
						value={value}
						{...props}
					/>

					{helper && <HelperText>{helper}</HelperText>}
				</Stack>
			</Stack>
		</FormControl>
	);
};

export default UserInput;
