const buildFormData = (data: any) => {
	const initialFormData = data.reduce((acc: any, curr: any) => {
		return { ...acc, [curr.name]: curr.type === 'switch' ? false : undefined };
	}, {});
	return initialFormData;
};

export default buildFormData;
