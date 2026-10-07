import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

const JsonView = ({ data, ...props }: BoxProps & { data: { [key: string]: any } }) => {
	return (
		<Box
			as='pre'
			fontSize='xs'
			overflow='auto'
			{...props}>
			{JSON.stringify(data, null, 2)}
		</Box>
	);
};

export default JsonView;
