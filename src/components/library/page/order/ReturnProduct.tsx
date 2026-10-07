import { useState } from 'react';

import { useIsMobile, Tr, CustomTd as Td } from '../..';
import { toaster } from '@/components/ui/toaster';
import InputElement from '../../utils/inputs/input-components/InputElement';

const ReturnProduct = ({ item, i, setItem }: { item: any; i: number; setItem: any }) => {
	const isMobile = useIsMobile();
	const [returnQty, setReturnQty] = useState(0);

	const handleReturnQty = (e: any) => {
		if (e.target.value > item.qty - item.returnQty) {
			toaster.create({
				title: 'Error',
				description: 'Return quantity cannot be greater than the sold quantity',
				type: 'error',
				duration: 3000,
			});
			setReturnQty(0);
			setItem({ qty: 0, item, returnAmount: 0 });

			return;
		}
		setReturnQty(e.target.value);
		setItem({ qty: e.target.value, item, returnAmount: item.unitPrice * e.target.value });
	};
	return (
		<Tr>
			<Td heading='#'>{i + 1}</Td>
			<Td heading='Product Name'>{item?.name}</Td>
			<Td heading='Unit Price'>{item?.unitPrice}</Td>
			<Td heading='Sell Qty'>{item?.qty - item?.returnQty}</Td>

			<Td
				// isNumeric={!isMobile && true}
				heading='Return Qty'>
				<InputElement
					size='xs'
					type='number'
					value={returnQty}
					onChange={handleReturnQty}
					w='100px'
				/>
			</Td>
			<Td heading='Return SubTotal'>{item?.unitPrice * returnQty}</Td>
		</Tr>
	);
};

export default ReturnProduct;
