'use client';

import { useState, FC } from 'react';
import { Flex, PopoverTrigger, RadioGroup, useDisclosure } from '@chakra-ui/react';

import {
	PopModal,
	PopModalHeader,
	PopModalBody,
	PopModalCloseButton,
	PopModalFooterLink,
	FilterOptionList,
	FilterRadio,
	useIsMobile,
	useAppDispatch,
	useAppSelector,
	Filter,
	applyFilters,
} from '../..';

const OPTIONS = [
	{ value: 'true', label: 'True' },
	{ value: 'false', label: 'False' },
];

type IsActiveFilterProps = {
	title: string;
	field: string;
	label?: string;
};

const BooleanFilter: FC<IsActiveFilterProps> = ({ title, field, label }) => {
	const { onOpen, onClose, open: isOpen } = useDisclosure();
	const isMobile = useIsMobile();

	const dispatch = useAppDispatch();
	const { filters } = useAppSelector((state: any) => state.table);

	const [val, setVal] = useState<string | undefined>(filters[field] || '');
	const handleChange = (value: string | null) => {
		setVal(value ?? '');
	};
	const open = () => {
		setVal(filters[field] || '');
		onOpen();
	};
	const popClose = () => {
		setVal(filters[field] || '');
		onClose();
	};
	const handleClick = () => {
		dispatch(
			applyFilters({
				key: field,
				value: val,
			})
		);
		popClose();
	};

	const ifFieldExists = (): boolean => {
		return Object.keys(filters).some(
			key => key.startsWith(field) && filters[key] !== null && filters[key] !== ''
		);
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
				isActive={ifFieldExists()}
				onCancel={onFilterReset}>
				{/* A plain string, not a `<span>`: a span picks up the global
				    `span { color; font-size }` rule instead of the chip's own text
				    style, so the value rendered in a different color and size. */}
				{label} {ifFieldExists() && `| ${filters[field]}`}
			</Filter>
		</span>
	);

	return (
		<PopModal
			handleClick={handleClick}
			isMobile={isMobile}
			onOpen={open}
			onClose={popClose}
			isOpen={isOpen}
			width='330px'
			footerStart={
				<PopModalFooterLink
					onClick={() => setVal('')}
					disabled={!val}>
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
				<RadioGroup.Root
					size={{ base: 'md', md: 'sm' }}
					colorPalette='gray'
					value={val || null}
					onValueChange={e => handleChange(e.value)}>
					<FilterOptionList>
						{OPTIONS.map(option => (
							<FilterRadio
								key={option.value}
								value={option.value}>
								{option.label}
							</FilterRadio>
						))}
					</FilterOptionList>
				</RadioGroup.Root>
			</PopModalBody>
		</PopModal>
	);
};

export default BooleanFilter;
