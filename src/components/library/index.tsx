'use client';

export { default as inputDataOptions } from './types/data-types/inputDataOptions';

//fundtions and hooks

export * from './hooks';
export * from './functions';

export * from './config';
export * as theme from './config';

export type ThemeProps = {
	TABLE: any;
	SIDEBAR: any;
};

//components
export * from './containers';

export * from './icon';

export * from './wrappers';

export * from './cms';

export * from './menu';
export * from './components';

export * from './nav';
export * from './utils/inputs';
export * from './utils/texts';

export * from './stat';

export * from './detail';
export { default as HeadingMenu } from './settings/heading-menu/HeadingMenu';

export * from './pages/page-tables';

export type * from './types';
export * from './utils/functions/handlers';

export * from './view';

export * from './components/table';

export * from './dynamic-filters/filters';

export { default as DynamicFilters } from './dynamic-filters/DynamicFilters';

export * from './create-page';
export * from './components/buttons';
export * from './modals';
export { Label, HelperText } from './form';
//export { OrderModal } from './pos';

export * from './store';
export * from './model';

export * from './model/types';
export * from './content';
export * from './components/skeleton';
export * from './page';
export * from './pos';
export * from './settings';

export * from './builder';

export * from './data';

export * from './ui';

export const alignmentOptions = [
	{
		label: 'Left',
		value: 'left',
	},
	{
		label: 'Center',
		value: 'center',
	},
	{
		label: 'Right',
		value: 'right',
	},
];

export const linkOptions = [
	{
		label: 'Page',
		value: 'page',
	},
	{
		label: 'Product',
		value: 'product',
	},
	{
		label: 'Category',
		value: 'category',
	},
	{
		label: 'Collection',
		value: 'collection',
	},
	{
		label: 'External Link',
		value: 'external',
	},
];

const BASE_LIMIT = 16;
export const SHOW_PER_PAGE_OPTIONS = [
	{ value: BASE_LIMIT, label: BASE_LIMIT },
	{ value: BASE_LIMIT * 2, label: BASE_LIMIT * 2 },
	{ value: 50, label: 50 },
	{ value: 100, label: 100 },
	{ value: 250, label: 250 },
	{ value: 999, label: 999 },
];

export type HomeContentProps = {
	content: any;
	dataModel: any;
	path: any;
	data?: any;
};
