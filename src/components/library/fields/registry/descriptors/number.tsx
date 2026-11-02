import { useMemo } from 'react';
import { VInput } from '@/components/library/utils/inputs';
import VMuted from '@/components/library/utils/inputs/VMuted';
import { CalendarClock, Calculator, Link2 } from 'lucide-react';
import { LINKED_VALUES, evaluate, evaluateDate, format, isDateFormulaSchema, parse } from '@/components/library/functions/formula';
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
const useTree = (formula?: string) =>
	useMemo(() => {
		try {
			return formula ? parse(formula) : null;
		} catch {
			return null;
		}
	}, [formula]);

const day = (d: Date | string) =>
	new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * A Formula (date) field (`dateformula`, docs/date-formulas): the date it
 * works out, read-only, as the fields it uses are filled in. One worked out
 * once (`item.calc: 'once'`) shows the record's own date once it has one —
 * that's what the server keeps.
 */
const DateFormulaInput = ({ item, value, formData, ...props }: any) => {
	const tree = useTree(item?.formula);
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
};

const FormulaInput = ({ item, isRequired, type, value, onChange: _onChange, formData, ...props }: any) => {
	const tree = useTree(item?.formula);
	// A Formula (date) saved by the first build as a formula marked `returns: 'date'`.
	if (isDateFormulaSchema({ type: 'formula', returns: item?.returns }))
		return (
			<DateFormulaInput
				item={item}
				value={value}
				formData={formData}
				{...props}
			/>
		);
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

/**
 * A read-only autofill (`fillFrom.readonly`, docs/autofill): a copy of a field
 * of the record picked in another field — set by the server on every save and
 * following that record, so it only shows here. The field keeps its own kind;
 * the form draws it with this input (`lockedFills`) and fills it the moment the
 * record is picked (LinkedFiller).
 */
const AutofillReadOnlyInput = ({ item, value, ...props }: any) => {
	const empty = value === null || value === undefined || value === '';
	const text = empty
		? ''
		: item?.fills === 'number'
		? Number(value).toLocaleString(undefined, { maximumFractionDigits: 10 })
		: item?.fills === 'date'
		? Number.isNaN(new Date(value).getTime())
			? String(value)
			: day(value)
		: item?.fills === 'boolean'
		? value
			? 'Yes'
			: 'No'
		: typeof value === 'object'
		? String(value.name ?? value.title ?? value.label ?? value._id ?? '')
		: String(value);
	return (
		<VMuted
			label={props.label}
			value={text}
			placeholder='—'
			helper={[`Copied from ${item?.fromLabel || item?.fillFrom?.from || 'a linked record'} — it changes with it`, item?.helper].filter(Boolean).join(' · ')}
			icon={<Link2 size={13} />}
		/>
	);
};

registerFieldType({
	id: 'autofillreadonly',
	family: 'text',
	input: AutofillReadOnlyInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	supportsInlineEdit: false,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'dateformula',
	family: 'datetime',
	input: DateFormulaInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	supportsInlineEdit: false,
	table: { type: 'date', cell: NotYetImplementedCell },
	view: { type: 'date', render: NotYetImplementedView, layout: 'inline' },
	storage: 'date',
});
