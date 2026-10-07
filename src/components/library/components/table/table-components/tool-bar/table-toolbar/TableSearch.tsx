import { useState, useRef, useEffect } from 'react';
import { Button, Input, Group, InputProps } from '@chakra-ui/react';

import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { radius, sizes } from '../../../../../config';
import { updateTable, Icon } from '../../../../..';

const TableSearch = () => {
	const { search } = useAppSelector((state: any) => state.table);
	const [value, setValue] = useState<string>(search || '');
	const dispatch = useAppDispatch();
	const inputRef = useRef<HTMLInputElement>(null);
	const btnRef = useRef<any>(null);

	// Redux `search` only changes on submit (below) or when the URL-sync hook
	// hydrates it from the query string on load — the latter can land after
	// this input's own initial render, which would otherwise leave the box
	// looking empty while the table is actually filtered.
	useEffect(() => {
		setValue(search || '');
	}, [search]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Check if either Alt (Option) or Meta (Command) and 'f' are pressed
			if (e.altKey && e.key.toLowerCase() === 'ƒ') {
				e.preventDefault();
				inputRef.current?.focus();
			}
			if (e.metaKey && e.key.toLowerCase() === 'f') {
				e.preventDefault();
				inputRef.current?.focus();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	const handleSearch = () => dispatch(updateTable({ search: value }));
	const enterClicked = (e: any) => {
		if (e.key === 'Enter') handleSearch();
	};

	return (
		<Group
			{...inputGroupCss}
			attached>
			<Input
				ref={inputRef}
				type='text'
				{...inputCss}
				value={value}
				onKeyDown={enterClicked}
				onChange={e => setValue(e.target.value)}
			/>
			<Button
				ref={btnRef}
				onClick={handleSearch}
				{...addOnCss}>
				<Icon
					name='search'
					size={14}
				/>
			</Button>
		</Group>
	);
};

const inputGroupCss: any = {
	flex: 1,
	size: 'sm',
	w: { base: 'full', lg: 300 },
};

const inputCss: InputProps = {
	px: 3,
	h: sizes.SEARCH_BAR_HEIGHT,
	fontSize: '14px',
	bg: 'field.bg',
	color: 'fg',
	borderColor: 'field.border',
	borderLeftRadius: radius.INPUT,
	placeholder: 'Search... (⌘ + F)',
	_placeholder: { fontSize: '14px', color: 'field.placeholder' },
	_hover: { borderColor: 'field.borderHover' },
	// The button is attached to the right, so the focus ring is drawn on the
	// group instead — a ring on the input alone would cut through the seam.
	_focusVisible: {
		outline: 'none',
		borderColor: 'field.focusRing',
		zIndex: 1,
	},
};

const addOnCss = {
	h: sizes.SEARCH_BAR_HEIGHT,
	w: sizes.SEARCH_BAR_HEIGHT,
	minW: sizes.SEARCH_BAR_HEIGHT,
	borderRightRadius: radius.INPUT,
	borderWidth: '1px',
	borderColor: 'field.border',
	bg: 'field.bg',
	color: 'fg.muted',
	_hover: { bg: 'bg.subtle', color: 'fg' },
};

export default TableSearch;
