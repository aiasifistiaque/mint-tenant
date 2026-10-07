// WO-10: text-family descriptors. Each `input` component is a mechanical port of
// the matching case from FormInput.tsx (no behaviour change) — see WO-11, which
// makes FormInput.tsx delegate to these instead of its own 720-line switch.
import VPassword from '@/components/library/utils/inputs/VPassword';
import VMuted from '@/components/library/utils/inputs/VMuted';
import { Sigma } from 'lucide-react';
import {
	VInput,
	VTextarea,
	VSlug,
	VCustomAttributes,
	ViewOnly,
	VEditor,
} from '@/components/library/utils/inputs';
import { registerFieldType } from '../registry';
import { NotYetImplementedCell, NotYetImplementedView } from './_shared';

const StringInput = ({ item, isRequired, ...props }: any) => (
	<VInput
		type='string'
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const TextInput = ({ item, isRequired, type, ...props }: any) => (
	<VInput
		type={type || 'text'}
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const NestedStringInput = ({ item, isRequired, type, ...props }: any) => (
	<VInput
		type={type}
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const TextareaInput = ({ item, isRequired, ...props }: any) => (
	<VTextarea
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const EditorInput = ({ item, ...props }: any) => (
	<VEditor
		onChange={(props as any).onChange}
		name={(props as any).name}
		helper={item?.helper}
		isRequired={item?.isRequired}
		{...props}
	/>
);

const BasicEditorInput = ({ item, ...props }: any) => (
	<VEditor
		type='basic'
		onChange={(props as any).onChange}
		name={(props as any).name}
		helper={item?.helper}
		isRequired={item?.isRequired}
		{...props}
	/>
);

const SlugInput = ({ item, isRequired, type, ...props }: any) => (
	<VSlug
		type={type}
		isRequired={isRequired}
		onChange={(props as any).onChange}
		helper={item?.helper}
		{...props}
	/>
);

/** A value as words: an option's label, a linked record's name, a list joined. */
const shown = (v: any, item: any): string => {
	if (v === null || v === undefined || v === '') return '—';
	if (Array.isArray(v)) return v.map(x => shown(x, item)).join(', ') || '—';
	if (typeof v === 'object') return String(v.name || v.title || v.label || v.code || v._id || '—');
	if (typeof v === 'boolean') return v ? 'Yes' : 'No';
	const option = (item?.options || []).find((o: any) => String(o?.value ?? o) === String(v));
	return String(option?.label ?? v);
};

// Muted like every field that can't be typed in (VMuted).
const ReadOnlyInput = ({ item, isRequired, label, value }: any) => (
	<VMuted
		label={label}
		isRequired={isRequired}
		helper={item?.helper}
		value={shown(value, item)}
	/>
);

/**
 * A field the record's state has locked (settings: `lockWhen` — a paid bill's
 * status). Its value, read-only, with the reason as the helper line.
 */
const LockedInput = ({ item, isRequired, label, value }: any) => (
	<VMuted
		label={label}
		isRequired={isRequired}
		helper={item?.helper}
		value={shown(value, item)}
	/>
);

const PasswordInput = ({ item, isRequired, type: _type, ...props }: any) => (
	<VPassword
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const ViewOnlyInput = ({ item, ...props }: any) => (
	<ViewOnly
		helper={item?.helper}
		{...props}
	/>
);

const CustomAttributeInput = ({ item, isRequired, type, ...props }: any) => (
	<VCustomAttributes
		type={type}
		helper={item?.helper}
		isRequired={isRequired}
		{...props}
	/>
);

registerFieldType({
	id: 'string',
	family: 'text',
	input: StringInput,
	changeMode: 'event',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'text',
	family: 'text',
	input: TextInput,
	changeMode: 'event',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'nested-string',
	family: 'text',
	input: NestedStringInput,
	changeMode: 'nested-value',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'textarea',
	family: 'text',
	input: TextareaInput,
	changeMode: 'event',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'textarea', render: NotYetImplementedView, layout: 'full' },
	storage: 'string',
});

registerFieldType({
	id: 'nested-textarea',
	family: 'text',
	input: TextareaInput,
	changeMode: 'nested-value',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'textarea', render: NotYetImplementedView, layout: 'full' },
	storage: 'string',
});

registerFieldType({
	id: 'editor',
	family: 'text',
	input: EditorInput,
	changeMode: 'value',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'editor', render: NotYetImplementedView, layout: 'full' },
	storage: 'string',
});

registerFieldType({
	id: 'basic-editor',
	family: 'text',
	input: BasicEditorInput,
	changeMode: 'value',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'basic-editor', render: NotYetImplementedView, layout: 'full' },
	storage: 'string',
});

registerFieldType({
	id: 'slug',
	family: 'text',
	input: SlugInput,
	changeMode: 'value',
	emptyValue: () => '',
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'read-only',
	family: 'text',
	input: ReadOnlyInput,
	changeMode: 'event',
	emptyValue: () => '',
	supportsInlineEdit: false,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

/** A field worked out from linked records (settings `rollup`): shown on the form, never typed. */
const RollupInput = ({ item, label, value }: any) => (
	<VMuted
		label={label}
		helper={item?.helper || 'Worked out from linked records — it updates by itself.'}
		value={value === null || value === undefined || value === '' ? '' : typeof value === 'number' ? value.toLocaleString() : String(value)}
		icon={<Sigma size={13} />}
	/>
);

registerFieldType({
	id: 'rollup',
	family: 'text',
	input: RollupInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	supportsInlineEdit: false,
	table: { type: 'number', cell: NotYetImplementedCell },
	view: { type: 'number', render: NotYetImplementedView, layout: 'inline' },
	storage: 'number',
});

registerFieldType({
	id: 'locked',
	family: 'text',
	input: LockedInput,
	changeMode: 'event',
	emptyValue: () => '',
	supportsInlineEdit: false,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'password',
	family: 'text',
	input: PasswordInput,
	changeMode: 'event',
	emptyValue: () => '',
	table: { type: 'password', cell: NotYetImplementedCell },
	view: { type: 'password', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'view-only',
	family: 'text',
	input: ViewOnlyInput,
	changeMode: 'event',
	emptyValue: () => '',
	supportsInlineEdit: false,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'custom-attribute',
	family: 'composite',
	input: CustomAttributeInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'custom-attribute', render: NotYetImplementedView, layout: 'full' },
	storage: 'array-object',
});
