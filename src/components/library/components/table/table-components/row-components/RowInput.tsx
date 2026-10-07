import { FC } from 'react';
import { Input, InputProps } from '@chakra-ui/react';

const RowInput: FC<InputProps> = ({ ...props }) => {
	return (
		<Input
			size={{ base: 'sm', md: 'xs' }}
			borderRadius='lg'
			color='fg'
			fontWeight='600'
			borderColor='selectBorder.light'
			_dark={{
				borderColor: 'selectBorder.dark',
			}}
			boxShadow='sm'
			w='100px'
			{...props}
		/>
	);
};

export default RowInput;
