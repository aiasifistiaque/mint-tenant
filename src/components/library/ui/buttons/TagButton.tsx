import React from 'react';
import { Tag } from '@chakra-ui/react';

const TagButton = ({ children, ...props }: any & { children: React.ReactNode }) => {
	return (
		<Tag.Root
			cursor='pointer'
			size='md'
			bg='transparent'
			borderWidth={1}
			borderColor='border'
			color='fg.muted'
			borderRadius='full'
			px={2.5}
			transitionProperty='background-color, border-color, color'
			transitionDuration='120ms'
			_hover={{ bg: 'bg.subtle', borderColor: 'border.emphasized', color: 'fg' }}
			{...props}>
			<Tag.Label>{children}</Tag.Label>
		</Tag.Root>
	);
};
export default TagButton;
