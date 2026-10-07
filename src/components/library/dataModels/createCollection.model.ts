import { InputData } from '..';

type FormDataType = {
	image: string | undefined;
	name: string | undefined;
	description: string | undefined;
	precedence: number | undefined;
};

const createCollection: InputData<FormDataType>[] = [
	// {
	// 	sectionTitle: 'Collection Image',
	// 	name: 'image',
	// 	label: 'Image',
	// 	isRequired: false,
	// 	type: 'image',
	// 	endOfSection: true,
	// },
	{
		name: 'name',
		label: 'Collection Title',
		isRequired: true,
		type: 'text',
	},
	// {
	// 	name: 'dataKey',
	// 	label: 'Collection Key',
	// 	isRequired: true,
	// 	type: 'text',
	// },
	{
		name: 'priority',
		label: 'Collection Priority',
		isRequired: true,
		type: 'number',
	},
	{
		name: 'description',
		label: 'Collection description',
		isRequired: false,
		type: 'textarea',
	},
];

export default createCollection;
