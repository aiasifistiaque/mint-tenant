import {
	convertToViewFields,
	TableObjectProps,
	FormLayout,
	convertToTableFields,
	convertToFormFields,
} from '@/components/library';
import schema from './brand.schema';

const formLayout: FormLayout = [
	{
		sectionTitle: 'Brand Details',
		fields: ['image', 'name'],
	},
	{
		sectionTitle: 'Description',
		fields: ['description', 'tags'],
	},
];

const viewFields = convertToTableFields({
	schema,
	fields: ['name', 'createdAt'],
});

const formFields = convertToFormFields({
	schema,
	layout: formLayout,
});

const viewDataFields = convertToViewFields({ schema });

export const createBrandModel = formFields;

const brandsTable: TableObjectProps = {
	title: 'Brands',
	path: 'brands',
	isModal: true,
	button: {
		title: 'Add Brand',
	},
	data: viewFields,
	createModel: formFields,
	menu: [
		{ type: 'edit-modal', title: 'Edit', dataModel: formFields },
		{ type: 'view-modal', title: 'View', dataModel: viewDataFields },
	],
};

export default brandsTable;
