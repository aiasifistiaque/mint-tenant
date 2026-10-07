import {
	currency,
	OrderRightSectionContainer,
	OrderItemHeading,
	OrderItemsContainer,
	OrderItemText,
	OrderPriceDetails,
	Grid,
	Flex,
	GridItem,
} from '../..';

const OrderItems = ({ data }: { data: any }) => {
	return (
		<>
			<OrderRightSectionContainer>
				<OrderItemHeading>Description</OrderItemHeading>
				<OrderItemHeading textAlign='center'>Price</OrderItemHeading>
				<OrderItemHeading textAlign='center'>Qty</OrderItemHeading>
				{/* <OrderItemHeading textAlign='center'>Size</OrderItemHeading>
				<OrderItemHeading textAlign='center'>Color</OrderItemHeading> */}
				<OrderItemHeading textAlign='right'>Amount</OrderItemHeading>
			</OrderRightSectionContainer>
			<OrderItemsContainer>
				{data?.items?.map((item: any, i: number) => (
					<Grid
						gridTemplateColumns='2fr 1fr 1fr 1fr'
						key={i}>
						<OrderItemText fontWeight='600'>
							{i + 1}. {item?.name} {item?.variantName && `- ${item?.variantName}`}
						</OrderItemText>
						<GridItem textAlign='center'>{item?.unitPrice?.toFixed(2)?.toLocaleString()}</GridItem>
						<GridItem textAlign='center'>{item?.qty - item?.returnQty}</GridItem>
						<GridItem textAlign='center'>{item?.size}</GridItem>
						<GridItem textAlign='center'>{item?.color}</GridItem>
						<GridItem textAlign='right'>
							{currency.symbol}
							{(item?.unitPrice * item?.qty).toFixed(2)?.toLocaleString()}
						</GridItem>
					</Grid>
				))}
			</OrderItemsContainer>
			<Flex
				flex={1}
				align='flex-end'
				w='full'>
				<OrderPriceDetails
					total={data?.total}
					subTotal={data?.subTotal}
					discount={data?.discount}
					shipping={data?.shippingCharge}
					vat={data?.vat}
				/>
			</Flex>
		</>
	);
};

export default OrderItems;
