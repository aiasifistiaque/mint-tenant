const formatFilterKeys = (
	filters: Record<string, any>,
	options: FilterFormatOptions = {}
): string => {
	const {
		removeSuffixes = [
			'in',
			'not',
			'contains',
			'startsWith',
			'endsWith',
			'btwn',
			'between',
			'gt',
			'gte',
			'lt',
			'lte',
			'eq',
			'ne',
		],
		preserveAcronyms = true,
		customReplacements = {},
	} = options;

	return Object.entries(filters)
		.filter(([key, value]) => value !== '' && value !== null && value !== undefined)
		.map(([key]) =>
			formatCamelCaseKey(key, { removeSuffixes, preserveAcronyms, customReplacements })
		)
		.join(', ');
};

interface FilterFormatOptions {
	removeSuffixes?: string[];
	preserveAcronyms?: boolean;
	customReplacements?: Record<string, string>;
}

const formatCamelCaseKey = (key: string, options: FilterFormatOptions = {}): string => {
	const { removeSuffixes = [], preserveAcronyms = true, customReplacements = {} } = options;

	let formatted = key;

	// Apply custom replacements first
	Object.entries(customReplacements).forEach(([from, to]) => {
		formatted = formatted.replace(new RegExp(from, 'gi'), to);
	});

	// Remove specified suffixes
	if (removeSuffixes.length > 0) {
		const suffixPattern = `_(${removeSuffixes.join('|')})$`;
		formatted = formatted.replace(new RegExp(suffixPattern, 'gi'), '');
	}

	// Convert camelCase to spaced words
	formatted = formatted
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.split(/[\s_]+/)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');

	// Preserve common acronyms
	if (preserveAcronyms) {
		formatted = formatted
			.replace(/\bId\b/g, 'ID')
			.replace(/\bUrl\b/g, 'URL')
			.replace(/\bApi\b/g, 'API')
			.replace(/\bUi\b/g, 'UI')
			.replace(/\bDb\b/g, 'DB')
			.replace(/\bSql\b/g, 'SQL')
			.replace(/\bHtml\b/g, 'HTML')
			.replace(/\bCss\b/g, 'CSS')
			.replace(/\bJs\b/g, 'JS');
	}

	return formatted;
};
export default formatFilterKeys;
