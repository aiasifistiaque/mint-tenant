'use client';
import { useState, FC } from 'react';

import { Flex, PopoverTrigger, useDisclosure } from '@chakra-ui/react';
import BetweenValues from './BetweenValues';
import { readApplied, applyOperator } from '../operatorFilter';

import {
	useIsMobile,
	FilterInput,
	PopModalCloseButton,
	useAppDispatch,
	useAppSelector,
	Filter,
	PopModal,
	PopModalHeader,
	PopModalBody,
	PopModalFooterLink,
	FilterSelect,
	applyFilters,
} from '../../..';

type RangeFilterProps = {
	field: string;
	title?: string;
	label?: string;
};

type Operator = 'eq' | 'btwn' | 'gte' | 'lte';

// The backend's `gte` / `lte` are inclusive, hence "at least" / "at most"
// rather than the "greater than" / "less than" the old dropdown said.
const OPERATORS: { value: Operator; label: string }[] = [
	{ value: 'eq', label: 'Is equal to' },
	{ value: 'btwn', label: 'Is between' },
	{ value: 'gte', label: 'Is at least' },
	{ value: 'lte', label: 'Is at most' },
];

const isComplete = (operator: Operator, value: string): boolean =>
	operator === 'btwn' ? value.split('_').every(v => v !== '') : value !== '';

const describe = (operator: Operator, value: string): string => {
	if (operator === 'btwn') return value.split('_').join(' – ');
	if (operator === 'gte') return `≥ ${value}`;
	if (operator === 'lte') return `≤ ${value}`;
	return value;
};

const RangeFilter: FC<RangeFilterProps> = ({ title, field, label }) => {
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
		setValue(applied?.operator === next ? applied.value : next === 'btwn' ? '_' : '');
	};

	// Opens on "is equal to" when nothing is applied, as the old dropdown did.
	// Clear empties the dropdown, and applying that removes the filter.
	const open = (): void => {
		setOperator(applied?.operator ?? 'eq');
		setValue(applied?.value ?? '');
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

	const isMobile = useIsMobile();

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

	return (
		<PopModal
			isMobile={isMobile}
			onOpen={open}
			onClose={onClose}
			isOpen={isOpen}
			handleClick={handleClick}
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

				{operator === 'btwn' && (
					<BetweenValues
						value={value}
						setVal={setValue}
					/>
				)}
				{operator && operator !== 'btwn' && (
					<FilterInput
						type='number'
						placeholder='Value'
						value={value}
						onChange={e => setValue(e.target.value)}
					/>
				)}
			</PopModalBody>
		</PopModal>
	);
};

export default RangeFilter;
