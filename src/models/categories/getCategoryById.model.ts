import { ViewModalDataModelProps } from '@/components/library';

const getCategoryById: ViewModalDataModelProps[] = [
	{
		title: 'Image',
		dataKey: 'image',
		type: 'image',
	},
	{
		title: 'Name',
		dataKey: 'name',
		type: 'string',
	},
	{
		title: 'Slug',
		dataKey: 'slug',
		type: 'string',
	},
	{
		title: 'Short Description',
		dataKey: 'shortDescription',
		type: 'string',
	},
	{
		title: 'Long description',
		dataKey: 'longDescription',
		type: 'string',
	},

	{
		title: 'Priority',
		dataKey: 'priority',
		type: 'string',
	},
	// {
	// 	title: 'Tags',
	// 	dataKey: 'tags',
	// 	type: '',
	// },
	{
		title: 'Active',
		dataKey: 'isActive',
		type: 'tag',
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},
	{
		title: 'Featured',
		dataKey: 'isFeatured',
		type: 'tag',
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},
	{
		title: 'Display in Home Page',
		dataKey: 'displayInHomePage',
		type: 'tag',
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},
	{
		title: 'Display in Menu',
		dataKey: 'displayInMeny',
		type: 'tag',
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},
	{
		title: 'Created',
		dataKey: 'createdAt',
		type: 'date',
	},
];

export default getCategoryById;
