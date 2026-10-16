import { VSwitch, VCheckbox } from '@/components/library/utils/inputs';
import { registerFieldType } from '../registry';
import { NotYetImplementedCell, NotYetImplementedView } from './_shared';

// A Yes/No is never required: unticked is a No (false), a real answer — so
// neither input carries `required` (it would block the form's submit).
const SwitchInput = ({ item, isRequired: _required, ...props }: any) => (
	<VSwitch
		isRequired={false}
		helper={item?.helper}
		{...props}
	/>
);

const CheckboxInput = ({ item, isRequired: _required, ...props }: any) => (
	<VCheckbox
		isRequired={false}
		helper={item?.helper}
		{...props}
	/>
);

registerFieldType({
	id: 'switch',
	family: 'boolean',
	input: SwitchInput,
	changeMode: 'array', // getOnChangeHandler.ts currently routes 'switch' through handleImageArray — looks like a pre-existing bug, kept as-is (not in scope here)
	emptyValue: () => false,
	supportsInlineEdit: true,
	table: { type: 'boolean', cell: NotYetImplementedCell },
	view: { type: 'checkbox', render: NotYetImplementedView, layout: 'inline' },
	storage: 'boolean',
});

registerFieldType({
	id: 'checkbox',
	family: 'boolean',
	input: CheckboxInput,
	changeMode: 'value',
	emptyValue: () => false,
	supportsInlineEdit: true,
	table: { type: 'checkbox', cell: NotYetImplementedCell },
	view: { type: 'checkbox', render: NotYetImplementedView, layout: 'inline' },
	storage: 'boolean',
});
