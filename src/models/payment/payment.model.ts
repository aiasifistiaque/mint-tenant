import { Schema, TableObjectDataProps } from '@/components/library';
import {
	convertToViewFields,
	TableObjectProps,
	FormLayout,
	convertToTableFields,
	convertToFormFields,
} from '@/components/library';

type PaymentType = {
	invoice: string;
	amount: number;
	order: string;
	//category: string;
	date: Date;
	tags: string[];
	note: string;
	account: 'debit' | 'credit';
	customer: string;
	trnxId: string;
	paymentMethod:
		| 'cash'
		| 'cheque'
		| 'card'
		| 'bank'
		| 'bkash'
		| 'nagad'
		| 'rocket'
		| 'other'
		| 'ssl'
		| 'stripe';
	reference: string;
	currency: string;
	status: 'pending' | 'completed' | 'failed' | 'refunded';
	attachments: string[];
	// checkNo: string;
	// walletNo: string;
	createdAt: Date;
};

export const adjustmentSchema: Schema = {
	invoice: {
		label: 'Invoice',
		type: 'data-menu',
		tableType: 'text',
		model: 'invoices',
		sort: true,
		default: true,
		displayInTable: true,
	},
	due: {
		label: 'Due',
		type: 'read-only',
		isRequired: true,
		fetch: (data: any) => ({
			path: 'orders',
			fields: [{ key: 'dueAmount', as: 'due' }],
			id: data?.invoice,
		}),
		isExcluded: true,
		// renderCondition: (data: any) => (data?.invoice ? true : false),
	},
	amount: {
		label: 'Amount',
		type: 'number',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},
	date: {
		label: 'Date',
		type: 'date',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},
	tags: {
		label: 'tags',
		isRequired: false,
		type: 'tag',
	},
	account: {
		label: 'Account',
		type: 'select',
		options: [
			{ label: 'Debit', value: 'debit' },
			{ label: 'Credit', value: 'credit' },
		],
		default: true,
		displayInTable: true,
		isRequired: true,
		colorPalette: (data: any) => {
			if (data === 'debit') return 'red';
			if (data === 'credit') return 'green';
		},
	},

	note: {
		label: 'Note',
		type: 'textarea',
	},
	customer: {
		label: 'Customer',
		type: 'data-menu',
		menuField: 'invoice',
		tableType: 'text',
		model: 'customers',
		displayInTable: true,
		tableKey: 'customer.name',
		default: true,
	},
	trnxId: {
		label: 'Transaction ID',
		type: 'text',
		displayInTable: true,
		default: true,
	},
	reference: {
		label: 'Ref',
		type: 'text',
		displayInTable: true,
		default: true,
	},
	paymentMethod: {
		label: 'Payment Method',
		type: 'select',
		options: [
			{ label: 'Cash', value: 'cash' },
			{ label: 'Cheque', value: 'cheque' },
			{ label: 'Card', value: 'card' },
			{ label: 'Bank', value: 'bank' },
			{ label: 'Bkash', value: 'bkash' },
			{ label: 'Nagad', value: 'nagad' },
			{ label: 'Rocket', value: 'rocket' },
			{ label: 'Other', value: 'other' },
			{ label: 'SSL', value: 'ssl' },
			{ label: 'Stripe', value: 'stripe' },
		],
		default: true,
		displayInTable: true,
		isRequired: true,
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
		sectionTitle: 'Payment details',
		fields: [
			'invoice',
			'due',
			'account',
			'amount',
			['trnxId', 'reference'],
			'date',
			'paymentMethod',
		],
	},
	{
		sectionTitle: 'Customer Information',
		fields: ['customer'],
	},

	{
		sectionTitle: 'Additional Information',
		fields: ['tags', 'note', 'attachments'],
	},
];

const schema = adjustmentSchema;

const viewFields = convertToTableFields({
	schema,
	fields: [
		'invoice',
		'amount',
		'date',
		'account',
		'customer',
		'trnxId',
		'reference',
		'paymentMethod',
		'createdAt',
	],
});

const formFields = convertToFormFields({
	schema,
	layout: formLayout,
});

const viewDataFields = convertToViewFields({ schema });

const damageTable: TableObjectProps = {
	title: 'Payments',
	path: 'payments',
	isModal: true,

	invalidate: ['orders', 'customers'],
	button: {
		title: 'Add Payment',
	},
	data: viewFields,
	createModel: formFields,
	menu: [
		{ type: 'edit-modal', title: 'Edit', dataModel: formFields },
		{ type: 'view-modal', title: 'View', dataModel: viewDataFields },
		// {
		// 	type: 'view-modal',
		// 	title: 'View Order',
		// 	dataModel: viewProductFields,
		// 	path: 'products',
		// 	id: (data: any) => data?.product?._id,
		// },
	],
};

export default damageTable;
