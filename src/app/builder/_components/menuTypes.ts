/**
 * The menu item types the builder can configure, and the parameters each one
 * reads — taken from TableMenu (row menu) and SelectedMenu (bulk menu).
 *
 * Only types whose behaviour is fully described by data are offered. The
 * `custom`, `custom-modal` and `custom-redirect` types carry React components
 * or functions, which can't live in a published config; an item of an unknown
 * type is kept as-is and shown read-only, so publishing never drops it.
 */

export type ParamKind =
	| 'text' //       free text (href, api path)
	| 'field' //      one settings field
	| 'fields' //     several settings fields, ordered
	| 'keyType' //    how update-key edits its field
	| 'options' //    value/label rows
	| 'json' //       an object (update-api body)
	| 'prompt'; //    confirm dialog: title, body, button text

export type Param = { name: string; label: string; kind: ParamKind; hint?: string; required?: boolean };

export type MenuType = { value: string; label: string; hint: string; params?: Param[] };

const prompt: Param = {
	name: 'prompt',
	label: 'Confirmation',
	kind: 'prompt',
	hint: 'Ask before running. Leave empty to run straight away.',
};

export const ROW_MENU_TYPES: MenuType[] = [
	{ value: 'view-server-modal', label: 'Quick view', hint: 'Opens the record in a modal, laid out by the view config' },
	{ value: 'view-item', label: 'Details page', hint: 'Opens /view/<route>/<id>' },
	{ value: 'edit-server-modal', label: 'Edit in modal', hint: 'Edits the record in a modal, laid out by the form config' },
	{ value: 'edit', label: 'Edit page', hint: 'Goes to /<route>/edit/<id>' },
	{ value: 'view', label: 'Record page', hint: 'Goes to /<route>/<id>' },
	{ value: 'duplicate', label: 'Duplicate', hint: 'Copies the record' },
	{ value: 'delete', label: 'Delete', hint: 'Deletes the record, after confirming' },
	{
		value: 'link',
		label: 'Link with id',
		hint: 'Goes to <href>/<id>',
		params: [{ name: 'href', label: 'Href', kind: 'text', required: true, hint: 'e.g. /invoices/print' }],
	},
	{
		value: 'redirect',
		label: 'Link',
		hint: 'Goes to a fixed address',
		params: [{ name: 'href', label: 'Href', kind: 'text', required: true }],
	},
	{
		value: 'update-key',
		label: 'Quick edit a field',
		hint: 'Edits one field in place',
		params: [
			{ name: 'key', label: 'Field', kind: 'field', required: true },
			{ name: 'keyType', label: 'Input', kind: 'keyType', required: true },
			{ name: 'dataPath', label: 'Options from route', kind: 'text', hint: 'For a data menu: the route its options come from' },
		],
	},
	{
		value: 'update-api',
		label: 'Call the API',
		hint: 'PUTs a fixed body to the record',
		params: [
			{ name: 'path', label: 'Route', kind: 'text', hint: 'Defaults to this route' },
			{ name: 'body', label: 'Body', kind: 'json', required: true },
			prompt,
		],
	},
	{
		value: 'view-modal',
		label: 'Quick view (fields)',
		hint: 'A modal showing the fields listed here',
		params: [{ name: 'fields', label: 'Fields', kind: 'fields', required: true }],
	},
];

export const BULK_MENU_TYPES: MenuType[] = [
	{
		value: 'export',
		label: 'Export',
		hint: 'Excel, CSV or PDF — the columns you pick, of the ticked rows or every row matching the filters',
	},
	{ value: 'delete-many', label: 'Delete', hint: 'Deletes the ticked rows, with Undo for a few seconds after' },
	{ value: 'duplicate-many', label: 'Duplicate', hint: 'A copy of each ticked row; fields can be changed on the copies' },
	{
		value: 'archive',
		label: 'Archive',
		hint: 'Hides the ticked rows from the list (restorable under “Archived”). Needs “Archive rows” on, below',
	},
	{
		value: 'change-status',
		label: 'Change status',
		hint: 'Moves the ticked rows to another status, where allowed. Needs the status set up, below',
	},
	{ value: 'compare', label: 'Compare', hint: '2–4 ticked records side by side, differences highlighted' },
	{
		value: 'merge',
		label: 'Merge duplicates',
		hint: 'Keeps one of the ticked records; everything linking to the others moves to it',
	},
	{ value: 'print', label: 'Print / PDF', hint: 'The ticked records one per page — print view, or a PDF file' },
	{
		value: 'edit-select',
		label: 'Set a field from a list',
		hint: 'Sets one field on every selected row to a chosen option',
		params: [
			{ name: 'key', label: 'Field', kind: 'field', required: true },
			{ name: 'options', label: 'Options', kind: 'options', required: true },
			prompt,
		],
	},
	{
		value: 'edit',
		label: 'Set a field',
		hint: 'Sets one field on every selected row to a value',
		params: [{ name: 'key', label: 'Field', kind: 'field', required: true }, { name: 'value', label: 'Value', kind: 'json' }, prompt],
	},
	{
		value: 'edit-data-select',
		label: 'Set a field from another route',
		hint: 'Sets a reference field from records of another route',
		params: [
			{ name: 'key', label: 'Field', kind: 'field', required: true },
			{ name: 'dataPath', label: 'Options from route', kind: 'text', required: true },
			prompt,
		],
	},
	{
		value: 'calculate',
		label: 'Sum fields',
		// No field to configure: CalculateModal lists the route's number fields
		// and the admin picks which to total. A required `key` here blocked every
		// save of a route whose code config has this action (invoices).
		hint: 'Totals the number fields the admin picks, across the selected rows',
	},
	{ value: 'marketing-sms', label: 'Send SMS', hint: 'Sends a bulk SMS to the selected customers' },
];

export const KEY_TYPES = [
	{ value: 'string', label: 'Text' },
	{ value: 'number', label: 'Number' },
	{ value: 'data-menu', label: 'Data menu (another route)' },
];

export type MenuItem = { type: string; title?: string; [key: string]: any };

/** The default row menu for a generated table config. */
export const DEFAULT_ROW_MENU: MenuItem[] = [
	{ type: 'view-server-modal', title: 'View' },
	{ type: 'view-item', title: 'Go To Details' },
	{ type: 'edit-server-modal', title: 'Edit' },
	{ type: 'delete', title: 'Delete' },
];

/** Problems that would make an item fail at runtime, keyed by index. */
export const validateMenu = (items: MenuItem[], types: MenuType[]) => {
	const errors: Record<number, string> = {};
	items.forEach((item, i) => {
		const type = types.find(t => t.value === item.type);
		if (!type) return; // unknown types are kept as-is, not judged
		if (!item.title?.trim()) return (errors[i] = 'Needs a title');
		const missing = (type.params || []).find(
			p => p.required && (item[p.name] === undefined || item[p.name] === '' || (Array.isArray(item[p.name]) && !item[p.name].length))
		);
		if (missing) errors[i] = `Needs ${missing.label.toLowerCase()}`;
	});
	return errors;
};
