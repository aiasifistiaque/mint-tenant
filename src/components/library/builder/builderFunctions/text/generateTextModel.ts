const generateTextModel = (key: string, title?: string) => [
	{
		startOfSection: true,
		sectionTitle: title,
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
		name: `${key}.color`,
		label: 'Color',
		isRequired: true,
		type: 'color',
		span: 1,
	},

	{
		name: `${key}.fontStyle`,
		label: 'Font Style',
		type: 'select',
		span: 1,
		options: [
			{ label: 'Normal', value: 'normal' },
			{ label: 'Italic', value: 'italic' },
		],
	},
	{
		name: `${key}.fontSize.base`,
		label: 'Font Size (Sm)',
		type: 'font-size',
		span: 1,
	},
	{
		name: `${key}.fontSize.md`,
		label: 'Font Size (Lg)',
		type: 'font-size',
		span: 1,
	},

	{
		name: `${key}.lineHeight`,
		label: 'Line Height',
		type: 'line-height',
		span: 1,
	},
	{
		name: `${key}.letterSpacing`,
		label: 'Letter Spacing',
		type: 'number',
		span: 1,
	},
	{
		name: `${key}.pb`,
		label: 'Padding Bottom',
		type: 'number',
	},
];

export default generateTextModel;
