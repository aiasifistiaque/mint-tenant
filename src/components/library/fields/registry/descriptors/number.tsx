import { useMemo } from 'react';
import { VInput } from '@/components/library/utils/inputs';
import VMuted from '@/components/library/utils/inputs/VMuted';
import { CalendarClock, Calculator } from 'lucide-react';
import { LINKED_VALUES, evaluate, evaluateDate, format, parse } from '@/components/library/functions/formula';
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
 *
 * A Date formula (`item.returns: 'date'`, docs/date-formulas) shows the date
 * it works out; one worked out once (`item.calc: 'once'`) shows the record's
 * own date once it has one — that's what the server keeps.
 */
const day = (d: Date | string) =>
	new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const FormulaInput = ({ item, isRequired, type, value, onChange: _onChange, formData, ...props }: any) => {
	const tree = useMemo(() => {
		try {
			return item?.formula ? parse(item.formula) : null;
		} catch {
			return null;
		}
	}, [item?.formula]);
	if (item?.returns === 'date') {
		const kept = item?.calc === 'once' && value !== null && value !== undefined && value !== '';
		const date = kept ? value : tree ? evaluateDate(tree, formData || {}, formData?.[LINKED_VALUES]) : null;
		return (
			<VMuted
				label={props.label}
				value={date && !Number.isNaN(new Date(date).getTime()) ? day(date) : ''}
				placeholder={tree ? '—' : 'No formula set'}
				helper={[tree ? `= ${format(tree)}` : '', item?.calc === 'once' ? (kept ? 'worked out when it was added' : 'worked out once, when saved') : '', item?.helper]
					.filter(Boolean)
					.join(' · ')}
				icon={<CalendarClock size={13} />}
			/>
		);
	}
	// A linked record's numbers (`tax.amount`) come with the form's values (withFormulaValues).
	const result = tree ? evaluate(tree, formData || {}, formData?.[LINKED_VALUES]) : null;
	// Worked out, never typed: muted like every field that can't be typed in.
	return (
		<VMuted
			label={props.label}
			value={result === null ? '' : result.toLocaleString(undefined, { maximumFractionDigits: 10 })}
			placeholder={tree ? '—' : 'No formula set'}
			helper={[tree ? `= ${format(tree)}` : '', item?.helper].filter(Boolean).join(' · ')}
			icon={<Calculator size={13} />}
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
