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

export const deliverySchema: Schema = {
	order: {
		label: 'Invoice',
		type: 'string',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},
	invoice: {
		label: 'Invoice',
		type: 'read-only',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},
	receiveAmount: {
		label: 'Receive Amount',
		type: 'number',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
		fetch: (data: any) => ({
			path: 'orders',
			fields: [
				{ key: 'invoice', as: 'invoice' },
				{ key: 'dueAmount', as: 'receiveAmount' },
			],
			id: data?.order,
		}),
	},

	status: {
		label: 'Delivery Status',
		type: 'select',
		tableType: 'text',
		sort: true,
		default: true,
		displayInTable: true,
		options: deliveryStatusOptions,
	},

	note: {
		label: 'Note',
		type: 'textarea',
	},

	estimatedDeliveryDate: {
		label: 'Estimated Delivery Date',
		type: 'date',
		sort: true,
		default: true,
		displayInTable: true,
	},

	deliveryDate: {
		label: 'Delivery Date',
		type: 'date',
		sort: true,
		default: true,
		displayInTable: true,
	},
	tags: {
		label: 'Tags',
		type: 'tag',
	},
	deliveryCompany: {
		label: 'Delivery Company',
		type: 'text',
		sort: true,
		displayInTable: true,
		default: true,
	},
	trackingId: {
		label: 'Tracking ID',
		type: 'text',
		displayInTable: true,
		default: true,
	},
	trackingUrl: {
		label: 'Tracking URL',
		type: 'text',
		sort: true,
		displayInTable: true,
		default: true,
	},

	createdAt: {
		label: 'Created At',
		type: 'date',
		sort: true,
		default: true,
		displayInTable: true,
	},
};

const formLayout: FormLayout = [
	{
		sectionTitle: 'Damage Details',
		fields: ['product', 'change', 'note'],
	},
];

const schema = deliverySchema;

const viewFields = convertToTableFields({
	schema,
	fields: ['invoice', 'status', 'receiveAmount', 'deliveryCompany', 'trackingId', 'createdAt'],
});

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

const formFields = convertToFormFields({
	schema,
	layout: formLayout,
});

export const viewDataFields = convertToViewFields({ schema });

const deliveryTable: TableObjectProps = {
	title: 'Deliveries',
	path: 'deliveries',
	invalidate: ['deliveries', 'orders'],
	data: viewFields,
	menu: [
		{ type: 'edit-modal', title: 'Edit', dataModel: editFields },
		{ type: 'view-modal', title: 'View', dataModel: viewDataFields },
		// {
		// 	type: 'view-modal',
		// 	title: 'View Return',
		// 	dataModel: viewProductFields,
		// 	path: 'returns',
		// 	id: (data: any) => data?.product?._id,
		// },
	],
};

export default deliveryTable;
