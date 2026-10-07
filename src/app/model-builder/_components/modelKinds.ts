import { FieldInfo, checkFormula } from '@/components/library/functions/formula';

/**
 * The field kinds the model builder offers — the same list the backend
 * compiles (library/functions/dynamicModels.function.ts, FIELD_KINDS). Each
 * becomes a Mongoose type plus the settings a hand-written model would have:
 * validation, the form input, the table cell and, for some, a filter chip.
 */

export type FieldKind =
	| 'text'
	| 'textarea'
	| 'editor'
	| 'email'
	| 'url'
	| 'number'
	| 'formula'
	| 'boolean'
	| 'date'
	| 'select'
	| 'multiselect'
	| 'tags'
	| 'color'
	| 'image'
	| 'images'
	| 'file'
	| 'files'
	| 'video'
	| 'reference'
	| 'references'
	| 'section'
	| 'sectionlist'
	| 'password';

export const KINDS: { value: FieldKind; label: string; hint: string; group: string; hidden?: boolean }[] = [
	{ value: 'text', label: 'Text', hint: 'A short line: a name, a title, a phone number', group: 'Text' },
	{ value: 'textarea', label: 'Long text', hint: 'Several lines of plain text', group: 'Text' },
	{ value: 'editor', label: 'Rich text', hint: 'Formatted text with headings, lists and links', group: 'Text' },
	{ value: 'email', label: 'Email', hint: 'Checked to be an email address, stored in lower case', group: 'Text' },
	{ value: 'url', label: 'Link', hint: 'A web address, shown as a link', group: 'Text' },
	{ value: 'color', label: 'Color', hint: 'A colour, picked with a colour picker', group: 'Text' },
	{
		value: 'password',
		label: 'Password',
		hint: 'A login or key kept for someone — shown as dots, click the eye to see it',
		group: 'Text',
	},
	{ value: 'number', label: 'Number', hint: 'An amount, a quantity, a price — can have a lowest and highest value', group: 'Values' },
	{
		value: 'formula',
		label: 'Formula',
		hint: 'A number calculated from other number fields — e.g. due = total - paid. Read-only',
		group: 'Values',
	},
	{ value: 'boolean', label: 'Yes / No', hint: 'A switch, on or off — like “Paid” or “Featured”', group: 'Values' },
	{ value: 'date', label: 'Date', hint: 'A day, like a due date or a birthday — the table can filter by it', group: 'Values' },
	// One entry in the kind picker: "Options". Whether one or several can be
	// picked is a switch beside it — multiselect is the "several" form.
	{ value: 'select', label: 'Options', hint: 'A choice from a list you type in, like Draft / Sent / Paid', group: 'Choices' },
	{
		value: 'multiselect',
		label: 'Options (several)',
		hint: 'Any number of a list of options you type in, with a filter',
		group: 'Choices',
		hidden: true,
	},
	{ value: 'tags', label: 'Tags', hint: 'A list of short texts — free, or limited to a list', group: 'Choices' },
	{ value: 'image', label: 'Image', hint: 'One uploaded image', group: 'Media' },
	{ value: 'images', label: 'Images', hint: 'A gallery of uploaded images', group: 'Media' },
	{ value: 'file', label: 'File', hint: 'One uploaded file: a PDF, a document…', group: 'Media' },
	{ value: 'files', label: 'Files', hint: 'Several uploaded files', group: 'Media' },
	{ value: 'video', label: 'Video', hint: 'An uploaded video', group: 'Media' },
	{ value: 'reference', label: 'Link to a record', hint: 'One record of another model — or this one', group: 'Links' },
	{ value: 'references', label: 'Link to records', hint: 'Several records of another model', group: 'Links' },
	{
		value: 'section',
		label: 'Section',
		hint: 'A group of fields of its own, filled in once — an address, a billing block. You choose its fields',
		group: 'Sections',
	},
	{
		value: 'sectionlist',
		label: 'Section list',
		hint: 'Rows of the same fields, as many as needed — an invoice’s items. You choose the fields of a row; its number fields can be added up in formulas (sum(items.total))',
		group: 'Sections',
	},
];

export const KIND_GROUPS = ['Text', 'Values', 'Choices', 'Media', 'Links', 'Sections'];

/** Kinds made of fields of their own, chosen in the section's field builder. */
export const SECTION_KINDS: FieldKind[] = ['section', 'sectionlist'];
/** What a section's own fields can be — the same list as the backend's SUB_KINDS. */
export const SUB_KINDS: FieldKind[] = [
	'text',
	'textarea',
	'email',
	'url',
	'color',
	'number',
	'formula',
	'boolean',
	'date',
	'select',
	'image',
	'file',
];

export const kindLabel = (kind?: string) => KINDS.find(k => k.value === kind)?.label || kind || '—';

/** Kinds that can name a record when it's linked from elsewhere. */
export const TEXT_KINDS: FieldKind[] = ['text', 'email', 'url', 'select'];
export const REFERENCE_KINDS: FieldKind[] = ['reference', 'references'];
/** Kinds that can be limited to allowed values (an enum); select and multi-select must be. */
export const ENUM_KINDS: FieldKind[] = ['text', 'number', 'select', 'multiselect', 'tags'];
export const NEEDS_OPTIONS: FieldKind[] = ['select', 'multiselect'];
/** Kinds stored as a list — their default is a list too. */
export const ARRAY_KINDS: FieldKind[] = ['multiselect', 'tags', 'images', 'files', 'references'];
export const NO_DEFAULT_KINDS: FieldKind[] = ['reference', 'references', 'formula', 'section', 'sectionlist', 'password'];
/** Shown as dots — its key may say what it holds (password, pin, token). Same as the backend's SECRET_KINDS. */
export const SECRET_KINDS: FieldKind[] = ['password'];
const CANT_BE_UNIQUE: FieldKind[] = ['boolean', 'editor', 'textarea', 'formula', 'password', ...ARRAY_KINDS, ...SECTION_KINDS];
export const canBeUnique = (kind: FieldKind) => !CANT_BE_UNIQUE.includes(kind);
export const hasLength = (kind: FieldKind) => ['text', 'email', 'url', 'textarea', 'editor'].includes(kind);
export const hasOptions = (f: Pick<EditableField, 'kind' | 'options'>) =>
	ENUM_KINDS.includes(f.kind) && (f.options || []).some(o => o.value?.trim());

/** Same as the backend's: Mongoose's own names, and the paths every model gets. */
export const RESERVED_KEYS = [
	'_id', 'id', '__v', 'code', 'createdAt', 'updatedAt',
	'collection', 'db', 'emit', 'errors', 'get', 'init', 'isModified', 'isNew', 'listeners', 'modelName',
	'on', 'once', 'populated', 'prototype', 'remove', 'removeListener', 'save', 'schema', 'set',
	'toObject', 'toJSON', 'validate', 'isSelected', 'model', 'baseModel', '_model',
];
const SENSITIVE = /pass(word)?|token|secret|api_?key|apikey|private|otp|salt|hash/i;

/** Stands for "the model being edited" in a link picker; the server resolves it. */
export const SELF = '__self__';

export type EditableField = {
	uid: string;
	key: string;
	label?: string;
	kind: FieldKind;
	required?: boolean;
	unique?: boolean;
	index?: boolean;
	default?: any;
	options?: { value: string; label?: string }[];
	ref?: string;
	min?: number | null;
	max?: number | null;
	showInTable?: boolean;
	searchable?: boolean;
	helper?: string;
	/** The formula kind's calculation, e.g. `total - paid`. */
	formula?: string;
	/** A section's own fields (SUB_KINDS only). */
	fields?: EditableField[];
	/** A section list's add button, e.g. "Add item". */
	addLabel?: string;
	/** Editor-only: the key follows the label until it's typed by hand. */
	keyTouched?: boolean;
};

let counter = 0;
export const newUid = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;

/** 'Due date' -> 'dueDate'. */
export const toKey = (label: string) => {
	const words = label
		.replace(/[^a-zA-Z0-9]+/g, ' ')
		.trim()
		.split(' ')
		.filter(Boolean);
	const key = words.map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w[0].toLowerCase() + w.slice(1))).join('');
	return /^[a-zA-Z]/.test(key) ? key : key ? `f${key}` : '';
};

/** 'Invoice item' -> 'InvoiceItem', as the server registers it (before numbering). */
export const toModelName = (value: string) =>
	value
		.replace(/[^a-zA-Z0-9]+/g, ' ')
		.trim()
		.split(' ')
		.filter(Boolean)
		.map(w => w[0].toUpperCase() + w.slice(1))
		.join('');

/** 'Invoices' -> 'Invoice', 'Categories' -> 'Category' — the default model name for a title. */
export const singular = (title: string) =>
	title
		.trim()
		.replace(/ies$/i, 'y')
		.replace(/(ch|sh|x|ss)es$/i, '$1')
		.replace(/([^s])s$/i, '$1');

/**
 * What a new section starts with — the title / description / image a custom
 * section has always had — for the list, an invoice line: item, quantity,
 * rate and total = quantity * rate. Every one can be changed or removed.
 */
export const sectionPreset = (kind: FieldKind): EditableField[] => {
	const f = (key: string, label: string, k: FieldKind, extra: Partial<EditableField> = {}): EditableField => ({
		uid: newUid(),
		key,
		label,
		kind: k,
		keyTouched: true,
		...extra,
	});
	return kind === 'sectionlist'
		? [
				f('item', 'Item', 'text', { required: true }),
				f('description', 'Description', 'textarea'),
				f('quantity', 'Quantity', 'number'),
				f('rate', 'Rate', 'number'),
				f('total', 'Total', 'formula', { formula: 'quantity * rate' }),
		  ]
		: [f('title', 'Title', 'text'), f('description', 'Description', 'textarea'), f('image', 'Image', 'image')];
};

export const fromServer = (fields: any[] = []): EditableField[] =>
	fields.map(f => ({
		...f,
		uid: newUid(),
		keyTouched: true,
		...(Array.isArray(f.fields) && { fields: fromServer(f.fields) }),
	}));

export const toServer = (fields: EditableField[]): any[] =>
	fields.map(({ uid, keyTouched, ...f }) => {
		const out: any = { ...f, label: f.label || '' };
		if (!ENUM_KINDS.includes(f.kind)) delete out.options;
		else out.options = (f.options || []).filter(o => o.value?.trim());
		if (!out.options?.length) delete out.options;
		if (!REFERENCE_KINDS.includes(f.kind)) delete out.ref;
		if (SECTION_KINDS.includes(f.kind)) out.fields = toServer(f.fields || []);
		else delete out.fields;
		if (f.kind !== 'sectionlist' || !out.addLabel) delete out.addLabel;
		if (f.kind !== 'formula') delete out.formula;
		else {
			// Calculated, never typed.
			delete out.required;
			delete out.unique;
		}
		if (out.min === null || out.min === undefined || Number.isNaN(out.min)) delete out.min;
		if (out.max === null || out.max === undefined || Number.isNaN(out.max)) delete out.max;
		if (!canBeUnique(f.kind)) delete out.unique;
		if (SECRET_KINDS.includes(f.kind)) {
			delete out.index;
			delete out.searchable;
		}
		if (NO_DEFAULT_KINDS.includes(f.kind)) delete out.default;
		if (Array.isArray(out.default) && !ARRAY_KINDS.includes(f.kind)) delete out.default;
		if (ARRAY_KINDS.includes(f.kind) && out.default !== undefined && !Array.isArray(out.default)) delete out.default;
		if (out.default === '' || out.default === undefined || out.default === null || (Array.isArray(out.default) && !out.default.length))
			delete out.default;
		return out;
	});

/** A field's default in the terms of its allowed values, for comparison. */
const defaultValues = (f: EditableField): string[] =>
	f.default === undefined || f.default === null || f.default === '' ? [] : (Array.isArray(f.default) ? f.default : [f.default]).map(String);

/** Which input a field problem is about — where it's shown, and which input turns red. */
export type FieldErrorOn = 'key' | 'ref' | 'options' | 'default' | 'range' | 'formula' | 'fields';
export type FieldError = { message: string; on: FieldErrorOn };

/** What a formula may use: the model's fields, and which hold numbers. */
export const formulaFieldsOf = (fields: EditableField[]): FieldInfo[] =>
	fields
		.filter(f => f.key)
		.flatMap((f): FieldInfo[] => {
			const numeric = (k: FieldKind) => k === 'number' || k === 'formula';
			const subs = (f.fields || []).filter(x => x.key);
			// A list: itself for count(), each row's values for sum() / avg().
			if (f.kind === 'sectionlist')
				return [
					{ key: f.key, label: f.label, numeric: false, list: true },
					...subs.map(x => ({ key: `${f.key}.${x.key}`, label: x.label, numeric: numeric(x.kind), inList: f.key })),
				];
			// A section: its values as `address.zip`.
			if (f.kind === 'section')
				return subs.map(x => ({ key: `${f.key}.${x.key}`, label: `${f.label || f.key} › ${x.label || x.key}`, numeric: numeric(x.kind) }));
			return [{ key: f.key, label: f.label, numeric: numeric(f.kind), ...(f.kind === 'formula' && { formula: f.formula }) }];
		});

/** Keys access control adds to every record; no field may use them while it's on. */
export const ACCESS_KEYS = ['privacy', 'access', 'addedBy'];

/** Problems per field (by uid) that would make the server refuse the model. */
export const validateFields = (
	fields: EditableField[],
	{ accessEnabled = false, sub = false }: { accessEnabled?: boolean; sub?: boolean } = {}
): Record<string, FieldError> => {
	const errors: Record<string, FieldError> = {};
	const seen = new Map<string, string>();
	const fail = (uid: string, on: FieldErrorOn, message: string) => (errors[uid] = { on, message });
	fields.forEach(f => {
		// The key is shown as the field's "API name" under its label.
		if (!f.key) return fail(f.uid, 'key', 'Give the field a name');
		if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key))
			return fail(f.uid, 'key', 'The API name starts with a letter; letters, digits and _ only');
		if (RESERVED_KEYS.includes(f.key)) return fail(f.uid, 'key', `“${f.key}” is reserved as an API name`);
		if (accessEnabled && ACCESS_KEYS.includes(f.key))
			return fail(f.uid, 'key', `“${f.key}” is used by record privacy — pick another API name`);
		if (SENSITIVE.test(f.key) && !SECRET_KINDS.includes(f.kind))
			return fail(f.uid, 'key', 'A password, token or other secret needs the Password kind — it’s shown as dots until clicked');
		const lower = f.key.toLowerCase();
		if (seen.has(lower)) return fail(f.uid, 'key', `Another field already has the API name “${f.key}”`);
		seen.set(lower, f.uid);
		if (REFERENCE_KINDS.includes(f.kind) && !f.ref) return fail(f.uid, 'ref', 'Pick the model it links to');
		const values = (f.options || []).map(o => o.value?.trim()).filter(Boolean);
		if (NEEDS_OPTIONS.includes(f.kind) && !values.length) return fail(f.uid, 'options', 'Add at least one option');
		if (ENUM_KINDS.includes(f.kind) && new Set(values).size !== values.length)
			return fail(f.uid, 'options', 'An option is listed twice');
		if (f.kind === 'number' && values.some(v => !Number.isFinite(Number(v))))
			return fail(f.uid, 'options', 'The options of a number must be numbers');
		if (ENUM_KINDS.includes(f.kind) && values.length) {
			const outside = defaultValues(f).filter(d => !values.includes(d));
			if (outside.length) return fail(f.uid, 'default', `${outside.join(', ')} isn’t one of the options`);
		}
		if (typeof f.min === 'number' && typeof f.max === 'number' && f.min > f.max) return fail(f.uid, 'range', 'Min is above max');
		if (SECTION_KINDS.includes(f.kind)) {
			if (sub) return fail(f.uid, 'fields', 'A section can’t hold another section');
			if (!f.fields?.length) return fail(f.uid, 'fields', 'Add at least one field to the section');
			const inner = validateFields(f.fields, { sub: true });
			const first = f.fields.find(x => inner[x.uid]);
			if (first) return fail(f.uid, 'fields', `${first.label || first.key || 'A field'}: ${inner[first.uid].message}`);
		}
		if (f.kind === 'formula') {
			if (!f.formula?.trim()) return fail(f.uid, 'formula', 'Write its formula');
			const checked = checkFormula(f.formula, formulaFieldsOf(fields), f.key);
			if (!checked.ok) return fail(f.uid, 'formula', checked.errors.map(e => e.message).join('; '));
		}
	});
	return errors;
};
