import { InputData } from '..';

type FormDataType = {
	image: string | undefined;
	name: string | undefined;
	isActive: boolean;
	isFeatured: boolean;
	description?: string | undefined;
	[key: string]: any;
};

const createBrand: InputData<FormDataType>[] = [
	{
		startOfSection: true,
		sectionTitle: 'Image',
		name: 'image',
		label: 'Image',
		isRequired: false,
		type: 'image',
		endOfSection: true,
	},

	{
		name: 'name',
		label: 'Brand Name',
		isRequired: true,
		type: 'text',
	},
	{
		name: 'isActive',
		label: 'Is Active',
		isRequired: false,
		type: 'switch',
	},
	{
		name: 'isFeatured',
		label: 'Featured',
		isRequired: false,
		type: 'switch',
	},
	{
		name: 'description',
		label: 'Brand Description',
		isRequired: false,
		type: 'textarea',
	},
];

export default createBrand;
