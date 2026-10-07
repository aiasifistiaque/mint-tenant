import { TableObjectProps } from '@/components/library';
import createCollection from './createCollection.model';
import getCollectionById from './getCollectionById.model';
import menuSelect from './data/menuSelect';

const viewCollections: TableObjectProps = {
	title: 'Product Collections',
	path: 'collections',
	isModal: true,
	createModel: createCollection,
	export: false,

	button: {
		title: 'Add Collection',
	},
	select: {
		show: true,
		menu: menuSelect,
	},
	menu: [
		{
			title: 'Edit',
			type: 'edit-modal',
			dataModel: createCollection,
		},
		{
			title: 'View',
			type: 'view-modal',
			dataModel: getCollectionById,
		},
	],

	data: [
		{
			title: 'Name',
			dataKey: 'name',
			sort: 'name',
			// type: 'image-text',
			// imageKey: 'image',
			default: true,
		},
		// {
		// 	title: 'Key',
		// 	dataKey: 'dataKey',
		// 	sort: 'dataKey',
		// 	default: true,
		// },
		{
			title: 'isActive',
			dataKey: 'isActive',
			type: 'tag',
			sort: 'isActive',
			default: true,
			colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
		},
		{
			title: 'Display In Home',
			dataKey: 'displayInHome',
			type: 'tag',
			sort: 'displayInHome',
			colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
		},
		{
			title: 'Display In Menu',
			dataKey: 'displayInMenu',
			type: 'tag',
			sort: 'displayInMenu',
			colorPalette: (isActive: boolean) => (isActive ? 'green' : 'red'),
		},
		{
			title: 'Priority',
			dataKey: 'priority',
			sort: 'priority',
		},
		{ title: 'Created', dataKey: 'createdAt', type: 'date', sort: 'createdAt' },
		{ title: '...', type: 'menu' },
	],
};

export default viewCollections;
