'use client';

import { FC } from 'react';
import { Box, Button, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { Plus, X } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import type { ApiModel, EndpointCondition } from '@/components/library/store/services/apiBuilderApi';

/**
 * An endpoint's rules (backend docs/api-builder D5, D7): rows of field · test ·
 * value, all or any of them. A value is typed, or — on an endpoint for
 * signed-in customers — the customer themselves: "Owner is the signed-in
 * customer", "Email is their email". The server reads the same tests
 * (fieldLocks ops) and checks each value against the field's kind on save;
 * its message lands under the row it names (`errorAt`).
 */

type Op = 'is' | 'not' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'empty' | 'filled';

const LABEL: Record<Op, string> = {
	is: 'is',
	not: 'is not',
	in: 'is one of',
	gt: 'is more than',
	gte: 'is at least',
	lt: 'is less than',
	lte: 'is at most',
	contains: 'contains',
	empty: 'is empty',
	filled: 'is not empty',
};
const DATE_LABEL: Partial<Record<Op, string>> = { gt: 'is after', gte: 'is on or after', lt: 'is before', lte: 'is on or before' };

/** The tests a field takes, by its kind. */
const opsFor = (kind: string): Op[] => {
	if (kind === 'owner') return ['is', 'empty', 'filled'];
	if (kind === 'id') return ['is', 'not', 'in'];
	if (kind === 'boolean') return ['is', 'not'];
	if (['number', 'formula', 'date', 'dateformula'].includes(kind)) return ['is', 'not', 'gt', 'gte', 'lt', 'lte', 'empty', 'filled'];
	if (['select', 'reference', 'references'].includes(kind)) return ['is', 'not', 'in', 'empty', 'filled'];
	return ['is', 'not', 'contains', 'in', 'empty', 'filled'];
};

/** What a value can be compared with on a customers' endpoint, by the field's kind. */
const customerRefsFor = (kind: string) =>
	kind === 'owner'
		? [{ value: 'customer', label: 'the signed-in customer' }]
		: kind === 'reference' || kind === 'id'
		? []
		: [
				{ value: 'customer.email', label: 'their email' },
				{ value: 'customer.name', label: 'their name' },
				{ value: 'customer.phone', label: 'their phone' },
		  ];

const isRef = (v: any): v is { ref: string } => !!v && typeof v === 'object' && !Array.isArray(v) && typeof v.ref === 'string';

const RuleEditor: FC<{
	model: ApiModel;
	value: EndpointCondition[];
	onChange: (v: EndpointCondition[]) => void;
	match: 'all' | 'any';
	onMatchChange?: (m: 'all' | 'any') => void;
	/** The endpoint is for signed-in customers: values may be the customer. */
	customer: boolean;
	/** The server's message for row n ("access.when.2" → 2). */
	errorAt?: { index: number; message: string } | null;
	addLabel?: string;
	disabled?: boolean;
}> = ({ model, value, onChange, match, onMatchChange, customer, errorAt, addLabel = 'Add a rule', disabled }) => {
	const fields = model.ruleFields.filter(f => f.key !== '_customer' || customer || value.some(c => c.field === '_customer'));
	const kindOf = (key: string) => fields.find(f => f.key === key)?.kind || model.ruleFields.find(f => f.key === key)?.kind || 'text';
	const optionsOf = (key: string) => model.fields.find(f => f.key === key)?.options || [];
	const set = (i: number, c: EndpointCondition) => onChange(value.map((x, j) => (j === i ? c : x)));
	const add = () => {
		// Start from a field with set values (a status, a yes/no) — the usual rule — then any of the model's own.
		const own = fields.filter(x => x.key !== '_customer' && x.key !== '_id' && x.key !== 'createdAt' && x.key !== 'updatedAt');
		const f = own.find(x => x.kind === 'select') || own.find(x => x.kind === 'boolean') || own.find(x => x.kind !== 'reference' && x.kind !== 'references') || own[0] || fields[0];
		if (f) onChange([...value, { field: f.key, op: 'is', value: f.kind === 'boolean' ? true : f.kind === 'select' ? optionsOf(f.key)[0]?.value ?? '' : '' }]);
	};

	return (
		<Flex
			direction='column'
			gap={2}>
			{value.length > 1 && onMatchChange && (
				<Flex
					align='center'
					gap={2}
					fontSize='12.5px'
					color='fg.muted'>
					<Text>Records must meet</Text>
					<Box w='150px'>
						<Dropdown
							size='xs'
							value={match}
							disabled={disabled}
							onChange={(v: string) => onMatchChange(v === 'any' ? 'any' : 'all')}
							items={[
								{ value: 'all', label: 'all of these' },
								{ value: 'any', label: 'any one of these' },
							]}
						/>
					</Box>
				</Flex>
			)}
			{value.map((c, i) => {
				const kind = kindOf(c.field);
				const ops = opsFor(kind);
				const op = (ops.includes(c.op as Op) ? c.op : ops[0]) as Op;
				const blank = op === 'empty' || op === 'filled';
				const refs = customer ? customerRefsFor(kind) : [];
				const usesRef = isRef(c.value) || kind === 'owner';
				const options = optionsOf(c.field);
				const err = errorAt?.index === i ? errorAt.message : '';
				return (
					<Box key={i}>
						<Flex
							gap={2}
							align='center'
							wrap={{ base: 'wrap', md: 'nowrap' }}
							p={2}
							borderWidth='1px'
							borderColor={err ? 'red.solid' : 'border'}
							borderRadius='lg'>
							<Box flex={{ base: '1 1 45%', md: '0 0 190px' }}>
								<Dropdown
									size='sm'
									value={c.field}
									disabled={disabled}
									onChange={(v: string) => {
										const k = kindOf(v);
										set(i, { field: v, op: opsFor(k)[0], value: k === 'owner' ? { ref: 'customer' } : k === 'boolean' ? true : '' });
									}}
									items={fields.map(f => ({ value: f.key, label: f.label }))}
								/>
							</Box>
							<Box flex={{ base: '1 1 45%', md: '0 0 150px' }}>
								<Dropdown
									size='sm'
									value={op}
									disabled={disabled}
									onChange={(v: string) =>
										set(i, { ...c, op: v, value: v === 'empty' || v === 'filled' ? undefined : kind === 'owner' ? { ref: 'customer' } : c.value ?? '' })
									}
									items={ops.map(o => ({ value: o, label: (kind === 'date' && DATE_LABEL[o]) || LABEL[o] }))}
								/>
							</Box>
							{!blank && (
								<Flex
									flex='1 1 220px'
									gap={2}
									minW={0}>
									{refs.length > 0 && kind !== 'owner' && (
										<Box w='130px'>
											<Dropdown
												size='sm'
												value={usesRef ? 'customer' : 'value'}
												disabled={disabled}
												onChange={(v: string) => set(i, { ...c, value: v === 'customer' ? { ref: refs[0].value } : '' })}
												items={[
													{ value: 'value', label: 'a value' },
													{ value: 'customer', label: 'the customer' },
												]}
											/>
										</Box>
									)}
									<Box
										flex={1}
										minW={0}>
										{kind === 'owner' ? (
											<Text
												fontSize='13px'
												px={2}
												py={1.5}>
												{customer ? 'the signed-in customer' : 'the signed-in customer (pick “Signed-in customers” above)'}
											</Text>
										) : usesRef ? (
											<Dropdown
												size='sm'
												value={(c.value as any).ref}
												disabled={disabled}
												onChange={(v: string) => set(i, { ...c, value: { ref: v } })}
												items={refs}
											/>
										) : kind === 'boolean' ? (
											<Dropdown
												size='sm'
												value={String(c.value === true || c.value === 'true')}
												disabled={disabled}
												onChange={(v: string) => set(i, { ...c, value: v === 'true' })}
												items={[
													{ value: 'true', label: 'Yes' },
													{ value: 'false', label: 'No' },
												]}
											/>
										) : options.length && op !== 'in' ? (
											<Dropdown
												size='sm'
												value={String(c.value ?? '')}
												disabled={disabled}
												onChange={(v: string) => set(i, { ...c, value: v })}
												items={options.map(o => ({ value: o.value, label: o.label }))}
											/>
										) : (
											<Input
												size='sm'
												type={kind === 'number' || kind === 'formula' ? 'number' : kind === 'date' && op !== 'in' ? 'date' : 'text'}
												value={Array.isArray(c.value) ? c.value.join(', ') : String(c.value ?? '')}
												disabled={disabled}
												onChange={e => set(i, { ...c, value: e.target.value })}
												placeholder={
													op === 'in'
														? options.length
															? options.map(o => o.value).slice(0, 3).join(', ')
															: 'Values, comma-separated'
														: kind === 'reference' || kind === 'id'
														? 'A record’s _id'
														: 'Value'
												}
												aria-label='Value'
											/>
										)}
									</Box>
								</Flex>
							)}
							<IconButton
								aria-label='Remove this rule'
								size='xs'
								variant='ghost'
								disabled={disabled}
								onClick={() => onChange(value.filter((_, j) => j !== i))}>
								<X size={14} />
							</IconButton>
						</Flex>
						{err && (
							<Text
								fontSize='12.5px'
								color='red.fg'
								mt={1}>
								{err}
							</Text>
						)}
					</Box>
				);
			})}
			<Button
				alignSelf='flex-start'
				size='xs'
				variant='outline'
				disabled={disabled || !fields.length}
				onClick={add}>
				<Plus size={13} />
				{addLabel}
			</Button>
		</Flex>
	);
};

export default RuleEditor;
