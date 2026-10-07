import { SchemaProps } from '@/components/library';

const schema: SchemaProps = {
	name: {
		label: 'Name',
		type: 'string',
		isRequired: true,
		displayInTable: true,
		default: true,
	},
	username: {
		label: 'Username',
		type: 'text',
	},
	email: {
		label: 'Email',
		type: 'string',
		isRequired: true,
		displayInTable: true,
		default: true,
	},
	phone: {
		label: 'Phone',
		type: 'text',
		displayInTable: true,
		default: true,
	},
	github: {
		label: 'Github Username',
		type: 'text',
		copy: true,
		displayInTable: true,
	},
	password: {
		label: 'Password',
		type: 'password',
		isRequired: true,
	},

	role: {
		label: 'Role',
		type: 'data-menu',
		isRequired: true,
		displayInTable: true,
		default: true,
		model: 'adminroles',
		tableKey: 'role.name',
	},
	isActive: {
		label: 'Active Status',
		type: 'checkbox',
		displayInTable: true,
	},
	isDeleted: {
		label: 'Active Status',
		type: 'tag',
	},
	invitationStatus: {
		label: 'Invitation',
		type: 'string',
		tableType: 'invitation-status',
		viewType: 'string',
		displayInTable: true,
		default: true,
	},
};

export default schema;
