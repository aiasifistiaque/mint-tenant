import { VColor, VFont, VFontSize, VAlignment, BLineHeight, BOpacity, VSlider } from '@/components/library/utils/inputs';
import { flexAlignOptions, flexJustifyOptions, textAlignOptions } from '@/components/library/create-page/inputs/form-input/options';
import { registerFieldType } from '../registry';
import { NotYetImplementedCell, NotYetImplementedView } from './_shared';

const ColorInput = ({ item, isRequired, type, ...props }: any) => (
	<VColor
		type={type}
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const FontInput = ({ item, isRequired, ...props }: any) => (
	<VFont
		isRequired={isRequired}
		helper={item?.helper}
		onChange={(props as any).onChange}
		{...props}
	/>
);

const FontSizeInput = ({ item, isRequired, type, ...props }: any) => (
	<VFontSize
		options={[10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 32, 36, 40, 48, 64, 96, 128]}
		type={type}
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const LineHeightInput = ({ item, isRequired, ...props }: any) => (
	<BLineHeight
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const OpacityInput = ({ item, isRequired, ...props }: any) => (
	<BOpacity
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const SliderInput = ({ item, isRequired, ...props }: any) => (
	<VSlider
		isRequired={isRequired}
		helper={item?.helper}
		values={item?.values}
		threshold={item?.threshold}
		min={item?.min}
		max={item?.max}
		step={item?.step}
		{...props}
	/>
);

const LetterspacingInput = ({ item, isRequired, ...props }: any) => (
	<VSlider
		isRequired={isRequired}
		helper={item?.helper}
		values={[-3, -2, -1, 0, 1, 2, 3]}
		threshold={100}
		min={-400}
		max={400}
		step={10}
		{...props}
	/>
);

const AlignmentInput = ({ item, isRequired, type, ...props }: any) => (
	<VAlignment
		type={type}
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const FlexJustifyInput = ({ item, isRequired, type, ...props }: any) => (
	<VAlignment
		type={type}
		isRequired={isRequired}
		helper={item?.helper}
		options={flexJustifyOptions}
		{...props}
	/>
);

const FlexAlignInput = ({ item, isRequired, type, ...props }: any) => (
	<VAlignment
		type={type}
		isRequired={isRequired}
		helper={item?.helper}
		options={flexAlignOptions}
		{...props}
	/>
);

const TextAlignInput = ({ item, isRequired, type, ...props }: any) => (
	<VAlignment
		type={type}
		isRequired={isRequired}
		helper={item?.helper}
		options={textAlignOptions}
		{...props}
	/>
);

registerFieldType({
	id: 'color',
	family: 'style',
	input: ColorInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'font',
	family: 'style',
	input: FontInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'font-size',
	family: 'style',
	input: FontSizeInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'number',
});

registerFieldType({
	id: 'line-height',
	family: 'style',
	input: LineHeightInput,
	changeMode: 'value',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'number',
});

registerFieldType({
	id: 'opacity',
	family: 'style',
	input: OpacityInput,
	changeMode: 'value',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'number',
});

registerFieldType({
	id: 'slider',
	family: 'style',
	input: SliderInput,
	changeMode: 'value',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'number',
});

registerFieldType({
	id: 'letterspacing',
	family: 'style',
	input: LetterspacingInput,
	changeMode: 'value',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'number',
});

registerFieldType({
	id: 'alignment',
	family: 'style',
	input: AlignmentInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'flex-justify',
	family: 'style',
	input: FlexJustifyInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'flex-align',
	family: 'style',
	input: FlexAlignInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'text-align',
	family: 'style',
	input: TextAlignInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});
