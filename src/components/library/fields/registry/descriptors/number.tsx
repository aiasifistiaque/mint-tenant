import { useMemo } from 'react';
import { VInput } from '@/components/library/utils/inputs';
import { evaluate, format, parse } from '@/components/library/functions/formula';
import { registerFieldType } from '../registry';
import { NotYetImplementedCell, NotYetImplementedView } from './_shared';

const NumberInput = ({ item, isRequired, type, ...props }: any) => (
	<VInput
		type={type || 'number'}
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

registerFieldType({
	id: 'number',
	family: 'number',
	input: NumberInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	supportsInlineEdit: true,
	table: { type: 'number', cell: NotYetImplementedCell, align: 'end' },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'number',
});

/**
 * A formula field: calculated from the record's other number fields
 * (`item.formula`, e.g. `total - paid`) and shown read-only, updating as the
 * fields it uses are typed. The server calculates the stored value the same
 * way; nothing typed here is sent.
 */
const FormulaInput = ({ item, isRequired, type, value: _value, onChange: _onChange, formData, ...props }: any) => {
	const tree = useMemo(() => {
		try {
			return item?.formula ? parse(item.formula) : null;
		} catch {
			return null;
		}
	}, [item?.formula]);
	const result = tree ? evaluate(tree, formData || {}) : null;
	return (
		<VInput
			type='text'
			readOnly
			bg='bg.muted'
			cursor='default'
			value={result === null ? '' : result.toLocaleString(undefined, { maximumFractionDigits: 10 })}
			onChange={() => {}}
			placeholder={tree ? '—' : 'No formula set'}
			helper={[tree ? `= ${format(tree)}` : '', item?.helper].filter(Boolean).join(' · ')}
			{...props}
		/>
	);
};

registerFieldType({
	id: 'formula',
	family: 'number',
	input: FormulaInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	supportsInlineEdit: false,
	table: { type: 'number', cell: NotYetImplementedCell, align: 'end' },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'number',
});
