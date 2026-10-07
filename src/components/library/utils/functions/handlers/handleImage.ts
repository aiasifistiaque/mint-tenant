import { Handler } from '.';

const updateNestedState: any = (state: any, keys: string[], value: any) => {
	if (keys.length === 1) {
		return { ...state, [keys[0]]: value };
	}
	const [firstKey, ...restKeys] = keys;
	return {
		...state,
		[firstKey]: updateNestedState(state[firstKey] || {}, restKeys, value),
	};
};

const handleImage = ({
	e,
	dataKey,
	formData,
	setFormData,
	setChangedData,
}: Handler & { dataKey: string }) => {
	const keys = dataKey.split('.');

	setChangedData((prevState: any) => updateNestedState(prevState, keys, e));
	setFormData((prevState: any) => updateNestedState(prevState, keys, e));
};

export default handleImage;
