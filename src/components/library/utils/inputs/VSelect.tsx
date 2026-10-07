'use client';
import { Children, FC, ReactElement, ReactNode, useMemo } from 'react';
import { createListCollection, Portal, Select } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { FormControl, Icon } from '../..';

type OptionItem = { value: string; label: ReactNode; disabled?: boolean };

type InputContainerProps = any & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string | boolean | number;
	children: ReactNode;
	placeholder?: any;
	defaultDisabled?: boolean;
	defaultEnabled?: boolean;
	name?: string;
	size?: 'sm' | 'md' | 'lg' | 'xs';
	onChange?: (e: { target: { name?: string; value: string } }) => void;
};

// `children` keeps the old `<option>` API so every call site (dynamic form
// descriptors, filters, settings) stays untouched — this just reads the
// option elements into the collection Chakra's Select needs.
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

const VSelect: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	children,
	defaultDisabled,
	defaultEnabled,
	name,
	size = 'sm',
	disabled,
	onChange,
	// FormInput's form-state props — not DOM attributes, so keep them out of `...props`.
	formData: _formData,
	setFormData: _setFormData,
	setChangedData: _setChangedData,
	...props
}) => {
	// `children` is a fresh array of element objects on every parent render
	// (JSX always allocates), so memoizing on it directly would recompute —
	// and hand Select.Root a new `collection` — every render, which the
	// underlying Ark state machine treats as an external change and loops on.
	// Keying the memo off a content signature instead keeps the reference
	// stable across renders where the actual options haven't changed.
	const rawOptions = useMemo(() => {
		const placeholderOption =
			defaultDisabled || defaultEnabled
				? [{ value: '', label: placeholder || `Select an option`, disabled: !!defaultDisabled }]
				: [];
		return [...placeholderOption, ...optionsFromChildren(children)];
	}, [children, defaultDisabled, defaultEnabled, placeholder]);
	const optionsKey = JSON.stringify(rawOptions);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const options = useMemo(() => rawOptions, [optionsKey]);

	const collection = useMemo(() => createListCollection({ items: options }), [options]);
	const selected = useMemo(() => (value || value === 0 ? [String(value)] : []), [value]);

	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}>
			<Select.Root
				lazyMount
				collection={collection}
				size={size}
				value={selected}
				disabled={disabled}
				onValueChange={details => {
					onChange?.({ target: { name, value: details.value[0] ?? '' } });
				}}
				{...props}>
				<Select.HiddenSelect name={name} />
				<Select.Control>
					<Select.Trigger>
						<Select.ValueText placeholder={placeholder || `Select an option`} />
					</Select.Trigger>
					<Select.IndicatorGroup>
						<Select.ClearTrigger>
							<MdClose size={16} />
						</Select.ClearTrigger>
						<Select.Indicator>
							<Icon name='select' />
						</Select.Indicator>
					</Select.IndicatorGroup>
				</Select.Control>
				<Portal>
					<Select.Positioner>
						<Select.Content>
							{options.map(option => (
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
		</FormControl>
	);
};

export default VSelect;
