//

export const orderStatus = [
	{
		label: 'Pending',
		value: 'pending',
	},
	{
		label: 'Order Placed',
		value: 'order-placed',
	},
	{
		label: 'Processing',
		value: 'processing',
	},
	{
		label: 'Ready For Dispatch',
		value: 'ready-for-dispatch',
	},
	{
		label: 'Dispatched',
		value: 'dispatched',
	},
	{
		label: 'Completed',
		value: 'completed',
	},
	{
		label: 'Refunded',
		value: 'refunded',
	},
	{
		label: 'Cancelled',
		value: 'cancelled',
	},
];

const schema = {
	invoice: {
		label: 'Invoice',
		type: 'string',
		displayInTable: true,
		default: true,
		sort: true,
	},
	total: {
		label: 'Total Price',
		type: 'number',
		displayInTable: true,
	},
	profit: {
		label: 'Profit',
		type: 'number',
		displayInTable: true,
	},
	vat: {
		label: 'VAT',
		type: 'number',
		displayInTable: true,
	},
	subTotal: {
		label: 'Sub Total',
		type: 'number',
		default: true,
		displayInTable: true,
	},
	paidAmount: {
		label: 'Paid Amount',
		type: 'number',
		displayInTable: true,
	},
	returnAmount: {
		label: 'Return Amount',
		type: 'number',
		displayInTable: true,
		default: true,
	},
	dueAmount: {
		label: 'Due Amount',
		type: 'number',
		displayInTable: true,
	},
	isPaid: {
		label: 'Is Paid',
		type: 'checkbox',
		displayInTable: true,
		colorPalette: (isPaid: boolean) => (isPaid ? 'green' : 'red'),
	},
	coupon: {
		label: 'Coupon',
		type: 'string',
		displayInTable: true,
	},
	origin: {
		label: 'Order From',
		type: 'string',
		displayInTable: true,
	},
	address: {
		label: 'Address',
		type: 'object',
	},
	items: {
		label: 'Items',
		type: 'array',
		displayInTable: true,
	},
	totalItems: {
		label: 'Total Items',
		type: 'number',
		displayInTable: true,
		default: true,
	},
	status: {
		label: 'Delivery Status',
		type: 'text',
		tableType: 'tag',
		colorPalette: (status: string) => {
			if (status == 'pending') return 'blue';
			else if (status == 'completed') return 'green';
			else if (status == 'cancelled') return 'red';
			else if (status == 'order-placed') return 'purple';
			else return 'purple';
		},
		displayInTable: true,
		default: true,
	},
	customer: {
		label: 'Customer',
		type: 'text',
		displayInTable: true,
		default: true,
		tableKey: 'customer.name',
	},
};

export default schema;
