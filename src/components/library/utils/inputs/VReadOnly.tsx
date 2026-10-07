'use client';

import { FC } from 'react';
import { InputProps, Stack, Text } from '@chakra-ui/react';
import { Label, HelperText, FormControl } from '../..';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string | number | undefined;
	placeholder?: any;
};

const VReadOnly: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	...props
}) => {
	return (
		<FormControl
			isRequired={isRequired}
			gap={4}>
			<Stack
				gap={2}
				w='full'>
				<Label>{label}</Label>

				<Stack
					gap={1}
					w='full'
					px={3}>
					<Text>{value}</Text>

					{helper && <HelperText>{helper}</HelperText>}
				</Stack>
			</Stack>
		</FormControl>
	);
};

export default VReadOnly;
