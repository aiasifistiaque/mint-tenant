import {
	convertToTableFields,
	convertToViewFields,
	createFormFields,
	TableObjectProps,
} from '@/components/library';

export { default as edit } from './editCategories.model';
export { default as create } from './editCategories.model';
// export { default as getAll } from './getAllCategories.model';
export { default as getById } from './getCategoryById.model';
export { default as createModal } from './editCategories.model';

import schema from './schema';
import categoriesSelectMenu from './categoriesSelectMenu';

const createLayout = [
	{
		sectionTitle: 'Category Details',
		fields: ['image', 'name'],
	},
	{
		sectionTitle: 'Description',
		fields: ['shortDescription'],
	},
	{
		sectionTitle: 'Display Settings',
		fields: ['priority', ['isActive', 'isFeatured'], ['displayInMenu', 'displayInHomePage']],
	},
];

const tableFields = [
	'name',
	// 'slug',
	'priority',
	'isActive',
	'displayInHomePage',
	'displayInMenu',
	'isFeatured',
	'createdAt',
];

const createModel = createFormFields({ schema, layout: createLayout });
const editModel = createFormFields({ schema, layout: createLayout, type: 'update' });
const viewFields = convertToTableFields({ schema, fields: tableFields });

const getAll: TableObjectProps = {
	title: 'Categories',
	path: 'categories',
	isModal: true,
	createModel: createModel,
	export: true,
	filters: true,

	select: {
		show: true,
		menu: categoriesSelectMenu,
	},

	button: {
		title: 'Add Category',
		path: '/categories/create',
	},
	menu: [
		{
			title: 'Edit',
			type: 'edit-modal',
			dataModel: editModel,
		},
		{
			title: 'View',
			type: 'view-modal',
			dataModel: convertToViewFields({ schema }),
		},
	],

	data: viewFields,
};

export { getAll };
