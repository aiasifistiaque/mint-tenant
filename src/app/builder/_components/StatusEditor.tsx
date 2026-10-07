'use client';

import { FC } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Dropdown } from '@/components/library/cl';
import { TableField } from './TableColumnsEditor';
import { DocLink, FieldLabel, Toggle } from './ui';

export type StatusConfig = {
	field: string;
	/** status → the statuses it may move to. A status not listed may move anywhere. */
	transitions?: Record<string, string[]>;
	requireReason?: boolean;
};

type Props = {
	value?: StatusConfig;
	onChange: (next: StatusConfig | undefined) => void;
	fields: TableField[];
};

/**
 * The route's status (route.status), used by the bulk "Change status": which
 * select field is the status, which moves are allowed (Draft → Sent, not
 * Paid → Draft), and whether a move needs a reason. Every move is allowed
 * until a chip is switched off.
 */
const StatusEditor: FC<Props> = ({ value, onChange, fields }) => {
	const selects = fields.filter(f => f.input === 'select' && (f.options || []).length);
	const field = selects.find(f => f.key === value?.field);
	const options: { value: string; label: string }[] = (field?.options || []).map((o: any) => ({
		value: String(o?.value ?? o),
		label: String(o?.label ?? o?.value ?? o),
	}));
	const transitions = value?.transitions || {};

	const set = (patch: Partial<StatusConfig>) => {
		const next: StatusConfig = { ...(value as StatusConfig), ...patch };
		if (!next.field) return onChange(undefined);
		if (!next.transitions || !Object.keys(next.transitions).length) delete next.transitions;
		if (!next.requireReason) delete next.requireReason;
		onChange(next);
	};

	/** Turn one move on or off; a status that may move everywhere drops out of the map. */
	const toggleMove = (from: string, to: string) => {
		const others = options.map(o => o.value).filter(v => v !== from);
		const current = transitions[from] ?? others;
		const nextList = current.includes(to) ? current.filter(v => v !== to) : [...current, to];
		const next = { ...transitions };
		if (others.every(v => nextList.includes(v))) delete next[from];
		else next[from] = others.filter(v => nextList.includes(v));
		set({ transitions: next });
	};

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
				<Box>
					<Text
						fontSize='sm'
						fontWeight='600'>
						Status
					</Text>
					<Text
						fontSize='xs'
						color='fg.muted'>
						What “Change status” moves, and which moves it allows.
					</Text>
				</Box>
				<DocLink section='table-status' />
			</Flex>

			<Box maxW='320px'>
				<FieldLabel>Status field</FieldLabel>
				<Dropdown
					size='sm'
					placeholder={selects.length ? 'None' : 'No select fields on this route'}
					value={value?.field || ''}
					onChange={v => (v === '__none' ? onChange(undefined) : set({ field: v, transitions: undefined }))}>
					<option value='__none'>None</option>
					{selects.map(f => (
						<option
							key={f.key}
							value={f.key}>
							{f.label}
						</option>
					))}
				</Dropdown>
			</Box>

			{field && options.length > 1 && (
				<Box>
					<FieldLabel>Allowed moves</FieldLabel>
					<Text
						fontSize='xs'
						color='fg.muted'
						mb={2}>
						Switch off a status a row may not move to. A row that can’t move is skipped and listed.
					</Text>
					<Flex
						direction='column'
						gap={2}>
						{options.map(from => {
							const allowed = transitions[from.value] ?? options.map(o => o.value).filter(v => v !== from.value);
							return (
								<Flex
									key={from.value}
									align='center'
									gap={2}
									flexWrap='wrap'>
									<Text
										fontSize='xs'
										w='120px'
										flexShrink={0}
										truncate>
										From <strong>{from.label}</strong>
									</Text>
									{options
										.filter(o => o.value !== from.value)
										.map(to => {
											const on = allowed.includes(to.value);
											return (
												<Box
													key={to.value}
													as='button'
													px={2}
													py={0.5}
													fontSize='xs'
													borderRadius='full'
													borderWidth='1px'
													borderColor={on ? 'fg' : 'border'}
													bg={on ? 'bg.inverted' : 'transparent'}
													color={on ? 'fg.inverted' : 'fg.muted'}
													textDecoration={on ? 'none' : 'line-through'}
													aria-pressed={on}
													onClick={() => toggleMove(from.value, to.value)}>
													{to.label}
												</Box>
											);
										})}
								</Flex>
							);
						})}
					</Flex>
				</Box>
			)}

			{field && (
				<Toggle
					label='Ask for a reason'
					hint='Every move needs a reason, saved in each record’s history.'
					checked={!!value?.requireReason}
					onChange={v => set({ requireReason: v || undefined })}
				/>
			)}
		</Flex>
	);
};

export default StatusEditor;
