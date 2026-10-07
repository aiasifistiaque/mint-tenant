import { TableObjectProps } from '@/components/library';
import multiSelectMenu from './data/multiSelect';
import itemMenu from './data/itemMenu';
import viewAllDataFields from './data/viewAllDataFields';

const dataFields: TableObjectProps = {
	title: 'Products',
	path: 'products',
	// clickable: true,
	//toPath: '/items/edit',
	export: true,
	select: {
		show: true,
		menu: multiSelectMenu,
	},
	button: {
		title: 'Add Product',
		path: '/products/create',
	},
	menu: itemMenu,
	data: viewAllDataFields,
};

export default dataFields;
