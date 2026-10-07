// import Handler from './handler.type';

// const handleString = ({ e, formData, setFormData, setChangedData }: Handler) => {
// 	console.log(e.target.name);
// 	if (e.target.name.includes('.')) {
// 		const [parent, child] = e.target.name.split('.');
// 		setFormData((prevState: any) => ({
// 			...prevState,
// 			[parent]: {
// 				...prevState[parent],
// 				[child]: e.target.value,
// 			},
// 		}));
// 		setChangedData((prevState: any) => ({
// 			...prevState,
// 			[parent]: {
// 				...formData[parent],
// 				[child]: e.target.value,
// 			},
// 		}));
// 	} else {
// 		setFormData({ ...formData, [e.target.name]: e.target.value });
// 		setChangedData((prevState: any) => ({ ...prevState, [e.target.name]: e.target.value }));
// 	}
// };

// export default handleString;

import Handler from './handler.type';

const handleNestedString = ({ e, formData, setFormData, setChangedData }: Handler) => {
	const updateNestedField = (obj: any, keys: (string | number)[], value: any): any => {
		if (keys.length === 1) {
			return { ...obj, [keys[0]]: value };
		}
		const [firstKey, ...restKeys] = keys;
		const indexMatch = firstKey.toString().match(/^(\w+)\[(\d+)\]$/);
		if (indexMatch) {
			const [_, arrayKey, index] = indexMatch;
			const newArray = [...(obj[arrayKey] || [])];
			newArray[Number(index)] = updateNestedField(newArray[Number(index)] || {}, restKeys, value);
			return {
				...obj,
				[arrayKey]: newArray,
			};
		} else if (typeof firstKey === 'number') {
			const newArray = Array.isArray(obj) ? [...obj] : [];
			newArray[firstKey] = updateNestedField(newArray[firstKey] || {}, restKeys, value);
			return newArray;
		} else {
			return {
				...obj,
				[firstKey]: updateNestedField(obj[firstKey] || {}, restKeys, value),
			};
		}
	};

	const keys = e.target.name
		.split('.')
		.flatMap((k: any) => k.match(/(\w+|\[\d+\])/g) || [])
		.map((k: any) => {
			const indexMatch = k.match(/^\[(\d+)\]$/);
			return indexMatch ? Number(indexMatch[1]) : k;
		});

	setFormData((prevState: any) => {
		const newState = updateNestedField({ ...prevState }, keys, e.target.value);
		return newState;
	});

	setChangedData((prevState: any) => {
		const newState = updateNestedField({ ...prevState }, keys, e.target.value);
		return newState;
	});
};

export default handleNestedString;
