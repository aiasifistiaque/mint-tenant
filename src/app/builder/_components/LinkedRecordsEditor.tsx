'use client';

import { FC } from 'react';
import { Box, Button, Flex, IconButton, Input, SegmentGroup, Text } from '@chakra-ui/react';
import { Plus, Trash2, X } from 'lucide-react';
import { useGetConfigQuery } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { OptionFilter, OptionFilterOp } from '@/components/library/functions/optionFilters';
import { PickerDetailsLayout } from '@/components/library/functions/pickerDetails';
import { DocLink, FieldLabel, Toggle } from './ui';
import { mainRoute, modelLabel, useLinkModels } from './useLinkModels';

/**
 * A record picker's own options (Settings → a field's details, when its input
 * picks records): the linked model — picked by name; what's stored is still
 * the route it's served on (`schema.model`), as settings files have always
 * had it, so existing fields keep working — a + beside the input that adds a record
 * of it in a modal (`schema.addItem`), and which of its records are offered
 * (`schema.optionFilters`) — compared with a fixed value (only active admins)
 * or with another field of this form (only the projects of the client picked
 * above). The picker in the form reads both; see optionFilters.ts. And how
 * each record reads in the list: the field that names it (`schema.menuKey` /
 * `labelKey`, `name` unless picked), and which of its other fields show in
 * small type under that name (`schema.pickerDetails`) — a bill's total and due
 * date, on one dotted line or one per line (`schema.pickerDetailsLayout`).
 */

export const RECORD_INPUTS = ['data-menu', 'data-tag', 'nested-data-menu'];

type FormField = { key: string; title?: string };

type Props = {
	schema: any;
	/** This form's other fields — what a condition can be compared with. */
	formFields: FormField[];
	fieldKey: string;
	disabled?: boolean;
	onChange: (patch: any) => void;
};

const ICON = { size: 14, strokeWidth: 1.75 };
const SENSITIVE = /pass(word)?|token|secret|api_?key|apikey|private|otp|salt|hash/i;
const BOOL_INPUTS = ['checkbox', 'switch', 'boolean'];
const OPS: { value: OptionFilterOp; label: string }[] = [
	{ value: 'eq', label: 'is' },
	{ value: 'ne', label: 'is not' },
	{ value: 'in', label: 'is one of' },
];

type Target = { key: string; label: string; input?: string; options?: { value: any; label?: any }[] };

/** A value not matched to a model: an old route, kept as it is. */
const ROUTE_ONLY = 'route:';

const LinkedRecordsEditor: FC<Props> = ({ schema, formFields, fieldKey, disabled, onChange }) => {
	const model: string = schema?.model || '';
	const filters: OptionFilter[] = Array.isArray(schema?.optionFilters) ? schema.optionFilters : [];
	const others = formFields.filter(f => f.key !== fieldKey);
	// The linked route's form config: whether it's served at all (the conditions read its fields too).
	const { data: linkedConfig, isError } = useGetConfigQuery(model, { skip: !model });

	const { models } = useLinkModels();
	const linked = models.find(m => m.routes.includes(model));

	/** A model picked: the route it's served on, and the field that names its records. */
	const pickModel = (value: string) => {
		const m = models.find(x => x.name === value);
		if (!m) return;
		const route = mainRoute(m);
		const display = m.display && m.display !== '_id' ? m.display : undefined;
		onChange({
			model: route,
			...(display && { menuKey: display, labelKey: display }),
			// Conditions name fields of the old model.
			...(m.name !== linked?.name && filters.length && { optionFilters: undefined }),
		});
	};

	const setFilters = (next: OptionFilter[]) => onChange({ optionFilters: next.length ? next : undefined });

	// The field that names each record in the picker (menuKey for one record, labelKey for several).
	const nameKey: string = schema?.menuKey || schema?.labelKey || 'name';
	const details: string[] = Array.isArray(schema?.pickerDetails) ? schema.pickerDetails : [];

	return (
		<Flex
			direction='column'
			gap={3}
			p={3}
			borderWidth='1px'
			borderColor='border.muted'
			borderRadius='md'
			bg='bg.subtle'>
			<Flex
				align='center'
				justify='space-between'
				gap={3}>
				<Text
					fontSize='sm'
					fontWeight='600'>
					Linked records
				</Text>
				<DocLink section='settings-linked' />
			</Flex>

			<Flex
				gap={3}
				flexWrap='wrap'
				align='flex-start'>
				<Box
					w='320px'
					maxW='full'>
					<FieldLabel>Linked model</FieldLabel>
					<Dropdown
						size='sm'
						disabled={disabled || !models.length}
						placeholder={models.length ? 'Pick a model' : 'Loading models…'}
						value={linked?.name || (model ? `${ROUTE_ONLY}${model}` : '')}
						onChange={pickModel}>
						{models.map(m => (
							<option
								key={m.name}
								value={m.name}>
								{modelLabel(m)}
							</option>
						))}
						{model && !linked && <option value={`${ROUTE_ONLY}${model}`}>{`Route “${model}” (no model found)`}</option>}
					</Dropdown>
				</Box>
				{linked && linked.routes.length > 1 && (
					<Box w='200px'>
						<FieldLabel>Served on</FieldLabel>
						<Dropdown
							size='sm'
							disabled={disabled}
							value={model}
							onChange={route => onChange({ model: route })}>
							{linked.routes.map(r => (
								<option
									key={r}
									value={r}>
									/{r}
								</option>
							))}
						</Dropdown>
					</Box>
				)}
			</Flex>
			{model && (
				<Text
					fontSize='xs'
					color={isError || (models.length > 0 && !linked) ? 'red.fg' : 'fg.muted'}
					mt={-1}>
					{isError || (models.length > 0 && !linked)
						? `No model is served on “${model}” — pick one above.`
						: `Records come from /${model}.`}
				</Text>
			)}

			{model && !isError && (
				<PickerNameEditor
					schema={linkedConfig?.schema}
					value={nameKey}
					disabled={disabled}
					onChange={key => {
						// The new name isn't repeated under itself.
						const rest = details.filter(k => k !== key);
						onChange({
							menuKey: key,
							labelKey: key,
							...(rest.length !== details.length && { pickerDetails: rest.length ? rest : undefined }),
						});
					}}
				/>
			)}

			{model && !isError && (
				<PickerDetailsEditor
					schema={linkedConfig?.schema}
					nameKey={nameKey}
					value={details}
					layout={schema?.pickerDetailsLayout}
					disabled={disabled}
					onChange={next => onChange({ pickerDetails: next.length ? next : undefined })}
					onLayoutChange={layout => onChange({ pickerDetailsLayout: layout === 'stacked' ? layout : undefined })}
				/>
			)}

			<Toggle
				label='Add new from the form'
				hint='A + beside the input opens a modal with the linked model’s form; the record added is picked straight away.'
				checked={!!schema?.addItem}
				onChange={v => !disabled && onChange({ addItem: v || undefined })}
			/>

			<Box>
				<FieldLabel>Which records are offered</FieldLabel>
				<Text
					fontSize='xs'
					color='fg.muted'
					mb={2}>
					{filters.length
						? 'Only records matching every condition are offered. A choice that stops matching (another client picked) is cleared.'
						: 'Every record of the linked model. Add a condition to narrow it — to a fixed value, or to another field of this form.'}
				</Text>

				<OptionFiltersEditor
					model={model}
					filters={filters}
					others={others}
					disabled={disabled}
					onChange={setFilters}
				/>
			</Box>
		</Flex>
	);
};

const MAX_DETAILS = 4;

/** The linked model's fields a picker can show: no id, nothing secret. */
const pickableFields = (schema?: Record<string, any>) =>
	Object.entries<any>(schema || {})
		.filter(([key]) => key !== '_id' && !SENSITIVE.test(key))
		.map(([key, s]) => ({ key, label: String(s?.label || key) }));

/**
 * "Name shown in the picker" (`schema.menuKey` + `labelKey`): the field each
 * record is listed by, and what the input shows once one is picked. Name
 * unless the builder picks another — an invoice's number, a person's email.
 */
const PickerNameEditor: FC<{
	/** The linked page's config schema: its fields and their labels. */
	schema?: Record<string, any>;
	value: string;
	disabled?: boolean;
	onChange: (key: string) => void;
}> = ({ schema, value, disabled, onChange }) => {
	const fields = pickableFields(schema);
	// A name kept from before that the linked model no longer has still shows as picked.
	const options = fields.some(f => f.key === value) ? fields : [{ key: value, label: value }, ...fields];
	return (
		<Box>
			<FieldLabel>Name shown in the picker</FieldLabel>
			<Text
				fontSize='xs'
				color='fg.muted'
				mb={2}>
				Each record is listed by this field, and the input shows it once a record is picked.
			</Text>
			<Box
				w='320px'
				maxW='full'>
				<Dropdown
					size='sm'
					disabled={disabled || !fields.length}
					value={value}
					onChange={(key: string) => key && key !== value && onChange(key)}>
					{options.map(f => (
						<option
							key={f.key}
							value={f.key}>
							{f.key === 'name' ? `${f.label} (default)` : f.label}
						</option>
					))}
				</Dropdown>
			</Box>
		</Box>
	);
};

/**
 * "Shown under the name in the list" (`schema.pickerDetails`): fields of the
 * linked model, in small type under each record in the picker — so two bills
 * named alike can be told apart by their total and due date. Values only, no
 * field names. With two or more, `schema.pickerDetailsLayout` puts them on one
 * line separated by dots (the default) or each on its own line.
 */
const PickerDetailsEditor: FC<{
	/** The linked page's config schema: its fields and their labels. */
	schema?: Record<string, any>;
	/** The field that already names the records — not offered again. */
	nameKey: string;
	value: string[];
	layout?: PickerDetailsLayout;
	disabled?: boolean;
	onChange: (keys: string[]) => void;
	onLayoutChange: (layout: PickerDetailsLayout) => void;
}> = ({ schema, nameKey, value: chosen, layout, disabled, onChange, onLayoutChange }) => {
	const fields = pickableFields(schema).filter(f => f.key !== nameKey);
	const labelOf = (key: string) => fields.find(f => f.key === key)?.label || key;
	const left = fields.filter(f => !chosen.includes(f.key));
	const stacked = layout === 'stacked';
	const list = chosen.map(k => labelOf(k).toLowerCase());

	return (
		<Box>
			<FieldLabel>Shown under the name in the list</FieldLabel>
			<Text
				fontSize='xs'
				color='fg.muted'
				mb={2}>
				{!chosen.length
					? 'Just the name. Add fields — a total, a date, a status — to tell records apart before picking one.'
					: chosen.length === 1
						? `Each record shows its ${list[0]} in small type under its name — the value only.`
						: stacked
							? `Each record shows its ${list.join(', ')} under its name, one per line — values only.`
							: `Each record shows its ${list.join(', ')} under its name on one line, separated by dots — values only.`}
			</Text>
			<Flex
				gap={2}
				flexWrap='wrap'
				align='center'>
				{chosen.map(key => (
					<Flex
						key={key}
						align='center'
						gap={1}
						h='28px'
						pl={2.5}
						pr={1}
						borderWidth='1px'
						borderRadius='full'
						bg='bg'
						fontSize='xs'>
						{labelOf(key)}
						<IconButton
							size='2xs'
							variant='ghost'
							borderRadius='full'
							disabled={disabled}
							aria-label={`Stop showing ${labelOf(key)}`}
							title={`Stop showing ${labelOf(key)}`}
							onClick={() => onChange(chosen.filter(k => k !== key))}>
							<X size={12} />
						</IconButton>
					</Flex>
				))}
				{chosen.length < MAX_DETAILS && left.length > 0 && (
					<Box w='200px'>
						<Dropdown
							size='sm'
							disabled={disabled}
							value=''
							placeholder='Add a field…'
							onChange={(key: string) => key && onChange([...chosen, key])}>
							{left.map(f => (
								<option
									key={f.key}
									value={f.key}>
									{f.label}
								</option>
							))}
						</Dropdown>
					</Box>
				)}
			</Flex>
			{chosen.length > 1 && (
				<Flex
					mt={3}
					gap={3}
					align='center'
					flexWrap='wrap'>
					<Text
						fontSize='xs'
						color='fg.muted'>
						Show them
					</Text>
					<SegmentGroup.Root
						size='xs'
						disabled={disabled}
						value={stacked ? 'stacked' : 'inline'}
						onValueChange={e => e.value && onLayoutChange(e.value as PickerDetailsLayout)}>
						<SegmentGroup.Indicator />
						<SegmentGroup.Items
							items={[
								{ value: 'inline', label: 'Side by side · dotted' },
								{ value: 'stacked', label: 'One per line' },
							]}
						/>
					</SegmentGroup.Root>
				</Flex>
			)}
		</Box>
	);
};

/**
 * A record picker's "Which records are offered" conditions (`schema.optionFilters`):
 * a field of the linked model, is / is not / is one of, and a fixed value or
 * another field of this form. Shared by the field's settings and the Form
 * tab's "Pickers that depend on other fields".
 */
export const OptionFiltersEditor: FC<{
	/** The linked route (`schema.model`). */
	model: string;
	filters: OptionFilter[];
	/** This form's other fields — what a condition can be compared with. */
	others: FormField[];
	disabled?: boolean;
	onChange: (filters: OptionFilter[]) => void;
}> = ({ model, filters, others, disabled, onChange: setFilters }) => {
	const { data, isFetching } = useGetConfigQuery(model, { skip: !model });
	const targets: Target[] = Object.entries<any>(data?.schema || {})
		.filter(([key]) => key !== '_id' && !SENSITIVE.test(key))
		.map(([key, s]) => ({ key, label: s?.label || key, input: s?.type, options: s?.options }));
	const targetOf = (key: string) => targets.find(t => t.key === key);
	const setFilter = (i: number, patch: Partial<OptionFilter>) =>
		setFilters(
			filters.map((f, j) => {
				if (j !== i) return f;
				const merged: any = { ...f, ...patch };
				for (const k of Object.keys(merged)) if (merged[k] === undefined) delete merged[k];
				return merged;
			})
		);
	return (
		<>
				<Flex
					direction='column'
					gap={2}>
					{filters.map((f, i) => {
						const target = targetOf(f.field);
						const isBool = BOOL_INPUTS.includes(target?.input || '');
						const source = f.from ? `from:${f.from}` : 'value';
						const op = f.op || 'eq';
						return (
							<Flex
								key={i}
								gap={2}
								align='center'
								flexWrap='wrap'>
								<Dropdown
									size='xs'
									w='170px'
									disabled={disabled || isFetching}
									placeholder='Field of the linked model'
									value={f.field || ''}
									onChange={v => setFilter(i, { field: v, value: undefined })}>
									{targets.map(t => (
										<option
											key={t.key}
											value={t.key}>
											{t.label}
										</option>
									))}
									{f.field && !target && <option value={f.field}>{f.field}</option>}
								</Dropdown>
								<Dropdown
									size='xs'
									w='110px'
									disabled={disabled || isBool}
									value={isBool ? 'eq' : op}
									onChange={v => setFilter(i, { op: v === 'eq' ? undefined : (v as OptionFilterOp) })}>
									{OPS.map(o => (
										<option
											key={o.value}
											value={o.value}>
											{o.label}
										</option>
									))}
								</Dropdown>
								<Dropdown
									size='xs'
									w='190px'
									disabled={disabled}
									value={source}
									onChange={v =>
										setFilter(
											i,
											v === 'value'
												? { from: undefined, whenEmpty: undefined }
												: { from: v.slice(5), value: undefined }
										)
									}>
									<option value='value'>A fixed value</option>
									<optgroup label='This form’s field'>
										{others.map(o => (
											<option
												key={o.key}
												value={`from:${o.key}`}>
												{o.title || o.key}
											</option>
										))}
									</optgroup>
								</Dropdown>

								{f.from ? (
									<Dropdown
										size='xs'
										w='190px'
										disabled={disabled}
										title='While that field is empty'
										value={f.whenEmpty || 'all'}
										onChange={v => setFilter(i, { whenEmpty: v === 'none' ? 'none' : undefined })}>
										<option value='all'>While empty: offer all</option>
										<option value='none'>While empty: offer none</option>
									</Dropdown>
								) : isBool ? (
									<Dropdown
										size='xs'
										w='110px'
										disabled={disabled}
										value={f.value === false ? 'false' : f.value === true ? 'true' : ''}
										placeholder='Yes / no'
										onChange={v => setFilter(i, { value: v === 'true' })}>
										<option value='true'>Yes</option>
										<option value='false'>No</option>
									</Dropdown>
								) : target?.options?.length && op !== 'in' ? (
									<Dropdown
										size='xs'
										w='170px'
										disabled={disabled}
										value={f.value ?? ''}
										placeholder='Value'
										onChange={v => setFilter(i, { value: v })}>
										{target.options.map((o: any) => (
											<option
												key={String(o.value)}
												value={String(o.value)}>
												{String(o.label ?? o.value)}
											</option>
										))}
									</Dropdown>
								) : (
									<Input
										size='xs'
										w='190px'
										disabled={disabled}
										placeholder={op === 'in' ? 'Values, comma separated' : 'Value'}
										value={Array.isArray(f.value) ? f.value.join(', ') : f.value ?? ''}
										onChange={e =>
											setFilter(i, {
												value:
													op === 'in'
														? e.target.value
																.split(',')
																.map(x => x.trim())
																.filter(Boolean)
														: e.target.value,
											})
										}
									/>
								)}

								{!disabled && (
									<IconButton
										size='xs'
										variant='ghost'
										aria-label='Remove condition'
										color='red.500'
										_dark={{ color: 'red.300' }}
										onClick={() => setFilters(filters.filter((_, j) => j !== i))}>
										<Trash2 {...ICON} />
									</IconButton>
								)}
							</Flex>
						);
					})}
				</Flex>

				{!disabled && (
					<Button
						mt={2}
						size='xs'
						variant='outline'
						disabled={!model}
						title={model ? undefined : 'Set the linked model first'}
						onClick={() => setFilters([...filters, { field: '' }])}>
						<Plus {...ICON} />
						Add condition
					</Button>
				)}
		</>
	);
};

export default LinkedRecordsEditor;
