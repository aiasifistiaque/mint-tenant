import { InputData } from '@/components/library';

const dataFields: InputData<any>[] = [
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
		type: 'read-only',
	},

	{
		name: 'phone',
		label: 'Phone Number',
		type: 'text',
	},
];

export default dataFields;
