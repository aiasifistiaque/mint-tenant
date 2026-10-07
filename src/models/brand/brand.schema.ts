import { Schema } from '@/components/library';

const expenseSchema: Schema = {
	image: {
		label: 'Image',
		type: 'image',
	},
	name: {
		label: 'Name',
		type: 'text',
		sort: true,
		isRequired: true,
		default: true,
		displayInTable: true,
	},
	description: {
		label: 'Description',
		type: 'textarea',
	},

	tags: {
		label: 'Tags',
		type: 'tag',
	},

	createdAt: {
		label: 'Created At',
		type: 'date',
		sort: true,
		default: true,
		displayInTable: true,
	},
};

export default expenseSchema;
