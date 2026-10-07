const linkOptions = [
	{
		label: 'Page',
		value: 'page',
	},
	{
		label: 'Product',
		value: 'product',
	},
	{
		label: 'Category',
		value: 'category',
	},
	{
		label: 'Collection',
		value: 'collection',
	},
	{
		label: 'External Link',
		value: 'external',
	},
];

type LinkRenderType = {
	key: string;
	pages: { label: string; value: string }[];
	index?: number;
};

const getNestedValue = (obj: any, path: string) => {
	// Handle array notation by parsing the path properly
	const parts = path.match(/[^\[\].]+/g) || [];
	return parts.reduce((acc, part) => {
		return acc ? acc[part] : undefined;
	}, obj);
};

const createRenderCondition = (key: string, expectedType: string) => {
	return (data: any) => {
		// Handle both direct key and nested path scenarios
		const isNestedPath = key.includes('.');

		if (isNestedPath) {
			// For nested paths like 'discover.items[0]'
			const typeValue = getNestedValue(data, `${key}.type`);
			console.log('Path:', `${key}.type`, 'Type value:', typeValue, 'Data:', data);
			return typeValue === expectedType;
		} else {
			// For simple keys
			return data?.[key]?.type === expectedType;
		}
	};
};

const linkRenderOptions = ({ key, pages, index }: LinkRenderType) => {
	return [
		{
			name: `${key}.type`,
			label: 'Link Type',
			type: 'nested-select',
			isRequired: true,
			options: linkOptions,
		},
		{
			name: `${key}.href`,
			label: 'Select Page',
			type: 'nested-select',
			options: pages,

			isRequired: true,
			renderCondition: createRenderCondition(key, 'page'),
			// renderCondition: (data: any) => {
			// 	return data[key]?.type === 'page';
			// },
		},
		{
			name: `${key}.href`,
			label: 'Select Product',
			type: 'nested-data-menu',
			model: 'products',
			isRequired: true,
			renderCondition: createRenderCondition(key, 'product'),
		},
		{
			name: `${key}.href`,
			label: 'Enter External Link [eg. https://google.com]',
			type: 'nested-string',
			isRequired: true,
			renderCondition: createRenderCondition(key, 'external'),
		},
		{
			name: `${key}.href`,
			label: 'Select Collection',
			type: 'nested-data-menu',
			model: 'collections',
			isRequired: true,

			renderCondition: createRenderCondition(key, 'collection'),
		},
		{
			name: `${key}.href`,
			label: 'Select Cateogry',
			type: 'nested-data-menu',
			model: 'categories',
			isRequired: true,
			renderCondition: createRenderCondition(key, 'category'),
		},
	];
};

export default linkRenderOptions;
