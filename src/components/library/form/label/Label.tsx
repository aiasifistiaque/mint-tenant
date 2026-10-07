import { Text, TextProps } from '@chakra-ui/react';
import { FC } from 'react';

type LabelProps = TextProps & {
	children: any;
};

const Label: FC<LabelProps> = ({ children, ...props }) => {
	return (
		<Text
			color='text.formLabel.light'
			_dark={{ color: 'text.formLabel.dark' }}
			userSelect='none'
			m={0}
			fontSize='13px'
			lineHeight='1.3'
			letterSpacing='-0.005em'
			fontWeight='600'
			{...props}>
			{children}
		</Text>
	);
};

export default Label;
