import { Input, InputProps } from '@chakra-ui/react';
import { styles } from '../../../config';

const InputElement = ({ ...props }: InputProps) => {
	return (
		<Input
			size='sm'
			{...(styles.FIELD as InputProps)}
			{...props}
		/>
	);
};

export default InputElement;
