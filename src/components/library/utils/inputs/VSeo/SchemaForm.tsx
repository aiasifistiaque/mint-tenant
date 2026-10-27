'use client';

import { FC } from 'react';
import { Box, Button, Flex, Menu, Portal, SimpleGrid, Text, Textarea, TextareaProps } from '@chakra-ui/react';
import { Braces, Plus, Trash2 } from 'lucide-react';
import { FormControl, Input, SelectContainer, styles } from '../../..';
import { MenuContainer } from '../../../menu';
import CustomMenuItem, { MenuItemStyle } from '../../../menu/CustomMenuItem';
import { DANGER, TEXT_MUTED, WARNING, tone } from './constants';
import { SCHEMA_FORMS, schemaGaps, type SchemaField } from './schemaForms';

/**
 * The structured data form for a schema type (backend docs/seo SEO-04): the
 * fields of schemaForms.ts, saved as the SEO's `schemaData`. On a template page
 * each text field can take one of the record's fields, as `{{record.<key>}}`.
 */

export type RecordFields = { title: string; fields: { key: string; label: string; kind: string }[] };
type Props = { type: string; value: Record<string, any>; onChange: (next: Record<string, any>) => void; record?: RecordFields | null };

const Area = (props: TextareaProps) => (
	<Textarea
		{...(styles.FIELD as TextareaProps)}
		size='sm'
		px={3}
		py={2}
		{...props}
	/>
);

const DAYS: [string, string][] = [
	['mo', 'Mon'],
	['tu', 'Tue'],
	['we', 'Wed'],
	['th', 'Thu'],
	['fr', 'Fri'],
	['sa', 'Sat'],
	['su', 'Sun'],
];

/** Puts `{{record.<key>}}` in a field. */
const RecordMenu: FC<{ record: RecordFields; onPick: (binding: string) => void }> = ({ record, onPick }) => (
	<Menu.Root positioning={{ placement: 'bottom-end', gutter: 4 }}>
		<Menu.Trigger asChild>
			<Button
				size='xs'
				variant='ghost'
				px={1.5}
				aria-label={`Use a field of the ${record.title} record`}
				title={`Use a field of the ${record.title} record`}>
				<Braces size={14} />
			</Button>
		</Menu.Trigger>
		<Portal>
			<MenuContainer
				p='6px'
				w='220px'
				maxH='300px'
				overflowY='auto'>
				<MenuItemStyle compact>
					{record.fields.map(f => (
						<CustomMenuItem
							key={f.key}
							value={f.key}
							onClick={() => onPick(`{{record.${f.key}}}`)}>
							{f.label}
						</CustomMenuItem>
					))}
				</MenuItemStyle>
			</MenuContainer>
		</Portal>
	</Menu.Root>
);

const Hours: FC<{ value: any; onChange: (v: any[]) => void }> = ({ value, onChange }) => {
	const rows: { days: string[]; opens: string; closes: string }[] = Array.isArray(value) ? value : [];
	const set = (i: number, patch: Partial<(typeof rows)[number]>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
	return (
		<Flex
			w='full'
			direction='column'
			gap={2}>
			{rows.map((r, i) => (
				<Flex
					key={i}
					gap={2}
					align='center'
					wrap='wrap'>
					<Flex
						gap={1}
						wrap='wrap'>
						{DAYS.map(([d, label]) => {
							const on = (r.days || []).includes(d);
							return (
								<Button
									key={d}
									size='xs'
									px={2}
									variant={on ? 'solid' : 'outline'}
									aria-pressed={on}
									onClick={() => set(i, { days: on ? r.days.filter(x => x !== d) : [...(r.days || []), d] })}>
									{label}
								</Button>
							);
						})}
					</Flex>
					<Flex
						gap={2}
						align='center'>
						<Input
							size='sm'
							px={2}
							w='88px'
							type='time'
							aria-label='Opens'
							value={r.opens || ''}
							onChange={e => set(i, { opens: e.target.value })}
						/>
						<Text {...tone(TEXT_MUTED)}>–</Text>
						<Input
							size='sm'
							px={2}
							w='88px'
							type='time'
							aria-label='Closes'
							value={r.closes || ''}
							onChange={e => set(i, { closes: e.target.value })}
						/>
						<Button
							size='xs'
							variant='ghost'
							aria-label='Remove these hours'
							onClick={() => onChange(rows.filter((_, j) => j !== i))}>
							<Trash2 size={14} />
						</Button>
					</Flex>
				</Flex>
			))}
			<Button
				size='xs'
				variant='outline'
				alignSelf='flex-start'
				onClick={() => onChange([...rows, { days: rows.length ? [] : ['mo', 'tu', 'we', 'th', 'fr'], opens: '09:00', closes: '18:00' }])}>
				<Plus size={13} /> Add hours
			</Button>
		</Flex>
	);
};

const Faqs: FC<{ value: any; onChange: (v: any[]) => void; record?: RecordFields | null }> = ({ value, onChange, record }) => {
	const rows: { question: string; answer: string }[] = Array.isArray(value) ? value : [];
	const set = (i: number, patch: Partial<(typeof rows)[number]>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
	return (
		<Flex
			w='full'
			direction='column'
			gap={3}>
			{rows.map((r, i) => (
				<Box
					key={i}
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'
					p={3}>
					<Flex
						gap={2}
						align='center'
						mb={2}>
						<Input
							size='sm'
							px={3}
							placeholder='The question'
							value={r.question || ''}
							onChange={e => set(i, { question: e.target.value })}
						/>
						{record && (
							<RecordMenu
								record={record}
								onPick={b => set(i, { question: `${r.question || ''}${b}` })}
							/>
						)}
						<Button
							size='xs'
							variant='ghost'
							aria-label='Remove this question'
							onClick={() => onChange(rows.filter((_, j) => j !== i))}>
							<Trash2 size={14} />
						</Button>
					</Flex>
					<Area
						minH='64px'
						placeholder='Its answer, as it reads on the page'
						value={r.answer || ''}
						onChange={e => set(i, { answer: e.target.value })}
					/>
				</Box>
			))}
			<Button
				size='xs'
				variant='outline'
				alignSelf='flex-start'
				onClick={() => onChange([...rows, { question: '', answer: '' }])}>
				<Plus size={13} /> Add a question
			</Button>
		</Flex>
	);
};

const SchemaForm: FC<Props> = ({ type, value, onChange, record }) => {
	const form = SCHEMA_FORMS[type];
	if (!form) return null;
	const d = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
	const set = (key: string, v: any) => onChange({ ...d, [key]: v });
	const { need, could } = schemaGaps(type, d);

	const field = (f: SchemaField) => {
		const v = d[f.key];
		if (f.kind === 'hours')
			return (
				<Hours
					value={v}
					onChange={x => set(f.key, x)}
				/>
			);
		if (f.kind === 'faqs')
			return (
				<Faqs
					value={v}
					record={record}
					onChange={x => set(f.key, x)}
				/>
			);
		if (f.kind === 'select')
			return (
				<SelectContainer
					value={typeof v === 'string' ? v : f.options?.[0]?.value || ''}
					onChange={(e: any) => set(f.key, e.target.value)}>
					{(f.options || []).map(o => (
						<option
							key={o.value}
							value={o.value}>
							{o.label}
						</option>
					))}
				</SelectContainer>
			);
		const text = typeof v === 'string' ? v : v == null ? '' : String(v);
		return (
			<Flex
				w='full'
				gap={1}
				align={f.kind === 'textarea' ? 'flex-start' : 'center'}>
				{f.kind === 'textarea' ? (
					<Area
						minH='64px'
						placeholder={f.placeholder}
						value={text}
						onChange={e => set(f.key, e.target.value)}
					/>
				) : (
					<Input
						size='sm'
						px={3}
						placeholder={f.placeholder}
						value={text}
						onChange={e => set(f.key, e.target.value)}
					/>
				)}
				{record && (
					<RecordMenu
						record={record}
						onPick={b => set(f.key, f.kind === 'textarea' ? `${text}${text ? '\n' : ''}${b}` : `${text}${b}`)}
					/>
				)}
			</Flex>
		);
	};

	return (
		<Flex
			direction='column'
			gap={4}>
			<Text
				fontSize='12.5px'
				{...tone(TEXT_MUTED)}>
				{form.about}
				{record && ` On this template page the { } button fills a field from each record of ${record.title}.`}
			</Text>
			<SimpleGrid
				columns={{ base: 1, md: 2 }}
				gap={4}>
				{form.fields.map(f => (
					<Box
						key={f.key}
						gridColumn={f.half ? undefined : { md: 'span 2' }}>
						<FormControl
							label={f.label}
							helper={f.help}>
							{field(f)}
						</FormControl>
					</Box>
				))}
			</SimpleGrid>
			{(need.length > 0 || could.length > 0) && (
				<Box
					fontSize='12px'
					data-testid='schema-gaps'>
					{need.map(n => (
						<Text
							key={n}
							{...tone(DANGER)}>
							Google needs: {n}
						</Text>
					))}
					{could.map(n => (
						<Text
							key={n}
							{...tone(WARNING)}>
							Would help: {n}
						</Text>
					))}
				</Box>
			)}
		</Flex>
	);
};

export default SchemaForm;
