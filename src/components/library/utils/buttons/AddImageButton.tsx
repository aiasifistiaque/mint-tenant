import { ReactNode, FC } from 'react';
import { Center, CenterProps, FlexProps, Heading } from '@chakra-ui/react';
import { Icon } from '../..';
import { motion } from 'framer-motion';

type AddImageButtonProps = CenterProps & {
	children?: ReactNode;
	size?: string;
};

const AddImageButton: FC<AddImageButtonProps> = ({ children, size, ...props }) => {
	return (
		<Center
			as={motion.div}
			cursor='pointer'
			flexDir='column'
			h={size || '100px'}
			w={size || '100px'}
			border='2px dashed'
			borderColor='border.emphasized'
			borderRadius='8px'
			color='fg.subtle'
			userSelect='none'
			gap={2}
			{...props}>
			<Icon
				name='add-image'
				size={30}
			/>
			<Heading
				color='fg.subtle'
				size='xs'>
				{children || 'Add Image'}
			</Heading>
		</Center>
	);
};

export default AddImageButton;
