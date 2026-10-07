import {
	CreateLayoutProps,
	TableObjectProps,
	createFormFields,
	convertToTableFields,
	convertToViewFields,
} from '@/components/library';
import schema from './schema';

const createLayout: CreateLayoutProps = [
	{ sectionTitle: 'Role Info', fields: ['name', 'isActive'] },
	{
		sectionTitle: 'Permissions',
		fields: ['permissions'],
	},
	{
		sectionTitle: 'Additional Info',
		fields: ['description'],
	},
];

const tableLayout: string[] = ['name', 'isActive', 'createdAt'];

const createFields = createFormFields({ schema, layout: createLayout });
export const viewAllDataFields = convertToTableFields({ schema, fields: tableLayout });
export const viewPreviewFields = convertToViewFields({ schema });

const itemMenu: any[] = [
	{
		title: 'View',
		type: 'view-modal',
		dataModel: convertToViewFields({ schema }),
	},
	{
		title: 'Edit',
		type: 'edit-modal',
		dataModel: createFields,
	},
];

const viewAll: TableObjectProps = {
	title: 'Roles',
	path: 'roles',
	// clickable: true,
	//toPath: '/items/edit',
	isModal: true,
	createModel: createFields,
	export: true,
	// select: {
	// 	show: true,
	// 	menu: multiSelectMenu,
	// },

	menu: itemMenu,
	button: {
		title: 'Add Role',
		path: '/roles/create',
	},

	data: viewAllDataFields,
};

const form = {
	type: 'add',
	title: 'Add New Role',
	path: 'roles',

	fields: createFields,
};

export {
	form,
	form as creteForm,
	createFields as formFields,
	viewAll,
	viewPreviewFields as viewById,
};
