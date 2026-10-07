import Handler from './handler.type';

//v1 can't handle 2 layer nesting
//if v2 fails revert to v1

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

//v2: Test case: can handle multiple layer of nesting
//if this fails revert to v1
const handleString = ({ e, formData, setFormData, setChangedData }: Handler) => {
	const updateNestedObject = (obj: any, path: string[], value: any): any => {
		// Base case - if we're at the last key, set the value
		if (path.length === 1) {
			return { ...obj, [path[0]]: value };
		}

		// Get the current key and remaining path
		const [currentKey, ...remainingPath] = path;

		// If the current key doesn't exist in the object, initialize it
		const currentValue = obj[currentKey] || {};

		// Recursively update the nested object
		return {
			...obj,
			[currentKey]: updateNestedObject(currentValue, remainingPath, value),
		};
	};

	const keys = e.target.name.split('.');

	setFormData((prevState: any) => updateNestedObject(prevState, keys, e.target.value));
	setChangedData((prevState: any) => updateNestedObject(prevState, keys, e.target.value));
};

export default handleString;
