import { FC } from 'react';
import { CartIconButton } from '.';
import { Text } from '@chakra-ui/react';
import { EmptyCartModal, Column } from '../../../';

type QtyButtonsType = {
	addOne: any;
	deleteOne: any;
	deleteAll: any;
	children: number;
	name?: string;
};

const QtyButtons: FC<QtyButtonsType> = ({ addOne, deleteOne, deleteAll, children, name = '' }) => {
	return (
		<Column
			gap={0}
			align='center'>
			<CartIconButton
				size={16}
				onClick={addOne}
				name='add'
			/>
			<Text textAlign='center'>{children}</Text>
			{children > 1 ? (
				<CartIconButton
					size={12}
					onClick={deleteOne}
					name='subtract'
				/>
			) : (
				<EmptyCartModal
					onClick={deleteAll}
					title='Remove Item'
					description={`Are you sure you want to remove ${name} from the cart?`}
					trigger={
						<CartIconButton
							size={12}
							name='subtract'
							onClick={() => {}}
						/>
					}
				/>
			)}
		</Column>
	);
};

export default QtyButtons;
