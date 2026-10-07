const formatFieldTitle = ({ field, schema }: { field: string; schema: any }): string => {
	if (!field || !schema || !Array.isArray(schema)) return field;

	// Find the schema item where dataKey matches the field
	const fieldSchema = schema.find(item => item.dataKey === field);
	if (!fieldSchema) return field;

	// If the field has a title, use it
	if (fieldSchema.title) {
		return fieldSchema.title;
	}

	// Fallback to the field name
	return field;
};

export default formatFieldTitle;
