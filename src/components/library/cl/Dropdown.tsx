'use client';

import { Children, isValidElement, KeyboardEvent, ReactElement, ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Box, createListCollection, Input, Portal, Select, Text } from '@chakra-ui/react';
import { ChevronDown, Search } from 'lucide-react';

/**
 * The one dropdown — Chakra's `Select`, not the browser's native one, so the
 * list looks the same on every OS and matches the rest of the admin.
 *
 * It takes the `<option>` / `<optgroup>` children a native select would
 * (read into the collection `Select` needs), or `items`, and reports the new
 * value as a plain string — a native select converts in a line:
 *
 *   <NativeSelect.Field value={v} onChange={e => set(e.target.value)}>…
 *   <Dropdown value={v} onChange={set}>…
 *
 * An option with `value=''` is a real choice ("From the data type", "Any"),
 * shown as the current value when selected; with no such option, an empty
 * value shows `placeholder`.
 *
 * `searchable` puts a search box at the top of the list: typing narrows it
 * (by label or value), arrows and Enter still pick. Long lists get it by
 * default — over SEARCH_FROM items — so nobody scrolls through 30 models.
 *
 * The list is portalled so a Panel's `overflow: hidden` can't clip it — to
 * the body, or, inside a Dialog, to the dialog itself: portalled outside it,
 * the dialog's focus trap would keep the keyboard out of the list.
 */

export type DropdownItem = { value: string; label: ReactNode; disabled?: boolean; group?: string };

export type DropdownProps = Omit<Select.RootProps, 'collection' | 'value' | 'onValueChange' | 'onChange' | 'children'> & {
	value: string | number | null | undefined;
	onChange: (value: string) => void;
	children?: ReactNode;
	items?: DropdownItem[];
	placeholder?: string;
	portalled?: boolean;
	/** Just the chevron — for a preset picker beside an input that already shows the value. */
	hideValue?: boolean;
	/** A search box at the top of the list. Default: on when there are more than SEARCH_FROM items. */
	searchable?: boolean;
};

const SEARCH_FROM = 10;

/** The text of a label, for matching a search. */
const plainText = (label: ReactNode): string =>
	typeof label === 'string' || typeof label === 'number'
		? String(label)
		: Array.isArray(label)
		? label.map(plainText).join('')
		: isValidElement(label)
		? plainText((label as ReactElement<any>).props.children)
		: '';

/** `{n} lines` is ['5', ' lines'] — join plain text so the closed trigger can show it. */
const textOf = (label: ReactNode): ReactNode =>
	Array.isArray(label) && label.every(x => typeof x === 'string' || typeof x === 'number') ? label.join('') : label;

const itemsFrom = (children: ReactNode, group?: string): DropdownItem[] => {
	const out: DropdownItem[] = [];
	Children.forEach(children, child => {
		if (!isValidElement(child)) return;
		const el = child as ReactElement<any>;
		if (el.type === 'optgroup') return out.push(...itemsFrom(el.props.children, el.props.label));
		if (el.type !== 'option') return out.push(...itemsFrom(el.props.children, group)); // fragments
		out.push({
			value: String(el.props.value ?? (typeof el.props.children === 'string' ? el.props.children : '')),
			label: textOf(el.props.children),
			disabled: !!el.props.disabled,
			group,
		});
	});
	return out;
};

const signature = (items: DropdownItem[]) =>
	items.map(i => `${i.group || ''}\u0001${i.value}\u0001${typeof i.label === 'string' ? i.label : ''}\u0001${i.disabled ? 1 : 0}`).join('\u0002');

const Dropdown = ({
	value,
	onChange,
	children,
	items: given,
	placeholder = 'Select…',
	portalled = true,
	hideValue,
	searchable,
	size = 'sm',
	...props
}: DropdownProps) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const idBase = useId().replace(/[^a-zA-Z0-9]/g, '');
	const dialogRef = useRef<HTMLElement | null>(null);
	const [inDialog, setInDialog] = useState(false);
	useEffect(() => {
		dialogRef.current = rootRef.current?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') || null;
		setInDialog(!!dialogRef.current);
	}, []);

	const read = given || itemsFrom(children);
	// Children are new objects every render; keying on their content keeps the
	// collection stable, which Select's state machine needs (a new collection
	// each render is an external change it keeps reacting to).
	const key = signature(read);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const items = useMemo(() => read, [key]);
	const withSearch = searchable ?? items.length > SEARCH_FROM;
	const [query, setQuery] = useState('');
	const [open, setOpen] = useState(false);
	const [highlight, setHighlight] = useState<string | null>(null);
	const searchRef = useRef<HTMLInputElement>(null);
	const shown = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!withSearch || !q) return items;
		return items.filter(i => plainText(i.label).toLowerCase().includes(q) || i.value.toLowerCase().includes(q) || (i.group || '').toLowerCase().includes(q));
	}, [items, query, withSearch]);
	const collection = useMemo(() => createListCollection({ items: shown }), [shown]);
	const pickable = shown.filter(i => !i.disabled);

	/**
	 * Keys typed in the search box. The list only reacts to keys pressed on
	 * itself, so the box moves the highlight (arrows) and picks (Enter) here;
	 * everything else is typing, kept from the list's own typeahead.
	 */
	const searchKeys = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			e.stopPropagation();
			if (!pickable.length) return;
			const at = pickable.findIndex(i => i.value === highlight);
			const next = e.key === 'ArrowDown' ? (at + 1) % pickable.length : at <= 0 ? pickable.length - 1 : at - 1;
			setHighlight(pickable[next].value);
			document.querySelector(`[data-dd="${CSS.escape(`${idBase}-${pickable[next].value}`)}"]`)?.scrollIntoView({ block: 'nearest' });
		} else if (e.key === 'Enter') {
			e.preventDefault();
			e.stopPropagation();
			const pick = pickable.find(i => i.value === highlight) || (pickable.length === 1 ? pickable[0] : null);
			if (pick) {
				onChange(pick.value);
				setOpen(false);
			}
		} else if (e.key !== 'Escape' && e.key !== 'Tab') e.stopPropagation();
	};

	const current = value === null || value === undefined ? '' : String(value);
	const selected = useMemo(() => (items.some(i => i.value === current) ? [current] : []), [items, current]);
	// Named from the full list: while a search hides the picked item, the trigger still shows it.
	const selectedLabel = items.find(i => i.value === current)?.label;

	const groups = useMemo(() => {
		const map = new Map<string, DropdownItem[]>();
		shown.forEach(i => map.set(i.group || '', [...(map.get(i.group || '') || []), i]));
		return [...map.entries()];
	}, [shown]);

	const content = (
		<Select.Positioner>
			<Select.Content
				maxH='300px'
				overflowY='auto'>
				{withSearch && (
					<Box
						position='sticky'
						top={0}
						zIndex={1}
						bg='bg.panel'
						pb={1}
						mb={1}
						borderBottomWidth='1px'
						borderColor='border.muted'>
						<Box
							position='absolute'
							zIndex={1}
							left={2}
							top='50%'
							transform='translateY(calc(-50% - 2px))'
							color='fg.muted'
							pointerEvents='none'>
							<Search size={13} />
						</Box>
						<Input
							ref={searchRef}
							size='xs'
							ps={7}
							placeholder='Search…'
							value={query}
							onChange={e => {
								setQuery(e.target.value);
								setHighlight(null);
							}}
							onKeyDown={searchKeys}
						/>
					</Box>
				)}
				{!shown.length && (
					<Text
						px={2}
						py={1.5}
						fontSize='12.5px'
						color='fg.muted'>
						No matches
					</Text>
				)}
				{groups.map(([group, list]) => {
					const rows = list.map(item => (
						<Select.Item
							key={item.value}
							data-dd={`${idBase}-${item.value}`}
							item={item}>
							<Select.ItemText>{item.label}</Select.ItemText>
							<Select.ItemIndicator />
						</Select.Item>
					));
					return group ? (
						<Select.ItemGroup key={group}>
							<Select.ItemGroupLabel>{group}</Select.ItemGroupLabel>
							{rows}
						</Select.ItemGroup>
					) : (
						rows
					);
				})}
			</Select.Content>
		</Select.Positioner>
	);

	return (
		<Select.Root
			// The option list is built only while open: a settings row holds
			// several dropdowns, and every closed list kept in the DOM was
			// re-rendered on each change to the page.
			lazyMount
			unmountOnExit
			ref={rootRef}
			collection={collection}
			size={size}
			value={selected}
			onValueChange={d => d.value[0] !== undefined && onChange(d.value[0])}
			positioning={{ sameWidth: false, fitViewport: true }}
			{...props}
			{...(withSearch && {
				open,
				highlightedValue: highlight,
				onHighlightChange: (d: { highlightedValue: string | null }) => setHighlight(d.highlightedValue),
			})}
			onOpenChange={d => {
				// The search starts empty each time, and has the keyboard as the list opens.
				if (withSearch) {
					setOpen(d.open);
					setQuery('');
					setHighlight(null);
					if (d.open) setTimeout(() => searchRef.current?.focus(), 30);
				}
				props.onOpenChange?.(d);
			}}>
			{/* The native twin only matters for a form post, and it writes every
			    option into the page — 2,000+ nodes on a settings page. */}
			{props.name && <Select.HiddenSelect />}
			<Select.Control>
				<Select.Trigger>
					{!hideValue && (
						<Select.ValueText placeholder={placeholder}>{withSearch && selected.length ? textOf(selectedLabel) : undefined}</Select.ValueText>
					)}
				</Select.Trigger>
				<Select.IndicatorGroup>
					<Select.Indicator>
						<ChevronDown size={14} />
					</Select.Indicator>
				</Select.IndicatorGroup>
			</Select.Control>
			{portalled ? <Portal container={inDialog ? (dialogRef as any) : undefined}>{content}</Portal> : content}
		</Select.Root>
	);
};

export default Dropdown;
