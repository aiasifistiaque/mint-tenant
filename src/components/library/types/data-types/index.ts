export type { default as InputDataType } from './InputDataType';

export type ViewDataType =
	| 'date'
	| 'price'
	| 'boolean'
	| 'menu'
	| 'image-text'
	| 'checkbox'
	| 'textarea'
	| 'tag'
	| 'string'
	| 'text'
	| 'image'
	| 'object'
	| 'file'
	| 'image-array'
	| 'data-array-tag'
	| 'data-array-count'
	| 'custom-attribute'
	| 'custom-section-array'
	// WO-10: real view kinds the registry needs that weren't declared yet
	| 'editor'
	| 'basic-editor'
	| 'section-data-array'
	// A model builder Section: one object of its own fields.
	| 'section-object'
	// WO-15: renderViewItem.tsx already had working cases for these, just never
	// declared in the union
	| 'array-tag'
	| 'external-link'
	| 'date-only'
	| 'number'
	| 'data-tag'
	// Masked until the eye is pressed (SecretValue).
	| 'password';

export type TableDataFieldType =
	| 'date'
	| 'time'
	| 'date-only'
	| 'price'
	| 'boolean'
	| 'menu'
	| 'data-array'
	| 'image-text'
	| 'checkbox'
	| 'number'
	| 'tag'
	| 'file'
	| 'text'
	| 'data-array-count'
	| 'external-link'
	| 'password';
