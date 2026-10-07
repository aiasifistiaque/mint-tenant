import { SchemaType, SchemaProps } from '@/components/library';

type DocumentBaseType = {
	createdAt?: Date;
	updatedAt?: Date;
};

const documentSchema: SchemaType<any> = {
	code: {
		label: 'Document Code',
		type: 'string',
		default: true,
		sort: true,
	},
	name: {
		label: 'Name',
		type: 'string',
		isRequired: true,
		default: true,
		displayInTable: true,
		sort: true,
	},
	description: {
		label: 'Description',
		type: 'textarea',
	},
	client: {
		label: 'Client',
		type: 'data-menu',
		default: true,
		displayInTable: true,
		tableType: 'text',
		tableKey: 'client.name',
		sort: true,
		model: 'clients',
	},
	docUrl: {
		label: 'Document URL',
		type: 'string',
		default: true,
		displayInTable: true,
		viewType: 'external-link',
		tableType: 'external-link',
	},
	fileUrl: {
		label: 'File',
		type: 'file',
		default: true,
		displayInTable: true,
	},
	category: {
		label: 'Category',
		type: 'string',
		isRequired: true,
		displayInTable: true,
		sort: true,
		default: true,
	},
	direction: {
		label: 'Type',
		type: 'select',
		displayInTable: true,
		sort: true,
		options: [
			{ label: 'Inbound', value: 'inbound' },
			{ label: 'Outbound', value: 'outbound' },
			{ label: 'Internal', value: 'internal' },
			{ label: 'Other', value: 'other' },
		],
		helperText: 'Select the type of the document',
	},
	project: {
		label: 'Project',
		type: 'data-menu',
		default: true,
		displayInTable: true,
		tableType: 'text',
		tableKey: 'project.name',
		sort: true,
		model: 'projects',
		tooltip: 'The project this document is related to',
	},
	access: {
		label: 'Access',
		type: 'data-tag',
		// viewType: 'data-array-tag',
		model: 'admins',
		modelAddOn: 'email',
		// menuKey: 'email',
		// menuAddOnKey: 'name',
		tooltip: 'Users who can access this document',
	},
	privacy: {
		label: 'Privacy',
		type: 'select',
		displayInTable: true,
		default: true,
		isRequired: true,
		sort: true,
		options: [
			{
				label: 'Public',
				value: 'public',
			},
			{
				label: 'Private',
				value: 'private',
			},
			{
				label: 'Only Me',
				value: 'only-me',
			},
		],
	},
	addedBy: {
		label: 'Added By',
		type: 'string',
		displayInTable: true,
		tableKey: 'addedBy.name',
		sort: true,
	},
	createdAt: { label: 'Created At', type: 'date', displayInTable: true, sort: true },
};

export default documentSchema;
