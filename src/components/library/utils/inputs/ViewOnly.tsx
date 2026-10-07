import { FC } from 'react';
import { TextProps, Text } from '@chakra-ui/react';
import { FormControl } from '../..';

type InputContainerProps = TextProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string;
	placeholder?: any;
};

const ViewOnly: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	...props
}) => {
	return (
		<FormControl
			label={label}
			isRequired={isRequired}
			helper={helper}>
			<Text {...props}>{value || '...'}</Text>
		</FormControl>
	);
};

export default ViewOnly;
