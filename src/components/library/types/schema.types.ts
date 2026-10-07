import { InputDataType, TableDataFieldType } from './data-types';

type CommonProps = {
	label: string;
	type: InputDataType;
	inputLabel?: string;
	isRequired?: boolean;
	required?: boolean; // alias some settings authors use instead of isRequired
	title?: string; // alias some settings authors use instead of label
	sort?: boolean;
	tableType?: TableDataFieldType;
	imageKey?: string;
	default?: boolean;
	menuKey?: string;
	menuAddOnKey?: string;
	displayInTable?: boolean; // Display in table
	model?: string;
	dataModel?: any;
	viewType?: string;
	objectKey?: string;
	options?: { label: string; value: string }[];
	placeholder?: string;
	colorPalette?: any;
	renderCondition?: any; // Condition to render the field
	tableKey?: string; // Key for table if different from model key specially for nested objects
	viewKey?: string; // Key for view if different from model key specially for nested objects
	menuField?: string;
	limit?: number; // Limit for number of items in array
	copy?: boolean;
	helperText?: string; // Helper text for the input
	tooltip?: string; // Tooltip for the table
	modelAddOn?: string;

	// WO-03: keys the converters/inputs already read but that weren't declared here
	tableLabel?: string; // Column header override, read by convertToTableFields
	bold?: boolean; // Render this column's cells at 600. Defaults on for `name`.
	editable?: boolean; // Inline-editable table cell
	editType?: InputDataType; // Input type to use for inline edit, if different from `type`
	colorTheme?: any; // Per-value colour map, read by convertToTableFields/TableData
	folder?: string; // Upload destination folder for image/file inputs
	labelKey?: string; // Display-name key on the related model, for data-menu/data-tag
	valueKey?: string; // Id key on the related model, for data-menu/data-tag
	/** @deprecated typo'd sibling of valueKey some inputs still read as a fallback */
	valKey?: string;
	readOnlyOnUpdate?: boolean; // Force read-only when editing an existing document
	style?: any; // Passed through to the underlying input component
	hasImage?: boolean; // Whether a section/variant input shows an image picker
	helper?: string; // Resolved helper text forwarded to the input (see helperText)
	/** @deprecated broken evaluator (defect 7) — migrate to `when` once Phase 2 lands */
	renderIf?: { field: string; operator: string; value?: unknown };
	displayValue?: any;
	path?: string;
	min?: number;
	max?: number;
	step?: number;
	threshold?: number;
	values?: any[];

	section?: {
		title?: string;
		addBtnText?: string;
		btnText?: string;
		dataModel?: any;
		display?: {
			image?: string;
			title: string;
			description?: string;
		};
	};
	value?: any;
	getValue?: (doc: any) => any;
	fetch?: (data: any) => {
		path: string;
		fields: { key: string; as: string }[];
		id: any;
	};
	isExcluded?: boolean;
};

type Schema = {
	[key: string]: CommonProps;
};

export type SchemaType<T> = {
	[K in keyof T]: CommonProps;
};

export default Schema;
