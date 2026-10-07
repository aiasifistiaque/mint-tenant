import React from 'react';
import { TableObjectProps } from '@/components/library';
import { viewAllDataFields } from '@/models/order';
import TableCustom from '../library/sections/table/TableCustom';

const viewAll: TableObjectProps = {
	title: 'Orders',
	path: 'orders',
	clickable: true,
	toPath: '/orders',
	export: false,
	search: false,
	hidePreferences: true,
	filters: false,
	pagination: false,
	limit: 5,
	preferences: ['customer.name', 'totalItems', 'status', 'total', 'dueAmount', 'profit'],
	// select: {
	// 	show: true,
	// 	menu: multiSelectMenu,
	// },
	// button: {
	// 	title: 'Add Product',
	// 	path: '/products/create',
	// },
	// menu: itemMenu,
	// clickable: true,

	data: viewAllDataFields,
	showMenu: false,
};

const OrderTable = () => {
	return <TableCustom table={viewAll} />;
};

export default OrderTable;
