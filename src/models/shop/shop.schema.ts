import { Schema } from '@/components/library';

const schema: Schema = {
	id: {
		label: 'Code',
		type: 'string',
		isRequired: true,
		sort: true,
		default: true,
		displayInTable: true,
	},
	name: {
		label: 'Name',
		inputLabel: 'Owner Name',
		type: 'text',
		isRequired: true,
		sort: true,
		default: true,
		displayInTable: true,
	},
	activeTheme: {
		label: 'Active Theme',
		type: 'string',
		tableKey: 'activeTheme.name',
		displayInTable: true,
	},
	smsBalance: {
		label: 'SMS Balance',
		type: 'number',
		displayInTable: true,
	},
	smsExpense: {
		label: 'SMS Expense',
		type: 'number',
		displayInTable: true,
	},
	website: {
		label: 'Website',
		type: 'text',
	},
	facebook: {
		label: 'Facebook',
		type: 'text',
	},
	instagram: {
		label: 'Instagram',
		type: 'text',
	},
	websiteViews: {
		label: 'Website Views',
		type: 'number',
		displayInTable: true,
	},
	shopName: {
		label: 'Shop Name',
		type: 'text',
		isRequired: true,
	},
	password: {
		label: 'Password',
		type: 'password',
		isRequired: true,
	},
	confirm: {
		label: 'Confirm Password',
		type: 'password',
		isRequired: true,
	},
	package: {
		label: 'Package',
		tableKey: 'package.subscription.name',
		isRequired: true,
		sort: true,
		default: true,
		displayInTable: true,
		type: 'data-menu',
		model: 'packages',
	},
	expire: {
		label: 'Expire',
		type: 'date',
		displayInTable: true,
	},
	owner: {
		tableKey: 'owner.name',
		label: 'Owner',
		type: 'string',
		sort: true,
		default: true,
		displayInTable: true,
	},
	description: {
		label: 'Description',
		type: 'textarea',
	},
	template: {
		label: 'Template',
		type: 'text',
		displayInTable: true,
	},
	logo: {
		type: 'image',
		label: 'logo',
	},
	image: {
		type: 'image',
		label: 'Image',
	},
	coverImage: {
		type: 'image',
		label: 'Cover Image',
	},
	location: {
		type: 'string',
		label: 'Location',
	},
	address: {
		type: 'string',
		label: 'Address',
	},
	email: {
		type: 'text',
		isRequired: true,
		label: 'Email',
		displayInTable: true,
	},

	trial: {
		type: 'tag',
		label: 'Trial',
		sort: true,
		isRequired: true,
		colorPalette: (data: any) => (data?.trial ? 'purple' : 'green'),
	},
	phone: {
		type: 'text',
		label: 'Phone',
		displayInTable: true,
	},

	isDeleted: {
		type: 'tag',
		label: 'Deleted',
		sort: true,
		colorPalette: (data: any) => (data?.isDeleted ? 'red' : 'green'),
	},
	isActive: {
		type: 'tag',
		label: 'Active',
		sort: true,
		isRequired: true,
		displayInTable: true,
		colorPalette: (data: any) => (data?.isActive ? 'green' : 'red'),
	},
	isExpired: {
		type: 'tag',
		label: 'Expired',
		sort: true,
		displayInTable: true,
		colorPalette: (data: any) => (data?.isExpired == true ? 'red' : 'green'),
	},
	createdAt: {
		type: 'date',
		label: 'Registered',
		sort: true,
		displayInTable: true,
		default: true,
	},
};

export default schema;
