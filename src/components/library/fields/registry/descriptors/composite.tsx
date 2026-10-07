import {
	VSection,
	VSectionDataArray,
	VArrayString,
	VCustom,
	VSeo,
	VFormFields,
	VSettings,
} from '@/components/library/utils/inputs';
import VVariant from '@/components/library/utils/inputs/VVariant';
import VModelFields from '@/components/library/utils/inputs/VModelFields';
import VSectionObject from '@/components/library/utils/inputs/section/VSectionObject';
import { registerFieldType } from '../registry';
import { NotYetImplementedCell, NotYetImplementedView } from './_shared';

const CustomSectionArrayInput = ({ item, isRequired, ...props }: any) => (
	<VSection
		onChange={(props as any).onChange}
		isRequired={isRequired}
		name={(props as any).name}
		helper={item?.helper}
		hasImage={item?.hasImage}
		limit={item?.limit}
		section={item?.section}
		{...props}
	/>
);

const SectionDataArrayInput = ({ item, isRequired, ...props }: any) => (
	<VSectionDataArray
		onChange={(props as any).onChange}
		isRequired={isRequired}
		name={(props as any).name}
		helper={item?.helper}
		hasImage={item?.hasImage}
		limit={item?.limit}
		section={item?.section}
		{...props}
	/>
);

const SectionObjectInput = ({ item, isRequired, formData, ...props }: any) => (
	<VSectionObject
		name={(props as any).name}
		label={(props as any).label}
		value={(props as any).value}
		onChange={(props as any).onChange}
		isRequired={isRequired}
		helper={item?.helper}
		dataModel={item?.dataModel}
	/>
);

const ArrayStringInput = ({ item, isRequired, ...props }: any) => (
	<VArrayString
		onChange={(props as any).onChange}
		isRequired={isRequired}
		name={(props as any).name}
		helper={item?.helper}
		{...props}
	/>
);

const CustomSectionInput = ({ item, isRequired, ...props }: any) => (
	<VCustom
		onChange={(props as any).onChange}
		isRequired={isRequired}
		name={(props as any).name}
		helper={item?.helper}
		dataModel={item?.dataModel}
		{...props}
	/>
);

const SeoInput = ({ item, isRequired, formData, ...props }: any) => (
	<VSeo
		isRequired={isRequired}
		onChange={(props as any).onChange}
		helper={item?.helper}
		formData={formData}
		{...props}
	/>
);

const VariantInput = ({ item, isRequired, formData, ...props }: any) => (
	<VVariant
		form={formData}
		onChange={(props as any).onChange}
		isRequired={isRequired}
		name={(props as any).name}
		helper={item?.helper}
		hasImage={item?.hasImage}
		limit={item?.limit}
		section={item?.section}
		{...props}
	/>
);

const ModelFieldsInput = ({ item, isRequired, type, formData, ...props }: any) => (
	<VModelFields
		form={formData}
		type={type}
		helper={item?.helper}
		isRequired={isRequired}
		{...props}
	/>
);

const FormFieldsInput = ({ item, isRequired, type, formData, ...props }: any) => (
	<VFormFields
		form={formData}
		type={type}
		helper={item?.helper}
		isRequired={isRequired}
		onChange={(props as any).onChange}
		{...props}
	/>
);

const SettingsInput = ({ item, isRequired, type, formData, ...props }: any) => (
	<VSettings
		form={formData}
		type={type}
		helper={item?.helper}
		isRequired={isRequired}
		onChange={(props as any).onChange}
		{...props}
	/>
);

registerFieldType({
	id: 'custom-section-array',
	family: 'composite',
	input: CustomSectionArrayInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'custom-section-array', render: NotYetImplementedView, layout: 'full' },
	storage: 'array-object',
});

registerFieldType({
	id: 'section-data-array',
	family: 'composite',
	input: SectionDataArrayInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'data-array', cell: NotYetImplementedCell },
	view: { type: 'section-data-array', render: NotYetImplementedView, layout: 'full' },
	storage: 'array-object',
});

registerFieldType({
	id: 'section-object',
	family: 'composite',
	input: SectionObjectInput,
	changeMode: 'value',
	emptyValue: () => ({}),
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'section-object', render: NotYetImplementedView, layout: 'full' },
	storage: 'object',
});

registerFieldType({
	id: 'array-string',
	family: 'composite',
	input: ArrayStringInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'tag', render: NotYetImplementedView, layout: 'inline' },
	storage: 'array-string',
});

registerFieldType({
	id: 'custom-section',
	family: 'composite',
	input: CustomSectionInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'custom-section-array', render: NotYetImplementedView, layout: 'full' },
	storage: 'array-object',
});

registerFieldType({
	id: 'seo',
	family: 'composite',
	input: SeoInput,
	changeMode: 'value',
	emptyValue: () => ({}),
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'object', render: NotYetImplementedView, layout: 'full' },
	storage: 'object',
});

registerFieldType({
	id: 'variant',
	family: 'composite',
	input: VariantInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'object', render: NotYetImplementedView, layout: 'full' },
	storage: 'array-object',
});

registerFieldType({
	id: 'model-fields',
	family: 'composite',
	input: ModelFieldsInput,
	changeMode: 'value',
	emptyValue: () => ({}),
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'object', render: NotYetImplementedView, layout: 'full' },
	storage: 'object',
});

registerFieldType({
	id: 'form-fields',
	family: 'composite',
	input: FormFieldsInput,
	changeMode: 'value',
	emptyValue: () => ({}),
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'object', render: NotYetImplementedView, layout: 'full' },
	storage: 'object',
});

registerFieldType({
	id: 'settings',
	family: 'composite',
	input: SettingsInput,
	changeMode: 'value',
	emptyValue: () => ({}),
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'object', render: NotYetImplementedView, layout: 'full' },
	storage: 'object',
});
