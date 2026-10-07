import { InputData } from '@/components/library';

export type DataType = {
	name: string | undefined;
	isFeatured: boolean;
	image?: string | undefined;

	meta?: {
		title: string;
		description: string;
		keywords: string[];
	};
	[key: string]: any;
};

const dataFields: InputData<DataType>[] = [
	{
		sectionTitle: 'Category Image',
		name: 'image',
		label: 'Image',
		isRequired: false,
		type: 'image',
	},
	{
		name: 'name',
		label: 'Category Name',
		isRequired: true,
		type: 'text',
	},
	{
		name: 'slug',
		label: 'Category Slug',
		isRequired: true,
		type: 'slug',
	},
	{
		name: 'isActive',
		label: 'Is Active',
		isRequired: false,
		type: 'checkbox',
	},
	// {
	// 	sectionTitle: 'Parent Category',
	// 	name: 'parent',
	// 	label: 'Parent Category',
	// 	isRequired: false,
	// 	type: 'select',
	// 	options: [],
	// },

	{
		name: 'priority',
		label: 'Priority',
		isRequired: false,
		type: 'number',
		endOfSection: true,
	},
	{
		sectionTitle: 'Category Description',
		name: 'shortDescription',
		label: 'Short Description',
		isRequired: false,
		type: 'textarea',
	},
	{
		name: 'description',
		label: 'Long Description',
		isRequired: false,
		type: 'textarea',
	},
	{
		name: 'tags',
		label: 'Add Tags',
		isRequired: false,
		type: 'tag',
	},
	{
		sectionTitle: 'Display Settings',
		name: 'isFeatured',
		label: 'Is Featured?',
		isRequired: false,
		type: 'checkbox',
	},
	{
		name: 'displayInHomePage',
		label: 'Display In Home Page?',
		isRequired: false,
		type: 'checkbox',
	},
	{
		name: 'displayInMenu',
		label: 'Display In Menu/Sidebar?',
		isRequired: false,
		type: 'checkbox',
		endOfSection: true,
	},
	{
		sectionTitle: 'Meta Data',
		name: 'meta.title',
		label: 'Meta Title',
		isRequired: false,
		type: 'text',
	},
	{
		name: 'meta.description',
		label: 'Meta Description',
		isRequired: false,
		type: 'textarea',
	},
	{
		name: 'meta.keywords',
		label: 'Meta Keywords',
		isRequired: false,
		type: 'text',
		endOfSection: true,
	},
];

export default dataFields;
