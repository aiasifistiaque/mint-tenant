'use client';
import { Children, FC, ReactElement, ReactNode, useMemo } from 'react';
import { createListCollection, Portal, Select } from '@chakra-ui/react';
import { Icon } from '../../..';
import { radius } from '../../../config';
import { FILTER_CONTROL_HEIGHT } from './FilterInput';

type OptionItem = { value: string; label: ReactNode; disabled?: boolean };

type FilterSelectProps = any & {
	children: ReactNode;
	value?: string;
	onChange?: (e: { target: { name?: string; value: string } }) => void;
};

// Same `<option>`-children API as the native select it replaces — every
// filter (Boolean, Date, Range, Select, InTheLast) keeps working unchanged —
// but rendered as the same popover Select used elsewhere now, instead of the
// OS-native dropdown.
const optionsFromChildren = (children: ReactNode): OptionItem[] => {
	const items: OptionItem[] = [];
	Children.forEach(children, child => {
		const option = child as ReactElement<any>;
		if (!option?.props) return;
		items.push({
			value: String(option.props.value ?? ''),
			label: option.props.children,
			disabled: !!option.props.disabled,
		});
	});
	return items;
};

const FilterSelect: FC<FilterSelectProps> = ({ children, value, name, onChange, disabled, ...props }) => {
	const rawOptions = useMemo(() => optionsFromChildren(children), [children]);
	// `children` is fresh JSX every render — key the memo off a content
	// signature instead, or Select.Root gets a new `collection` each render
	// and the underlying state machine loops (see VSelect.tsx for the story).
	const optionsKey = JSON.stringify(rawOptions);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const options = useMemo(() => rawOptions, [optionsKey]);

	const collection = useMemo(() => createListCollection({ items: options }), [options]);
	const selected = useMemo(() => (value || value === '0' ? [String(value)] : []), [value]);
	// Callers pass their own disabled `<option value=''>Select an option</option>`
	// as a placeholder item rather than a `placeholder` prop — a native select
	// shows that option's own text when nothing else is selected, so mirror it.
	const placeholderOption = options.find(option => option.value === '');

	return (
		<Select.Root
			lazyMount
			collection={collection}
			size='sm'
			w='full'
			disabled={disabled}
			value={selected}
			onValueChange={details => {
				onChange?.({ target: { name, value: details.value[0] ?? '' } });
			}}
			{...props}>
			<Select.HiddenSelect name={name} />
			<Select.Control>
				<Select.Trigger
					boxShadow='none'
					// `minH` too: the select recipe's own min-height (36px at size
					// sm) otherwise wins over `h`, leaving it 4px taller than a
					// `FilterInput` beside it.
					h={FILTER_CONTROL_HEIGHT}
					minH={FILTER_CONTROL_HEIGHT}
					fontSize='13px'
					px={2.5}
					borderRadius={radius.INPUT}
					cursor='pointer'>
					<Select.ValueText
						fontSize='13px'
						placeholder={placeholderOption?.label as any}
					/>
				</Select.Trigger>
				<Select.IndicatorGroup>
					<Select.Indicator color='fg.muted'>
						<Icon name='select' />
					</Select.Indicator>
				</Select.IndicatorGroup>
			</Select.Control>
			<Portal>
				<Select.Positioner>
					<Select.Content>
						{/* The placeholder option only labels the empty trigger; listing it
						    too just adds a dead, greyed-out row. */}
						{options
							// Only a disabled one: an enabled `value=''` option is a real
							// choice (e.g. "All") and must stay pickable.
							.filter(option => !(option === placeholderOption && option.disabled))
							.map(option => (
								<Select.Item
									item={option}
									key={option.value}>
									<Select.ItemText>{option.label}</Select.ItemText>
									<Select.ItemIndicator />
								</Select.Item>
							))}
					</Select.Content>
				</Select.Positioner>
			</Portal>
		</Select.Root>
	);
};

export default FilterSelect;
