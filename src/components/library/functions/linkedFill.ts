import { evaluate, parse } from './formula';

/**
 * Fields filled from a linked record (settings `schema.fillFrom`): a payment's
 * amount from the bill picked — `{ from: 'bill', formula: 'total' }`, or a
 * formula over the bill's fields (`total - paid`). The panel's copy of the
 * backend's linkedFill.function — keep the two in step.
 */

export type FillFrom = { from: string; formula: string };

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
