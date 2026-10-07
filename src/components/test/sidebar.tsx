import { SidebarItemType } from '../library';

const sidebar: SidebarItemType[] = [
	{
		title: 'Dashboard',
		href: '/',
		icon: 'home',
		path: 'dashboard',
	},

	{
		startOfSection: true,
		sectionTitle: 'Shop Management',
		title: 'Shops',
		href: '/shops',
		icon: 'order',
		path: 'shops',
	},
	{
		title: 'Packages',
		href: '/packages',
		icon: 'order',
		path: 'packages',
	},
	{
		title: 'User',
		href: '/sellers',
		icon: 'order',
		path: 'sellers',
	},
	{
		startOfSection: true,
		sectionTitle: 'Data Management',
		title: 'Products',
		href: '/products',
		icon: 'product',
		path: 'products',
	},
	// {
	// 	title: 'Categories',
	// 	href: '/categories',
	// 	icon: 'category',
	// 	path: 'categories',
	// },
	{
		title: 'Leads',
		href: '/leads',
		icon: 'customer',
		path: 'leads',
	},
	{
		title: 'Customers',
		href: '/customers',
		icon: 'customer',
		path: 'customers',
	},
	{
		startOfSection: true,
		sectionTitle: 'Theme',
		title: 'Themes',
		href: '/themes',
		icon: 'product',
		path: 'themes',
	},
	{
		title: 'Purchases',
		href: '/purchased-themes',
		icon: 'product',
		path: 'purchased-themes',
	},
	{
		startOfSection: true,
		sectionTitle: 'Admin Management',
		title: 'Admin List',
		href: '/admins',
		icon: 'customer',
		path: 'admins',
	},
	{
		title: 'Roles',
		href: '/adminroles',
		icon: 'customer',
		path: 'adminroles',
	},
	{
		title: 'Clients',
		href: '/clients',
		icon: 'customer',
		path: 'clients',
	},
	{
		title: 'Projects',
		href: '/projects',
		icon: 'customer',
		path: 'projects',
	},
	{
		title: 'Meetings',
		href: '/meetings',
		icon: 'customer',
		path: 'meetings',
	},
	{
		title: 'Documents',
		href: '/documents',
		icon: 'customer',
		path: 'documents',
	},
	{
		startOfSection: true,
		sectionTitle: 'Career',
		title: 'Job Posts',
		href: '/jobposts',
		icon: 'customer',
		path: 'jobposts',
	},
	{
		title: 'Applications',
		href: '/jobapplications',
		icon: 'customer',
		path: 'jobapplications',
	},
	{
		startOfSection: true,
		sectionTitle: 'Framework Doc',
		title: 'Components',
		href: '/components',
		icon: 'customer',
		path: 'components',
	},
	{
		title: 'Props',
		href: '/props',
		icon: 'customer',
		path: 'props',
	},

	{
		title: 'Settings',
		href: '/settings',
		icon: 'settings-fill',
		path: 'settings',
	},
];

export default sidebar;
