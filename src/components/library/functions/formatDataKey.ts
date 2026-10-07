const formatDataKey = (dataKey: string) => {
	return dataKey
		.split('.')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

export default formatDataKey;
