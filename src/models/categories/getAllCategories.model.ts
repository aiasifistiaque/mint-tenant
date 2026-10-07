import { TableObjectProps } from '@/components/library';
// import { categories } from '@/models';
import editCategories from './editCategories.model';
import getCategoryById from './getCategoryById.model';

// const { create, update, getById } = categories;

const data: TableObjectProps = {
	title: 'Categories',
	path: 'categories',
	isModal: true,
	createModel: editCategories,
	export: true,
	filters: true,

	select: {
		show: true,
		menu: [
			{
				title: 'Change Active status',
				type: 'edit-select',
				key: 'isActive',
				options: [
					{ label: 'Active', value: true },
					{ label: 'In Active', value: false },
				],
				prompt: {
					title: 'Un-feature selected',
					body: 'Are you sure you want to un-feature these items?',
				},
			},
			{
				title: 'Display In Menu',
				type: 'edit-select',
				key: 'displayInMenu',
				options: [
					{ label: 'Show', value: true },
					{ label: 'Hide', value: false },
				],
				prompt: {
					title: 'Display In menu',
					body: 'Change Display In menu status?',
				},
			},
			{
				title: 'Display In Home Page',
				type: 'edit-select',
				key: 'displayInHomePage',
				options: [
					{ label: 'Show', value: true },
					{ label: 'Hide', value: false },
				],
				prompt: {
					title: 'Display In home page',
					body: 'Change Display In Home Page status for the selected items?',
				},
			},
		],
	},

	button: {
		title: 'Add Category',
		path: '/categories/create',
	},
	menu: [
		{
			title: 'Edit',
			type: 'edit-modal',
			dataModel: editCategories,
		},
		{
			title: 'View',
			type: 'view-modal',
			dataModel: getCategoryById,
		},
	],

	data: [
		{
			title: 'Name',
			dataKey: 'name',
			sort: 'name',
			default: true,
		},
		{
			title: 'Slug',
			dataKey: 'slug',
			sort: 'slug',
			default: true,
		},
		{ title: 'Priority', dataKey: 'priority', sort: 'priority', default: true },

		{
			title: 'isActive',
			dataKey: 'isActive',
			type: 'tag',
			sort: 'isActive',
			default: true,
			colorPalette: (data: boolean) => (data ? 'green' : 'red'),
		},
		{
			title: 'Display In Home',
			dataKey: 'displayInHomePage',
			type: 'tag',
			sort: 'displayInHomePage',
			default: true,
			colorPalette: (data: boolean) => (data ? 'green' : 'red'),
		},
		{
			title: 'Display In Menu',
			dataKey: 'displayInMenu',
			type: 'tag',
			sort: 'displayInMenu',
			default: false,
			colorPalette: (data: boolean) => (data ? 'green' : 'red'),
		},
		{
			title: 'Featured',
			dataKey: 'isFeatured',
			type: 'tag',
			sort: 'isFeatured',
			default: false,
			colorPalette: (data: boolean) => (data ? 'green' : 'red'),
		},
		{ title: 'Created', dataKey: 'createdAt', type: 'date', sort: 'createdAt' },
		{ title: '...', type: 'menu' },
	],
};

export default data;
