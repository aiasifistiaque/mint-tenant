import { FC, useEffect } from 'react';
import { useState } from 'react';

import { CustomTd as Td, RowContainerBase, Icon, currency } from '../..';
import { Box, Table, InputProps } from '@chakra-ui/react';
import InputElement from '../../utils/inputs/input-components/InputElement';

type PurchaseProductProps = {
	item: any;
	i: number;
	setItem: any;
	deleteItem: any;
	viewOnly?: boolean;
	isMobile?: boolean;
};

const TransferProduct: FC<PurchaseProductProps> = ({ item, i, setItem, isMobile, deleteItem }) => {
	const [qty, setQty] = useState(1);

	useEffect(() => {
		setQty(item?.qty);
	}, []);

	const handleReturnQty = (e: any) => {
		if (e.target.value < 0) {
			return;
		}
		setQty(e.target.value);
		setItem({ item, qty: e.target.value });
	};

	const icon = (
		<Box
			cursor='pointer'
			onClick={() => deleteItem(item?._id)}>
			<Icon
				name='delete'
				color='fg.error'
			/>
		</Box>
	);

	if (isMobile)
		return (
			<RowContainerBase>
				<Td heading='#'>{i + 1}</Td>
				<Td heading='Product Name'>{item?.name}</Td>

				<Td heading='Qty'>
					<InputElement
						{...inputStyle}
						value={qty}
						onChange={handleReturnQty}
					/>
				</Td>

				<Td heading='Unit Price'>
					{currency.code} {item?.price?.toLocaleString()}
				</Td>
				<Td heading='SubTotal'>{item?.price * qty}</Td>

				<Td>{icon}</Td>
			</RowContainerBase>
		);
	return (
		<Table.Row h='2.5rem'>
			<Table.Cell>{i + 1}</Table.Cell>
			<Table.Cell>{item?.name}</Table.Cell>

			<Table.Cell>
				<InputElement
					{...inputStyle}
					value={qty}
					onChange={handleReturnQty}
				/>
			</Table.Cell>

			<Table.Cell>
				{currency.symbol} {item?.price?.toLocaleString()}
			</Table.Cell>
			<Table.Cell>
				{currency.symbol} {(item?.price * qty).toLocaleString()}
			</Table.Cell>

			<Table.Cell>{icon}</Table.Cell>
		</Table.Row>
	);
};

const inputStyle: InputProps = {
	size: 'xs',
	type: 'number',
	w: '100px',
};

export default TransferProduct;
