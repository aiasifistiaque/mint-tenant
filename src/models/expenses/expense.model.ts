import {
	convertToViewFields,
	TableObjectProps,
	FormLayout,
	convertToTableFields,
	convertToFormFields,
} from '@/components/library';
import schema from './expenses.schema';

const formLayout: FormLayout = [
	{
		sectionTitle: 'Expense Details',
		fields: ['name', 'amount', 'date', 'category', 'tags', 'note'],
	},
];

const viewFields = convertToTableFields({
	schema,
	fields: ['name', 'amount', 'date', 'category', 'createdAt'],
});

const formFields = convertToFormFields({
	schema,
	layout: formLayout,
});

const viewDataFields = convertToViewFields({ schema });

const expenseTable: TableObjectProps = {
	title: 'Expenses',
	path: 'expenses',
	isModal: true,
	button: {
		title: 'Add Expense',
	},
	data: viewFields,
	createModel: formFields,
	menu: [
		{ type: 'edit-modal', title: 'Edit', dataModel: formFields },
		{ type: 'view-modal', title: 'View', dataModel: viewDataFields },
	],
};

export default expenseTable;
