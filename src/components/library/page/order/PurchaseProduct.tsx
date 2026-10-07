import { FC, useEffect } from 'react';
import { useState } from 'react';

import { CustomTd as Td, RowContainerBase, Icon } from '../..';
import { Box, Table } from '@chakra-ui/react';
import InputElement from '../../utils/inputs/input-components/InputElement';

type PurchaseProductProps = {
	item: any;
	i: number;
	setItem: any;
	deleteItem: any;
	viewOnly?: boolean;
	isMobile?: boolean;
};

const PurchaseProduct: FC<PurchaseProductProps> = ({ item, i, setItem, isMobile, deleteItem }) => {
	const [qty, setQty] = useState(1);
	const [price, setPrice] = useState(0);

	useEffect(() => {
		setQty(item?.qty);
		setPrice(item?.price);
	}, []);

	const handlePrice = (e: any) => {
		setPrice(e.target.value);
		setItem({ price: e.target.value, item, qty });
	};

	const handleReturnQty = (e: any) => {
		if (e.target.value < 0) {
			return;
		}
		setQty(e.target.value);
		setItem({ price: price, item, qty: e.target.value });
	};

	if (isMobile)
		return (
			<RowContainerBase>
				<Td heading='#'>{i + 1}</Td>
				<Td heading='Product Name'>{item?.name}</Td>

				<Td heading='Qty'>
					<InputElement
						size='xs'
						type='number'
						value={qty}
						onChange={handleReturnQty}
						w='100px'
					/>
				</Td>

				<Td heading='Cost Price'>
					<InputElement
						size='xs'
						type='number'
						value={price}
						onChange={handlePrice}
						w='100px'
					/>
				</Td>
				<Td heading='SubTotal'>{item?.subTotal}</Td>

				<Td>
					<Box
						cursor='pointer'
						onClick={() => deleteItem(item?._id)}>
						<Icon name='delete' />
					</Box>
				</Td>
			</RowContainerBase>
		);
	return (
		<Table.Row h='2.5rem'>
			<Table.Cell>{i + 1}</Table.Cell>
			<Table.Cell>{item?.name}</Table.Cell>

			<Table.Cell>
				<InputElement
					size='xs'
					type='number'
					value={qty}
					onChange={handleReturnQty}
					w='100px'
				/>
			</Table.Cell>

			<Table.Cell>
				<InputElement
					size='xs'
					type='number'
					value={price}
					onChange={handlePrice}
					w='100px'
				/>
			</Table.Cell>
			<Table.Cell>{item?.subTotal}</Table.Cell>

			<Table.Cell>
				<Box
					cursor='pointer'
					onClick={() => deleteItem(item?._id)}>
					<Icon name='delete' />
				</Box>
			</Table.Cell>
		</Table.Row>
	);
};

export default PurchaseProduct;
