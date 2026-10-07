import { SchemaProps } from '@/components/library';
import permissions from './permissions';

const schema: SchemaProps = {
	name: {
		label: 'Name',
		type: 'text',
		sort: true,
		displayInTable: true,
		default: true,
	},
	description: {
		label: 'Description',
		type: 'textarea',
	},

	isActive: {
		title: 'Is Active',
		sort: true,
		type: 'checkbox',
		displayInTable: true,
		colorPalette: (data: boolean) => (data ? 'green' : 'red'),
	},
	permissions: {
		title: 'Permissions',
		sort: true,
		type: 'permissions',
		viewType: 'array-tag',
		model: 'permissions',
		options: permissions,
	},
	createdAt: { title: 'Created', type: 'date', sort: true, displayInTable: true },
};

export default schema;
