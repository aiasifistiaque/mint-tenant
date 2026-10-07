import { Handler } from '.';

const updateNestedState: any = (state: any, keys: (string | number)[], value: any) => {
	if (keys.length === 1) {
		return { ...state, [keys[0]]: value };
	}
	const [firstKey, ...restKeys] = keys;
	const indexMatch = firstKey.toString().match(/^(\w+)\[(\d+)\]$/);
	if (indexMatch) {
		const [_, arrayKey, index] = indexMatch;
		const newArray = [...(state[arrayKey] || [])];
		newArray[Number(index)] = updateNestedState(newArray[Number(index)] || {}, restKeys, value);
		return {
			...state,
			[arrayKey]: newArray,
		};
	} else if (typeof firstKey === 'number') {
		const newArray = Array.isArray(state) ? [...state] : [];
		newArray[firstKey] = updateNestedState(newArray[firstKey] || {}, restKeys, value);
		return newArray;
	} else {
		return {
			...state,
			[firstKey]: updateNestedState(state?.[firstKey] || {}, restKeys, value),
		};
	}
};

const handleNestedImage = ({
	e,
	dataKey,
	formData,
	setFormData,
	setChangedData,
}: Handler & { dataKey: string }) => {
	const keys = dataKey
		.split('.')
		.flatMap((k: any) => k.match(/(\w+|\[\d+\])/g) || [])
		.map((k: any) => {
			const indexMatch = k.match(/^\[(\d+)\]$/);
			return indexMatch ? Number(indexMatch[1]) : k;
		});

	setChangedData((prevState: any) => updateNestedState(prevState, keys, e));
	setFormData((prevState: any) => updateNestedState(prevState, keys, e));
};

export default handleNestedImage;
