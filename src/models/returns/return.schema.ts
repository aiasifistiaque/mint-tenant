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
	invoice: {
		label: 'Invoice',
		type: 'string',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
	},
	amount: {
		label: 'Amount',
		type: 'number',
		sort: true,
		default: true,
		displayInTable: true,
		isRequired: true,
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

	otherReason: {
		label: 'Note',
		type: 'textarea',
	},
	date: {
		label: 'Return Date',
		type: 'date',
		sort: true,
		default: true,
		displayInTable: true,
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
	fields: ['invoice', 'amount', 'reason', 'note', 'date', 'createdAt'],
});

const formFields = convertToFormFields({
	schema,
	layout: formLayout,
});

const viewDataFields = convertToViewFields({ schema });

const damageTable: TableObjectProps = {
	title: 'Returns',
	path: 'returns',
	invalidate: ['returns', 'orders'],
	data: viewFields,
	menu: [
		{ type: 'edit-modal', title: 'Edit', dataModel: formFields },
		{ type: 'view-modal', title: 'View', dataModel: viewDataFields },
		{
			type: 'view-modal',
			title: 'View Return',
			dataModel: viewProductFields,
			path: 'returns',
			id: (data: any) => data?.product?._id,
		},
	],
};

export default damageTable;
