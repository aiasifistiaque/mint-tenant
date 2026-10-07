import { SchemaProps } from '@/components/library';

const schema: SchemaProps = {
	name: {
		label: 'Name',
		type: 'text',
		sort: true,
		displayInTable: true,
		default: true,
	},
	email: {
		label: 'Email',
		type: 'text',
		displayInTable: true,
		default: true,
	},
	group: {
		label: 'Groups',
		type: 'data-tag',
		model: 'groups',
	},
	phone: {
		label: 'Phone',
		type: 'text',
		displayInTable: true,
		default: true,
	},
	isSubscribedToEmail: {
		title: 'Subscribed to email',
		sort: true,
		type: 'checkbox',
		displayInTable: true,
		colorPalette: (data: boolean) => (data ? 'green' : 'red'),
	},
	isRegisteredOnline: {
		title: 'Is Registered Online',
		sort: true,
		type: 'checkbox',
		displayInTable: true,
		colorPalette: (data: boolean) => (data ? 'green' : 'red'),
	},
	createdAt: { title: 'Created', type: 'date', sort: true, displayInTable: true },
};

export default schema;
