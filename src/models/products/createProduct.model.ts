import { InputData } from '@/components/library';
import editCategoriesModel from '@/models/categories/editCategories.model';

export type DataType = {
	name: string | undefined;
	isFeatured: boolean;
	image?: string | undefined;
	meta?: {
		title: string;
		description: string;
	};
	[key: string]: any;
};

export const dataFields: InputData<DataType>[] = [
	{
		sectionTitle: 'Product Image',
		name: 'image',
		label: 'Image',
		isRequired: false,
		type: 'image',
	},
	{
		name: 'name',
		label: 'Product Name',
		isRequired: true,
		type: 'text',
		endOfSection: true,
	},

	{
		sectionTitle: 'Product Information',
		name: 'category',
		label: 'Product Category',
		isRequired: true,
		type: 'data-menu',
		model: 'categories',
		dataModel: editCategoriesModel,
	},
	{
		name: 'slug',
		label: 'Slug',
		isRequired: true,
		type: 'slug',
	},
	{
		name: 'shortDescription',
		label: 'Short Description',
		isRequired: false,
		type: 'textarea',
	},
	{
		sectionTitle: 'Product Tags',
		name: 'tags',
		label: 'tags',
		isRequired: false,
		type: 'tag',
		endOfSection: true,
	},

	{
		name: 'price',
		label: 'Price',
		isRequired: false,
		type: 'number',
		span: 1,
	},
	{
		name: 'vat',
		label: 'Vat in %',
		isRequired: true,
		type: 'number',
		span: 1,
	},
	{
		startOfSection: true,
		sectionTitle: 'Product Units',
		name: 'unitValue',
		label: 'Unit Value',
		isRequired: false,
		type: 'number',
		span: 1,
	},
	{
		name: 'unit',
		label: 'Product Unit',
		isRequired: false,
		placeholder: 'e.g. pc, kg, g, l, ml',
		type: 'select',
		options: [
			{
				label: 'pc',
				value: 'pc',
			},
			{
				label: 'kg',
				value: 'kg',
			},
			{
				label: 'g',
				value: 'g',
			},
			{
				label: 'l',
				value: 'l',
			},
			{
				label: 'ml',
				value: 'ml',
			},
		],
		span: 1,
	},
	{
		name: 'sku',
		label: 'SKU (Stock Keeping Unit)',
		isRequired: false,
		type: 'text',
		span: 1,
	},
	{
		name: 'barcode',
		label: 'Barcode (ISBN, UPC, GTIN, etc.)',
		isRequired: false,
		type: 'text',
		span: 1,
	},

	{
		name: 'isFeatured',
		label: 'Is Featured',
		isRequired: false,
		type: 'checkbox',
		span: 1,
	},
	{
		name: 'isVisible',
		label: 'Is Visible',
		isRequired: false,
		type: 'checkbox',
		span: 1,
		endOfSection: true,
	},
	{
		sectionTitle: 'Product Collections',
		name: 'collection',
		label: 'Add to collections',
		isRequired: false,
		type: 'data-tag',
		model: 'collections',
		endOfSection: true,
	},

	{
		sectionTitle: 'Product Images',
		name: 'images',
		label: 'Images',
		isRequired: false,
		type: 'image-array',
		endOfSection: true,
	},

	{
		sectionTitle: 'Detailed Description',
		name: 'description',
		label: 'Long Description',
		isRequired: false,
		type: 'textarea',
		endOfSection: true,
	},

	{
		sectionTitle: 'Custom Attributes',
		name: 'customAttributes',
		label: 'Add Custom Attributes',
		isRequired: false,
		type: 'custom-attribute',
	},
	{
		label: 'Custom Sections',
		name: 'customSections',
		type: 'custom-section-array',
		isRequired: false,
		endOfSection: true,
	},
	{
		label: 'Frequently Asked Questions',
		name: 'faq',
		type: 'custom-section-array',
		isRequired: false,
		endOfSection: true,
	},
];

export const form = {
	type: 'add',
	title: 'Add New Product',
	path: 'products',
	fields: dataFields,
};

export default form;
