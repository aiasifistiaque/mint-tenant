const generateButtonSchema = (key: string, title?: string) => [
	{
		sectionTitle: title,
		name: `${key}.children`,
		label: 'Button Text',
		type: 'text',
		isRequired: true,
	},
	{
		startOfSection: true,
		sectionTitle: 'Button Style',
		name: `${key}.variant`,
		label: 'Variant',
		type: 'select',
		span: 1,
		options: [
			{ label: 'Solid', value: 'solid' },
			{ label: 'Outline', value: 'outline' },
			{ label: 'Ghost', value: 'ghost' },
			{ label: 'Link', value: 'link' },
		],
	},
	{
		name: `${key}.size`,
		label: 'Size',
		type: 'select',
		span: 1,
		options: [
			{ label: 'Large', value: 'lg' },
			{ label: 'Medium', value: 'md' },
			{ label: 'Small', value: 'sm' },
			{ label: 'Extra Small', value: 'xs' },
		],
	},

	{
		name: `${key}.fontFamily`,
		label: 'Font',
		type: 'font',

		span: 1,
	},
	{
		name: `${key}.fontWeight`,
		label: 'Font Weight',
		type: 'font-weight',
		span: 1,
	},
	{
		name: `${key}.bg`,
		label: 'Backgrodun Color',
		isRequired: true,
		type: 'color',
		span: 1,
	},
	{
		name: `${key}.color`,
		label: 'Color',
		isRequired: true,
		type: 'color',
		span: 1,
	},

	{
		name: `${key}.fontSize`,
		label: 'Font Size',
		type: 'number',
		span: 1,
	},

	{
		name: `${key}.letterSpacing`,
		label: 'Letter Spacing',
		type: 'slider',
		min: -400,
		max: 400,
		values: [-3, -2, -1, 0, 1, 2, 3],
		threshold: 100,
		step: 10,
		span: 1,
	},
	{
		startOfSection: true,
		sectionTitle: 'Padding',
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
		startOfSection: true,
		sectionTitle: 'Margin',
		name: `${key}.mx`,
		label: 'Margin Horizontal',
		type: 'number',
		span: 1,
	},
	{
		name: `${key}.my`,
		label: 'Margin Vertical',
		type: 'number',
		span: 1,
	},
	{
		name: `${key}.borderRadius`,
		label: 'Border Radius',
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
		name: `${key}.borderWidth`,
		label: 'Border Width',
		type: 'number',
		span: 1,
	},
	{
		startOfSection: true,
		sectionTitle: 'Hover',
		name: `${key}._hover.bg`,
		label: 'Hover Background Color',
		type: 'color',
		span: 1,
	},
	{
		name: `${key}._hover.color`,
		label: 'Hover Color',
		type: 'color',
		span: 1,
	},
	{
		name: `${key}._hover.borderColor`,
		label: 'Hover Border Color',
		type: 'color',
	},
];

export default generateButtonSchema;
