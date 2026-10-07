import { VSwitch, VCheckbox } from '@/components/library/utils/inputs';
import { registerFieldType } from '../registry';
import { NotYetImplementedCell, NotYetImplementedView } from './_shared';

const SwitchInput = ({ item, isRequired, ...props }: any) => (
	<VSwitch
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const CheckboxInput = ({ item, isRequired, ...props }: any) => (
	<VCheckbox
		isRequired={isRequired}
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
