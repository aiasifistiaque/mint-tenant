import schema from '../product.schema';
import { convertToViewFields, MenuItemProps } from '@/components/library';

const itemMenu: MenuItemProps[] = [
	{
		title: 'View',
		type: 'view-modal',
		dataModel: convertToViewFields({ schema }),
	},
];

export default itemMenu;
