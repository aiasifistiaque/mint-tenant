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
	useGetByIdQuery,
} from '../..';

const VariantOrderItems = ({ data }: { data: any }) => {
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
					<SingleOrderItem
						key={i}
						item={item}
						index={i}
					/>
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

const SingleOrderItem = ({ item, index }: { item: any; index: number }) => {
	const { data } = useGetByIdQuery({ path: 'products', id: item?._id });
	return (
		<Grid gridTemplateColumns='2fr 1fr 1fr 1fr'>
			<OrderItemText fontWeight='600'>
				{index + 1}. {item?.name}, {item?.variantName} {`(SKU: ${data?.sku || 'N/A'})`}
			</OrderItemText>
			<GridItem textAlign='center'>{item?.unitPrice?.toFixed(2)?.toLocaleString()}</GridItem>
			<GridItem textAlign='center'>{item?.qty - item?.returnQty}</GridItem>
			{/* <GridItem textAlign='center'>{item?.size}</GridItem>
			<GridItem textAlign='center'>{item?.color}</GridItem> */}
			<GridItem textAlign='right'>
				{currency.symbol}
				{(item?.unitPrice * item?.qty)?.toFixed(2)?.toLocaleString()}
			</GridItem>
		</Grid>
	);
};

export default VariantOrderItems;
