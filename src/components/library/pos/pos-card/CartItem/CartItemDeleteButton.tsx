import { FC } from 'react';
import { EmptyCartModal } from '../../../';
import { Button } from '@chakra-ui/react';

type Props = {
	onClick: any;
	qty: any;
	name: any;
};

const CartItemDeleteButton: FC<Props> = ({ onClick, qty, name }) => {
	return (
		<EmptyCartModal
			onClick={onClick}
			title='Remove Item'
			description={`Are you sure you want to remove ${qty} ${name} from the cart?`}
			trigger={
				<Button
					size='xs'
					colorPalette='red'
					variant='plain'>
					Remove
				</Button>
			}
		/>
	);
};

export default CartItemDeleteButton;
