'use client';

import { FC } from 'react';
import { Box, Flex, Skeleton, Text } from '@chakra-ui/react';
import { Dropdown } from '@/components/library/cl';
import type { AuthMapping, AuthView } from '@/components/library/store/services/tenantApi';
import { help, label } from './parts';

/**
 * Login & account's own step in the setup wizard (docs/widgets W-24): which of
 * the project's models holds the customers, and which of its fields are their
 * email, name and phone. Sign-in itself (passwords, staying signed in) is
 * always MINT's own Customers; the chosen model gets a record per account,
 * linked to it and kept in step (backend functions/authMapping.function.ts).
 * Kept in step with the backend's AUTH_KINDS.
 */

const BUILT_IN = '__builtin';
const NONE = '__none';

const FIELDS: { key: keyof AuthMapping['fields']; label: string; kinds: string[]; required?: boolean; help: string }[] = [
	{ key: 'email', label: 'Email', kinds: ['email', 'text'], required: true, help: 'How an account finds its record — one record per email.' },
	{ key: 'name', label: 'Name', kinds: ['text'], help: 'Filled from the sign-up form.' },
	{ key: 'phone', label: 'Phone', kinds: ['text'], help: 'Filled when the customer gives one.' },
];

const CustomersStep: FC<{ auth?: AuthView; missing?: boolean; value: AuthMapping | null; onChange: (v: AuthMapping | null) => void }> = ({ auth, missing, value, onChange }) => {
	if (!auth && missing)
		return (
			<Text
				fontSize='13px'
				color='fg.muted'
				lineHeight='1.6'>
				Accounts are kept in MINT’s Customers page. Choosing a model of your own for customers isn’t available on this server yet —
				carry on, and pick one from Edit once it is.
			</Text>
		);
	if (!auth) return <Skeleton h='160px' />;
	const model = auth.models.find(m => m.name === value?.model);
	const choose = (name: string) => {
		if (name === BUILT_IN) return onChange(null);
		const m = auth.models.find(x => x.name === name);
		// Fields named like the part, to start from.
		const guess = (kinds: string[], re: RegExp) => m?.fields.find(f => kinds.includes(f.kind) && re.test(f.key))?.key;
		onChange({
			model: name,
			fields: {
				email: guess(['email', 'text'], /e-?mail/i) || '',
				name: guess(['text'], /^(name|full_?name|customer_?name)$/i),
				phone: guess(['text'], /phone|mobile/i),
			},
		});
	};

	return (
		<Flex
			direction='column'
			gap={4}>
			<Text
				fontSize='13px'
				color='fg.muted'
				lineHeight='1.6'>
				Who signs in on your site? Accounts — passwords and staying signed in — are always kept safely by MINT. If you have your own model for
				customers, pick it: each new account also gets a record there (or is linked to the one with the same email), so your team sees customers
				where they already work, and orders and other records can link to them.
			</Text>
			{auth.problem && (
				<Text
					fontSize='13px'
					color='orange.fg'>
					{auth.problem} Pick the model and fields again.
				</Text>
			)}
			<Box>
				<Text {...label}>Customer model</Text>
				<Dropdown
					size='sm'
					value={value?.model || BUILT_IN}
					onChange={(v: string) => choose(v)}
					items={[{ value: BUILT_IN, label: 'MINT’s Customers only (built in)' }, ...auth.models.map(m => ({ value: m.name, label: m.title }))]}
				/>
				<Text {...help}>
					{model ? `New accounts also get a record in ${model.title}.` : 'Accounts show on your Customers page. Pick a model to keep customers in your own as well.'}
				</Text>
			</Box>
			{model &&
				value &&
				FIELDS.map(f => {
					const fits = model.fields.filter(x => f.kinds.includes(x.kind));
					return (
						<Box key={f.key}>
							<Text {...label}>
								{f.label}
								{f.required ? '' : ' (optional)'}
							</Text>
							<Dropdown
								size='sm'
								value={value.fields[f.key] || NONE}
								onChange={(v: string) => onChange({ ...value, fields: { ...value.fields, [f.key]: v === NONE ? (f.required ? '' : undefined) : v } })}
								items={[{ value: NONE, label: f.required ? 'Choose a field' : 'None' }, ...fits.map(x => ({ value: x.key, label: x.label }))]}
							/>
							<Text
								{...help}
								color={f.required && !value.fields[f.key] ? 'orange.fg' : 'fg.muted'}>
								{fits.length === 0 ? `${model.title} has no ${f.kinds.join(' or ')} field for this.` : f.help}
							</Text>
						</Box>
					);
				})}
		</Flex>
	);
};

export default CustomersStep;
