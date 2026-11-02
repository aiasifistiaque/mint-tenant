import { evaluate, parse } from './formula';
import { meets } from './fieldLocks';

/**
 * Fields filled from a linked record (settings `schema.fillFrom`): a payment's
 * amount from the bill picked — `{ from: 'bill', formula: 'total' }`, or a
 * formula over the bill's fields (`total - paid`). The panel's copy of the
 * backend's linkedFill.function — keep the two in step.
 */

export type FillWhen = { field: string; op: string; value?: any };
export type FillFrom = { from: string; formula: string; readonly?: boolean; when?: FillWhen[]; match?: 'all' | 'any' };

/** The prefix of a condition on the picked record's field rather than this record's (backend `SOURCE_PREFIX`). */
export const SOURCE_PREFIX = '@.';

/**
 * Do an autofill's conditions hold for the form's `record`, with `linked` the picked record (null: none yet)?
 * No conditions: always. A condition on the picked record never holds without one. The panel's copy of the
 * backend's `fillHolds` — keep the two in step.
 */
export const fillHolds = (fill: Pick<FillFrom, 'when' | 'match'> | undefined, record: any, linked: any): boolean => {
	const when = fill?.when;
	if (!when?.length) return true;
	const one = (c: FillWhen) => {
		const src = typeof c?.field === 'string' && c.field.startsWith(SOURCE_PREFIX);
		if (src && !linked) return false;
		return meets(src ? linked : record, [src ? { ...c, field: c.field.slice(SOURCE_PREFIX.length) } : c], 'all', { this: record });
	};
	return fill?.match === 'any' ? when.some(one) : when.every(one);
};

/** What a form field's type holds, for the read-only display of an autofill. */
export const fillsOfType = (t?: string): 'text' | 'number' | 'date' | 'boolean' =>
	t === 'number' || t === 'slider'
		? 'number'
		: t === 'date' || t === 'date-only'
		? 'date'
		: t === 'checkbox' || t === 'switch' || t === 'boolean'
		? 'boolean'
		: 'text';

/**
 * The form's fields with the read-only autofills shown as a muted copy ("from Customer"): the field keeps its own
 * kind, so the form only swaps how it is drawn.
 */
export const lockedFills = (fields: any) =>
	Array.isArray(fields) ? fields.map((f: any) => (f?.fillFrom?.readonly && f?.fillFrom?.from ? { ...f, type: 'autofillreadonly', fills: fillsOfType(f.type), isRequired: false } : f)) : fields;

const valueAt = (doc: any, path: string) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), doc);

/** The value for this linked record: a field as it is, or a formula's result. Undefined when the formula doesn't parse. */
export const fillValue = (formula: string, linked: any): any => {
	try {
		const tree = parse(formula);
		if (tree.t === 'ref') return valueAt(linked, tree.key);
		return evaluate(tree, linked);
	} catch {
		return undefined;
	}
};

/** A picked record's id, however the form holds it. */
export const linkedId = (v: any): string | null => {
	const id = v && typeof v === 'object' ? v._id ?? v.value : v;
	return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) ? id : null;
};
