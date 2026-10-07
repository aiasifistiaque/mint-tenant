import { ComponentType } from 'react';
import type { InputDataType, TableDataFieldType, ViewDataType } from '../../types/data-types';

// WO-09: registry scaffolding. FieldTypeId is deliberately just an alias of the
// existing InputDataType (itself derived from inputDataOptions.ts, WO-01) — the
// registry doesn't introduce a new id vocabulary, it attaches behaviour to the
// one that already exists so nothing downstream breaks.
export type FieldTypeId = InputDataType;
export type TableTypeId = TableDataFieldType;
export type ViewTypeId = ViewDataType;

// Mirrors the backend's `setttingsTypeOptions` storage-type vocabulary (defect
// #15's third vocabulary). Kept as a plain string union here — WO-58 is what
// makes the backend side total against this.
export type StorageTypeId =
	| 'string'
	| 'number'
	| 'boolean'
	| 'array'
	| 'array-string'
	| 'array-object'
	| 'object'
	| 'date'
	| 'email'
	| 'uri'
	| 'ref'
	| 'mixed';

export type FieldFamily =
	| 'text'
	| 'number'
	| 'boolean'
	| 'choice'
	| 'relation'
	| 'datetime'
	| 'media'
	| 'style'
	| 'composite'
	| 'geo'
	| 'special';

// A field entry after createResolvedField (createFormFields.ts) has resolved it —
// i.e. what FormInput/TableData/renderViewItem actually receive per field, not
// the raw authored schema entry. Loosely typed on purpose: it's a superset bag
// of whatever the ~55 existing input components already read from `item`/props,
// which WO-10 will narrow per family as descriptors are written.
export type ResolvedField = Record<string, any> & {
	name: string;
	label?: string;
	type: FieldTypeId;
};

export type FieldInputProps = Record<string, any> & {
	item?: ResolvedField;
	value?: unknown;
	onChange?: (event: unknown) => void;
	isRequired?: boolean;
	helper?: string;
};

export type CellProps = Record<string, any> & {
	item: Record<string, any>;
	field: Record<string, any>;
};

export type ViewProps = Record<string, any> & {
	field: Record<string, any>;
	value: unknown;
};

export type FieldTypeDescriptor = {
	id: FieldTypeId;
	family: FieldFamily;

	// form facet
	input: ComponentType<FieldInputProps>;
	changeMode: 'event' | 'value' | 'array' | 'nested-event' | 'nested-value';
	emptyValue: () => unknown;
	coerceIn?: (raw: unknown) => unknown; // doc  -> form value
	coerceOut?: (v: unknown) => unknown; // form -> payload
	validate?: (v: unknown, f: ResolvedField) => string | null;
	supportsInlineEdit?: boolean;

	// table facet
	table: {
		type: TableTypeId;
		cell: ComponentType<CellProps>;
		align?: 'start' | 'end';
		minW?: string;
		maxW?: string;
		sortable?: boolean;
		mobilePriority?: number;
	};

	// view facet
	view: {
		type: ViewTypeId;
		render: ComponentType<ViewProps>;
		layout: 'inline' | 'full';
		hideIfEmptyDefault?: boolean;
	};

	// storage facet (backend parity)
	storage: StorageTypeId;
};
