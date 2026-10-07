import { SchemaProps } from '@/components/library';
import permissions from '../role/permissions';

const schema: SchemaProps = {
	name: {
		label: 'Role Name',
		type: 'string',
		isRequired: true,
		displayInTable: true,
		default: true,
	},
	description: {
		label: 'Role Description',
		type: 'string',
	},
	permissions: {
		title: 'Permissions',
		sort: true,
		type: 'permissions',
		viewType: 'array-tag',
		model: 'permissions',
		options: permissions,
	},
	isActive: {
		label: 'Active Status',
		type: 'tag',
		displayInTable: true,
		default: true,
	},
	image: {
		label: 'Image',
		type: 'image',
	},
	createdAt: {
		label: 'Created At',
		type: 'string',
	},
};

export default schema;
