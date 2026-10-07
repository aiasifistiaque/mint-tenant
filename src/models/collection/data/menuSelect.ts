import { SelectmenuItemProps } from '@/components/library';

const data: SelectmenuItemProps[] = [
	{
		title: 'Change Active status',
		type: 'edit-select',
		key: 'isActive',
		options: [
			{ label: 'Active', value: true },
			{ label: 'In Active', value: false },
		],
		prompt: {
			title: 'Un-feature selected',
			body: 'Are you sure you want to un-feature these items?',
		},
	},
	{
		title: 'Display In Menu',
		type: 'edit-select',
		key: 'displayInMenu',
		options: [
			{ label: 'Show', value: true },
			{ label: 'Hide', value: false },
		],
		prompt: {
			title: 'Display In menu',
			body: 'Change Display In menu status?',
		},
	},
	{
		title: 'Display In Home Page',
		type: 'edit-select',
		key: 'displayInHomePage',
		options: [
			{ label: 'Show', value: true },
			{ label: 'Hide', value: false },
		],
		prompt: {
			title: 'Display In home page',
			body: 'Change Display In Home Page status for the selected items?',
		},
	},
];

export default data;
