'use client';
import { FC, useEffect, useMemo, useRef } from 'react';
import { Box, Grid, Input, InputProps, Spinner, Text } from '@chakra-ui/react';
import { FormControl, styles } from '../..';
import { useGetQuery } from '../../store/services/commonApi';

/**
 * Key-value pairs (backend docs/key-values): a product's specifications. Its groups — records of the
 * project's Key values model — are shown always (`kv.fixed`) and/or by the value of another field of the
 * form (`kv.from`: a category picked, a choice made). The backend answers with the groups for that value
 * (GET /<route>/get/keyvalue/<field>?value=<v>): each a section, its name the heading, its description
 * under it, its keys the rows. The value is [{ group, title, description, items: [{ key, value }] }].
 *
 * Values typed for keys the pick no longer has are kept in memory, so switching the category back
 * before saving brings them back; only the current sections are sent.
 */

export type KvSection = { group?: string; title: string; description?: string; items: { key: string; value: string }[] };
type Group = { _id: string; title: string; description: string; keys: string[] };

type Props = {
	name: string;
	label?: string;
	value?: any;
	/** Called the way the form's other inputs call it: { target: { name, value } }. */
	onChange: (e: { target: { name: string; value: KvSection[] } }) => void;
	isRequired?: boolean;
	helper?: string;
	kv?: { route?: string; from?: string; via?: string; fixed?: boolean };
	formData?: any;
	isDisabled?: boolean;
	fromLabel?: string;
};

/** What the deciding field holds: a picked record (or its id), a choice, yes/no — or a list of them. */
const valuesOf = (v: any): string[] =>
	(Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v])
		.map((x: any) => (x && typeof x === 'object' ? x._id : typeof x === 'boolean' || typeof x === 'number' ? String(x) : x))
		.filter((x: any) => typeof x === 'string' && x.trim())
		.map((x: string) => x.trim());

const sectionsOf = (v: any): KvSection[] => (Array.isArray(v) ? v.filter(s => s && typeof s === 'object' && Array.isArray(s.items)) : []);

const lc = (s: string) => String(s || '').trim().toLowerCase();

const VKeyValue: FC<Props> = ({ name, label, value, onChange: emit, isRequired, helper, kv, formData, isDisabled, fromLabel }) => {
	const onChange = (next: KvSection[]) => emit({ target: { name, value: next } });
	const picked = kv?.from ? valuesOf(formData?.[kv.from]) : [];
	// What the groups depend on now; with groups always shown there's something to ask even with nothing picked.
	const ref = picked.map(encodeURIComponent).join(',') || (kv?.fixed ? '-' : '');
	const path = kv?.route && name ? `${kv.route}/get/keyvalue/${name}?value=${ref === '-' ? '' : ref}` : '';
	const { data, isFetching, isError } = useGetQuery({ path }, { skip: !path || !ref });
	const groups: Group[] = ref && Array.isArray(data?.groups) ? data.groups : [];

	// Every value typed so far, by group + key and by key alone (a key that moved to another group keeps its value).
	const memory = useRef<{ byGroup: Map<string, string>; byKey: Map<string, string> }>({ byGroup: new Map(), byKey: new Map() });
	const saved = sectionsOf(value);
	for (const s of saved)
		for (const i of s.items) {
			if (s.group) memory.current.byGroup.set(`${s.group}:${lc(i.key)}`, i.value);
			memory.current.byKey.set(lc(i.key), i.value);
		}

	const valueOf = (g: Group, key: string) => memory.current.byGroup.get(`${g._id}:${lc(key)}`) ?? memory.current.byKey.get(lc(key)) ?? '';

	/** The sections to send: the current groups, their filled keys. */
	const build = (groupsNow: Group[]): KvSection[] =>
		groupsNow
			.map(g => ({
				group: g._id,
				title: g.title,
				...(g.description && { description: g.description }),
				items: g.keys.map(key => ({ key, value: valueOf(g, key) })).filter(i => String(i.value).trim()),
			}))
			.filter(s => s.items.length);

	// When the pick's groups arrive or change, the value follows them (titles renamed, keys gone, values carried over).
	const sig = useMemo(() => JSON.stringify(groups.map(g => [g._id, g.title, g.description, g.keys])), [groups]);
	const lastSig = useRef<string>('');
	useEffect(() => {
		if (isFetching || isError || !ref || !data) return;
		if (lastSig.current === `${ref}|${sig}`) return;
		const first = !lastSig.current;
		lastSig.current = `${ref}|${sig}`;
		const next = build(groups);
		// Opening a saved record changes nothing unless its sections really differ from what the category gives now.
		if (JSON.stringify(next) !== JSON.stringify(saved) && !(first && !next.length && !saved.length)) onChange(next);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sig, ref, isFetching, isError, data]);

	const set = (g: Group, key: string, v: string) => {
		memory.current.byGroup.set(`${g._id}:${lc(key)}`, v);
		memory.current.byKey.set(lc(key), v);
		onChange(build(groups));
	};

	const note = (text: string) => (
		<Text
			fontSize='13px'
			color='fg.muted'
			py={1}>
			{text}
		</Text>
	);

	return (
		<FormControl
			isRequired={isRequired}
			label={label || 'Specifications'}
			helper={helper}>
			{!kv?.from && !kv?.fixed ? (
				note('This field doesn’t say which groups it shows yet — set it in the model builder.')
			) : !ref ? (
				note(`Fill in ${fromLabel || kv?.from} first — its groups show here as sections.`)
			) : isFetching && !groups.length ? (
				<Spinner size='sm' />
			) : isError ? (
				note('Couldn’t load the groups for this field.')
			) : !groups.length ? (
				note(kv?.from ? `Nothing to fill in for this ${fromLabel || kv.from} yet.` : 'No groups to fill in yet.')
			) : (
				<Box
					display='flex'
					flexDirection='column'
					gap={4}
					w='full'>
					{groups.map(g => (
						<Box
							key={g._id}
							borderWidth='1px'
							borderColor='border.muted'
							borderRadius='lg'
							p={4}>
							<Text
								fontSize='14px'
								fontWeight='600'>
								{g.title}
							</Text>
							{g.description && (
								<Text
									fontSize='12.5px'
									color='fg.muted'
									mt={0.5}>
									{g.description}
								</Text>
							)}
							{g.keys.length ? (
								<Grid
									mt={3}
									gridTemplateColumns={{ base: '1fr', md: 'minmax(120px, 1fr) 2fr' }}
									columnGap={4}
									rowGap={{ base: 1, md: 2.5 }}
									alignItems='center'>
									{g.keys.map(key => (
										<KeyRow
											key={key}
											k={key}
											id={`${name}-${g._id}-${key}`}
											value={valueOf(g, key)}
											isDisabled={isDisabled}
											onChange={v => set(g, key, v)}
										/>
									))}
								</Grid>
							) : (
								<Text
									fontSize='12.5px'
									color='fg.muted'
									mt={2}>
									No keys in this group yet.
								</Text>
							)}
						</Box>
					))}
				</Box>
			)}
		</FormControl>
	);
};

const KeyRow: FC<{ k: string; id: string; value: string; isDisabled?: boolean; onChange: (v: string) => void }> = ({ k, id, value, isDisabled, onChange }) => (
	<>
		<Text
			asChild
			fontSize='13px'
			color='fg.muted'
			mt={{ base: 2, md: 0 }}>
			<label htmlFor={id}>{k}</label>
		</Text>
		<Input
			id={id}
			size='sm'
			{...(styles.FIELD as InputProps)}
			placeholder={k}
			value={value}
			disabled={isDisabled}
			onKeyDown={e => {
				// Enter inside a row doesn't submit the whole form.
				if (e.key === 'Enter') e.preventDefault();
			}}
			onChange={e => onChange(e.target.value)}
		/>
	</>
);

export default VKeyValue;
