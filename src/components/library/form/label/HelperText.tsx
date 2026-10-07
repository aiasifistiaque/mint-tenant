import { Text, TextProps } from '@chakra-ui/react';
import { FC } from 'react';

type HelperTextProps = TextProps & {
	children: string;
};

const HelperText: FC<HelperTextProps> = ({ children, ...props }) => {
	return (
		<Text
			color='fg.muted'
			fontSize='12px'
			lineHeight='1.45'
			{...props}>
			{children}
		</Text>
	);
};

export default HelperText;
