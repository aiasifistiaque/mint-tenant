'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Box, CloseButton, Combobox, Flex, Portal, Text, createListCollection } from '@chakra-ui/react';
import { useGetAllQuery, useGetByIdQuery } from '@/components/library/store/services/commonApi';
import { mainRoute, useLinkModels } from './useLinkModels';

/**
 * A condition's value when the field links to another model: pick the record
 * by its name instead of typing its id. Searches the linked route as you type
 * (its own search fields), shows the picked record's name, stores its id —
 * what lock conditions, tab conditions and form rules compare against.
 *
 * `model` is the linked model's name (a model field's `ref`); `route` its
 * route when known already (a settings field's `schema.model`).
 */

type Props = {
	model?: string;
	route?: string;
	value?: string | string[];
	onChange: (v: string | string[] | undefined) => void;
	/** Several records ("is one of"): picked ones show as chips. */
	multiple?: boolean;
	w?: string;
	disabled?: boolean;
};

const nameOf = (doc: any, display?: string) =>
	String((display && doc?.[display]) || doc?.name || doc?.title || doc?.label || doc?.code || doc?._id || '');

/** One picked record, by name — looked up by id when it isn't in the list on screen. */
const Chip: FC<{ route: string; id: string; display?: string; known?: string; onRemove: () => void }> = ({
	route,
	id,
	display,
	known,
	onRemove,
}) => {
	const { data } = useGetByIdQuery({ path: route, id }, { skip: !!known || !route || !id });
	return (
		<Badge
			size='sm'
			variant='subtle'
			gap={1}
			pe={0.5}>
			{known || (data ? nameOf(data, display) : '…')}
			<CloseButton
				size='2xs'
				aria-label='Remove'
				onClick={onRemove}
			/>
		</Badge>
	);
};

const RecordPicker: FC<Props> = ({ model, route: given, value, onChange, multiple, w = '220px', disabled }) => {
	const { models } = useLinkModels();
	const linked = models.find(m => (given ? m.routes.includes(given) : m.name === model));
	const route = given || (linked ? mainRoute(linked) : '');
	const display = linked?.display;

	// null while not searching: the input then shows the picked record's name.
	const [search, setSearch] = useState<string | null>(null);
	const [query, setQuery] = useState('');
	useEffect(() => {
		const t = setTimeout(() => setQuery(search ?? ''), 250);
		return () => clearTimeout(t);
	}, [search]);

	const { data, isFetching } = useGetAllQuery({ path: route, search: query, limit: 20 }, { skip: !route });
	const docs: any[] = data?.doc || [];
	const ids: string[] = Array.isArray(value) ? value : value ? [String(value)] : [];
	const single = !multiple ? ids[0] : undefined;
	const { data: picked } = useGetByIdQuery(
		{ path: route, id: single },
		{ skip: !route || !single || docs.some(d => String(d._id) === single) }
	);
	const singleName = single ? nameOf(docs.find(d => String(d._id) === single) || picked, display) || single : '';
	const known = useRef(new Map<string, string>());
	for (const d of docs) known.current.set(String(d._id), nameOf(d, display));

	const shown = multiple ? docs.filter(d => !ids.includes(String(d._id))) : docs;
	const collection = useMemo(
		() => createListCollection({ items: shown, itemToValue: (d: any) => String(d._id), itemToString: (d: any) => nameOf(d, display) }),
		[shown, display]
	);
	const picking = useRef(false);

	if (!route)
		return (
			<Text
				fontSize='xs'
				color='fg.muted'
				w={w}>
				{model ? `${model.replace(/^T[0-9a-f]{24}_/, '')} has no page to pick from` : 'Linked records'}
			</Text>
		);

	return (
		<Flex
			direction='column'
			gap={1}
			w={w}>
			<Combobox.Root
				collection={collection}
				size='xs'
				disabled={disabled}
				value={multiple ? [] : single ? [single] : []}
				openOnClick
				inputBehavior='autohighlight'
				positioning={{ sameWidth: true }}
				inputValue={search ?? (multiple ? '' : singleName)}
				onInputValueChange={d => {
					if (picking.current) picking.current = false;
					else setSearch(d.inputValue);
				}}
				onOpenChange={d => !d.open && setSearch(null)}
				onValueChange={d => {
					const id = d.value[0];
					picking.current = true;
					setSearch(null);
					if (!id) return;
					if (multiple) onChange([...ids, id]);
					else onChange(id);
				}}>
				<Combobox.Control>
					<Combobox.Input
						placeholder={multiple ? 'Add a record by name' : 'Search by name'}
						autoComplete='off'
					/>
					<Combobox.IndicatorGroup>
						<Combobox.Trigger />
					</Combobox.IndicatorGroup>
				</Combobox.Control>
				<Portal>
					<Combobox.Positioner>
						<Combobox.Content maxH='260px'>
							<Combobox.Empty>{isFetching ? 'Searching…' : 'No record matches'}</Combobox.Empty>
							{shown.map(d => (
								<Combobox.Item
									item={d}
									key={String(d._id)}>
									<Box
										flex='1'
										minW={0}>
										<Text
											fontSize='13px'
											truncate>
											{nameOf(d, display)}
										</Text>
										{d.code && nameOf(d, display) !== String(d.code) && (
											<Text
												fontSize='11px'
												color='fg.muted'
												truncate>
												{d.code}
											</Text>
										)}
									</Box>
									<Combobox.ItemIndicator />
								</Combobox.Item>
							))}
						</Combobox.Content>
					</Combobox.Positioner>
				</Portal>
			</Combobox.Root>
			{multiple && ids.length > 0 && (
				<Flex
					gap={1}
					flexWrap='wrap'>
					{ids.map(id => (
						<Chip
							key={id}
							route={route}
							id={id}
							display={display}
							known={known.current.get(id)}
							onRemove={() => {
								const next = ids.filter(x => x !== id);
								onChange(next.length ? next : undefined);
							}}
						/>
					))}
				</Flex>
			)}
		</Flex>
	);
};

export default RecordPicker;
