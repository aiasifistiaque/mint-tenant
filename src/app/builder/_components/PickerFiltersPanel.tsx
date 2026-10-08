'use client';

import { FC } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Filter, Sparkles } from 'lucide-react';
import { useGetConfigQuery } from '@/components/library';
import { Panel } from '@/components/library/cl';
import { OptionFilter } from '@/components/library/functions/optionFilters';
import { OptionFiltersEditor, RECORD_INPUTS } from './LinkedRecordsEditor';
import { SettingsField } from './SettingsEditor';
import { ToneTitle } from './areas';
import { DocLink } from './ui';

/**
 * The form's record pickers that depend on other fields: a bill's Project
 * offers only the projects of the Client picked above it. The same setting
 * as a field's "Which records are offered" (settings `schema.optionFilters`),
 * gathered on the Form tab beside the other form rules — with a one-click
 * suggestion when the linked model points at what another picker picks.
 * A choice that stops matching (another client picked) is cleared.
 */

type Props = {
	fields: SettingsField[];
	/** The keys placed in the form, in order. */
	formKeys: string[];
	onChange: (fields: SettingsField[]) => void;
	readOnly?: boolean;
};

const labelOf = (f?: SettingsField) => f?.schema?.label || f?.title || f?.key || '';
const isPicker = (f: SettingsField) => RECORD_INPUTS.includes(f.schema?.type) && typeof f.schema?.model === 'string' && !!f.schema.model;

/** One picker: its conditions, and the links worth suggesting. */
const PickerCard: FC<{
	field: SettingsField;
	others: SettingsField[];
	readOnly?: boolean;
	onFilters: (filters: OptionFilter[]) => void;
}> = ({ field, others, readOnly, onFilters }) => {
	const model: string = field.schema.model;
	const filters: OptionFilter[] = Array.isArray(field.schema?.optionFilters) ? field.schema.optionFilters : [];
	const { data } = useGetConfigQuery(model, { skip: !model });
	const linkedSchema: Record<string, any> = data?.schema || {};
	// Another picker of this form picks X, and the linked model has a field pointing at X:
	// "only projects whose client is this form's Client".
	const suggestions = others
		.filter(isPicker)
		.flatMap(o =>
			Object.entries(linkedSchema)
				.filter(([, s]) => RECORD_INPUTS.includes(s?.type) && s?.model === o.schema.model)
				.map(([key, s]) => ({ key, label: s?.label || key, from: o.key, fromLabel: labelOf(o) }))
		)
		.filter(sg => !filters.some(f => f.field === sg.key && f.from === sg.from));

	return (
		<Box
			borderWidth='1px'
			borderRadius='md'
			p={3}>
			<Text
				fontSize='sm'
				mb={2}>
				<b>{labelOf(field)}</b> offers{' '}
				{filters.length ? 'only the records where' : <Text as='span' color='fg.muted'>every record of /{model}</Text>}
			</Text>
			<OptionFiltersEditor
				model={model}
				filters={filters}
				others={others.map(o => ({ key: o.key, title: labelOf(o) }))}
				disabled={readOnly}
				onChange={onFilters}
			/>
			{suggestions.length > 0 && !readOnly && (
				<Flex
					mt={2}
					gap={2}
					flexWrap='wrap'
					align='center'>
					<Sparkles size={13} />
					{suggestions.map(sg => (
						<Button
							key={`${sg.key}-${sg.from}`}
							size='2xs'
							variant='outline'
							onClick={() => onFilters([...filters, { field: sg.key, from: sg.from }])}>
							Only where {sg.label} is this form’s {sg.fromLabel}
						</Button>
					))}
				</Flex>
			)}
		</Box>
	);
};

const PickerFiltersPanel: FC<Props> = ({ fields, formKeys, onChange, readOnly }) => {
	const inForm = formKeys.length ? fields.filter(f => formKeys.includes(f.key)) : fields;
	const pickers = inForm.filter(isPicker);
	const setFilters = (key: string, filters: OptionFilter[]) =>
		onChange(
			fields.map(f => {
				if (f.key !== key) return f;
				const schema = { ...(f.schema || {}) };
				if (filters.length) schema.optionFilters = filters;
				else delete schema.optionFilters;
				return { ...f, schema };
			})
		);

	return (
		<Panel
			title={
				<ToneTitle
					icon={Filter}
					palette='orange'>
					Pickers that depend on other fields
				</ToneTitle>
			}
			subtitle='Narrow what a record picker offers by another field of the form — on a bill, Project offers only the projects of the Client picked above it. Picking another client clears a project that no longer fits.'
			actions={<DocLink section='settings-linked' />}>
			{!pickers.length ? (
				<Text
					fontSize='sm'
					color='fg.muted'>
					The form has no field that picks records of another model.
				</Text>
			) : (
				<Flex
					direction='column'
					gap={3}>
					{pickers.map(p => (
						<PickerCard
							key={p.key}
							field={p}
							others={inForm.filter(o => o.key !== p.key)}
							readOnly={readOnly}
							onFilters={f => setFilters(p.key, f)}
						/>
					))}
				</Flex>
			)}
		</Panel>
	);
};

export default PickerFiltersPanel;
