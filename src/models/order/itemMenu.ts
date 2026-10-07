// import schema from './order.schema.ts';
import { convertToViewFields, MenuItemProps } from '@/components/library';
import ViewOrderModal from '@/components/library/pos/ViewOrderModel';

const itemMenu: MenuItemProps[] = [
	// {
	// 	title: 'Edit',
	// 	type: 'edit',
	// },
	// {
	// 	title: 'Details',
	// 	type: 'redirect',
	// 	href: '/go/details',
	// },
	// {
	// 	title: 'View',
	// 	type: 'view-modal',
	// 	dataModel: convertToViewFields({ schema }),
	// },
	// {
	// 	title: 'Make Copy',
	// 	type: 'duplicate',
	// },
	{
		title: 'View Order',
		type: 'custom-modal',
		modal: ViewOrderModal,
	},
	{
		title: 'Details',
		type: 'custom-redirect',
		href: (formData: any) => `/orders/${formData._id}`,
	},
	{
		title: 'Sale Return',
		type: 'custom-redirect',
		href: (formData: any) => `/return/${formData._id}`,
	},
	{
		title: 'Delete',
		type: 'delete',
	},
];

export default itemMenu;
