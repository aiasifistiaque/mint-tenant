'use client';

import { FC } from 'react';
import { Badge, Box, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import { useGetAllQuery } from '@/components/library/store/services/commonApi';
import type { ReportModel, ReportModelField } from '@/components/library/store/services/tenantApi';

/**
 * The value of one "Only records where" condition, in the field's own terms:
 * a linked field picks records of the model it links to (the condition keeps
 * their ids), a choice field its choices, a yes/no field Yes or No, a date a
 * date and a number a number. "is one of" takes several. Anything else is typed.
 */

const LINK_KINDS = ['reference', 'references'];
const MULTI_SEP = ',';

/** Which operators make sense for a field. */
export const opsFor = (field: ReportModelField | undefined, all: { value: string; label: string }[]) => {
	if (!field) return all;
	const keep = (...v: string[]) => all.filter(o => v.includes(o.value));
	if (LINK_KINDS.includes(field.kind) || field.options?.length || ['select', 'multiselect', 'tags'].includes(field.kind)) return keep('eq', 'ne', 'in', 'exists');
	if (field.kind === 'boolean') return keep('eq', 'exists');
	if (field.number || field.date) return all.filter(o => o.value !== 'in');
	return keep('eq', 'ne', 'in', 'exists');
};

/** The model a linked field points at: its `ref` is the model's own name. */
export const linkedModel = (field: ReportModelField | undefined, models: ReportModel[]) => {
	const ref = field?.ref;
	if (!ref) return undefined;
	const lower = ref.toLowerCase();
	return (
		models.find(m => m.model === ref) ||
		models.find(m => m.name === ref) ||
		// Before the server sends `model`: the usual route for a model name (Employee → employees).
		models.find(m => m.route.replace(/-/g, '') === `${lower}s` || m.route === lower)
	);
};

const split = (v: any): string[] =>
	(Array.isArray(v) ? v : String(v ?? '').split(MULTI_SEP))
		.map(x => String(x).trim())
		.filter(Boolean);

/** Several picks: chips of what's picked, and a list to add one more. */
const Several: FC<{ value: any; items: { value: string; label: string }[]; onChange: (v: string) => void; placeholder: string }> = ({ value, items, onChange, placeholder }) => {
	const picked = split(value);
	const labelOf = (v: string) => items.find(i => i.value === v)?.label || v;
	return (
		<Flex
			direction='column'
			gap={1.5}
			flex='1'
			minW='200px'>
			<Dropdown
				size='sm'
				value=''
				placeholder={picked.length ? 'Add another' : placeholder}
				searchable
				onChange={v => v && !picked.includes(v) && onChange([...picked, v].join(MULTI_SEP))}
				items={items.filter(i => !picked.includes(i.value))}
			/>
			{picked.length > 0 && (
				<Flex
					gap={1.5}
					wrap='wrap'>
					{picked.map(v => (
						<Badge
							key={v}
							size='sm'
							variant='subtle'
							pr={0.5}>
							{labelOf(v)}
							<IconButton
								aria-label={`Remove ${labelOf(v)}`}
								size='2xs'
								variant='ghost'
								onClick={() => onChange(picked.filter(x => x !== v).join(MULTI_SEP))}>
								<X size={11} />
							</IconButton>
						</Badge>
					))}
				</Flex>
			)}
		</Flex>
	);
};

/** One pick or several from a fixed list. */
const Choose: FC<{ op: string; value: any; items: { value: string; label: string }[]; onChange: (v: string) => void; placeholder: string }> = ({ op, value, items, onChange, placeholder }) =>
	op === 'in' ? (
		<Several
			value={value}
			items={items}
			onChange={onChange}
			placeholder={placeholder}
		/>
	) : (
		<Box
			flex='1'
			minW='200px'>
			<Dropdown
				size='sm'
				value={String(value ?? '')}
				placeholder={placeholder}
				searchable={items.length > 10}
				onChange={onChange}
				items={items}
			/>
		</Box>
	);

/** Records of the linked model, by their display field. */
const RecordValue: FC<{ target: ReportModel; op: string; value: any; onChange: (v: string) => void }> = ({ target, op, value, onChange }) => {
	const display = target.displayField && target.displayField !== '_id' ? target.displayField : 'name';
	const { data, isLoading, isError } = useGetAllQuery({ path: target.route, limit: 999, sort: display });
	if (isError)
		return (
			<Text
				flex='1'
				fontSize='12px'
				color='fg.muted'>
				Couldn’t load {target.name} to pick from.
			</Text>
		);
	const items = ((data?.doc as any[]) || []).map(d => {
		const name = d?.[display] ?? d?.name ?? d?.title ?? d?.code;
		return { value: String(d._id), label: [name, d?.code && d.code !== name ? d.code : ''].filter(Boolean).join(' · ') || String(d._id) };
	});
	return (
		<Choose
			op={op}
			value={value}
			items={items}
			onChange={onChange}
			placeholder={isLoading ? 'Loading…' : `Pick ${op === 'in' ? '' : 'a '}${target.name.toLowerCase()}`}
		/>
	);
};

const ConditionValue: FC<{ field: ReportModelField | undefined; models: ReportModel[]; op: string; value: any; onChange: (v: string) => void }> = ({ field, models, op, value, onChange }) => {
	if (op === 'exists') return null;
	const target = LINK_KINDS.includes(field?.kind || '') ? linkedModel(field, models) : undefined;
	if (target)
		return (
			<RecordValue
				target={target}
				op={op}
				value={value}
				onChange={onChange}
			/>
		);
	if (field?.options?.length)
		return (
			<Choose
				op={op}
				value={value}
				items={field.options.map(o => ({ value: o.value, label: o.label || o.value }))}
				onChange={onChange}
				placeholder='Pick a choice'
			/>
		);
	if (field?.kind === 'boolean')
		return (
			<Choose
				op='eq'
				value={value}
				items={[
					{ value: 'true', label: 'Yes' },
					{ value: 'false', label: 'No' },
				]}
				onChange={onChange}
				placeholder='Yes or No'
			/>
		);
	return (
		<Input
			flex='1'
			size='sm'
			type={field?.date ? 'date' : field?.number ? 'number' : 'text'}
			placeholder={op === 'in' ? 'Comma-separated' : 'Value'}
			value={String(value ?? '')}
			onChange={e => onChange(e.target.value)}
		/>
	);
};

export default ConditionValue;
