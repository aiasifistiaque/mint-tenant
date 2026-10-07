import { InputData } from '@/components/library/types';

export type DataType = {
	name: string | undefined;
	isFeatured: boolean;
	image?: string | undefined;
	meta?: {
		title: string;
		description: string;
	};
	[key: string]: any;
};

const createCategoryModalModel: InputData<DataType>[] = [
	// {
	// 	sectionTitle: 'Category Image',
	// 	name: 'image',
	// 	label: 'Image',
	// 	isRequired: false,
	// 	type: 'image',
	// 	endOfSection: true,
	// },
	{
		sectionTitle: 'Details',
		name: 'name',
		label: 'Category Name',
		isRequired: true,
		type: 'text',
	},
	{
		name: 'description',
		label: 'Description',
		isRequired: false,
		type: 'textarea',
	},
	{
		name: 'priority',
		label: 'Priority',
		isRequired: false,
		type: 'number',
	},
	{
		name: 'isActive',
		label: 'Is Active',
		isRequired: false,
		type: 'checkbox',
		endOfSection: true,
	},
];

export default createCategoryModalModel;
