import { Schema, TableObjectDataProps } from '@/components/library';
import {
	convertToViewFields,
	TableObjectProps,
	FormLayout,
	convertToTableFields,
	convertToFormFields,
} from '@/components/library';
import { viewProductFields } from '../products/products.model';

export const adjustmentSchema: Schema = {
	product: {
		label: 'Product',
		type: 'data-menu',
		tableKey: 'product.name',
		model: 'products',
		tableType: 'text',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},
	change: {
		label: 'Quantity',
		type: 'number',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},

	value: {
		label: 'Value',
		type: 'number',
		sort: true,
		default: true,
		displayInTable: true,
	},

	note: {
		label: 'Note',
		type: 'textarea',
	},
	reason: {
		label: 'Reason',
		// 'multi-select' is quarantined (PLANNED_FIELD_TYPES) until WO-34 — it fell
		// through to a plain text box before too, so 'text' is behavior-identical.
		type: 'text',
		sort: true,
		default: true,
		displayInTable: true,
		options: [
			{ label: 'Damaged', value: 'damaged' },
			{ label: 'Expired', value: 'expired' },
			// { label: 'Stock Adjustment', value: 'stock-adjustment' },
			// { label: 'Other', value: 'other' },
		],
	},
	createdAt: {
		label: 'Created At',
		type: 'date',
		sort: true,
		default: true,
		displayInTable: true,
	},
};

const formLayout: FormLayout = [
	{
		sectionTitle: 'Damage Details',
		fields: ['product', 'change', 'note'],
	},
];

const schema = adjustmentSchema;

const viewFields = convertToTableFields({
	schema,
	fields: ['product', 'change', 'reason', 'note', 'value', 'createdAt'],
});

const formFields = convertToFormFields({
	schema,
	layout: formLayout,
});

const viewDataFields = convertToViewFields({ schema });

const damageTable: TableObjectProps = {
	title: 'Damages',
	path: 'adjustments/damages',
	isModal: true,
	hidePreferences: true,
	invalidate: ['products'],

	button: {
		title: 'Add Damage',
	},
	data: viewFields,
	createModel: formFields,
	menu: [
		{ type: 'edit-modal', title: 'Edit', dataModel: formFields },
		{ type: 'view-modal', title: 'View', dataModel: viewDataFields },
		{
			type: 'view-modal',
			title: 'View Product',
			dataModel: viewProductFields,
			path: 'products',
			id: (data: any) => data?.product?._id,
		},
	],
};

export default damageTable;
