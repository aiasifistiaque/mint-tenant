import {
	CreateLayoutProps,
	convertToTableFields,
	convertToViewFields,
	createFormFields,
} from '@/components/library';
import schema from './schema';
import { TableObjectProps } from '@/components/library';

const createLayout: any = [
	{ sectionTitle: 'Admin Info', fields: ['name', ['email', 'phone'], 'password'] },
	{
		sectionTitle: 'Role',
		fields: ['role'],
	},
];

const editLayout: any = [
	{ sectionTitle: 'Admin Info', fields: ['name', ['email', 'phone']] },
	{
		sectionTitle: 'Role',
		fields: ['role'],
	},
];

const createFields = createFormFields({ schema, layout: createLayout });
const editFields = createFormFields({ schema, layout: editLayout });
const viewAllDataFields = convertToTableFields({ schema });

const itemMenu: any[] = [
	{
		title: 'View',
		type: 'view-modal',
		dataModel: convertToViewFields({
			schema,
			fields: ['name', 'email', 'phone', 'role'],
		}),
	},
	{
		title: 'Edit',
		type: 'edit-modal',
		dataModel: editFields,
	},
];

const viewAll: TableObjectProps = {
	title: 'Users',
	path: 'users',
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
		title: 'Add User',
		path: '/roles/create',
	},

	data: viewAllDataFields,
};

const form = {
	type: 'add',
	title: 'Add New User',
	path: 'users',
	fields: createFields,
};

export { form, form as creteForm, createFields as formFields, viewAll };
