import { FC } from 'react';
import { Center } from '@chakra-ui/react';

const AlignBox: FC<any> = ({ children, isSelected, ...props }) => {
	return (
		<Center
			p={2}
			h='32px'
			w='44px'
			fontSize='13px'
			fontWeight='600'
			borderWidth={2}
			cursor='pointer'
			borderColor={isSelected ? 'fg' : 'border'}
			borderRadius='md'
			{...props}>
			{children}
		</Center>
	);
};

export default AlignBox;
