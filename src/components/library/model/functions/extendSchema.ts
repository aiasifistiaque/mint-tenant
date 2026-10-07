type Schema = {
	[key: string]: any;
};

const extendSchema = ({ schema, fields }: { schema: any; fields: any }): Schema => {
	// Create a copy of the original schema to avoid mutating it
	const updatedSchema = { ...schema };

	// Iterate over the new fields and replace the corresponding keys in the original schema
	for (const key in fields) {
		if (fields.hasOwnProperty(key)) {
			updatedSchema[key] = fields[key];
		}
	}

	return updatedSchema;
};

export default extendSchema;
