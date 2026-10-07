// Just check if there are active filters
const hasActiveFilters = (filters: Record<string, any>): boolean =>
	Object.values(filters || {}).some(
		value =>
			value !== '' &&
			value !== null &&
			value !== undefined &&
			!(Array.isArray(value) && value.length === 0)
	);

export default hasActiveFilters;
