import { TableObjectProps } from '@/components/library';

export const expenseCategoryCreateModel = [
	{
		name: 'name',
		label: 'Name',
		isRequired: true,
	},
];

const expenseCategoryTable: TableObjectProps = {
	title: 'Expense Categories',
	path: 'expense-categories',
	isModal: true,
	hidePreferences: true,
	filters: false,
	createModel: expenseCategoryCreateModel,
	preferences: ['name'],
	button: {
		title: 'Add Expense Category',
	},
	menu: [
		{
			type: 'view',
			title: 'View',
			dataModel: [
				{
					title: 'Name',
					dataKey: 'name',
					type: 'text',
				},
			],
		},
		{ type: 'edit-modal', title: 'Edit', dataModel: expenseCategoryCreateModel },
	],
	data: [
		{
			title: 'Name',
			dataKey: 'name',
			default: true,
			sort: 'name',
		},
	],
};

export default expenseCategoryTable;
