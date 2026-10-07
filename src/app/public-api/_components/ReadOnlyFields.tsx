'use client';

import { FC } from 'react';
import { Box, Checkbox, Flex, Text } from '@chakra-ui/react';
import { Lock } from 'lucide-react';

/**
 * A model's read-only fields on the public API (backend
 * `publicApi.readOnlyFields`; a template endpoint's `readOnly`): what only the
 * business sets — an order's status, a payment reference, a tracking link. The
 * API never writes them: on create they take their default, on update what's
 * sent is ignored. Shown when the API can create or update; formulas are
 * always worked out by the server, so they're not offered.
 */

type Field = { key: string; label?: string; kind: string; required?: boolean; default?: any };

const ReadOnlyFields: FC<{
	fields: Field[];
	value: string[];
	onChange: (next: string[]) => void;
	disabled?: boolean;
}> = ({ fields, value, onChange, disabled }) => {
	const choices = fields.filter(f => f.key && f.kind !== 'formula');
	if (!choices.length) return null;
	const toggle = (key: string, on: boolean) => onChange(choices.map(f => f.key).filter(k => (k === key ? on : value.includes(k))));
	return (
		<Box mt={3}>
			<Flex
				align='center'
				gap={1.5}
				mb={1}>
				<Lock size={12} />
				<Text
					fontSize='12.5px'
					fontWeight='600'>
					Read-only fields
				</Text>
			</Flex>
			<Text
				fontSize='12px'
				color='fg.muted'
				mb={2}>
				What only your team sets — a status, a payment reference. Requests can’t write them: a new record gets the default, an
				update leaves them as they are.
			</Text>
			<Flex
				gap={3}
				rowGap={1.5}
				wrap='wrap'>
				{choices.map(f => (
					<Checkbox.Root
						key={f.key}
						size='sm'
						checked={value.includes(f.key)}
						disabled={disabled}
						onCheckedChange={x => toggle(f.key, !!x.checked)}
						title={f.key}>
						<Checkbox.HiddenInput />
						<Checkbox.Control />
						<Checkbox.Label fontSize='12.5px'>{f.label || f.key}</Checkbox.Label>
					</Checkbox.Root>
				))}
			</Flex>
		</Box>
	);
};

export default ReadOnlyFields;
