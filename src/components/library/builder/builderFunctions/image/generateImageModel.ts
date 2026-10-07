const generateImageModel = (key: string, title?: string) => [
	{
		startOfSection: true,
		sectionTitle: title,
		name: `${key}.src.md`,
		label: 'Image Source',
		type: 'image',
		isRequired: true,
	},
	// {
	// 	name: `${key}.src.sm`,
	// 	label: 'Image Source [Mobile]',
	// 	type: 'image',
	// 	helper: 'If not provided, the desktop image will be used.',
	// },
	{
		name: `${key}.alt`,
		label: 'Alt Text',
		type: 'number',
		span: 1,
	},
	{
		name: `${key}.width.md`,
		label: 'Width [Desktop]',
		type: 'text',
		span: 1,
	},
	{
		name: `${key}.width.base`,
		label: 'Width [Mobile]',
		type: 'text',
		span: 1,
	},
	{
		name: `${key}.height.md`,
		label: 'Height [Desktop]',
		type: 'text',
		span: 1,
	},
	{
		name: `${key}.height.base`,
		label: 'Height [Mobile]',
		type: 'text',
		span: 1,
	},
	{
		name: `${key}.objectFit`,
		label: 'Object Fit',
		type: 'select',
		span: 1,
		options: [
			{ label: 'Contain', value: 'contain' },
			{ label: 'Cover', value: 'cover' },
			{ label: 'Fill', value: 'fill' },
			{ label: 'Scale-down', value: 'scale-down' },
		],
	},
	{
		name: `${key}.borderRadius`,
		label: 'Border Radius',
		type: 'number',
		span: 1,
	},
	{
		name: `${key}.borderWidth`,
		label: 'Border Width',
		type: 'number',
		span: 1,
	},
	{
		name: `${key}.borderColor`,
		label: 'Border Color',
		type: 'color',
		span: 1,
	},
	{
		name: `${key}.boxShadow`,
		label: 'Box Shadow',
		type: 'text',
		span: 1,
	},
	{
		name: `${key}.opacity`,
		label: 'Opacity',
		type: 'number',
		span: 1,
	},
	{
		name: `${key}.px`,
		label: 'Padding Horizontal',
		type: 'number',
		span: 1,
	},
	{
		name: `${key}.py`,
		label: 'Padding Vertical',
		type: 'number',
		span: 1,
	},
	{
		name: `${key}.mx`,
		label: 'Margin Horizontal',
		type: 'number',
	},
	{
		name: `${key}.my`,
		label: 'Margin Vertical',
		type: 'number',
	},
	{
		name: `${key}.opcacity`,
		label: 'Opacity',
		type: 'number',
	},
];

export default generateImageModel;
