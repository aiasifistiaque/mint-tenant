import { convertToFormFields } from '@/components/library';
import { createBrandModel } from '../brand/brand.model';
import productUnitOptions from '../util/productUnitOptions';
import categorySchema from '@/models/categories/schema';

const categoryScehma = convertToFormFields({
	schema: categorySchema,
	layout: [
		{
			sectionTitle: 'Category Details',
			fields: ['name'],
		},
	],
});
const schema = {
	image: {
		label: 'Thumbnail',
		type: 'image',
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
	category: {
		label: 'Category',
		isRequired: true,
		type: 'data-menu',
		model: 'categories',
		displayInTable: true,
		tableType: 'text',
		tableKey: 'category.name',
		dataModel: categorySchema,
	},
	brand: {
		label: 'Brand',
		type: 'data-menu',
		model: 'brands',
		displayInTable: true,
		tableType: 'text',
		tableKey: 'brand.name',
		dataModel: createBrandModel,
	},
	cost: {
		label: 'Cost Price',
		required: true,
		displayInTable: true,
		default: true,
		type: 'number',
		sort: true,
	},
	price: {
		label: 'Price',
		required: true,
		displayInTable: true,
		default: true,
		type: 'number',
		sort: true,
	},
	vat: {
		label: 'Vat in %',
		type: 'number',
		//displayInTable: true,
	},

	shortDescription: {
		label: 'Short Description',
		type: 'textarea',
	},
	description: {
		label: 'Description',
		type: 'textarea',
	},
	unitValue: {
		type: 'number',
		label: 'Unit',
	},
	unit: {
		label: 'Product Unit',
		placeholder: 'e.g. pc, kg, g, l, ml',
		type: 'select',
		options: productUnitOptions,
	},
	sku: {
		label: 'SKU (Stock Keeping Unit)',
		tableLabel: 'SKU',
		type: 'text',
		displayInTable: true,
	},
	slug: {
		label: 'Slug',
		type: 'slug',
		tableType: 'text',
		displayInTable: true,
		required: true,
		sort: true,
	},
	shop: {
		label: 'Shop',
		type: 'string',
		displayInTable: true,
		tableType: 'text',
		tableKey: 'shop.name',
	},
	isActive: {
		label: 'Is Active',
		type: 'checkbox',
		displayInTable: true,
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},

	images: {
		label: 'Images',
		type: 'image-array',
	},

	collection: {
		label: 'Add to collections',
		type: 'data-tag',
		model: 'collections',
	},

	isFeatured: {
		label: 'Is Featured',
		type: 'checkbox',
		displayInTable: true,
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},
	isDiscount: {
		sort: true,
		label: 'Is Discount',
		type: 'checkbox',
		displayInTable: true,
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},
	discountType: {
		sort: true,
		label: 'Discount Type',
		type: 'select',
		displayInTable: true,
		options: [
			{ label: 'Percentage', value: 'percentage' },
			{ label: 'Flat', value: 'flat' },
		],
		renderCondition: (data: any) => data.isDiscount,
	},
	discount: {
		sort: true,
		label: 'Discount',
		isRequired: false,
		type: 'number',
		displayInTable: true,
		renderCondition: (data: any) => data.isDiscount,
	},

	barcode: {
		type: 'text',
		label: 'Barcode (ISBN, UPC, GTIN, etc.)',
		displayInTable: true,
		sort: true,
	},

	allowStock: {
		type: 'checkbox',
		label: 'Allow Stock',
		sort: true,
		displayInTable: true,
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},

	stock: {
		type: 'number',
		label: 'Stock',
		displayInTable: true,
		sort: true,
		renderCondition: (data: any) => data.allowStock,
	},

	lowStockAlert: {
		type: 'number',
		label: 'Low Stock Alert',
		displayInTable: true,
		sort: true,
		renderCondition: (data: any) => data.allowStock,
	},

	tags: {
		label: 'tags',
		isRequired: false,
		type: 'tag',
	},
	status: {
		label: 'Status',
		isRequired: true,
		displayInTable: true,
		colorPalette: (data: any) => {
			if (data === 'published') return 'green';
			if (data === 'draft') return 'orange';
			if (data === 'archived') return 'red';
		},
		type: 'select',
		options: [
			{ label: 'Draft', value: 'draft' },
			{ label: 'Published', value: 'published' },
			{ label: 'Archived', value: 'archived' },
		],
	},

	customAttributes: {
		label: 'Add Custom Attributes',
		isRequired: false,
		type: 'custom-attribute',
	},
	customSections: {
		label: 'Custom Sections',
		type: 'custom-section-array',
		isRequired: false,
		// dataModel: [
		// 	{ name: 'title', label: 'Title', type: 'text' },
		// 	{ name: 'description', label: 'Description', type: 'textarea' },
		// 	// { name: 'image', label: 'Image', type: 'image' },
		// ],
	},

	faq: {
		label: 'Frequently Asked Questions',
		type: 'custom-section-array',
		isRequired: false,
	},
	'meta.title': {
		label: 'Meta Title',
		type: 'text',
	},
	'meta.description': {
		label: 'Meta Description',
		type: 'textarea',
	},
	createdAt: {
		label: 'Created At',
		type: 'date',
		displayInTable: true,
		sort: true,
	},
};

export default schema;
