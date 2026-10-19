'use client';

import { FC } from 'react';
import { Box, Button, Flex, Grid, Skeleton, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import type { AuthMapping, AuthView } from '@/components/library/store/services/tenantApi';
import { help, label } from './parts';

/**
 * Login & account's own step in the setup wizard (docs/widgets W-24): where the
 * customers are. MINT's Customers is the default. A model of the project's
 * own can be named instead, with which of its fields are the email, name and
 * phone, and how: a linked copy of each account (accounts stay in MINT's
 * Customers), or the model holds the accounts itself (a record is an
 * account). Only models switched on for sign-in (their Advanced tab, W-25)
 * are offered. Passwords always stay with MINT (backend
 * functions/authMapping.function.ts). Field kinds kept in step with the
 * backend's AUTH_KINDS.
 */

const BUILT_IN = '__builtin';
const NONE = '__none';

const FIELDS: { key: keyof AuthMapping['fields']; label: string; kinds: string[]; required?: boolean; help: string }[] = [
	{ key: 'email', label: 'Email', kinds: ['email', 'text'], required: true, help: 'One record per email.' },
	{ key: 'name', label: 'Name', kinds: ['text'], help: 'Filled from the sign-up form.' },
	{ key: 'phone', label: 'Phone', kinds: ['text'], help: 'Filled when the customer gives one.' },
	{
		key: 'role',
		label: 'Role',
		kinds: ['select'],
		help: 'An options field (Customer, Staff…). Sign-ups get its default; only your team changes it. Endpoints can let in only some roles.',
	},
];

/** Field kinds as the model builder names them. */
const KIND_WORD: Record<string, string> = { email: 'Email', text: 'Text', select: 'Options' };

const MODES: { value: AuthMapping['accounts']; title: string; text: (model: string) => string }[] = [
	{
		value: 'mint',
		title: 'Keep accounts in MINT’s Customers, with a copy here',
		text: model =>
			`Each new account also gets a record in ${model} (or is linked to the one with the same email). Your team can edit or remove those records; the accounts carry on.`,
	},
	{
		value: 'model',
		title: 'This model holds the accounts',
		text: model =>
			`Every sign-up is a record in ${model}, and the record’s email is what signs in. Removing a record ends that account. Records your team adds can’t sign in — they have no password.`,
	},
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
	const suggested = !value && auth.guess ? auth.models.find(m => m.name === auth.guess!.model) : null;
	const choose = (name: string) => {
		if (name === BUILT_IN) return onChange(null);
		if (auth.guess?.model === name) return onChange({ ...auth.guess, accounts: value?.accounts || 'mint' });
		const m = auth.models.find(x => x.name === name);
		// Fields named like the part, to start from.
		const guess = (kinds: string[], re: RegExp) => m?.fields.find(f => kinds.includes(f.kind) && re.test(f.key))?.key;
		onChange({
			model: name,
			accounts: value?.accounts || 'mint',
			fields: {
				email: guess(['email', 'text'], /e-?mail/i) || '',
				name: guess(['text'], /^(name|full_?name|customer_?name)$/i),
				phone: guess(['text'], /phone|mobile/i),
				role: guess(['select'], /role/i),
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
				Where do the people who sign up go? By default they’re kept in MINT’s Customers page. If you have a model of your own for customers,
				you can use it instead. Passwords are always kept safely by MINT and never go into your model.
			</Text>
			{auth.problem && (
				<Text
					fontSize='13px'
					color='orange.fg'>
					{auth.problem} Pick the model and fields again.
				</Text>
			)}
			<Box>
				<Text {...label}>Customers</Text>
				<Dropdown
					size='sm'
					value={value?.model || BUILT_IN}
					onChange={(v: string) => choose(v)}
					items={[{ value: BUILT_IN, label: 'MINT’s Customers (default)' }, ...auth.models.map(m => ({ value: m.name, label: m.title }))]}
				/>
				<Text {...help}>{model ? `Customers are kept with ${model.title}.` : 'Accounts show on your Customers page.'}</Text>
				{!model && (auth.models.length === 0 || !!auth.closed) && (
					<Text {...help}>
						{auth.models.length === 0 ? 'None of your models is open to sign-in yet. ' : 'Only models open to sign-in are listed. '}
						To use one, switch on <b>People can sign up and sign in</b> on its Advanced tab (Models → the model → Advanced).
					</Text>
				)}
				{suggested && (
					<Button
						size='xs'
						variant='outline'
						mt={2}
						onClick={() => choose(suggested.name)}>
						Use {suggested.title} instead
					</Button>
				)}
			</Box>
			{model && value && (
				<>
					<Box>
						<Text {...label}>How</Text>
						<Grid
							role='radiogroup'
							aria-label='How accounts are kept'
							gap={2}>
							{MODES.map(x => (
								<Flex
									key={x.value}
									as='button'
									role='radio'
									aria-checked={value.accounts === x.value}
									onClick={() => onChange({ ...value, accounts: x.value })}
									align='flex-start'
									gap={3}
									p={3}
									textAlign='left'
									borderWidth='1px'
									borderRadius='lg'
									borderColor={value.accounts === x.value ? 'fg.muted' : 'border'}
									bg={value.accounts === x.value ? 'bg.subtle' : 'transparent'}
									_hover={{ borderColor: 'fg.muted' }}>
									<Box
										flex={1}
										minW={0}>
										<Text
											fontSize='13.5px'
											fontWeight='500'>
											{x.title}
										</Text>
										<Text
											fontSize='12px'
											color='fg.muted'
											lineHeight='1.5'>
											{x.text(model.title)}
										</Text>
									</Box>
									{value.accounts === x.value && <Check size={15} />}
								</Flex>
							))}
						</Grid>
					</Box>
					{FIELDS.map(f => {
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
									{fits.length === 0
										? `${model.title} has no ${f.kinds.map(k => KIND_WORD[k] || k).join(' or ')} field for this.`
										: f.key === 'email' && value.accounts === 'model'
											? 'What customers sign in with.'
											: f.help}
								</Text>
							</Box>
						);
					})}
				</>
			)}
		</Flex>
	);
};

export default CustomersStep;
