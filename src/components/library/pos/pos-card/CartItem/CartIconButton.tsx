import { FC } from 'react';
import { IconButton } from '@chakra-ui/react';
import { Icon } from '../../../';

type CartIconButtonProps = {
	size: number;
	onClick: any;
	name: any;
};

const CartIconButton: FC<CartIconButtonProps> = ({ size, onClick, name }) => (
	<IconButton
		onClick={onClick}
		aria-label={'cart'}
		size='xs'
		variant='ghost'>
		<Icon
			name={name}
			size={size}
		/>
	</IconButton>
);

export default CartIconButton;
