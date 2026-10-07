'use client';

import { useState, ChangeEvent, FC } from 'react';
import { Flex, PopoverTrigger, useDisclosure } from '@chakra-ui/react';

import {
	PopModal,
	PopModalHeader,
	PopModalBody,
	PopModalCloseButton,
	PopModalFooterLink,
	useIsMobile,
	useAppDispatch,
	useAppSelector,
	Filter,
	FilterInput,
	applyFilters,
} from '../..';

type IsActiveFilterProps = {
	title: string;
	field: string;
	label?: string;
};

const TextFilter: FC<IsActiveFilterProps> = ({ title, field, label }) => {
	const { onOpen, onClose, open: isOpen } = useDisclosure();
	const isMobile = useIsMobile();

	const dispatch = useAppDispatch();
	const { filters } = useAppSelector((state: any) => state.table);

	const [val, setVal] = useState<string | undefined>(filters[field] || '');
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setVal(e.target.value);
	};
	const open = () => {
		setVal(filters[field] || '');
		onOpen();
	};
	const popClose = () => {
		setVal('');
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
				{/* Plain string rather than a `<span>` — see BooleanFilter.tsx. */}
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
				<FilterInput
					value={val}
					onChange={handleChange}
					// Enter applies, as it would in any search box.
					onKeyDown={e => e.key === 'Enter' && handleClick()}
					placeholder='Search value'
				/>
			</PopModalBody>
		</PopModal>
	);
};

export default TextFilter;
