const getFieldValue = ({ name, formData }: { name: string; formData: any }) => {
	const parentProperty = name?.split('.')[0];
	const childProperty = name?.split('.')[1];
	const value =
		name?.includes('.') && formData[parentProperty]
			? formData[parentProperty][childProperty]
			: formData[name];

	return value;
};

export default getFieldValue;
