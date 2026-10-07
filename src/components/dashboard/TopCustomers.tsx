import React from 'react';
import { TableObjectProps } from '@/components/library';
import TableCustom from '../library/sections/table/TableCustom';

const viewAll: TableObjectProps = {
	title: 'Top Customers',
	path: 'customers/analytics/top-buying',
	clickable: true,
	toPath: '/view/customers',
	export: false,
	search: false,
	hidePreferences: true,
	filters: false,
	limit: 5,
	pagination: false,
	preferences: ['name', 'totalOrders', 'totalOrderValue', 'totalProductsBought'],

	data: [
		{
			dataKey: 'name',
			title: 'Customer Name',
		},
		{
			dataKey: 'totalOrders',
			title: 'Orders',
		},
		{
			title: 'Order Value',
			dataKey: 'totalOrderValue',
			type: 'number',
		},
		{
			title: 'Products Bought',
			dataKey: 'totalProductsBought',
		},
	],
	showMenu: false,
};

const TopCustomers = () => {
	return <TableCustom table={viewAll} />;
};

export default TopCustomers;
