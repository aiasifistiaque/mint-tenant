import { Schema, TableObjectDataProps } from '@/components/library';
import {
	convertToViewFields,
	TableObjectProps,
	FormLayout,
	convertToTableFields,
	convertToFormFields,
	createFormFields,
} from '@/components/library';
import { viewProductFields } from '../products/products.model';

export const deliveryStatusOptions = [
	{ label: 'Pending', value: 'pending' },
	{ label: 'Delivered', value: 'delivered' },
	{ label: 'Returned', value: 'returned' },
	{ label: 'Completed', value: 'completed' },
	{ label: 'Failed', value: 'failed' },
	{ label: 'Refunded', value: 'refunded' },
	{ label: 'Cancelled', value: 'cancelled' },
	{ label: 'In Transit', value: 'in-transit' },
	{ label: 'Out for Delivery', value: 'out-for-delivery' },
	{ label: 'Delayed', value: 'delayed' },
	{ label: 'Awaiting Pickup', value: 'awaiting_pickup' },
	{ label: 'Partially Delivered', value: 'partially-delivered' },
];

export const ledgerSchema: Schema = {
	type: {
		label: 'User Type',
		type: 'string',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},
	customer: {
		label: 'Customer',
		type: 'data-menu',
		model: 'customers',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
		tableKey: 'customer.name',
	},
	supplier: {
		label: 'Supplier',
		type: 'data-menu',
		model: 'suppliers',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
		tableKey: 'supplier.name',
	},
	amount: {
		label: 'Amount',
		type: 'number',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},
	amountReceived: {
		label: 'Cash In',
		type: 'number',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},
	amountSent: {
		label: 'Cash Out',
		type: 'number',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},
	account: {
		label: 'Credit/Debit',
		type: 'string',
		sort: true,
		default: true,
		displayInTable: true,
	},
	date: {
		label: 'Date',
		type: 'date',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},

	note: {
		label: 'Note',
		type: 'textarea',
	},
};

const formLayout: FormLayout = [
	{
		sectionTitle: 'Damage Details',
		fields: ['product', 'change', 'note'],
	},
];

const schema = ledgerSchema;

const editFields = createFormFields({
	schema: schema,
	layout: [
		{
			sectionTitle: 'Basic Information',
			fields: ['order', 'receiveAmount', 'status'],
		},
		{
			sectionTitle: 'Delivery Information',
			fields: ['deliveryCompany', 'trackingId', 'trackingUrl', 'estimatedDeliveryData'],
		},
		{
			sectionTitle: 'Additional Information',
			fields: ['tags', 'note'],
		},
	],
});

export const formFields = convertToFormFields({
	schema,
	layout: formLayout,
});

export const viewDataFields = convertToViewFields({ schema });

const viewFields = convertToTableFields({
	schema,
	fields: ['customer', 'amount', 'amountReceived', 'amountSent', 'account', 'date', 'note'],
});

const ledgerTable: TableObjectProps = {
	title: 'Ledged',
	path: 'ledgers',
	export: true,
	data: viewFields,
	menu: [{ type: 'view-modal', title: 'View', dataModel: viewDataFields }],
};

export default ledgerSchema;
