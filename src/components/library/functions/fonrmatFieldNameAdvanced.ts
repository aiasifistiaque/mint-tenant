interface FormatOptions {
	separator?: string;
	capitalizeWords?: boolean;
	removeUnderscores?: boolean;
	removeDashes?: boolean;
	customReplacements?: Record<string, string>;
	preserveAcronyms?: boolean;
}

const formatFieldNameAdvanced = (field: string, options: FormatOptions = {}): string => {
	const {
		separator = ' ',
		capitalizeWords = true,
		removeUnderscores = true,
		removeDashes = true,
		customReplacements = {},
		preserveAcronyms = false,
	} = options;

	if (!field || typeof field !== 'string') {
		return '';
	}

	let formatted = field;

	// Apply custom replacements first
	Object.entries(customReplacements).forEach(([key, value]) => {
		formatted = formatted.replace(new RegExp(key, 'gi'), value);
	});

	// Handle different separators in the original field
	if (removeUnderscores) {
		formatted = formatted.replace(/_/g, '.');
	}
	if (removeDashes) {
		formatted = formatted.replace(/-/g, '.');
	}

	return formatted
		.split('.')
		.filter(part => part.length > 0) // Remove empty parts
		.map(part => {
			// Add space before capital letters (camelCase handling)
			let spaced = part.replace(/([a-z])([A-Z])/g, `$1${separator}$2`);

			// Handle consecutive capitals (like XMLHttpRequest -> XML Http Request)
			if (!preserveAcronyms) {
				spaced = spaced.replace(/([A-Z])([A-Z][a-z])/g, `$1${separator}$2`);
			}

			// Capitalize words if requested
			if (capitalizeWords) {
				return spaced
					.split(separator)
					.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
					.join(separator);
			}

			return spaced;
		})
		.join(separator);
};

// Utility functions for common use cases
export const formatFieldNameTitle = (field: string): string =>
	formatFieldNameAdvanced(field, { capitalizeWords: true });

export const formatFieldNameSentence = (field: string): string =>
	formatFieldNameAdvanced(field, { capitalizeWords: false }).replace(/^./, str =>
		str.toUpperCase()
	);

export const formatFieldNameKebab = (field: string): string =>
	formatFieldNameAdvanced(field, {
		separator: '-',
		capitalizeWords: false,
	}).toLowerCase();

export const formatFieldNameSnake = (field: string): string =>
	formatFieldNameAdvanced(field, {
		separator: '_',
		capitalizeWords: false,
	}).toLowerCase();

export default formatFieldNameAdvanced;
