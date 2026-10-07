import { Button, ButtonProps, IconButton } from '@chakra-ui/react';
import { Icon } from '../..';

const buttonStyle = {
	position: 'absolute',
	top: '2',
	right: '2',
};

const DeleteImageButton = ({ ...props }: ButtonProps) => {
	return (
		<IconButton
			css={buttonStyle}
			size='xs'
			colorPalette='gray'
			{...props}>
			<Icon
				name='delete'
				color='red'
				size={12}
			/>
		</IconButton>
	);
};

export default DeleteImageButton;
