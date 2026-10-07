import { ReactNode, FC } from 'react';
import { Center, CenterProps, Heading } from '@chakra-ui/react';
import { Icon } from '../..';

type AddImageButtonProps = CenterProps & {
	children?: ReactNode;
	size?: string;
};

const DEFAULT_IMAGE_SIZE = '100px';

const AddSectionButton: FC<AddImageButtonProps> = ({ children, size, ...props }) => {
	return (
		<Center
			cursor='pointer'
			flexDir='column'
			h={size || DEFAULT_IMAGE_SIZE}
			w='full'
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

export default AddSectionButton;
