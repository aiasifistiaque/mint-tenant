/**
 * The filter shape the editor works with — the same one a backend settings
 * file declares under `<field>.filter`, with `model` held as a model name
 * rather than a Model reference. `uid` is editor-only: filters have no id of
 * their own, and cards need a stable key that survives being dragged.
 */

export type FilterType = 'text' | 'select' | 'multi-select' | 'boolean' | 'range' | 'date';
export type FilterCategory = 'default' | 'model' | 'distinct';

export type FilterOption = { value: any; label: string };

export type EditableFilter = {
	uid: string;
	name: string;
	field?: string;
	type: FilterType;
	label?: string;
	title?: string;
	roles?: string[];
	category?: FilterCategory;
	key?: string;
	model?: string;
	options?: FilterOption[];
};

export type ModelField = {
	key: string;
	instance: string;
	ref?: string;
	enum?: any[];
	isArray?: boolean;
};

export const FILTER_TYPES: { value: FilterType; label: string; hint: string }[] = [
	{ value: 'multi-select', label: 'Multi select', hint: 'Pick any number of values' },
	{ value: 'select', label: 'Select', hint: 'Pick one value' },
	{ value: 'text', label: 'Text', hint: 'Match typed text' },
	{ value: 'boolean', label: 'Yes / No', hint: 'True or false' },
	{ value: 'range', label: 'Number range', hint: 'Equal, above, below, between' },
	{ value: 'date', label: 'Date', hint: 'On, before, after, between, in the last…' },
];

export const CATEGORIES: { value: FilterCategory; label: string; hint: string }[] = [
	{ value: 'default', label: 'Listed here', hint: 'The options typed below' },
	{ value: 'model', label: 'From another model', hint: 'Every document of a model, labelled by one of its fields' },
	{ value: 'distinct', label: 'Distinct values', hint: 'Every value this field currently holds' },
];

export const hasOptions = (type?: FilterType) => type === 'select' || type === 'multi-select';

export const typeLabel = (type?: FilterType) =>
	FILTER_TYPES.find(t => t.value === type)?.label || type || '—';

let counter = 0;
export const newUid = () => `f${Date.now().toString(36)}${(counter++).toString(36)}`;

/** 'inventory.location' -> 'Inventory Location'; 'createdAt' -> 'Created At'. */
export const humanize = (key = '') =>
	key
		.split('.')
		.pop()!
		.replace(/_/g, ' ')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/\b\w/g, c => c.toUpperCase());

/**
 * The query-string key a chip writes. Multi-selects send a comma list, which
 * the backend reads as `$in` only under an `_in` key; every other type writes
 * the field itself (range and date append their own operator suffix).
 */
export const defaultQueryKey = (name: string, type: FilterType) =>
	type === 'multi-select' ? `${name}_in` : name;

/**
 * A sensible starting filter for a schema field — what a settings author
 * would usually have written for it. Only applied when a field is picked on a
 * card, and everything it fills in stays editable.
 */
export const suggestFilter = (field: ModelField): Partial<EditableFilter> => {
	const base = { name: field.key, label: humanize(field.key) };

	if (field.ref)
		return { ...base, type: 'multi-select', category: 'model', model: field.ref, key: 'name', title: `Filter by ${base.label}` };
	if (field.enum?.length)
		return {
			...base,
			type: 'multi-select',
			category: 'default',
			options: field.enum.map(v => ({ value: v, label: humanize(String(v)) })),
			title: `Filter by ${base.label}`,
		};

	switch (field.instance) {
		case 'Boolean':
			return { ...base, type: 'boolean', title: `Filter by ${base.label}` };
		case 'Number':
		case 'Decimal128':
			return { ...base, type: 'range', title: `Filter by ${base.label}` };
		case 'Date':
			return { ...base, type: 'date', title: `Filter by ${base.label}` };
		case 'ObjectId':
			return { ...base, type: 'text', title: `Find by ${base.label}` };
		default:
			return field.isArray
				? { ...base, type: 'multi-select', category: 'distinct', key: field.key, title: `Filter by ${base.label}` }
				: { ...base, type: 'text', title: `Find by ${base.label}` };
	}
};

/** Server shape -> editor shape. */
export const fromServer = (filters: any[] = []): EditableFilter[] =>
	filters.map(f => ({ ...f, uid: newUid() }));

/**
 * Editor shape -> what's saved. Drops the editor's uid, and any field that
 * doesn't apply to the chosen type or option source, so a card that was a
 * model-backed multi-select and became a range doesn't carry a stale `model`
 * into getFilters (which would then query it for options nobody renders).
 */
export const toServer = (filters: EditableFilter[]) =>
	filters.map(({ uid, ...f }) => {
		const out: any = {
			name: f.name,
			type: f.type,
			label: f.label || humanize(f.name),
			title: f.title || undefined,
			field: f.field || undefined,
			roles: f.roles?.length ? f.roles : undefined,
			category: 'default',
		};

		if (hasOptions(f.type)) {
			out.category = f.category || 'default';
			if (out.category === 'model') {
				out.model = f.model;
				out.key = f.key || 'name';
			} else if (out.category === 'distinct') {
				out.key = f.key || f.name;
			} else {
				out.options = (f.options || []).filter(o => o.value !== '' && o.value !== undefined);
			}
		}

		return out;
	});

/**
 * Per-card problems, keyed by uid. `errors` block saving — the card cannot
 * work at all. `warnings` don't: the seeded settings already contain a few
 * (two 'Folder' chips on files), and refusing to save a route until someone
 * untangles a problem they didn't introduce would make reordering impossible.
 */
export const validate = (filters: EditableFilter[]) => {
	const errors: Record<string, string> = {};
	const warnings: Record<string, string> = {};
	const seen = new Map<string, string>();

	filters.forEach(f => {
		if (!f.name) return (errors[f.uid] = 'Pick a field');
		if (!f.type) return (errors[f.uid] = 'Pick a type');
		if (hasOptions(f.type) && f.category === 'model' && !f.model)
			return (errors[f.uid] = 'Pick the model the options come from');

		if (hasOptions(f.type) && (f.category || 'default') === 'default' && !f.options?.length)
			warnings[f.uid] = 'No options yet — the dropdown will be empty';

		// Two chips writing the same query key fight over one URL param: setting
		// one silently changes what the other shows.
		const queryKey = f.field || f.name;
		const clash = seen.get(queryKey);
		if (clash) warnings[f.uid] = `Writes the same query key as "${clash}"`;
		else seen.set(queryKey, f.label || f.name);
	});

	return { errors, warnings };
};
