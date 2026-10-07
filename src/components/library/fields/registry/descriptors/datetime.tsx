import { VInput } from '@/components/library/utils/inputs';
import { registerFieldType } from '../registry';
import { NotYetImplementedCell, NotYetImplementedView } from './_shared';

const DateInput = ({ item, isRequired, type, ...props }: any) => {
	const formattedValue = props.value ? new Date(props.value as any).toISOString().split('T')[0] : '';
	return (
		<VInput
			type={type}
			isRequired={isRequired}
			helper={item?.helper}
			{...props}
			value={formattedValue}
		/>
	);
};

const TimeInput = ({ item, isRequired, ...props }: any) => (
	<VInput
		type='time'
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
		value={props.value}
	/>
);

registerFieldType({
	id: 'date',
	family: 'datetime',
	input: DateInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	supportsInlineEdit: true,
	table: { type: 'date-only', cell: NotYetImplementedCell },
	view: { type: 'date', render: NotYetImplementedView, layout: 'inline' },
	storage: 'date',
});

registerFieldType({
	id: 'time',
	family: 'datetime',
	input: TimeInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'time', cell: NotYetImplementedCell },
	view: { type: 'date', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});
