'use client';
import { FC, useState } from 'react';

import { Flex, PopoverTrigger, RadioGroup, Text, useDisclosure } from '@chakra-ui/react';

import {
	useIsMobile,
	useAppDispatch,
	useAppSelector,
	applyFilters,
	Filter,
	FilterInput,
	FilterRadio,
	FilterOptionList,
	PopModal,
	PopModalHeader,
	PopModalBody,
	PopModalCloseButton,
	PopModalFooterLink,
} from '../..';

type OptionType = {
	value: string;
	label: string;
};

type FilterProps = {
	title: string;
	field: string;
	label?: string;
	options: OptionType[];
};

// Short lists read at a glance; a search box only earns its place past this.
const SEARCH_THRESHOLD = 7;

const SelectFilter: FC<FilterProps> = ({ title, field, options = [], label }) => {
	const { onOpen, onClose, open: isOpen } = useDisclosure();
	const dispatch: any = useAppDispatch();
	const { filters } = useAppSelector((state: any) => state.table);

	const [val, setVal] = useState<string>(filters[field] || '');
	const [search, setSearch] = useState<string>('');

	const applied: string = filters[field] || '';
	const showSearch = options.length > SEARCH_THRESHOLD;

	const visibleOptions = options.filter(option =>
		option?.label?.toLowerCase()?.includes(search.toLowerCase())
	);

	const open = () => {
		setVal(applied);
		setSearch('');
		onOpen();
	};

	const popClose = () => {
		setVal(applied);
		setSearch('');
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
	const isMobile = useIsMobile();

	const labelOf = (value: string): string =>
		options.find(option => option?.value === value)?.label ?? value;

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
				{label} {applied && `| ${labelOf(applied)}`}
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
				{showSearch && (
					<FilterInput
						type='text'
						placeholder='Search'
						value={search}
						onChange={e => setSearch(e.target.value)}
					/>
				)}

				<RadioGroup.Root
					size={{ base: 'md', md: 'sm' }}
					colorPalette='gray'
					value={val || null}
					onValueChange={e => setVal(e.value ?? '')}>
					<FilterOptionList
						// Pulls the list up into the body's 12px gap below the search box.
						mt={showSearch ? -1.5 : 0}
						maxH={{ base: 'auto', md: '240px' }}
						overflowY='auto'>
						{visibleOptions.length === 0 && (
							<Text
								px={2}
								py={2}
								fontSize={{ base: '15px', md: '13px' }}
								color='fg.muted'>
								{options.length === 0 ? 'No options available' : 'No matches'}
							</Text>
						)}
						{visibleOptions.map((option, i) => (
							<FilterRadio
								key={option?.value ?? i}
								value={option?.value}>
								{option?.label}
							</FilterRadio>
						))}
					</FilterOptionList>
				</RadioGroup.Root>
			</PopModalBody>
		</PopModal>
	);
};

export default SelectFilter;
