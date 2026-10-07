import { SchemaType } from '@/components/library';

type DocumentBaseType = {
	createdAt?: Date;
	updatedAt?: Date;
};

type Type = DocumentBaseType & {
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	country?: string;
	website?: string;
	industry?: string;
	contactPerson?: string;
	notes?: string[];
	status: {
		type: String;
		enum: ['active', 'inactive', 'pending'];
		default: 'pending';
	};
	description: string;
};

const schema: SchemaType<Type> = {
	name: {
		label: 'Name',
		type: 'string',
		isRequired: true,
		default: true,
		displayInTable: true,
		sort: true,
	},
	email: {
		label: 'Email',
		type: 'string',
		default: true,
		displayInTable: true,
		sort: true,
		copy: true,
	},
	phone: { label: 'Phone', type: 'string', default: true, displayInTable: true },
	address: { label: 'Address', type: 'textarea' },
	city: { label: 'City', type: 'string', displayInTable: true, sort: true },
	country: { label: 'Country', type: 'string', displayInTable: true, sort: true },
	website: {
		label: 'Website',
		type: 'string',
		displayInTable: true,
		sort: true,
		viewType: 'external-link',
	},
	industry: { label: 'Industry', type: 'string', displayInTable: true, sort: true },
	contactPerson: { label: 'Contact person', type: 'string', displayInTable: true },
	notes: { label: 'Notes', type: 'tag' },
	status: {
		label: 'Status',
		type: 'select',
		isRequired: true,
		options: [
			{ label: 'Active', value: 'active' },
			{ label: 'Inactive', value: 'inactive' },
			{ label: 'Pending', value: 'pending' },
		],
		sort: true,
	},
	description: { label: 'Description', type: 'textarea' },
	createdAt: { label: 'Created At', type: 'date' },
};

export default schema;
