import { Schema, SchemaType } from '@/components/library';
// import { expenseCategoryCreateModel } from './expenseCategory.model';

type Type = {
	name: string;
	amount: number;
	duration: number;
	billingCycle: 'monthly' | 'yearly' | 'custom';
	isDiscounted: boolean;
	tags?: string[];
	note?: string;
	currency?: string;
	createdAt: Date;
	addedBy?: string;
	isActive?: boolean;
	features?: string[];
	discountedPrice?: number;
};

const expenseSchema: SchemaType<Type> = {
	name: {
		label: 'Name',
		type: 'text',
		sort: true,
		default: true,
		displayInTable: true,
	},
	amount: {
		label: 'Price',
		type: 'number',
		sort: true,
		default: true,
		displayInTable: true,
	},
	isDiscounted: {
		label: 'Discounted',
		type: 'checkbox',
		displayInTable: true,
		sort: true,
	},
	discountedPrice: {
		label: 'Discounted Price',
		type: 'number',
		displayInTable: true,
		renderCondition: (data: any) => data.isDiscounted,
	},
	duration: {
		label: 'Duration',
		inputLabel: 'Duration in days',
		type: 'number',
		sort: true,
		default: true,
		displayInTable: true,
	},
	billingCycle: {
		label: 'Billing Cycle',
		type: 'select',
		options: [
			{
				value: 'monthly',
				label: 'Monthly',
			},
			{
				value: 'yearly',
				label: 'Yearly',
			},
			{
				value: 'custom',
				label: 'Custom',
			},
		],
		displayInTable: true,
		default: true,
	},
	features: {
		label: 'Features',
		type: 'tag',
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
