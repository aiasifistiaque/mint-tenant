'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Combobox, Flex, Image, Portal, Text, createListCollection } from '@chakra-ui/react';
import { API_ORIGIN } from '../config/lib/constants/panel';

/**
 * Pick a country (docs/widgets W-02): the platform's countries, searchable by
 * name, native name, code or dial code, each with its flag. An organization's
 * country decides the payment providers it's offered, so sign-up, New
 * organization and organization settings all use this.
 *
 * The list comes from GET /public/countries (no sign-in), fetched once per
 * page load.
 */

export type Country = {
	code: string;
	name: string;
	nativeName: string;
	dialCode: string;
	flag: string;
	flagUrl: string;
	mapUrl: string;
	currency: { code?: string; symbol?: string; name?: string };
	paymentProviders: string[];
};

let cached: Promise<Country[]> | null = null;
const loadCountries = () => {
	cached ||= fetch(`${API_ORIGIN}/public/countries`)
		.then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
		.then(r => (r.doc || []) as Country[])
		.catch(e => {
			cached = null;
			throw e;
		});
	return cached;
};

/** The countries, once loaded (empty until then); `error` when they couldn't be. */
export const useCountries = () => {
	const [countries, setCountries] = useState<Country[]>([]);
	const [error, setError] = useState(false);
	useEffect(() => {
		let live = true;
		loadCountries().then(
			list => live && setCountries(list),
			() => live && setError(true)
		);
		return () => {
			live = false;
		};
	}, []);
	return { countries, error, loading: !countries.length && !error };
};

const Flag: FC<{ c: Country; size?: number }> = ({ c, size = 20 }) => (
	<Image
		src={c.flagUrl}
		alt=''
		w={`${size}px`}
		h={`${Math.round(size * 0.75)}px`}
		objectFit='cover'
		borderRadius='2px'
		flexShrink={0}
		boxShadow='0 0 0 1px rgba(0,0,0,0.08)'
	/>
);

const matches = (c: Country, q: string) => {
	const s = q.trim().toLowerCase().replace(/^\+/, '');
	if (!s) return true;
	return (
		c.name.toLowerCase().includes(s) ||
		c.nativeName.toLowerCase().includes(s) ||
		c.code.toLowerCase() === s ||
		c.dialCode.replace('+', '').startsWith(s)
	);
};

type Props = {
	/** The country's code (BD), or ''. */
	value: string;
	onChange: (code: string, country: Country | null) => void;
	placeholder?: string;
	size?: 'sm' | 'md';
	disabled?: boolean;
	invalid?: boolean;
};

const CountrySelect: FC<Props> = ({ value, onChange, placeholder = 'Search for your country', size = 'md', disabled, invalid }) => {
	const { countries, error } = useCountries();
	// null while not searching: the input then shows the chosen country's name, however it was set.
	const [search, setSearch] = useState<string | null>(null);
	const selected = countries.find(c => c.code === value) || null;
	const typed = search ?? '';
	const shown = useMemo(() => countries.filter(c => matches(c, typed)), [countries, typed]);
	const collection = useMemo(() => createListCollection({ items: shown, itemToValue: c => c.code, itemToString: c => c.name }), [shown]);
	// A pick writes the country's name into the input too — that's not a search.
	const picking = useRef(false);
	const showFlag = !!selected && search === null;

	return (
		<Box w='full'>
			<Combobox.Root
				collection={collection}
				size={size}
				disabled={disabled}
				invalid={invalid}
				value={value ? [value] : []}
				openOnClick
				inputBehavior='autohighlight'
				positioning={{ sameWidth: true }}
				inputValue={search ?? selected?.name ?? ''}
				onInputValueChange={d => {
					if (picking.current) picking.current = false;
					else setSearch(d.inputValue);
				}}
				onOpenChange={d => !d.open && setSearch(null)}
				onValueChange={d => {
					const c = countries.find(x => x.code === d.value[0]) || null;
					picking.current = true;
					setSearch(null);
					onChange(c?.code || '', c);
				}}>
				<Combobox.Control>
					{showFlag && (
						<Flex
							position='absolute'
							left='10px'
							top='0'
							bottom='0'
							align='center'
							pointerEvents='none'
							zIndex={1}>
							<Flag c={selected} />
						</Flex>
					)}
					<Combobox.Input
						placeholder={error ? 'Couldn’t load the countries — refresh to try again' : placeholder}
						autoComplete='off'
						ps={showFlag ? '38px' : undefined}
					/>
					<Combobox.IndicatorGroup>
						<Combobox.Trigger />
					</Combobox.IndicatorGroup>
				</Combobox.Control>
				<Portal>
					<Combobox.Positioner>
						<Combobox.Content maxH='280px'>
							<Combobox.Empty>No country matches — more are coming.</Combobox.Empty>
							{shown.map(c => (
								<Combobox.Item
									item={c}
									key={c.code}>
									<Flex
										align='center'
										gap={2.5}
										flex='1'
										minW={0}>
										<Flag c={c} />
										<Text
											fontSize='13px'
											truncate>
											{c.name}
											{c.nativeName && c.nativeName !== c.name && (
												<Text
													as='span'
													color='fg.muted'>
													{' '}
													· {c.nativeName}
												</Text>
											)}
										</Text>
										<Text
											ms='auto'
											fontSize='12px'
											color='fg.muted'
											fontFamily='mono'>
											{c.dialCode}
										</Text>
									</Flex>
									<Combobox.ItemIndicator />
								</Combobox.Item>
							))}
						</Combobox.Content>
					</Combobox.Positioner>
				</Portal>
			</Combobox.Root>
		</Box>
	);
};

export default CountrySelect;
