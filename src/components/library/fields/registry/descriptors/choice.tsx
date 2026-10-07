import {
	VSelect,
	VDataSelect,
	VDataMenu,
	VTags,
	VDataTags,
	VPermissions,
	VCatCollectionList,
	VInput,
} from '@/components/library/utils/inputs';
import VSelectTags from '@/components/library/utils/inputs/VSelectTags';
import { fontWeightOptions } from '@/components/library/data/fonts';
import { registerFieldType } from '../registry';
import { NotYetImplementedCell, NotYetImplementedView } from './_shared';

const SelectInput = ({ item, isRequired, ...props }: any) => (
	<VSelect
		isRequired={isRequired}
		helper={item?.helper}
		{...props}>
		<option
			value=''
			disabled
			selected>
			Select option
		</option>
		{item?.options?.map((option: any, i: number) => (
			<option
				key={i}
				value={option?.value}>
				{option?.label}
			</option>
		))}
	</VSelect>
);

const FontWeightInput = ({ item, isRequired, ...props }: any) => (
	<VSelect
		isRequired={isRequired}
		helper={item?.helper}
		{...props}>
		<option
			value=''
			disabled
			selected>
			Select option
		</option>
		{fontWeightOptions?.map((option: any, i: number) => (
			<option
				key={i}
				value={option?.value}>
				{option?.label}
			</option>
		))}
	</VSelect>
);

const DataSelectInput = ({ item, isRequired, ...props }: any) => (
	<VDataSelect
		isRequired={isRequired}
		model={(props as any)?.model || ''}
		helper={item?.helper}
		labelKey={item?.labelKey || 'name'}
		valueKey={item?.valueKey || '_id'}
		{...props}
	/>
);

const DataMenuInput = ({ item, isRequired, ...props }: any) => (
	<VDataMenu
		item={item}
		menuKey={item?.menuKey}
		menuAddOnKey={item?.menuAddOnKey}
		dataModel={item?.dataModel}
		isRequired={isRequired}
		model={(props as any)?.model || ''}
		field={item?.menuField || 'name'}
		helper={item?.helper}
		{...props}
	/>
);

const NestedDataMenuInput = ({ item, isRequired, ...props }: any) => (
	<VDataMenu
		menuKey={item?.menuKey}
		menuAddOnKey={item?.menuAddOnKey}
		dataModel={item?.dataModel}
		isRequired={isRequired}
		model={(props as any)?.model || ''}
		field={item?.menuField || 'name'}
		helper={item?.helper}
		{...props}
	/>
);

const TagInput = ({ item, isRequired, type, ...props }: any) => (
	<VTags
		type={type}
		helper={item?.helper}
		isRequired={isRequired}
		{...props}
	/>
);

const CaseTagInput = ({ item, isRequired, type, ...props }: any) => (
	<VTags
		type={type}
		helper={item?.helper}
		isRequired={isRequired}
		lowercase={false}
		{...props}
	/>
);

const SectionTagInput = ({ item, isRequired, type, ...props }: any) => (
	<VTags
		type={type}
		helper={item?.helper}
		isRequired={isRequired}
		section={true}
		{...props}
	/>
);

const DataTagInput = ({ item, isRequired, type, ...props }: any) => (
	<VDataTags
		item={item}
		type={type}
		model={(props as any)?.model || ''}
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const PermissionsInput = ({ item, isRequired, ...props }: any) => (
	<VPermissions
		dataModel={item?.dataModel}
		isRequired={isRequired}
		options={item?.options}
		helper={item?.helper}
		{...props}
	/>
);

const CategoryCollectionArrayInput = ({ item, ...props }: any) => (
	<VCatCollectionList
		{...props}
		helper={item?.helper}
	/>
);

// Several values picked from `options` — a multi-select (built models' multi-select
// fields, and tags limited to allowed values).
const SelectTagInput = ({ item, isRequired, type, ...props }: any) => (
	<VSelectTags
		isRequired={isRequired}
		helper={item?.helper}
		options={item?.options || []}
		{...props}
		value={Array.isArray(props.value) ? props.value : []}
	/>
);

registerFieldType({
	id: 'select',
	family: 'choice',
	input: SelectInput,
	changeMode: 'event',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'nested-select',
	family: 'choice',
	input: SelectInput,
	changeMode: 'nested-value',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'font-weight',
	family: 'style',
	input: FontWeightInput,
	changeMode: 'event',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'data-select',
	family: 'relation',
	input: DataSelectInput,
	changeMode: 'event',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'ref',
});

registerFieldType({
	id: 'data-menu',
	family: 'relation',
	input: DataMenuInput,
	changeMode: 'value',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'ref',
});

registerFieldType({
	id: 'nested-data-menu',
	family: 'relation',
	input: NestedDataMenuInput,
	changeMode: 'nested-value',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'ref',
});

registerFieldType({
	id: 'tag',
	family: 'choice',
	input: TagInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'tag', cell: NotYetImplementedCell },
	view: { type: 'tag', render: NotYetImplementedView, layout: 'inline' },
	storage: 'array-string',
});

registerFieldType({
	id: 'case-tag',
	family: 'choice',
	input: CaseTagInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'tag', cell: NotYetImplementedCell },
	view: { type: 'tag', render: NotYetImplementedView, layout: 'inline' },
	storage: 'array-string',
});

registerFieldType({
	id: 'section-tag',
	family: 'choice',
	input: SectionTagInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'tag', cell: NotYetImplementedCell },
	view: { type: 'tag', render: NotYetImplementedView, layout: 'inline' },
	storage: 'array-string',
});

registerFieldType({
	id: 'data-tag',
	family: 'relation',
	input: DataTagInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'tag', cell: NotYetImplementedCell },
	view: { type: 'data-array-tag', render: NotYetImplementedView, layout: 'inline' },
	storage: 'array-object',
});

registerFieldType({
	id: 'permissions',
	family: 'composite',
	input: PermissionsInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'custom-attribute', render: NotYetImplementedView, layout: 'full' },
	storage: 'array-object',
});

registerFieldType({
	id: 'category-collection-array',
	family: 'composite',
	input: CategoryCollectionArrayInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'custom-attribute', render: NotYetImplementedView, layout: 'full' },
	storage: 'array-object',
});

registerFieldType({
	id: 'select-tag',
	family: 'choice',
	input: SelectTagInput,
	changeMode: 'event',
	emptyValue: () => [],
	table: { type: 'tag', cell: NotYetImplementedCell },
	view: { type: 'tag', render: NotYetImplementedView, layout: 'inline' },
	storage: 'array-string',
});
