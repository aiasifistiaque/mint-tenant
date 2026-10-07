import { ButtonProps, FlexProps, GridProps, TableCellProps, TextProps } from '@chakra-ui/react';
export type { CustomTableProps } from './components.types';
import { SelectmenuItem } from './table';

export type { MenuItem as MenuItemProps, SelectmenuItem as SelectmenuItemProps } from './table';

export type { default as Schema } from './schema.types';

import { InputDataType } from './data-types';
export type { InputDataType } from './data-types';
// export { default as inputDataOptions } from './data-types/inputDataOptions';

import { ViewDataType, TableDataFieldType } from './data-types';
import { ReactNode } from 'react';
export type { ViewDataType, TableDataFieldType } from './data-types';

export type SidebarItemType = {
	title: string;
	href: string;
	icon: string;
	path: string;
	startOfSection?: boolean;
	sectionTitle?: string;
};

export type TableItemProps = {
	title: string;
	sort?: string;
	dataKey?: any;
};

export type TableDataProps = TableCellProps & {
	children: any;
	date?: boolean;
	price?: boolean;
	src?: string;
	type?: string;
	heading?: string;
	editable?: boolean;
};

type EditType = 'text' | 'number' | 'select' | 'boolean' | 'date';

type Options = {
	label: string;
	value: string;
}[];

type CommonProps = {
	date?: boolean;
	price?: boolean;
	type?: TableDataFieldType;
	title?: string;
	sort?: string;
	dataKey?: string;
	image?: boolean;
	imageKey?: string;
	editable?: boolean;
	default?: boolean;
	style?: any;
	tagType?: { value?: string; color?: string }[];
	colorPalette?: any;
	helperText?: string;
	toLocaleStr?: boolean;
};

type SelectProps = CommonProps & {
	editType: 'select';
	options: Options;
};

type NonSelectProps = CommonProps & {
	editType?: Exclude<EditType, 'select'>;
};

export type TableObjectDataProps = SelectProps | NonSelectProps;

/**
 * Data Modal for the
 * View Modal
 * When the user clicks on the view button
 * on the table, if the type is view-modal
 * this data model will be used to display
 */

export type ViewModalDataModelProps = {
	title: string;
	dataKey: string;
	type?: ViewDataType;
	colorPalette?: any;
	path?: string;
	copy?: boolean;
};

export type SelectDataType = {
	show: boolean;
	menu: SelectmenuItem[];
};

export type FormLayout = {
	sectionTitle: string;
	fields: any[];
	description?: string;
	collapsible?: boolean;
}[];

export type ModelType =
	| 'products'
	| 'brands'
	| 'categories'
	| 'users'
	| 'orders'
	| 'coupons'
	| 'customers'
	| 'collections';

type BaseInputData<T> = {
	name: string;
	label: string;
	isRequired?: boolean;
	placeholder?: string;
	renderCondition?: (formData: T) => boolean;
	span?: number;
	options?: { label: string; value: string }[];
	startOfSection?: boolean;
	sectionTitle?: string;
	description?: string;
	endOfSection?: boolean;
	object?: boolean;
	dataModel?: any;
	value?: any;
	getValue?: (doc: any) => any;
};

type DataSelectInputData<T> = BaseInputData<T> & {
	type: 'data-select' | 'data-tag' | 'data-menu';
	model: ModelType;
};

type OtherInputData<T> = BaseInputData<T> & {
	type: Exclude<InputDataType, 'data-select'>;
};

export type InputData<T> = DataSelectInputData<T> | OtherInputData<T>;

export type FlexChild = FlexProps & {
	children?: ReactNode;
};

export type GridChild = GridProps & {
	children?: ReactNode;
};

export type ButtonChild = ButtonProps & {
	children?: ReactNode;
};

export type TextChild = TextProps & {
	children?: ReactNode;
};

export type SelectChild = any & {
	children?: ReactNode;
	placeholder?: any;
};

export type PromptType = {
	title: string;
	body?: string;
	btnText?: string;
	successMsg?: string;
};

export type { SchemaType } from './schema.types';
export * from './TableObjectProps.types';
