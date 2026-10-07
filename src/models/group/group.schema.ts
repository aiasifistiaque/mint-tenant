import { Schema } from '@/components/library';

const groupSchema: Schema = {
	name: {
		type: 'text',
		isRequired: true,
		label: 'Name',
		displayInTable: true,
		default: true,
		sort: true,
	},
	description: {
		type: 'textarea',
		label: 'Description',
	},
};

export default groupSchema;
// Compare this snippet from backend/models/customer/supplier.model.ts:
