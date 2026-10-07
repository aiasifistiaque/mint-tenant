'use client';
import { FC, KeyboardEvent, useEffect, useState } from 'react';

import { Box, Flex, PopoverTrigger, Text, useDisclosure } from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { applyFilters } from '../..';

import {
	useIsMobile,
	useAppDispatch,
	useAppSelector,
	FilterOptionList,
	Filter,
	FilterInput,
	PopModal,
	PopModalHeader,
	PopModalBody,
	PopModalCloseButton,
	PopModalFooterLink,
	FilterCheckbox,
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

const MultiSelectFilter: FC<FilterProps> = ({ title, field, options, label }) => {
	const { onOpen, onClose, open: isOpen } = useDisclosure();
	const dispatch: any = useAppDispatch();
	const { filters } = useAppSelector((state: any) => state.table);

	const [val, setVal] = useState<string[]>([]);
	const [search, setSearch] = useState<string>('');

	const handleSearch = (e: any) => {
		setSearch(e.target.value);
	};

	// Takes the option's value rather than reading `e.target.name` off a change
	// event: the checkbox is controlled now, so the toggle comes from Chakra's
	// `onCheckedChange` and there is no DOM event to read a name from.
	const handleToggle = (value: string) => {
		setVal(val => (val.includes(value) ? val.filter(item => item !== value) : [...val, value]));
	};

	const visibleOptions = options.filter(option =>
		option?.label?.toLowerCase()?.includes(search?.toLowerCase())
	);

	// Both act on what the search currently shows, so "Select all" after typing
	// picks the matches rather than every option behind them.
	const allVisibleSelected =
		visibleOptions.length > 0 && visibleOptions.every(option => val.includes(option?.value));

	const selectAll = () => {
		setVal(val => Array.from(new Set([...val, ...visibleOptions.map(option => option?.value)])));
	};

	const clearAll = () => {
		const visible = new Set(visibleOptions.map(option => option?.value));
		setVal(val => val.filter(item => !visible.has(item)));
	};

	// One footer action instead of two: it selects what's shown, or clears it
	// once everything shown is ticked — the same toggle Ctrl/⌘+A runs.
	const toggleAll = () => (allVisibleSelected ? clearAll() : selectAll());

	// The shortcut's name, read after mount: the server doesn't know the
	// platform, and guessing there would mismatch on hydration.
	const [shortcut, setShortcut] = useState('Ctrl+A');
	useEffect(() => {
		if (/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)) setShortcut('⌘A');
	}, []);

	// Ctrl/⌘+A ticks every option the search shows (again: clears them); Enter
	// applies. Caught on the body, so it works from the search box and from a
	// focused checkbox alike — inside the search box it replaces select-all-text.
	const onKeyDown = (e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'a') {
			e.preventDefault();
			e.stopPropagation();
			if (visibleOptions.length) toggleAll();
		} else if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'text') {
			e.preventDefault();
			handleClick();
		}
	};

	const open = () => {
		setVal(filters[field] ? filters[field].split(',') : []);
		onOpen();
	};
	const popClose = () => {
		setVal(filters[field] ? filters[field].split(',') : []);
		setSearch('');
		onClose();
	};
	const handleClick = () => {
		const arr = val;
		dispatch(
			applyFilters({
				key: field,
				value: val?.length > 0 ? arr.join(',') : '',
			})
		);
		popClose();
	};
	const isMobile = useIsMobile();

	const ifFieldExists = (): boolean => {
		return Object.keys(filters).some(
			key => key.startsWith(field) && filters[key] !== null && filters[key] !== ''
		);
	};

	const getLabelsFromFilters = (): string[] => {
		const filterValue = filters[field] || '';
		// Split the filter value into an array of strings
		const valuesArray = filterValue.split(',');

		// Map the values to their corresponding labels
		const labelsArray = valuesArray
			.map((value: any) => {
				const option = options.find(option => option?.value === value?.trim());
				return option ? option?.label : '';
			})
			.filter((label: any) => label !== ''); // Filter out any empty labels

		return labelsArray;
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

	// The chip names the first choice and counts the rest ("Industry | Mining +2"):
	// listing every label grew it across the whole toolbar. A long first name is
	// cut short; the count stays readable, and hovering shows them all.
	const picked = ifFieldExists() ? getLabelsFromFilters() : [];
	const button = (
		<span>
			<Filter
				isActive={picked.length > 0 || ifFieldExists()}
				onCancel={onFilterReset}
				title={picked.length > 1 ? picked.join(', ') : undefined}>
				{/* One inline run: as separate flex items the spaces around "|" collapse. */}
				<span>
					{label}
					{picked.length > 0 && (
						<>
							{' | '}
							<Box
								as='span'
								display='inline-block'
								maxW='160px'
								verticalAlign='bottom'
								truncate>
								{picked[0]}
							</Box>
							{picked.length > 1 && ` +${picked.length - 1}`}
						</>
					)}
				</span>
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
					onClick={toggleAll}
					disabled={visibleOptions.length === 0}>
					<Flex
						as='span'
						align='center'
						gap={1.5}>
						{allVisibleSelected ? 'Clear all' : 'Select all'}
						{!isMobile && (
							<Box
								as='kbd'
								px={1}
								borderRadius='3px'
								borderWidth={1}
								borderColor='border'
								color='fg.muted'
								fontFamily='inherit'
								fontSize='10px'
								lineHeight='14px'
								fontWeight='500'>
								{shortcut}
							</Box>
						)}
					</Flex>
				</PopModalFooterLink>
			}
			trigger={
				isMobile ? (
					<Flex onClick={open}>{button}</Flex>
				) : (
					<PopoverTrigger>{button}</PopoverTrigger>
				)
			}>
			<PopModalHeader isMobile={isMobile}>
				<Flex
					as='span'
					w='full'
					align='baseline'
					justify='space-between'
					gap={3}>
					<span>{title}</span>
					{val.length > 0 && (
						<Text
							as='span'
							flexShrink={0}
							textTransform='none'
							letterSpacing='normal'
							fontWeight='500'
							fontSize={isMobile ? '13px' : '11px'}
							color='fg'>
							{val.length} of {options.length} selected
						</Text>
					)}
				</Flex>
			</PopModalHeader>
			<PopModalCloseButton isMobile={isMobile} />
			<PopModalBody isMobile={isMobile}>
				<Flex
					direction='column'
					gap={2}
					onKeyDown={onKeyDown}>
					<Box
						position='relative'
						color='fg.muted'>
						<Box
							position='absolute'
							left={2.5}
							top='50%'
							transform='translateY(-50%)'
							pointerEvents='none'
							lineHeight={0}
							zIndex={1}>
							<Search
								size={14}
								strokeWidth={1.75}
							/>
						</Box>
						<FilterInput
							type='text'
							placeholder={`Search ${options.length} options`}
							value={search}
							onChange={handleSearch}
							ps={8}
						/>
					</Box>

					<FilterOptionList
						maxH={{ base: '50vh', md: '264px' }}
						overflowY='auto'
						gap={0}>
						{visibleOptions.length === 0 && (
							<Text
								px={2}
								py={2}
								fontSize={{ base: '15px', md: '13px' }}
								color='fg.muted'>
								{options?.length === 0 ? 'No options available' : 'No matches'}
							</Text>
						)}
						{visibleOptions.map((option: any, i: number) => (
							// `checked`, not Chakra v2's `isChecked` — that name is not a
							// prop in v3, so it fell through to the DOM (the "React does
							// not recognize the `isChecked` prop" warning) and left
							// `checked` undefined, i.e. the box was uncontrolled and never
							// showed the filter that was actually applied.
							<FilterCheckbox
								checked={val.includes(option?.value)}
								onCheckedChange={() => handleToggle(option?.value)}
								size={{ base: 'md', md: 'xs' }}
								w='full'
								minH={{ base: '36px', md: '28px' }}
								gap={2}
								px={2}
								py={0}
								borderRadius='md'
								cursor='pointer'
								transition='background-color 120ms'
								_hover={{ bg: 'bg.muted' }}
								title={option?.label}
								controlProps={{ borderRadius: '4px' }}
								labelProps={{
									fontSize: { base: '15px', md: '13px' },
									fontWeight: '400',
									// Record names as written: capitalising every word turned
									// "Mining and Quarrying" into "… And …".
									textTransform: 'none',
									flex: 1,
									minW: 0,
									truncate: true,
								}}
								key={option?.value ?? i}>
								{option?.label}
							</FilterCheckbox>
						))}
					</FilterOptionList>
				</Flex>
			</PopModalBody>
		</PopModal>
	);
};

export default MultiSelectFilter;
