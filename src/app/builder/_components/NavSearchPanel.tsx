'use client';

import { FC } from 'react';
import { Button, Flex, Text } from '@chakra-ui/react';
import { Check, Search } from 'lucide-react';
import { Panel } from '@/components/library/cl';
import { ToneTitle } from './areas';
import { DocLink, FieldLabel, Toggle } from './ui';
import { SettingsField } from './SettingsEditor';

/**
 * The navbar search (WO-54): whether this page's records turn up in the
 * search at the top of every page, and by which of its searchable fields.
 * Kept in the page config as `route.search = { enabled, fields? }` — off
 * unless turned on; no `fields` means every Searchable field. Takes effect
 * once published. The server only shows records the searcher could list.
 */

type Value = { enabled?: boolean; fields?: string[] };

const labelOf = (f: SettingsField) => f.schema?.label || f.title || f.key;

const NavSearchPanel: FC<{
	value?: Value;
	/** The page's fields as they're being edited: the Searchable ones are offered. */
	fields: SettingsField[];
	disabled?: boolean;
	onChange: (search: Value) => void;
}> = ({ value, fields, disabled, onChange }) => {
	const enabled = value?.enabled === true;
	const searchable = fields.filter(f => f.search && !f.exclude);
	const keys = searchable.map(f => f.key);
	// Only fields still searchable count; none picked means all of them.
	const picked = (value?.fields || []).filter(k => keys.includes(k));
	const isOn = (key: string) => !picked.length || picked.includes(key);

	const toggleField = (key: string) => {
		const current = picked.length ? picked : keys;
		const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
		// Every field again is the same as none picked; at least one stays.
		if (!next.length) return;
		onChange({ ...value, enabled, fields: next.length === keys.length ? undefined : keys.filter(k => next.includes(k)) });
	};

	return (
		<Panel
			id='navbar-search'
			title={
				<ToneTitle
					icon={Search}
					palette='blue'>
					Navbar search
				</ToneTitle>
			}
			subtitle='Find this page’s records from the search at the top of every page (⌘K). People only see the records they could see in the table. Takes effect once published.'
			actions={<DocLink section='navbar-search' />}>
			<Flex
				direction='column'
				gap={4}>
				{disabled ? (
					<Text
						fontSize='sm'
						color='fg.muted'>
						This page has no table config, so the search has no page of records to open.
					</Text>
				) : (
					<Toggle
						label='Show in search'
						hint='Its records are listed under the page’s name, by their name (or record number), and open the record’s page.'
						checked={enabled}
						onChange={v => onChange({ ...value, enabled: v })}
					/>
				)}
				{enabled && !disabled && (
					<div>
						<FieldLabel>Search by</FieldLabel>
						{searchable.length ? (
							<Flex
								gap={1.5}
								wrap='wrap'>
								{searchable.map(f => {
									const on = isOn(f.key);
									return (
										<Button
											key={f.key}
											size='xs'
											variant={on ? 'subtle' : 'outline'}
											colorPalette={on ? 'blue' : 'gray'}
											aria-pressed={on}
											onClick={() => toggleField(f.key)}>
											{on && <Check size={12} />}
											{labelOf(f)}
										</Button>
									);
								})}
							</Flex>
						) : (
							<Text
								fontSize='sm'
								color='fg.muted'>
								No field is Searchable yet — turn on Searchable for a field in the list above (a name, an email…).
							</Text>
						)}
						{searchable.length > 0 && (
							<Text
								fontSize='xs'
								color='fg.muted'
								mt={1.5}>
								The page’s Searchable fields. Click one to leave it out.
							</Text>
						)}
					</div>
				)}
			</Flex>
		</Panel>
	);
};

export default NavSearchPanel;
