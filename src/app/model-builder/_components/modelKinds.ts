import { FieldInfo, checkFormula, parse, refsOf } from '@/components/library/functions/formula';

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
	| 'uid'
	| 'number'
	| 'formula'
	| 'dateformula'
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
	| 'component'
	| 'blocks'
	| 'password'
	| 'seo';

export const KINDS: { value: FieldKind; label: string; hint: string; group: string; hidden?: boolean }[] = [
	{ value: 'text', label: 'Text', hint: 'A short line: a name, a title, a phone number', group: 'Text' },
	{ value: 'textarea', label: 'Long text', hint: 'Several lines of plain text', group: 'Text' },
	{ value: 'editor', label: 'Rich text', hint: 'Formatted text with headings, lists and links', group: 'Text' },
	{ value: 'email', label: 'Email', hint: 'Checked to be an email address, stored in lower case', group: 'Text' },
	{ value: 'url', label: 'Link', hint: 'A web address, shown as a link', group: 'Text' },
	{
		value: 'uid',
		label: 'Address (slug)',
		hint: 'A record’s address on your site, made from its title — “My first post” → my-first-post. Always unique',
		group: 'Text',
	},
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
		label: 'Formula (number)',
		hint: 'A number calculated from other number fields — e.g. due = total - paid. Read-only',
		group: 'Values',
	},
	{ value: 'boolean', label: 'Yes / No', hint: 'A switch, on or off — like “Paid” or “Featured”', group: 'Values' },
	{ value: 'date', label: 'Date', hint: 'A day, like a due date or a birthday — the table can filter by it', group: 'Values' },
	{
		value: 'dateformula',
		label: 'Formula (date)',
		hint: 'A date worked out from other fields — e.g. due = addDays(invoiceDate, 30), or a renewal’s new expiry. Read-only',
		group: 'Values',
	},
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
	{
		value: 'component',
		label: 'Component',
		hint: 'A group of fields made once under Build → Components and used by any model — a button, an SEO block, a card. One, or a list',
		group: 'Sections',
	},
	{
		value: 'blocks',
		label: 'Content blocks',
		hint: 'Components in any order — a page’s hero, text, gallery, questions. You pick which components it takes; whoever fills it in picks which and in what order',
		group: 'Sections',
	},
	{
		value: 'seo',
		label: 'SEO',
		hint: 'A record’s search and social details in one editor — Google preview, meta title and description, share cards, indexing, structured data, sitemap. For pages, posts, products',
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
/**
 * What a component's own fields can be — the backend's COMPONENT_KINDS: a
 * section's, rich text and media lists, links to records, a group or list of
 * rows, and another component of plain fields (backend docs/cms CMS-03b).
 */
export const COMPONENT_KINDS: FieldKind[] = [
	...SUB_KINDS,
	'editor',
	'images',
	'files',
	'video',
	'tags',
	'multiselect',
	'reference',
	'references',
	'section',
	'sectionlist',
	'component',
];
/** Kinds that give a component fields of its own fields — one with any of them can't go inside another component. */
export const NESTING_KINDS: FieldKind[] = ['section', 'sectionlist', 'component', 'blocks'];

export const kindLabel = (kind?: string) => KINDS.find(k => k.value === kind)?.label || kind || '—';

/** Kinds that can name a record when it's linked from elsewhere. */
export const TEXT_KINDS: FieldKind[] = ['text', 'email', 'url', 'select'];
export const REFERENCE_KINDS: FieldKind[] = ['reference', 'references'];
/** Kinds that can be limited to allowed values (an enum); select and multi-select must be. */
export const ENUM_KINDS: FieldKind[] = ['text', 'number', 'select', 'multiselect', 'tags'];
export const NEEDS_OPTIONS: FieldKind[] = ['select', 'multiselect'];
/** Kinds stored as a list — their default is a list too. */
export const ARRAY_KINDS: FieldKind[] = ['multiselect', 'tags', 'images', 'files', 'references'];
export const NO_DEFAULT_KINDS: FieldKind[] = ['reference', 'references', 'formula', 'dateformula', 'section', 'sectionlist', 'password', 'uid', 'component', 'blocks', 'seo'];
/** What an address (uid) can be made from — the same list as the backend's UID_SOURCES. */
export const UID_SOURCES: FieldKind[] = ['text', 'email', 'url', 'select', 'textarea'];
/** Shown as dots — its key may say what it holds (password, pin, token). Same as the backend's SECRET_KINDS. */
export const SECRET_KINDS: FieldKind[] = ['password'];
const CANT_BE_UNIQUE: FieldKind[] = ['boolean', 'editor', 'textarea', 'formula', 'dateformula', 'password', 'component', 'blocks', 'seo', ...ARRAY_KINDS, ...SECTION_KINDS];
export const canBeUnique = (kind: FieldKind) => !CANT_BE_UNIQUE.includes(kind);
/** Kinds worked out by a formula, never typed: a number and a date (docs/date-formulas). */
export const FORMULA_KINDS: FieldKind[] = ['formula', 'dateformula'];
export const isFormulaKind = (kind?: string) => FORMULA_KINDS.includes(kind as FieldKind);
/** Kinds holding a date — what a Date formula reads. */
export const DATE_KINDS: FieldKind[] = ['date', 'dateformula'];
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
	/** A Date formula worked out once (when the record is added) and kept, instead of on every save. */
	calc?: 'once';
	/** A section's own fields (SUB_KINDS only). */
	fields?: EditableField[];
	/** A section list's add button, e.g. "Add item". */
	addLabel?: string;
	/** An address (uid): the field it's made from, e.g. `title`. */
	from?: string;
	/** A component field: its component's uid, and whether it's a list (with min/max). */
	component?: string;
	repeatable?: boolean;
	/** Content blocks: the components its items can be. */
	components?: string[];
	/** An image field: the API sends { url, alt, caption, width, height, focal } from the media library (backend docs/cms CMS-13). */
	details?: boolean;
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
		if ((f.kind !== 'sectionlist' && !(f.kind === 'component' && f.repeatable)) || !out.addLabel) delete out.addLabel;
		if (f.kind !== 'uid' || !out.from) delete out.from;
		if (f.kind !== 'blocks') delete out.components;
		if ((f.kind !== 'image' && f.kind !== 'images') || !out.details) delete out.details;
		if (f.kind !== 'component') {
			delete out.component;
			delete out.repeatable;
		} else {
			delete out.options;
			if (!out.repeatable) {
				delete out.repeatable;
				delete out.min;
				delete out.max;
				delete out.addLabel;
			} else if (out.addLabel) out.addLabel = String(out.addLabel);
		}
		if (f.kind === 'uid') out.unique = true;
		if (f.kind !== 'dateformula' || out.calc !== 'once') delete out.calc;
		if (!isFormulaKind(f.kind)) delete out.formula;
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
export type FieldErrorOn = 'key' | 'ref' | 'options' | 'default' | 'range' | 'formula' | 'fields' | 'from' | 'component';
export type FieldError = { message: string; on: FieldErrorOn };

/** A model's numbers, dates (`date`) and short texts (`text`), as a link to it offers them to formulas: `tax.amount`, `plan.unit`. */
export type LinkedNumbers = (ref?: string) => { key: string; label: string; date?: boolean; text?: boolean }[] | undefined;

/** What a formula may use: the model's fields, and which hold numbers or dates. */

export const formulaFieldsOf = (fields: EditableField[], numbersOf?: LinkedNumbers): FieldInfo[] =>
	fields
		.filter(f => f.key)
		.flatMap((f): FieldInfo[] => {
			const numeric = (k: FieldKind) => k === 'number' || k === 'formula';
			const subs = (f.fields || []).filter(x => x.key);
			// A link: itself (not a number), and the linked record's numbers as `tax.amount`.
			if (f.kind === 'reference')
				return [
					{ key: f.key, label: f.label, numeric: false },
					...(numbersOf?.(f.ref) || []).map(n => ({
						key: `${f.key}.${n.key}`,
						label: `${f.label || f.key} › ${n.label}`,
						numeric: !n.date && !n.text,
						...(n.date && { date: true }),
						linked: f.key,
					})),
				];
			// A list: itself for count(), each row's values for sum() / avg().
			if (f.kind === 'sectionlist')
				return [
					{ key: f.key, label: f.label, numeric: false, list: true },
					...subs.map(x => ({ key: `${f.key}.${x.key}`, label: x.label, numeric: numeric(x.kind), inList: f.key })),
				];
			// A section: its values as `address.zip`.
			if (f.kind === 'section')
				return subs.map(x => ({ key: `${f.key}.${x.key}`, label: `${f.label || f.key} › ${x.label || x.key}`, numeric: numeric(x.kind) }));
			return [
				{
					key: f.key,
					label: f.label,
					numeric: numeric(f.kind),
					...(DATE_KINDS.includes(f.kind) && { date: true }),
					...(isFormulaKind(f.kind) && { formula: f.formula }),
					// What it can be compared with in a condition.
					...(f.kind === 'boolean' && { yesNo: true }),
					...(hasOptions(f) && { options: (f.options || []).filter(o => o.value?.trim()).map(o => ({ value: o.value, label: o.label || o.value })) }),
				},
			];
		});

/**
 * For checking a formula without the linked models at hand: any `link.x` it
 * reads through one of the fields' links is let through as any kind — the
 * server checks the linked model really has it, and what it holds.
 */
const withLinkedReads = (infos: FieldInfo[], fields: EditableField[], formula: string): FieldInfo[] => {
	const links = new Set(fields.filter(f => f.kind === 'reference' && f.key).map(f => f.key));
	if (!links.size) return infos;
	let refs: string[] = [];
	try {
		refs = [...refsOf(parse(formula))];
	} catch {
		return infos;
	}
	const known = new Set(infos.map(i => i.key));
	const extra = refs
		.filter(r => !known.has(r) && links.has(r.split('.')[0]) && r.includes('.'))
		.map(r => ({ key: r, numeric: true, any: true, linked: r.split('.')[0] }));
	return extra.length ? [...infos, ...extra] : infos;
};

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
		if (f.kind === 'component' && !f.component) return fail(f.uid, 'component', 'Pick its component');
		if (f.kind === 'blocks' && !f.components?.length) return fail(f.uid, 'component', 'Pick the components it takes');
		if (f.kind === 'uid' && f.from) {
			const src = fields.find(x => x.key === f.from);
			if (!src || !UID_SOURCES.includes(src.kind)) return fail(f.uid, 'from', 'Make it from a text field of this model, or let it be typed');
		}
		if (isFormulaKind(f.kind)) {
			if (!f.formula?.trim()) return fail(f.uid, 'formula', 'Write its formula');
			const checked = checkFormula(f.formula, withLinkedReads(formulaFieldsOf(fields), fields, f.formula), f.key, f.kind === 'dateformula' ? 'date' : 'number');
			if (!checked.ok) return fail(f.uid, 'formula', checked.errors.map(e => e.message).join('; '));
		}
	});
	return errors;
};
