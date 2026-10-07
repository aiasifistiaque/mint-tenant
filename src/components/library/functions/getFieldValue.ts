// const getFieldValue = ({ name, formData }: { name: string; formData: any }) => {
// 	const parentProperty = name?.split('.')[0];
// 	const childProperty = name?.split('.')[1];
// 	const value =
// 		name?.includes('.') && formData[parentProperty]
// 			? formData[parentProperty][childProperty]
// 			: formData[name];

// 	return value;
// };

const getFieldValue = ({ name, formData }: { name: string; formData: any }) => {
	const getValue = (obj: any, keys: (string | number)[]): any => {
		if (keys.length === 0) return obj;
		const [firstKey, ...restKeys] = keys;
		const indexMatch = firstKey.toString().match(/^(\w+)\[(\d+)\]$/);
		if (indexMatch) {
			const [_, arrayKey, index] = indexMatch;
			if (
				!obj[arrayKey] ||
				!Array.isArray(obj[arrayKey]) ||
				obj[arrayKey].length <= Number(index)
			) {
				return undefined;
			}
			return getValue(obj[arrayKey][Number(index)], restKeys);
		}
		if (obj && obj[firstKey] === undefined) {
			return undefined;
		}
		if (!obj) {
			return undefined;
		}
		return getValue(obj[firstKey], restKeys);
	};

	const keys = name
		.split('.')
		.flatMap(k => k.match(/(\w+|\[\d+\])/g) || [])
		.map(k => {
			const indexMatch = k.match(/^\[(\d+)\]$/);
			return indexMatch ? Number(indexMatch[1]) : k;
		});

	return getValue(formData, keys);
};

// const getFieldValue = ({ name, formData }: { name: string; formData: any }) => {
// 	const getValue = (obj: any, keys: (string | number)[]): any => {
// 		if (keys.length === 0) return obj;
// 		const [firstKey, ...restKeys] = keys;
// 		const indexMatch = firstKey.toString().match(/^(\w+)\[(\d+)\]$/);
// 		if (indexMatch) {
// 			const [_, arrayKey, index] = indexMatch;
// 			if (
// 				!obj[arrayKey] ||
// 				!Array.isArray(obj[arrayKey]) ||
// 				obj[arrayKey].length <= Number(index)
// 			) {
// 				console.error(`Array access error: ${arrayKey}[${index}] does not exist.`);
// 				return undefined;
// 			}
// 			return getValue(obj[arrayKey][Number(index)], restKeys);
// 		}
// 		if (obj[firstKey] === undefined) {
// 			console.error(`Key access error: ${firstKey} does not exist.`);
// 			return undefined;
// 		}
// 		return getValue(obj[firstKey], restKeys);
// 	};

// 	const keys = name.split('.').flatMap(k => k.match(/(\w+|\[\d+\])/g) || []);
// 	console.log(`Retrieving value for keys: ${JSON.stringify(keys)}`);
// 	return getValue(formData, keys);
// };

export default getFieldValue;
