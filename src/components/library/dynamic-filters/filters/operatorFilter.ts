import { applyFilters } from '../../store';

/**
 * Shared plumbing for filters that pick an operator and a value (date, range).
 * They write `field` for "equal to" and `field_<operator>` for the rest, e.g.
 * `price_gte=100` or `createdAt_btwn=2026-01-01_2026-02-01`.
 */

export type AppliedOperator<Op extends string> = { operator: Op; value: string };

/**
 * The operator and value currently applied, read from the table store rather
 * than mirrored in local state, so filters restored from the URL show too.
 */
export const readApplied = <Op extends string>(
	filters: Record<string, any>,
	field: string,
	operators: readonly Op[]
): AppliedOperator<Op> | null => {
	const key = Object.keys(filters).find(
		key =>
			(key === field || operators.some(op => key === `${field}_${op}`)) &&
			filters[key] !== null &&
			filters[key] !== ''
	);
	if (!key) return null;
	return {
		operator: (key === field ? 'eq' : key.slice(field.length + 1)) as Op,
		value: String(filters[key]),
	};
};

/**
 * `applyFilters` only drops keys that start with the key it's given, so going
 * from `field_gte` to `field_btwn` would leave both applied. Wipe every key for
 * the field first, then write the new one (or nothing, to clear).
 */
export const applyOperator = (
	dispatch: (action: any) => void,
	field: string,
	operator: string | null,
	value: string
) => {
	dispatch(applyFilters({ key: field, value: '' }));
	if (operator) {
		dispatch(applyFilters({ key: operator === 'eq' ? field : `${field}_${operator}`, value }));
	}
};
