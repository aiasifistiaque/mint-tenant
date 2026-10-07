type Option = { label: string; value: string; message?: string };

export const textAlignOptions: Option[] = [
	{ label: 'text-align-left', value: 'left' },
	{ label: 'text-align-center', value: 'center' },
	{ label: 'text-align-right', value: 'right' },
	{ label: 'text-align-justify', value: 'justify' },
];

export const flexAlignOptions: Option[] = [
	{ label: 'flex-start', value: 'flex-start' },
	{ label: 'flex-center', value: 'flex-center' },
	{ label: 'flex-end', value: 'flex-end' },
];

export const flexJustifyOptions: Option[] = [
	{ label: 'justify-start', value: 'justify-start' },
	{ label: 'justify-end', value: 'justify-end' },
	{ label: 'justify-center', value: 'justify-center' },
	{ label: 'justify-space-between', value: 'space-between' },
	{ label: 'justify-space-around', value: 'space-around' },
	{ label: 'justify-space-evenly', value: 'space-evenly' },
];
