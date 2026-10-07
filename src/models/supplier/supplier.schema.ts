import { Schema } from '@/components/library';

const supplierSchema: Schema = {
	name: {
		type: 'text',
		isRequired: true,
		label: 'Name',
		displayInTable: true,
		default: true,
		sort: true,
	},
	email: {
		type: 'text',
		label: 'Email',
		displayInTable: true,
		default: true,
	},
	phone: {
		type: 'text',
		label: 'Phone',
		displayInTable: true,
		default: true,
		isRequired: true,
	},
	address: {
		type: 'textarea',
		label: 'Address',
	},

	payable: {
		type: 'number',
		label: 'Payable',
		tableKey: 'payable',
		displayInTable: true,
		sort: true,
		inputLabel: 'Opening Payable',
	},
	receivable: {
		type: 'number',
		label: 'Receivable',
		tableKey: 'receivable',
		inputLabel: 'Opening Receivable',
		displayInTable: true,
		sort: true,
	},
	createdAt: {
		type: 'date',
		label: 'Created At',
		displayInTable: true,
	},
};

export default supplierSchema;
// Compare this snippet from backend/models/customer/supplier.model.ts:
