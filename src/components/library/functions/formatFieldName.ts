const formatFieldName = (field: string): string => {
	return field
		.split('.')
		.map(
			part =>
				part
					.replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
					.replace(/^./, str => str.toUpperCase()) // Capitalize the first letter
		)
		.join(' ');
};

export default formatFieldName;
