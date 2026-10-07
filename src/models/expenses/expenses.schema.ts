import { Schema, TableObjectDataProps } from '@/components/library';
import { expenseCategoryCreateModel } from './expenseCategory.model';

const expenseSchema: Schema = {
	name: {
		label: 'Name',
		type: 'text',
		sort: true,
		default: true,
		displayInTable: true,
	},
	amount: {
		label: 'Amount',
		type: 'number',
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
	},
	category: {
		label: 'Category',
		type: 'data-menu',
		model: 'expense-categories',
		dataModel: expenseCategoryCreateModel,
		displayInTable: true,
		tableKey: 'category.name',
	},
	tags: {
		label: 'Tags',
		type: 'tag',
	},
	note: {
		label: 'Note',
		type: 'textarea',
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
