import { FC } from 'react';
import { Heading } from '@chakra-ui/react';
import { Price } from '../../../';
import { OPDContainer, OPDBottomContainer, OPDProps } from '.';
import PriceItem from '../PriceItem';

const OrderPriceDetails: FC<OPDProps> = ({ total, subTotal, discount, shipping, vat }) => {
	return (
		<OPDContainer>
			<>
				<PriceItem title='Sub Total'>{subTotal}</PriceItem>
				<PriceItem title='VAT (+)'>{vat}</PriceItem>
				<PriceItem title='Shipping (+)'>{shipping}</PriceItem>
				<PriceItem title='Discount (-)'>{discount}</PriceItem>
			</>

			<OPDBottomContainer>
				<Heading size='md'>Net Payable</Heading>
				<Heading
					size='md'
					textAlign='right'>
					<Price>{total}</Price>
				</Heading>
			</OPDBottomContainer>
		</OPDContainer>
	);
};

export default OrderPriceDetails;
