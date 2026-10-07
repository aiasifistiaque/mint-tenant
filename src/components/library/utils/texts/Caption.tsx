import { Text, TextProps } from '@chakra-ui/react';
import React, { ReactNode } from 'react';

const Caption = ({ children, ...props }: TextProps & { children: ReactNode }) => {
	return (
		<Text
			{...textCss}
			{...props}>
			{children}
		</Text>
	);
};

const textCss: TextProps = {
	wordBreak: 'break-all',
	fontSize: '.83rem',
	fontWeight: '600',
	lineClamp: 1,
};

export default Caption;
