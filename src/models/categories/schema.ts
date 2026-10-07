import { SchemaProps } from '@/components/library';

const schema: SchemaProps = {
	image: {
		type: 'image',
		label: 'Image',
	},
	name: {
		isRequired: true,
		type: 'text',
		label: 'Name',
		inputLabel: 'Product Name',
		sort: true,
		tableType: 'image-text',
		imageKey: 'image',
		default: true,
		displayInTable: true,
	},

	slug: {
		label: 'Slug',
		type: 'slug',
		tableType: 'text',
		displayInTable: true,
		required: true,
		sort: true,
		readOnlyOnUpdate: true,
	},
	shortDescription: {
		label: 'Description',
		type: 'textarea',
	},
	longDescription: {
		label: 'Long Description',
		type: 'textarea',
	},

	priority: {
		label: 'Priority',
		type: 'number',
		displayInTable: true,
		default: true,
	},
	isActive: {
		label: 'Is Active',
		type: 'checkbox',
		displayInTable: true,
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},
	isFeatured: {
		label: 'Is Featured',
		type: 'checkbox',
		default: true,
		displayInTable: true,
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},

	displayInHomePage: {
		label: 'Display In Home Page',
		type: 'checkbox',
		displayInTable: true,
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},

	displayInMenu: {
		label: 'Display In Menu',
		type: 'checkbox',
		displayInTable: true,
		default: true,
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},
	createdAt: {
		label: 'Created At',
		type: 'date',
		default: true,
		displayInTable: true,
	},
};

export default schema;
