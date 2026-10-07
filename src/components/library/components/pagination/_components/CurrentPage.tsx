import { Center } from '@chakra-ui/react';
import { TextChild } from '../../../types';

const CurrentPage = ({ children }: TextChild) => (
	<Center
		h='30px'
		px={2.5}
		minW='90px'
		color='fg'
		fontWeight='500'
		fontSize='13px'
		whiteSpace='nowrap'
		userSelect='none'>
		{children}
	</Center>
);

export default CurrentPage;
