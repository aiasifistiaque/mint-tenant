'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, Input, Text } from '@chakra-ui/react';
import { CircleAlert, CircleCheck, CircleDashed } from 'lucide-react';
import { dateTime } from '../../cl';
import { PromptDialog } from '../..';
import { PasswordInput } from '@/components/ui/password-input';
import { toaster } from '@/components/ui/toaster';
import GuideLink from '../../tenant/GuideLink';
import { useRemoveStoreCourierChecksMutation, useSaveStoreCourierChecksMutation } from '../../store/services/courierApi';
import type { CourierCard } from '../../store/services/courierApi';

/**
 * Buyer checks with the store's own merchant-panel login (backend docs/couriers BUYER_CHECK.md §3a, CR-20, CR-22):
 * RedX and Pathao have no API for a buyer's delivery record, so Mint signs in to their merchant website with the
 * store's login — kept apart from the API keys, the password never shown back. A store can use it with a courier it
 * doesn't send with. Steadfast checks with its API keys, so it has no such section.
 */

const msg = (e: any) => e?.data?.message || e?.message || 'Something went wrong';

/** One line for the courier card: are buyer checks on? */
export const checksState = (c: CourierCard): ['good' | 'bad' | 'idle', string] | null => {
	const k = c.checks;
	if (!k) return null;
	if (k.status === 'on') return ['good', `Buyer checks on${k.lastOkAt ? ` — last fine ${dateTime(k.lastOkAt)}` : ''}`];
	if (k.status === 'off') return ['idle', 'Buyer checks: off'];
	return ['bad', `Buyer checks stopped — ${k.message || 'sign in again'}`];
};

/** `alone`: the whole form for a check-only courier (Paperfly, CarryBee — CR-26), no rule above it. */
const PanelChecks: FC<{ c: CourierCard; alone?: boolean }> = ({ c, alone }) => {
	const k = c.checks;
	const [save, saving] = useSaveStoreCourierChecksMutation();
	const [remove, removing] = useRemoveStoreCourierChecksMutation();
	const [keys, setKeys] = useState<Record<string, string>>({});
	const [ask, setAsk] = useState(false);
	useEffect(() => {
		if (k) setKeys(Object.fromEntries(k.fields.filter(f => !f.secret).map(f => [f.key, k.keys[f.key]?.value || ''])));
	}, [c.id, k?.at]);
	if (!k) return null;

	const typed = Object.fromEntries(Object.entries(keys).filter(([f, v]) => v && v !== k.keys[f]?.value));
	const onSave = async () => {
		try {
			const r = await save({ id: c.id, keys: typed }).unwrap();
			const s = r.checks;
			toaster.create({ type: s?.status === 'on' ? 'success' : 'warning', title: s?.message || 'Saved' });
			setKeys(x => Object.fromEntries(Object.entries(x).filter(([f]) => !k.fields.find(ff => ff.key === f)?.secret)));
		} catch (e) {
			toaster.error({ title: msg(e) });
		}
	};
	const onRemove = async () => {
		try {
			await remove(c.id).unwrap();
			toaster.success({ title: `${c.name} login removed — buyer checks with ${c.name} are off` });
			setAsk(false);
		} catch (e) {
			toaster.error({ title: msg(e) });
		}
	};
	const tone = k.status === 'on' ? 'green.fg' : k.status === 'off' ? 'fg.muted' : 'red.fg';
	const Icon = k.status === 'on' ? CircleCheck : k.status === 'off' ? CircleDashed : CircleAlert;
	// Blank fields on Pathao use the API connection's email and password.
	const canSave = Object.keys(typed).length > 0 || (k.reusesConnection && !!c.connection) || (k.status !== 'off' && k.status !== 'on');

	return (
		<Box
			id='store-courier-buyer-checks'
			borderTopWidth={alone ? 0 : '1px'}
			pt={alone ? 0 : 4}>
			<Flex
				justify='space-between'
				align='baseline'
				gap={3}>
				<Text
					fontSize='14px'
					fontWeight='600'>
					Buyer checks — how often a buyer takes {c.name} parcels
				</Text>
				<GuideLink section='store-courier-buyer-checks' />
			</Flex>
			<Text
				fontSize='13px'
				color='fg.muted'
				mt={1}>
				Mint looks up a buyer’s phone on {c.name}’s Fraud Check page when an order comes in, with your {c.name} merchant login.{' '}
				{!c.checksOnly && `You can use it even if you don’t send with ${c.name}.`}
			</Text>
			<Box
				mt={2}
				p={2}
				px={3}
				borderRadius='md'
				bg='orange.subtle'
				color='orange.fg'
				fontSize='12px'>
				{k.note}
			</Box>

			<Flex
				mt={3}
				gap={2}
				align='flex-start'
				fontSize='13px'
				color={tone}>
				<Icon size={15} />
				<Text>
					{k.status === 'off' ? `Off — add your ${c.name} login to check buyers with ${c.name}.` : k.message}
					{k.lastOkAt && k.status === 'on' && (
						<Text
							as='span'
							color='fg.muted'>
							{' '}
							· last fine {dateTime(k.lastOkAt)}
						</Text>
					)}
				</Text>
			</Flex>
			{k.lastError && k.status === 'on' && (
				<Text
					fontSize='12px'
					color='fg.muted'
					mt={1}
					pl={6}>
					Last problem {dateTime(k.lastError.at)}: {k.lastError.message}
				</Text>
			)}

			<Flex
				mt={3}
				gap={3}
				wrap='wrap'>
				{k.fields.map(f => (
					<Box
						key={f.key}
						flex='1 1 220px'>
						<Text
							fontSize='13px'
							fontWeight='500'
							mb={1}>
							{f.label}
						</Text>
						{f.secret ? (
							<PasswordInput
								size='sm'
								autoComplete='new-password'
								placeholder={k.keys[f.key]?.set ? '•••••••• saved — type to replace' : ''}
								value={keys[f.key] ?? ''}
								onChange={e => setKeys(x => ({ ...x, [f.key]: e.target.value }))}
							/>
						) : (
							<Input
								size='sm'
								type={f.kind === 'email' ? 'email' : 'text'}
								autoComplete='off'
								value={keys[f.key] ?? ''}
								onChange={e => setKeys(x => ({ ...x, [f.key]: e.target.value }))}
							/>
						)}
						{f.helper && (
							<Text
								fontSize='12px'
								color='fg.muted'
								mt={1}>
								{f.helper}
							</Text>
						)}
					</Box>
				))}
			</Flex>

			<Flex
				mt={3}
				gap={2}
				justify='flex-end'
				wrap='wrap'>
				{k.status !== 'off' && (
					<Button
						size='sm'
						variant='ghost'
						colorPalette='red'
						onClick={() => setAsk(true)}>
						Remove login
					</Button>
				)}
				<Button
					size='sm'
					loading={saving.isLoading}
					disabled={!canSave}
					onClick={onSave}>
					{k.status === 'on' ? 'Save & sign in again' : 'Save & sign in'}
				</Button>
			</Flex>

			<PromptDialog
				open={ask}
				onClose={() => setAsk(false)}
				onConfirm={onRemove}
				tone='warning'
				title={`Remove your ${c.name} login?`}
				description={`Buyer checks with ${c.name} stop and the login is forgotten.${c.connection ? ` Your ${c.name} connection for sending parcels stays.` : ''}`}
				confirmLabel='Remove login'
				loading={removing.isLoading}
			/>
		</Box>
	);
};

export default PanelChecks;
