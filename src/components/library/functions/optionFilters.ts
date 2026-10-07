/**
 * Which records a record picker (data-menu, data-tag) offers — the field's
 * `schema.optionFilters`, set in the route builder's Settings. Each one is a
 * condition on the linked model, compared with a fixed value or with another
 * field of the same form:
 *
 *   { field: 'isActive', value: true }                  only active admins
 *   { field: 'client', from: 'client' }                 projects of the client picked above
 *   { field: 'status', op: 'in', value: ['open', 'hold'] }
 *
 * They become the list's query (`?client=…&status_in=open,hold`); the server
 * matches any field of the linked route that isn't hidden or a secret.
 */

export type OptionFilterOp = 'eq' | 'ne' | 'in';

export type OptionFilter = {
	/** A field of the linked model. */
	field: string;
	/** is (default), is not, is one of. */
	op?: OptionFilterOp;
	/** A fixed value — a list for `in`. */
	value?: any;
	/** Or: the key of another field of this form, whose value it must match. */
	from?: string;
	/** With `from`, while that field is empty: offer every record (default) or none. */
	whenEmpty?: 'all' | 'none';
};

/** A linked value as its id — a populated record arrives as an object. */
const idOf = (v: any) => (v && typeof v === 'object' ? v._id ?? v.value ?? '' : v);

const listOf = (v: any): string[] => {
	const raw = Array.isArray(v) ? v : typeof v === 'string' && v.includes(',') ? v.split(',') : [v];
	return raw
		.map(idOf)
		.filter(x => x !== undefined && x !== null && String(x).trim() !== '')
		.map(x => String(x).trim());
};

const valueAt = (data: any, path: string) =>
	String(path || '')
		.split('.')
		.reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), data);

/** A condition's values, from its fixed value or the form. */
const valuesOf = (f: OptionFilter, formData: any) => listOf(f.from ? valueAt(formData, f.from) : f.value);

/**
 * The list's query params for these conditions, and `waitingFor`: the form
 * field that has to be filled in before anything is offered (whenEmpty: none).
 */
export const optionQuery = (filters: OptionFilter[] | undefined, formData: any) => {
	const params: Record<string, string> = {};
	let waitingFor: string | undefined;
	for (const f of Array.isArray(filters) ? filters : []) {
		if (!f?.field) continue;
		const values = valuesOf(f, formData);
		if (!values.length) {
			if (f.from && f.whenEmpty === 'none') waitingFor = waitingFor || f.from;
			continue;
		}
		const op = f.op === 'eq' || !f.op ? (values.length > 1 ? 'in' : 'eq') : f.op;
		if (op === 'in') params[`${f.field}_in`] = values.join(',');
		else if (op === 'ne') params[`${f.field}_ne`] = values[0];
		else params[f.field] = values[0];
	}
	return { params, waitingFor };
};

/**
 * What a record added from the picker starts with, so it's one the picker
 * offers: the linked field of each "is" condition with a single value — a
 * project added from an invoice gets the invoice's client.
 */
export const optionPrefill = (filters: OptionFilter[] | undefined, formData: any) => {
	const out: Record<string, any> = {};
	for (const f of Array.isArray(filters) ? filters : []) {
		if (!f?.field || (f.op && f.op !== 'eq' && f.op !== 'in')) continue;
		const values = valuesOf(f, formData);
		if (values.length !== 1) continue;
		// A fixed yes/no stays a boolean, so a switch reads it.
		out[f.field] = !f.from && typeof f.value === 'boolean' ? f.value : values[0];
	}
	return out;
};

/** "client" -> "Client", "dueDate" -> "Due date" — for a field known only by its key. */
export const humanizeKey = (key: string) =>
	String(key || '')
		.split('.')
		.pop()!
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.toLowerCase()
		.replace(/^./, c => c.toUpperCase());
