import { InputData } from '..';

type FormDataType = {
	name: string | undefined;
	email: string | undefined;
	phone: string | undefined;
	note: string | undefined;
};

const createCustomer: InputData<FormDataType>[] = [
	{
		name: 'name',
		label: 'Customer Name',
		isRequired: true,
		type: 'text',
	},
	{
		name: 'email',
		label: 'Customer Email',
		isRequired: true,
		type: 'text',
		span: 1,
	},
	{
		name: 'phone',
		label: 'Customer Phone No.',
		isRequired: false,
		type: 'text',
		span: 1,
	},
	{
		name: 'note',
		label: 'Add Note',
		isRequired: false,
		type: 'textarea',
	},
];

export default createCustomer;
