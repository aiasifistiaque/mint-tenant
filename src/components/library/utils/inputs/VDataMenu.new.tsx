'use client';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Combobox, createListCollection, Flex, Portal } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { CreateModal, FormControl, Icon, useGetAllQuery } from '../..';
import { VDataMenuProps } from './VDataMenu/types';
import { humanizeKey, optionPrefill, optionQuery } from '../../functions/optionFilters';
import QuickAdd from './QuickAdd';

const EMPTY: any[] = [];

// Same field/list surface as VSelect (label, helper, value/name/onChange with
// a native `e.target.value` shape) but backed by a server-fetched, searchable
// list instead of static `<option>` children — Chakra's Combobox, not Select,
// since the trigger itself needs to double as the search input.
const VDataMenu: FC<VDataMenuProps> = ({
	label,
	item,
	isRequired,
	placeholder,
	value,
	helper,
	model,
	dataModel,
	field,
	type = 'value',
	dataKey = '_id',
	menuKey = 'name',
	menuAddOnKey,
	unselect = true,
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
	const [open, setOpen] = useState(false);

	// Which records are offered (schema.optionFilters): a query on the linked
	// model, some of it read from this form — a project picker narrowed to the
	// client picked above. `waitingFor` is a field that must be filled first.
	const { params, waitingFor } = optionQuery(item?.optionFilters, formData);
	// After a pick the input shows the record's name, which arrives here as a
	// search — it isn't one: the list stays whole and a stale choice can clear.
	const pickedLabel = useRef('');
	const typed = search && search !== pickedLabel.current ? search : '';
	const { data, currentData, isFetching } = useGetAllQuery(
		{ path: model, limit: '999', sort: 'name', search: typed, filters: params },
		{ skip: !model || !!waitingFor }
	);
	const docs: any[] = (!waitingFor && data?.doc) || EMPTY;
	const current = value && typeof value === 'object' ? value?.[dataKey] : value;

	// When what's offered changes because the form changed (another client
	// picked), a choice that no longer fits is cleared — once the new list is in.
	const offerKey = JSON.stringify(params) + (waitingFor || '');
	const lastOfferKey = useRef(offerKey);
	useEffect(() => {
		if (offerKey === lastOfferKey.current || typed) return;
		if (!waitingFor && (isFetching || !currentData)) return;
		lastOfferKey.current = offerKey;
		const list: any[] = waitingFor ? [] : currentData?.doc || [];
		if (current && !list.some((d: any) => String(d?.[dataKey]) === String(current))) handleUnselect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [offerKey, isFetching, currentData, typed]);

	// RTK Query keeps `data` referentially stable across renders when the
	// cache entry hasn't changed, so keying off `docs` directly (rather than a
	// stringified signature) is safe here — unlike VSelect's `children`, which
	// are fresh JSX elements every render.
	const collection = useMemo(
		() =>
			createListCollection({
				items: docs,
				itemToValue: (doc: any) => String(doc?.[dataKey]),
				itemToString: (doc: any) => String(doc?.[menuKey] ?? ''),
			}),
		[docs, dataKey, menuKey]
	);

	const selectedItem = docs.find((doc: any) => String(doc?.[dataKey]) === String(current));
	if (selectedItem) pickedLabel.current = String(selectedItem?.[menuKey] ?? '');
	const selected = useMemo(() => (current ? [String(current)] : []), [current]);

	const emitSelection = (doc: any) => {
		pickedLabel.current = String(doc?.[menuKey] ?? '');
		onChange?.({ target: { name, value: type === 'object' ? doc : doc?.[dataKey] } });
		setSearch('');
	};

	const handleUnselect = () => emitSelection({ name: '', _id: undefined });

	const closeAnd = (fn: () => void) => () => {
		fn();
		setOpen(false);
	};

	const btnRef = useRef<any>(null);

	const rowCss = {
		borderRadius: 'l1',
		fontSize: '13px',
		fontWeight: '500',
		px: '2',
		py: '1.5',
		cursor: 'pointer',
		_hover: { bg: 'bg.emphasized/60' },
	};

	return (
		<Flex
			w='full'
			direction='column'>
			{dataModel && (
				<CreateModal
					data={dataModel}
					path={model}
					trigger={
						<Button
							display='none'
							ref={btnRef}>
							Add new {model}
						</Button>
					}
					type='post'
				/>
			)}
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
							value={selected}
							open={open}
							openOnClick
							positioning={{ sameWidth: true }}
							onOpenChange={details => setOpen(details.open)}
							onInputValueChange={details => setSearch(details.inputValue)}
							onValueChange={details => {
								if (!details.value.length) {
									handleUnselect();
									return;
								}
								const doc = docs.find((d: any) => String(d?.[dataKey]) === details.value[0]);
								if (doc) emitSelection(doc);
							}}
							{...props}>
							<Combobox.Control>
								<Combobox.Input placeholder={placeholder || `Select ${label}`} />
								<Combobox.IndicatorGroup>
									{unselect && selectedItem && (
										<Combobox.ClearTrigger>
											<MdClose size={16} />
										</Combobox.ClearTrigger>
									)}
									<Combobox.Trigger>
										<Icon name='select' />
									</Combobox.Trigger>
								</Combobox.IndicatorGroup>
							</Combobox.Control>
							<Portal>
								<Combobox.Positioner>
									<Combobox.Content>
										{dataModel && (
											<Box
												{...rowCss}
												onClick={closeAnd(() => btnRef.current?.click())}>
												Add new {model}
											</Box>
										)}
										<Combobox.Empty>
											{waitingFor ? `Pick ${humanizeKey(waitingFor).toLowerCase()} first` : 'No results'}
										</Combobox.Empty>
										{docs.map((doc: any) => (
											<Combobox.Item
												item={doc}
												key={doc?.[dataKey]}>
												<Combobox.ItemText>
													{doc?.[menuKey]} {menuAddOnKey && `(${doc?.[menuAddOnKey]})`}
												</Combobox.ItemText>
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
							onCreated={emitSelection}
						/>
					)}
				</Flex>
			</FormControl>
		</Flex>
	);
};

export default VDataMenu;
