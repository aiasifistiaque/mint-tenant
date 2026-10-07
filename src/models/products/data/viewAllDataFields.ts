import { TableObjectDataProps } from '@/components/library';

const viewAllDataFields: TableObjectDataProps[] = [
	{
		title: 'Name',
		sort: 'name',
		type: 'image-text',
		dataKey: 'name',
		imageKey: 'image',
		default: true,
	},
	{ title: 'Category', dataKey: 'category.name', default: true },

	{
		title: 'Price',
		dataKey: 'price',
		sort: 'price',
		default: true,
	},

	{
		title: 'SKU',
		dataKey: 'sku',
		sort: 'sku',
		default: true,
	},
	{
		title: 'Slug',
		dataKey: 'slug',
		default: false,
		helperText:
			'The “slug” is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.',
	},

	{
		title: 'Barcode',
		dataKey: 'barcode',
		sort: 'barcode',
		default: false,
	},
	{
		title: 'Is Visible',
		dataKey: 'isVisible',
		type: 'tag',
		sort: 'isVisible',
		default: false,
		colorPalette: (data: boolean) => (data ? 'green' : 'red'),
	},

	{
		title: 'Is Featured',
		dataKey: 'isFeatured',
		type: 'tag',
		sort: 'isFeatured',
		default: true,

		colorPalette: (data: boolean) => (data ? 'green' : 'red'),
	},
	{
		title: 'isActive',
		dataKey: 'isActive',
		type: 'tag',
		sort: 'isActive',
		default: true,

		colorPalette: (data: boolean) => (data ? 'green' : 'red'),
	},
	{
		title: 'Is Discount?',
		dataKey: 'isDiscount',
		type: 'tag',
		sort: 'isDiscount',
		default: true,

		colorPalette: (data: boolean) => (data ? 'green' : 'red'),
	},
	{
		title: 'After Discount',
		dataKey: 'discountPrice',
		sort: 'discountPrice',
		default: true,
		editable: true,
	},
	{ title: 'Created', dataKey: 'createdAt', type: 'date', sort: 'createdAt' },
	{ title: '...', type: 'menu' },
];

export default viewAllDataFields;
