import { Schema, TableObjectDataProps } from '@/components/library';

const expenseCategorySchema: Schema = {
	name: {
		label: 'Name',
		type: 'text',
		sort: true,
		default: true,
	},
};

export default expenseCategorySchema;
