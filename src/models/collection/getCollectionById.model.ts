import { ViewModalDataModelProps } from '@/components/library';

const getCollectionById: ViewModalDataModelProps[] = [
	{
		title: 'Name',
		dataKey: 'name',
		type: 'string',
	},

	{
		title: 'isActive',
		dataKey: 'isActive',
		type: 'tag',
		colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
	},
	{
		title: 'Priority',
		dataKey: 'priority',

		type: 'string',
	},
	{ title: 'Created At', dataKey: 'createdAt', type: 'date' },
];

export default getCollectionById;
