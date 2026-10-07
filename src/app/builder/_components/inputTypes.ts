/**
 * The inputs the route builder offers for a field, by group — the form
 * builder's input dropdown (SettingsEditor) and the component library's Form
 * inputs page (/docs/components/inputs) both read this list, so the docs
 * always show exactly what the builder offers. `data` is the storage type the
 * input writes. Inputs not listed here still exist (inputDataOptions) and
 * appear under "Other" in both places.
 */
export const INPUTS: { value: string; label: string; group: string; data?: string }[] = [
	{ value: 'text', label: 'Text', group: 'Text', data: 'string' },
	{ value: 'textarea', label: 'Long text', group: 'Text', data: 'string' },
	{ value: 'editor', label: 'Rich text', group: 'Text', data: 'string' },
	{ value: 'basic-editor', label: 'Rich text (basic)', group: 'Text', data: 'string' },
	{ value: 'slug', label: 'Slug', group: 'Text', data: 'string' },
	{ value: 'password', label: 'Password', group: 'Text', data: 'string' },
	{ value: 'read-only', label: 'Read only', group: 'Text' },
	{ value: 'view-only', label: 'View only', group: 'Text' },
	{ value: 'number', label: 'Number', group: 'Values', data: 'number' },
	{ value: 'formula', label: 'Formula (calculated)', group: 'Values', data: 'number' },
	{ value: 'slider', label: 'Slider', group: 'Values', data: 'number' },
	{ value: 'checkbox', label: 'Checkbox', group: 'Values', data: 'boolean' },
	{ value: 'switch', label: 'Switch', group: 'Values', data: 'boolean' },
	{ value: 'date', label: 'Date', group: 'Values', data: 'date' },
	{ value: 'time', label: 'Time', group: 'Values', data: 'string' },
	{ value: 'color', label: 'Color', group: 'Values', data: 'string' },
	{ value: 'select', label: 'Select (from options)', group: 'Choices', data: 'string' },
	{ value: 'select-tag', label: 'Multi-select (from options)', group: 'Choices', data: 'array-string' },
	{ value: 'tag', label: 'Tags', group: 'Choices', data: 'array-string' },
	{ value: 'case-tag', label: 'Tags (keep case)', group: 'Choices', data: 'array-string' },
	{ value: 'image', label: 'Image', group: 'Media', data: 'string' },
	{ value: 'image-array', label: 'Images', group: 'Media', data: 'array-string' },
	{ value: 'file', label: 'File', group: 'Media', data: 'string' },
	{ value: 'file-array', label: 'Files', group: 'Media', data: 'array-string' },
	{ value: 'video', label: 'Video', group: 'Media', data: 'string' },
	{ value: 'icon', label: 'Icon', group: 'Media', data: 'string' },
	{ value: 'data-menu', label: 'Pick a record', group: 'Links to records', data: 'string' },
	{ value: 'data-select', label: 'Pick a record (select)', group: 'Links to records', data: 'string' },
	{ value: 'data-tag', label: 'Pick records', group: 'Links to records', data: 'array' },
	{ value: 'nested-data-menu', label: 'Pick a record (nested)', group: 'Links to records' },
	{ value: 'seo', label: 'SEO', group: 'Structured', data: 'object' },
	{ value: 'custom-attribute', label: 'Attributes', group: 'Structured' },
	// Fields of their own, chosen in the section field builder (the button beside the input).
	{ value: 'section-data-array', label: 'Section list (rows of fields)', group: 'Structured', data: 'array' },
	{ value: 'section-object', label: 'Section (a group of fields)', group: 'Structured', data: 'object' },
	{ value: 'array-string', label: 'List of texts', group: 'Structured', data: 'array-string' },
];
