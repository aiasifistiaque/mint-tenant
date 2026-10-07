import { InputData } from '@/components/library';

export type DataType = {
	name: string | undefined;
	isFeatured?: boolean;
	image?: string | undefined;
	meta?: {
		title: string;
		description: string;
	};
	[key: string]: any;
};

export const dataFields: InputData<DataType>[] = [
	{
		sectionTitle: 'Customer Info',
		name: 'name',
		label: 'Product Name',
		isRequired: true,
		type: 'text',
	},

	{
		name: 'email',
		label: 'Email',
		isRequired: true,
		type: 'text',
	},
	{
		name: 'phone',
		label: 'Phone Number',
		type: 'text',
	},
];

export const form = {
	type: 'add',
	title: 'Add Customer',
	path: 'customers',
	fields: dataFields,
};

export default form;
