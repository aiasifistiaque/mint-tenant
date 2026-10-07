'use client';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Combobox, createListCollection, Flex, Portal, Tag, Wrap } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { FormControl, Icon, useGetAllQuery } from '../..';
import { humanizeKey, optionPrefill, optionQuery } from '../../functions/optionFilters';
import QuickAdd from './QuickAdd';

const EMPTY: any[] = [];

type InputContainerProps = any & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string[];
	model: string;
	placeholder?: any;
	item?: any;
	name?: string;
	size?: 'sm' | 'md' | 'lg' | 'xs';
	onChange?: (e: { target: { name?: string; value: string[] } }) => void;
};

// Multi-select sibling of VDataMenu — same Combobox shell, `multiple` turned
// on, and the selected values rendered as removable Tags underneath instead
// of a single value in the trigger. The full (up to 1000-item) list is fetched
// in one shot — narrowed by the field's optionFilters, like VDataMenu's — so
// filtering as the user types happens locally rather than re-querying per key.
const VDataTags: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	model,
	item,
	name,
	size = 'sm',
	disabled,
	onChange,
	// FormInput's form-state props — not DOM attributes, so keep them out of `...props`.
	// formData also feeds the conditions on which records are offered.
	formData,
	setFormData: _setFormData,
	setChangedData: _setChangedData,
	...props
}: any) => {
	const [search, setSearch] = useState('');
	const { params, waitingFor } = optionQuery(item?.optionFilters, formData);
	const { data, currentData, isFetching } = useGetAllQuery(
		{ path: model, limit: '1000', sort: 'name', filters: params },
		{ skip: !model || !!waitingFor }
	);
	const docs: any[] = (!waitingFor && data?.doc) || EMPTY;

	// WO-05: valueKey is what createFormFields emits; valKey kept as a deprecated fallback.
	const valueKey = item?.valueKey || item?.valKey || '_id';
	const labelKey = item?.labelKey || 'name';

	const displayLabel = (doc: any) => {
		const addOn = item?.modelAddOn && doc?.[item.modelAddOn];
		return `${doc?.[labelKey] ?? ''}${addOn ? ` (${addOn})` : ''}`;
	};

	const allCollection = useMemo(
		() =>
			createListCollection({
				items: docs,
				itemToValue: (doc: any) => String(doc?.[valueKey]),
				itemToString: displayLabel,
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[docs, valueKey, labelKey, item?.modelAddOn]
	);

	const collection = useMemo(
		() =>
			search
				? allCollection.filter(itemString => itemString.toLowerCase().includes(search.toLowerCase()))
				: allCollection,
		[allCollection, search]
	);

	const selected = useMemo(() => value || EMPTY, [value]);

	const selectedDocs = useMemo(
		() =>
			selected
				.map((id: string) => docs.find((doc: any) => String(doc?.[valueKey]) === String(id)))
				.filter(Boolean),
		[selected, docs, valueKey]
	);

	const emit = (nextValue: string[]) => onChange?.({ target: { name, value: nextValue } });

	// When what's offered changes because the form changed, choices that no
	// longer fit are dropped — once the new list is in.
	const offerKey = JSON.stringify(params) + (waitingFor || '');
	const lastOfferKey = useRef(offerKey);
	useEffect(() => {
		if (offerKey === lastOfferKey.current) return;
		if (!waitingFor && (isFetching || !currentData)) return;
		lastOfferKey.current = offerKey;
		const list: any[] = waitingFor ? [] : currentData?.doc || [];
		const kept = selected.filter((id: string) => list.some((d: any) => String(d?.[valueKey]) === String(id)));
		if (kept.length !== selected.length) emit(kept);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [offerKey, isFetching, currentData]);

	const removeTag = (id: string) => emit(selected.filter((v: string) => v !== id));

	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}>
			<Flex
				gap={2}
				align='center'
				w='full'>
				<Box
					flex='1'
					minW={0}>
					<Combobox.Root
						lazyMount
						collection={collection}
						size={size}
						disabled={disabled}
						multiple
						value={selected}
						openOnClick
						positioning={{ sameWidth: true }}
						onInputValueChange={details => setSearch(details.inputValue)}
						onValueChange={details => {
							emit(details.value);
							setSearch('');
						}}
						{...props}>
						<Combobox.Control>
							<Combobox.Input placeholder={placeholder || `Select ${label}`} />
							<Combobox.IndicatorGroup>
								<Combobox.Trigger>
									<Icon name='select' />
								</Combobox.Trigger>
							</Combobox.IndicatorGroup>
						</Combobox.Control>
						<Portal>
							<Combobox.Positioner>
								<Combobox.Content>
									<Combobox.Empty>
										{waitingFor ? `Pick ${humanizeKey(waitingFor).toLowerCase()} first` : 'No results'}
									</Combobox.Empty>
									{collection.items.map((doc: any) => (
										<Combobox.Item
											item={doc}
											key={doc?.[valueKey]}>
											<Combobox.ItemText>{displayLabel(doc)}</Combobox.ItemText>
											<Combobox.ItemIndicator />
										</Combobox.Item>
									))}
								</Combobox.Content>
							</Combobox.Positioner>
						</Portal>
					</Combobox.Root>
				</Box>
				{item?.addItem && (
					<QuickAdd
						model={model}
						label={label}
						disabled={disabled}
						prefill={optionPrefill(item?.optionFilters, formData)}
						onCreated={(doc: any) => doc?.[valueKey] && emit([...selected, String(doc[valueKey])])}
					/>
				)}
			</Flex>
			{selectedDocs.length > 0 && (
				<Wrap
					gap={1.5}
					pt={2}>
					{selectedDocs.map((doc: any) => (
						<Tag.Root
							key={doc?.[valueKey]}
							size='sm'
							colorPalette='gray'
							variant='surface'
							borderRadius='l1'
							px={2.5}
							py={1.5}>
							<Tag.Label>{displayLabel(doc)}</Tag.Label>
							{/* The default CloseTrigger icon collapses to 0x0 in this theme
							    (its recipe never sizes the button or an inner _icon selector,
							    unlike startElement/endElement) — sizing the icon explicitly
							    sizes the flex button around it too. */}
							<Tag.CloseTrigger onClick={() => removeTag(String(doc?.[valueKey]))}>
								<MdClose size={12} />
							</Tag.CloseTrigger>
						</Tag.Root>
					))}
				</Wrap>
			)}
		</FormControl>
	);
};

export default VDataTags;
