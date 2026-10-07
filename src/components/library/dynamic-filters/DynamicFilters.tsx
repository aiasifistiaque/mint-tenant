'use client';

import { Button } from '@chakra-ui/react';
import { useMemo, useState } from 'react';

import {
	BooleanFilter,
	DateFilter,
	MultiSelectFilter,
	RangeFilter,
	TextFilter,
	SelectFilter,
} from './filters';
import { FilterSectionContainer } from './filter-components';
import { useAppDispatch, useAppSelector } from '../hooks';
import { clearFilters, useGetFiltersQuery } from '../store';
import { hasActiveFilters } from '../functions';
import { sizes } from '../config';
import { ChevronDown, ChevronUp } from 'lucide-react';

type FilterItemType = {
	field: any;
	label: any;
	title: any;
	type: 'boolean' | 'multi-select' | 'date' | 'range' | 'text' | 'select';
	options?: any;
};

// How many filters stay on screen when the row is collapsed. Tables here carry
// a dozen or more, and a three-line wall of chips pushed the table itself below
// the fold.
const COLLAPSED_COUNT = 4;

const renderFilter = (item: FilterItemType, index: number) => {
	// Keyed on the filter's own field rather than its position: the collapsed
	// row renders a different slice of the same list, so an index key would
	// remount a filter — losing what's typed into it — just because the row
	// expanded. The key is also set on each element directly; spreading it in
	// with the rest of the props is not how React reads a key.
	const key = item?.field ?? index;

	const commonProps = {
		field: item?.field,
		label: item?.label,
		title: item?.title,
	};

	switch (item?.type) {
		case 'boolean':
			return (
				<BooleanFilter
					key={key}
					{...commonProps}
				/>
			);
		case 'multi-select':
			return (
				<MultiSelectFilter
					key={key}
					{...commonProps}
					options={item?.options}
				/>
			);
		case 'date':
			return (
				<DateFilter
					key={key}
					{...commonProps}
				/>
			);
		case 'text':
			return (
				<TextFilter
					key={key}
					{...commonProps}
				/>
			);
		case 'range':
			return (
				<RangeFilter
					key={key}
					{...commonProps}
				/>
			);
		case 'select':
			return (
				<SelectFilter
					key={key}
					{...commonProps}
					options={item?.options}
				/>
			);
		default:
			return null;
	}
};

const DynamicFilters = ({ path }: { path: any }) => {
	const dispatch = useAppDispatch();
	const { data, isLoading, isError } = useGetFiltersQuery(path);
	const { filters } = useAppSelector(state => state.table);
	const [expanded, setExpanded] = useState(false);

	const handleClearFilter = () => dispatch(clearFilters());

	const isFilterActive = (item: FilterItemType) => {
		const value = filters?.[item?.field];
		if (value === undefined || value === null || value === '') return false;
		if (Array.isArray(value)) return value.length > 0;
		if (typeof value === 'object') return Object.keys(value).length > 0;
		return true;
	};

	// A filter that is currently narrowing the table always stays on screen —
	// collapsing one out of sight would hide why the results look the way they
	// do, and leave no way to clear it.
	const { visible, hiddenCount } = useMemo(() => {
		const all: FilterItemType[] = data || [];
		if (expanded) return { visible: all, hiddenCount: 0 };

		const shown: FilterItemType[] = [];
		all.forEach(item => {
			if (isFilterActive(item) || shown.length < COLLAPSED_COUNT) shown.push(item);
		});

		return { visible: shown, hiddenCount: all.length - shown.length };
	}, [data, expanded, filters]);

	// Gate on isLoading, not isFetching: a background refetch (a mutation
	// invalidating 'filters', or a remount after the cache expired) would
	// otherwise blink the whole filter row off screen while the chips we
	// already have are still perfectly good.
	if (isLoading || isError) return null;

	const canToggle = (data?.length || 0) > visible.length || expanded;

	return (
		<FilterSectionContainer>
			{visible.map((item, i) => renderFilter(item, i))}

			{canToggle && (
				<Button
					onClick={() => setExpanded(prev => !prev)}
					variant='plain'
					size='sm'
					h={sizes.SEARCH_BAR_HEIGHT}
					px={2}
					gap={1}
					color='fg.muted'
					fontWeight='500'
					fontSize='12px'
					_hover={{ color: 'fg' }}>
					{expanded ? (
						<ChevronUp
							size={13}
							strokeWidth={1.5}
						/>
					) : (
						<ChevronDown
							size={13}
							strokeWidth={1.5}
						/>
					)}
					{expanded ? 'Hide filters' : `Show ${hiddenCount} more filters`}
				</Button>
			)}

			{hasActiveFilters(filters) && (
				<Button
					onClick={handleClearFilter}
					variant='plain'
					size='sm'
					h={sizes.SEARCH_BAR_HEIGHT}
					px={2}
					color='fg.muted'
					fontWeight='500'
					fontSize='12px'
					_hover={{ color: 'fg' }}>
					Clear filters
				</Button>
			)}
		</FilterSectionContainer>
	);
};

export default DynamicFilters;
