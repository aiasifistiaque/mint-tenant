// WO-01: single source of truth for input type ids. Every id here has a matching
// `case` in FormInput.tsx (see PLANNED_FIELD_TYPES below for the ones that don't yet).
export const inputDataOptions = [
	'text',
	'number',
	'switch',
	'image',
	'image-array',
	'array-string',
	'nested-select',
	'date',
	'tag',
	'file',
	'file-array',
	'seo',
	'category-collection-array',
	'textarea',
	'read-only',
	// Calculated from other number fields (settings `schema.formula`); shown, never typed.
	'formula',
	'editor',
	'select',
	'data-select',
	'data-menu',
	'nested-data-menu',
	'checkbox',
	'color',
	'nested-image',
	'nested-string',
	'string',
	'custom-section',
	'nested-textarea',
	'view-only',
	'data-tag',
	'custom-attribute',
	'slug',
	'permissions',
	'password',
	'custom-section-array',
	'font',
	'font-weight',
	'font-size',
	'line-height',
	'letterspacing',
	'slider',
	'section-data-array',
	'section-object',
	'alignment',
	'flex-justify',
	'flex-align',
	'text-align',
	'opacity',
	// live but previously undeclared — FormInput.tsx already has a case for each
	'variant',
	'video',
	'icon',
	'basic-editor',
	'case-tag',
	'section-tag',
	'model-fields',
	'form-fields',
	'settings',
	'time',
	'select-tag',
];

// WO-02: declared in schemas historically with no FormInput.tsx case, so they
// silently render a plain text box today. Not part of InputDataType until a
// descriptor/case lands for them (see Phase 4 of FIELD_SYSTEM_WORK_ORDER.md).
export const PLANNED_FIELD_TYPES = [
	'radio',
	'multi-select',
	'checkbox-menu',
	'shadow',
	'font-style',
	'nested-text',
	'menu',
	// display-only complex-data markers already authored in real schemas
	// (order.schema.ts: address/items) — 'object' matches Phase 4's proposed
	// nested-fieldset type; 'array' is its array-of-values sibling.
	'object',
	'array',
] as const;

export default inputDataOptions;
