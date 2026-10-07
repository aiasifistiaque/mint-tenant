type GetValue = {
	dataKey: string;
	type: any;
	data: any;
};

/**
 * V0
 * can not handle cases more than 2 length
 */

// const getValue = ({ dataKey, type, data }: GetValue): any => {
// 	if (!data) return;
// 	// Split the dataKey by '.' to determine if it's nested
// 	const keys = dataKey?.split('.');
// 	// Determine the appropriate value based on whether the key is nested
// 	let value = 'n/a';
// 	if (keys?.length === 1) {
// 		// Single level key, directly access the value
// 		value = type === 'date' ? new Date(data[dataKey]) : data[dataKey];
// 	} else if (keys?.length === 2) {
// 		// Nested key, access the nested value
// 		const [parentKey, childKey] = keys;
// 		value = type === 'date' ? new Date(data[parentKey]?.[childKey]) : data[parentKey]?.[childKey];
// 	}
// 	return value;
// };

/**
 * V1
 * can handle cases more than 2 length
 */

const getValue = ({ dataKey, type, data }: GetValue): any => {
	if (!data || !dataKey) {
		return type == 'external-link' ? null : '--';
	}

	// Split the dataKey by '.' to get all nested levels
	const keys = dataKey.split('.');

	// Start with the root data
	let currentValue = data;

	// Traverse through all the nested levels
	for (const key of keys) {
		// If at any point the current value is undefined/null, return 'n/a'
		if (currentValue === undefined || currentValue === null) {
			return type == 'external-link' ? null : '--';
		}

		// Access the next level
		currentValue = currentValue[key];
	}

	// If we've reached here but the final value is undefined/null, return 'n/a'
	if (currentValue === undefined || currentValue === null) {
		return type == 'external-link' ? null : '--';
	}

	// Convert to Date if type is 'date', otherwise return the value as is
	return type === 'date' ? new Date(currentValue) : currentValue;
};

export default getValue;
