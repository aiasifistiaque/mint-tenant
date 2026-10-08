'use client';

import { FC, useState } from 'react';
import { Box, Button, Flex, Grid, IconButton, Input, Text } from '@chakra-ui/react';
import { ChevronDown, ChevronRight, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Dropdown, Panel } from '@/components/library/cl';
import { Affix, AffixPart } from '@/components/library/functions/affix';
import { ToneTitle } from './areas';
import { DocLink } from './ui';
import { SettingsField } from './SettingsEditor';

/**
 * Advanced display: what goes around a field's value wherever it's shown.
 * Words before or after it — typed ("BDT") or another field of the same
 * record (its currency) — on the table and the record page, and in the table
 * a second field in small type under it (the email under a name). Stored on
 * the settings field (`schema.affix`, `schema.subtitle`), so every row and
 * record shows it the same; the stored value doesn't change. The same panel
 * sits at the bottom of the Fields & rules and Table tabs.
 */

const ICON = { size: 14, strokeWidth: 1.75 };

type Props = {
	fields: SettingsField[];
	onChange: (fields: SettingsField[]) => void;
	readOnly?: boolean;
};

const labelOf = (f?: SettingsField) => f?.schema?.label || f?.title || f?.key || '';
// Listed once it has an affix (even one still being filled in) or a subtitle.
const dressed = (f: SettingsField) => !!f.schema?.affix || !!f.schema?.subtitle;

type Mode = 'none' | 'text' | 'field';
const modeOf = (p?: AffixPart): Mode => (!p ? 'none' : 'field' in p ? 'field' : 'text');

/** Before or after: nothing, words, or another field. */
const PartEditor: FC<{
	label: string;
	part?: AffixPart;
	others: SettingsField[];
	disabled?: boolean;
	onChange: (p: AffixPart | undefined) => void;
}> = ({ label, part, others, disabled, onChange }) => {
	const mode = modeOf(part);
	return (
		<Box minW={0}>
			<Text
				fontSize='xs'
				fontWeight='600'
				mb={1.5}>
				{label}
			</Text>
			<Flex
				gap={1.5}
				direction='column'>
				<Dropdown
					size='xs'
					value={mode}
					disabled={disabled}
					onChange={(v: string) => onChange(v === 'none' ? undefined : v === 'text' ? { text: '' } : { field: '' })}>
					<option value='none'>Nothing</option>
					<option value='text'>Words I type</option>
					<option value='field'>Another field’s value</option>
				</Dropdown>
				{mode === 'text' && (
					<Input
						size='xs'
						value={part?.text || ''}
						disabled={disabled}
						placeholder='BDT'
						onChange={e => onChange({ text: e.target.value })}
					/>
				)}
				{mode === 'field' && (
					<Dropdown
						size='xs'
						value={part?.field || ''}
						disabled={disabled}
						placeholder='Pick a field'
						onChange={(v: string) => onChange({ field: v })}>
						{others.map(o => (
							<option
								key={o.key}
								value={o.key}>
								{labelOf(o)}
							</option>
						))}
					</Dropdown>
				)}
			</Flex>
		</Box>
	);
};

/** "BDT 1,200 · under it: email" — how the field will read. */
const readsAs = (f: SettingsField, fields: SettingsField[]) => {
	const name = (k?: string) => labelOf(fields.find(x => x.key === k)) || k || '…';
	const part = (p?: AffixPart) => (!p ? '' : p.field ? `[${name(p.field)}]` : p.text || '');
	const a: Affix = f.schema?.affix || {};
	const line = [part(a.before), `[${labelOf(f)}]`, part(a.after)].filter(Boolean).join(' ');
	return f.schema?.subtitle ? `${line} — with ${name(f.schema.subtitle)} under it in the table` : line;
};

const ValueDisplayPanel: FC<Props> = ({ fields, onChange, readOnly }) => {
	const list = fields.filter(dressed);
	const [open, setOpen] = useState(list.length > 0);
	const [adding, setAdding] = useState('');
	const free = fields.filter(f => !dressed(f) && f.key !== '_id' && f.key !== '__v');

	const setSchema = (key: string, patch: Record<string, any>) =>
		onChange(
			fields.map(f => {
				if (f.key !== key) return f;
				const schema = { ...(f.schema || {}), ...patch };
				for (const k of Object.keys(patch)) if (schema[k] === undefined) delete schema[k];
				return { ...f, schema };
			})
		);
	const setPart = (f: SettingsField, side: 'before' | 'after', p: AffixPart | undefined) => {
		const affix: Affix = { ...(f.schema?.affix || {}), [side]: p };
		if (!affix.before) delete affix.before;
		if (!affix.after) delete affix.after;
		setSchema(f.key, { affix: affix.before || affix.after ? affix : undefined });
	};

	return (
		<Panel
			title={
				<Flex
					as='span'
					role='button'
					tabIndex={0}
					align='center'
					gap={1.5}
					onClick={() => setOpen(o => !o)}
					onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(o => !o))}
					cursor='pointer'>
					{open ? <ChevronDown {...ICON} /> : <ChevronRight {...ICON} />}
					<ToneTitle
						icon={SlidersHorizontal}
						palette='gray'>
						Advanced: around a value
					</ToneTitle>
				</Flex>
			}
			subtitle='Words before or after a field’s value — typed, like BDT, or another field such as the currency — on the table and the record page, and a second field in small type under it in the table (the email under a name). Shown the same on every row; the stored value doesn’t change.'
			actions={<DocLink section='value-display' />}>
			{open && (
				<Flex
					direction='column'
					gap={3}>
					{list.map(f => {
						const others = fields.filter(o => o.key !== f.key && o.key !== '_id' && o.key !== '__v');
						return (
							<Box
								key={f.key}
								p={3}
								borderWidth='1px'
								borderRadius='md'>
								<Flex
									align='center'
									justify='space-between'
									gap={2}
									mb={3}>
									<Box minW={0}>
										<Text
											fontSize='sm'
											fontWeight='600'>
											{labelOf(f)}
										</Text>
										<Text
											fontSize='11px'
											color='fg.muted'
											lineClamp={1}>
											Reads as {readsAs(f, fields)}
										</Text>
									</Box>
									<IconButton
										size='2xs'
										variant='ghost'
										aria-label='Remove'
										title='Remove'
										disabled={readOnly}
										onClick={() => setSchema(f.key, { affix: undefined, subtitle: undefined })}>
										<Trash2 {...ICON} />
									</IconButton>
								</Flex>
								<Grid
									templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
									gap={3}>
									<PartEditor
										label='Before the value'
										part={f.schema?.affix?.before}
										others={others}
										disabled={readOnly}
										onChange={p => setPart(f, 'before', p)}
									/>
									<PartEditor
										label='After the value'
										part={f.schema?.affix?.after}
										others={others}
										disabled={readOnly}
										onChange={p => setPart(f, 'after', p)}
									/>
									<Box minW={0}>
										<Text
											fontSize='xs'
											fontWeight='600'
											mb={1.5}>
											Under it, in the table
										</Text>
										<Dropdown
											size='xs'
											value={f.schema?.subtitle || ''}
											disabled={readOnly}
											placeholder='Nothing'
											onChange={(v: string) => setSchema(f.key, { subtitle: v || undefined })}>
											<option value=''>Nothing</option>
											{others.map(o => (
												<option
													key={o.key}
													value={o.key}>
													{labelOf(o)}
												</option>
											))}
										</Dropdown>
									</Box>
								</Grid>
							</Box>
						);
					})}

					<Flex
						align='center'
						gap={2}
						flexWrap='wrap'>
						<Dropdown
							size='xs'
							w='220px'
							value={adding}
							disabled={readOnly || !free.length}
							placeholder='Pick a field'
							onChange={(v: string) => setAdding(v)}>
							{free.map(f => (
								<option
									key={f.key}
									value={f.key}>
									{labelOf(f)}
								</option>
							))}
						</Dropdown>
						<Button
							size='xs'
							variant='outline'
							disabled={readOnly || !adding}
							onClick={() => {
								setSchema(adding, { affix: { before: { text: '' } } });
								setAdding('');
							}}>
							<Plus {...ICON} />
							Add
						</Button>
						{!list.length && (
							<Text
								fontSize='11px'
								color='fg.muted'>
								Nothing set — every value shows on its own.
							</Text>
						)}
					</Flex>
				</Flex>
			)}
		</Panel>
	);
};

export default ValueDisplayPanel;
