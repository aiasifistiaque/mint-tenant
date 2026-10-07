import { InputProps } from '@chakra-ui/react';

export const styles = {
	input: {
		color: 'fg',
		border: 'none',
		borderRadius: 'none',
		_placeholder: { fontSize: 16, fontWeight: '500' },
		outline: 'none',
		_hover: { outline: '2px solid background.light' },
		px: 3,
	},
};

export type HInputProps = any & {
	label?: string;
	placeholder?: string;
	required?: boolean;
	name?: string;
	value?: any;
};
