export type CreateLayoutProps = {
	sectionTitle: string;
	fields: string[] | string[][];
}[];

type SchemaFieldTypes =
	| 'text'
	| 'checkbox'
	| 'date'
	| 'string'
	| 'textarea'
	| 'tag'
	| 'data-menu'
	| 'password'
	| 'select'
	| 'data-tag'
	| 'multi-select';

type Types =
	| 'checkbox'
	| 'checkbox-menu'
	| 'data-menu'
	| 'data-tag'
	| 'date'
	| 'image'
	| 'multi-select'
	| 'number'
	| 'password'
	| 'permissions'
	| 'select'
	| 'slug'
	| 'string'
	| 'tag'
	| 'text'
	| 'textarea';

type TableTypes =
	| 'checkbox'
	| 'date'
	| 'image-text'
	| 'string'
	| 'tag'
	| 'text'
	| 'invitation-status';

type SchemaField = {
	type: Types;
	colorPalette?: (data: any) => string;
	dataModel?: any;
	default?: boolean;
	displayInTable?: boolean;
	inputLabel?: string;
	imageKey?: string;
	inputType?: string;
	isRequired?: boolean;
	label?: string;
	model?: string;
	options?: { label: string; value: string }[];
	readOnlyOnUpdate?: boolean;
	required?: boolean;
	sort?: boolean;
	tableKey?: string;
	tableType?: TableTypes;
	title?: string;
	viewType?: SchemaFieldTypes | 'array-tag';
	helperText?: string;
	copy?: boolean;
};

export type SchemaProps = {
	[key: string]: SchemaField;
};
