'use client';
import { useState, FC } from 'react';

import { Flex, useDisclosure, PopoverTrigger } from '@chakra-ui/react';

import InTheLast from './InTheLast';
import DatePicker from './DatePicker';
import BetweenDates from './BetweenDates';
import { readApplied, applyOperator } from '../operatorFilter';

import {
	Filter,
	useAppDispatch,
	useAppSelector,
	applyFilters,
	FilterSelect,
	useIsMobile,
	PopModal,
	PopModalHeader,
	PopModalCloseButton,
	PopModalBody,
	PopModalFooterLink,
} from '../../..';

type DateFilterProps = {
	field: string;
	title?: string;
	label?: string;
};

type Operator = 'last' | 'eq' | 'btwn' | 'gte' | 'lte';

const OPERATORS: { value: Operator; label: string }[] = [
	{ value: 'last', label: 'Is in the last' },
	{ value: 'eq', label: 'Is equal to' },
	{ value: 'btwn', label: 'Is between' },
	{ value: 'gte', label: 'Is on or after' },
	{ value: 'lte', label: 'Is before' },
];

// What a freshly picked operator starts with. Only "in the last" has a sensible
// default; the date ones wait for the user to pick a date.
const DEFAULT_VALUE: Record<Operator, string> = {
	last: 'days_7',
	eq: '',
	btwn: '_',
	gte: '',
	lte: '',
};

/** Half-filled inputs can't be applied: a missing count, or one end of a range. */
const isComplete = (operator: Operator, value: string): boolean => {
	if (operator === 'last') return Number(value.split('_')[1]) > 0;
	if (operator === 'btwn') return value.split('_').every(Boolean);
	return value !== '';
};

const describe = (operator: Operator, value: string): string => {
	if (operator === 'last') {
		const [unit, count] = value.split('_');
		return `last ${count} ${count === '1' ? unit.replace(/s$/, '') : unit}`;
	}
	if (operator === 'btwn') return value.split('_').join(' – ');
	if (operator === 'gte') return `on or after ${value}`;
	if (operator === 'lte') return `before ${value}`;
	return value;
};

const DateFilter: FC<DateFilterProps> = ({ title, field, label }) => {
	const { onOpen, onClose, open: isOpen } = useDisclosure();
	const dispatch = useAppDispatch();
	const { filters } = useAppSelector((state: any) => state.table);

	const applied = readApplied(
		filters,
		field,
		OPERATORS.map(op => op.value)
	);

	const [operator, setOperator] = useState<Operator | null>(null);
	const [value, setValue] = useState<string>('');

	const handleOperatorChange = (next: string | null): void => {
		if (!next) return;
		setOperator(next as Operator);
		setValue(applied?.operator === next ? applied.value : DEFAULT_VALUE[next as Operator]);
	};

	// With nothing applied it opens on "in the last 7 days", as the old
	// dropdown did, so the common case is one click. Clear empties the
	// dropdown, and applying that removes the filter.
	const open = (): void => {
		setOperator(applied?.operator ?? 'last');
		setValue(applied?.value ?? DEFAULT_VALUE.last);
		onOpen();
	};

	const clear = (): void => {
		setOperator(null);
		setValue('');
	};

	const handleClick = (): void => {
		applyOperator(dispatch, field, operator, value);
		onClose();
	};

	const onFilterReset = (e: any) => {
		e.stopPropagation();
		e.preventDefault();
		dispatch(
			applyFilters({
				key: field,
				value: '',
			})
		);
	};

	const button = (
		<span>
			<Filter
				isActive={!!applied}
				onCancel={onFilterReset}>
				{/* Plain string rather than a `<span>` — see BooleanFilter.tsx. */}
				{label} {applied && `| ${describe(applied.operator, applied.value)}`}
			</Filter>
		</span>
	);

	const isMobile = useIsMobile();

	return (
		<PopModal
			handleClick={handleClick}
			isMobile={isMobile}
			onOpen={open}
			onClose={onClose}
			isOpen={isOpen}
			width='330px'
			applyDisabled={!!operator && !isComplete(operator, value)}
			footerStart={
				<PopModalFooterLink
					onClick={clear}
					disabled={!operator}>
					Clear
				</PopModalFooterLink>
			}
			trigger={
				isMobile ? (
					<Flex onClick={open}>{button}</Flex>
				) : (
					<PopoverTrigger>{button}</PopoverTrigger>
				)
			}>
			<PopModalHeader isMobile={isMobile}>{title}</PopModalHeader>
			<PopModalCloseButton isMobile={isMobile} />

			<PopModalBody isMobile={isMobile}>
				<FilterSelect
					value={operator ?? ''}
					onChange={(e: { target: { value: string } }) => handleOperatorChange(e.target.value)}>
					<option
						value=''
						disabled>
						Choose a condition
					</option>
					{OPERATORS.map(option => (
						<option
							key={option.value}
							value={option.value}>
							{option.label}
						</option>
					))}
				</FilterSelect>

				{operator === 'last' && (
					<InTheLast
						value={value}
						setVal={setValue}
					/>
				)}
				{operator === 'btwn' && (
					<BetweenDates
						value={value}
						setVal={setValue}
					/>
				)}
				{(operator === 'eq' || operator === 'gte' || operator === 'lte') && (
					<DatePicker
						value={value}
						setVal={setValue}
					/>
				)}
			</PopModalBody>
		</PopModal>
	);
};

export default DateFilter;
