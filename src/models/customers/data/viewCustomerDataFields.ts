import { TableObjectDataProps } from '@/components/library';

const viewCustomerDataFields: TableObjectDataProps[] = [
	{
		title: 'Name',
		sort: 'name',
		type: 'image-text',
		dataKey: 'name',
		imageKey: 'image',
		default: true,
	},

	{
		title: 'Email',
		dataKey: 'email',
		sort: 'email',
		default: true,
	},

	{
		title: 'Phone',
		dataKey: 'phone',
		sort: 'phone',
		default: true,
	},
	{
		title: 'Shop',
		dataKey: 'shop.name',
		sort: 'shop',
		default: true,
	},

	{
		title: 'Subscribed to email',
		dataKey: 'isSubscribedToEmail',
		sort: 'isSubscribedToEmail',
		type: 'tag',
		default: false,
		colorPalette: (data: boolean) => (data ? 'green' : 'red'),
	},

	{
		title: 'Is Registered Online',
		dataKey: 'isRegisteredOnline',
		sort: 'isRegisteredOnline',
		type: 'tag',
		default: true,
		colorPalette: (data: boolean) => (data ? 'green' : 'red'),
	},

	{
		title: 'Is Active',
		dataKey: 'isActive',
		type: 'tag',
		sort: 'isActive',
		default: false,
		colorPalette: (data: boolean) => (data ? 'green' : 'red'),
	},

	{ title: 'Created', dataKey: 'createdAt', type: 'date', sort: 'createdAt' },
	{ title: '...', type: 'menu' },
];

export default viewCustomerDataFields;
