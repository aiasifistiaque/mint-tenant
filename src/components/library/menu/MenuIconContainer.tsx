import { Center, FlexProps } from '@chakra-ui/react';
import React from 'react';

const MenuIconContainer = ({ children, ...props }: any) => {
	return (
		<Center
			{...styles}
			{...props}>
			{children}
		</Center>
	);
};

const styles: FlexProps = {
	boxSize: '32px',
	cursor: 'pointer',
	borderRadius: 'full',
	border: '1.5px solid',
	_light: {
		borderColor: 'border.light',
		_hover: {
			bg: 'border.light',
		},
	},
	_dark: {
		bg: 'background.dark',
		borderColor: 'border.dark',
		_hover: {
			bg: 'border.dark',
		},
	},
};

export default MenuIconContainer;
