import { useState, useCallback, useEffect } from 'react';

const useFormData = <T extends {}>(data: any[], updatedData?: any) => {
	const initialFormData = () => {
		// Check if data is not provided or is not an array, return an empty object
		if (!data || !Array.isArray(data)) return {};

		// Reduce the data array to an object with initial form values
		return data?.reduce((acc: Partial<T>, curr: any) => {
			// If the current item is of type 'tag', 'array', or 'data-tag',
			// initialize with an empty array or provided value
			if (curr.type === 'tag' || curr.type === 'array' || curr.type === 'data-tag') {
				// If the value is not provided, initialize with an empty array
				return { ...acc, [curr.name]: [] };
			} else {
				// For other types, initialize with the provided value or default values
				return {
					...acc,
					[curr.name]: curr.type === 'switch' ? false : undefined,
				};
			}
		}, {});
	};

	// Initialize the form data with the initial form values
	const [formData, setFormData] = useState<T>(initialFormData);

	const updateNestedState = (state: any, keys: (string | number)[], value: any): any => {
		if (keys.length === 1) {
			return { ...state, [keys[0]]: value };
		}
		const [firstKey, ...restKeys] = keys;
		const indexMatch = firstKey.toString().match(/^(\w+)\[(\d+)\]$/);
		if (indexMatch) {
			const [_, arrayKey, index] = indexMatch;
			const array = state[arrayKey] || [];
			const newArray = [...array];
			newArray[Number(index)] = updateNestedState(array[Number(index)] || {}, restKeys, value);
			return {
				...state,
				[arrayKey]: newArray,
			};
		}
		return {
			...state,
			[firstKey]: updateNestedState(state[firstKey] || {}, restKeys, value),
		};
	};

	const updateFormData = (newData: Partial<T>) => {
		const formattedData = Object.fromEntries(
			Object.entries(newData)
				.filter(
					([key]) =>
						key in formData || Object.keys(formData).some(k => k.startsWith(key.split('.')[0]))
				)
				.map(([key, value]) => {
					if (typeof value === 'boolean') {
						return [key, value];
					} else if (
						typeof value === 'string' &&
						value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
					) {
						const date = new Date(value);
						const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
							2,
							'0'
						)}-${String(date.getDate()).padStart(2, '0')}`;
						return [key, formattedDate];
					}
					return [key, value];
				})
		);

		const updatedFormData = Object.entries(formattedData).reduce((acc, [key, value]) => {
			const keys = key.split('.').flatMap(k => k.match(/(\w+|\[\d+\])/g) || []);
			return updateNestedState(acc, keys, value);
		}, formData);

		setFormData(prevState => ({ ...prevState, ...updatedFormData }));
	};

	useEffect(() => {
		if (updatedData) {
			updateFormData(updatedData);
		}
	}, [updatedData]);

	return [formData, setFormData];
};

export default useFormData;
