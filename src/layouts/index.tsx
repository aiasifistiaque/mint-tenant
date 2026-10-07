type FieldConfig = {
	fields: string[];
	tableFields: string[];
	formFields: {
		sectionTitle: string;
		fields: (string | string[])[];
		description?: string;
	}[];
};

type ModuleResponse = {
	exists: boolean;
	module: FieldConfig;
};

const getFieldModule = async (key: string): Promise<ModuleResponse> => {
	try {
		const { fields, tableFields, formFields } = await import(`../app/${key}/config`);
		return {
			exists: true,
			module: {
				fields: fields || [],
				tableFields: tableFields || [],
				formFields: formFields || [
					{
						sectionTitle: '',
						fields: [],
					},
				],
			},
		};
	} catch (error) {
		return {
			exists: false,
			module: {
				fields: [],
				tableFields: [],
				formFields: [
					{
						sectionTitle: '',
						fields: [],
					},
				],
			},
		};
	}
};

export default getFieldModule;
