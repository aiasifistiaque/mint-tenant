'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { Box, Button, Flex, Input, Link, Skeleton, Text, Textarea } from '@chakra-ui/react';
import { CircleCheck, CircleAlert, ExternalLink, RefreshCw } from 'lucide-react';
import { CopyValue, Dropdown, Panel, dateTime } from '../../cl';
import { PromptDialog } from '../..';
import GuideLink from '../../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import {
	useDisconnectStoreCourierMutation,
	useGetStoreCourierOptionsQuery,
	useGetStoreCouriersQuery,
	useRenewStoreCourierSecretMutation,
	useSaveStoreCourierMutation,
	useTestStoreCourierMutation,
} from '../../store/services/courierApi';
import type { CourierCard } from '../../store/services/courierApi';

/**
 * Delivery settings → the couriers (backend docs/couriers CR-03, CR-07, CR18):
 * each store connects its own courier account. A card per courier the store
 * turned on: where to open an account, which keys to paste from the courier's
 * own panel, Save & test, the courier's settings, and the webhook address and
 * secret to paste back into that panel. Keys are never shown back.
 */

const errText = (e: any) => e?.data?.message || e?.message || 'Something went wrong';
const ext = (href: string, children: ReactNode) => (
	<Link
		href={href}
		target='_blank'
		rel='noreferrer'
		color='blue.fg'
		display='inline-flex'
		alignItems='center'
		gap={1}>
		{children}
		<ExternalLink size={11} />
	</Link>
);

/** Where each courier keeps its keys and webhook, in its own panel's words. */
const STEPS: Record<string, (c: CourierCard) => ReactNode[]> = {
	steadfast: c => [
		<>No Steadfast merchant account yet? {ext(c.links.signUp, 'Open one')}.</>,
		<>In Steadfast, open {ext(c.links.keys, 'API')} and add a key named “Mint”. Paste its <b>API key</b> and <b>secret key</b> below, then Save &amp; test.</>,
		<>Then in Steadfast’s {ext(c.links.webhook || c.links.keys, 'Webhook')} page, paste the <b>Callback URL</b> and <b>Auth token</b> from below and press Save webhook. It replaces any address that’s there now (Steadfast keeps one per account).</>,
	],
	pathao: c => [
		<>No Pathao merchant account yet? {ext(c.links.signUp, 'Open one')}.</>,
		<>In Pathao, open {ext(c.links.keys, 'Developer API')} → Merchant API Credentials (press Generate Credentials if it’s empty). Paste the <b>client id</b> and <b>client secret</b>, and the email and password you sign in to Pathao with — or try Pathao’s sandbox first.</>,
		<>Then in Developer API → <b>Webhook Integration</b>, paste the Callback URL and secret from below, choose All events, press Add Webhook and use Pathao’s test button.</>,
	],
	redx: c => [
		<>No RedX merchant account yet? {ext(c.links.signUp, 'Open one')}.</>,
		<>In RedX, open {ext(c.links.keys, 'Developer APIs')} → Configuration and request a token (Production — the Sandbox token is on the same page for Test mode). Paste it below, then Save &amp; test and pick your pickup store.</>,
		<>Then in Developer APIs → <b>Webhook</b>, paste the address from below and press Enable. The address carries its own secret — keep it private.</>,
	],
	manual: () => [<>For couriers without an API (Sundarban, your own rider): name them below, one per line. On an order you type the tracking code, and move the parcel on by hand.</>],
};

const SettingInput: FC<{ c: CourierCard; field: CourierCard['fields']['settings'][number]; value: any; onChange: (v: any) => void }> = ({ c, field, value, onChange }) => {
	const connected = !!c.connection?.test?.ok;
	const { data } = useGetStoreCourierOptionsQuery({ id: c.id, what: field.from || 'stores' }, { skip: !field.from || !connected });
	const items = field.from ? (data?.choices || []).map(x => ({ value: x.value, label: x.label })) : field.options || [];
	return (
		<Box>
			<Text
				fontSize='13px'
				fontWeight='500'
				mb={1}>
				{field.label}
			</Text>
			{field.kind === 'select' ? (
				field.from && !connected ? (
					<Text
						fontSize='13px'
						color='fg.muted'>
						Chosen from your {c.name} account once it’s connected.
					</Text>
				) : (
					<Dropdown
						size='sm'
						value={value == null ? '' : String(value)}
						onChange={onChange}
						items={items}
					/>
				)
			) : field.key === 'names' ? (
				<Textarea
					size='sm'
					rows={4}
					fontFamily='mono'
					placeholder={'Sundarban | https://…/track/{tracking}\nOwn rider'}
					value={value ?? ''}
					onChange={e => onChange(e.target.value)}
				/>
			) : (
				<Input
					size='sm'
					type={field.kind === 'number' ? 'number' : 'text'}
					value={value ?? ''}
					onChange={e => onChange(e.target.value)}
				/>
			)}
			{field.helper && (
				<Text
					fontSize='12px'
					color='fg.muted'
					mt={1}>
					{field.helper}
				</Text>
			)}
		</Box>
	);
};

const CourierPanel: FC<{ c: CourierCard }> = ({ c }) => {
	const [save, saving] = useSaveStoreCourierMutation();
	const [test, testing] = useTestStoreCourierMutation();
	const [renew, renewing] = useRenewStoreCourierSecretMutation();
	const [disconnect, disconnecting] = useDisconnectStoreCourierMutation();
	const conn = c.connection;
	const [keys, setKeys] = useState<Record<string, string>>({});
	const [settings, setSettings] = useState<Record<string, any>>({});
	const [mode, setMode] = useState<string>(conn?.mode || (c.sandbox ? 'test' : 'live'));
	const [token, setToken] = useState('');
	const [askRenew, setAskRenew] = useState(false);
	const [askDisconnect, setAskDisconnect] = useState(false);
	useEffect(() => {
		setKeys(Object.fromEntries(c.fields.credentials.filter(f => !f.secret).map(f => [f.key, conn?.keys?.[f.key]?.value || ''])));
		setSettings(Object.fromEntries(c.fields.settings.map(f => [f.key, conn?.settings?.[f.key] ?? f.default ?? ''])));
		setMode(conn?.mode || (c.sandbox ? 'test' : 'live'));
	}, [c.id, conn?.updatedAt]);

	const anchor = `store-courier-${c.id}`;
	if (!c.on)
		return (
			<Panel
				id={anchor}
				title={c.name}
				subtitle='Turned off'
				actions={<GuideLink section={anchor} />}>
				<Text
					p={4}
					fontSize='13px'
					color='fg.muted'>
					Turn {c.name} on under Delivery above, save, and its card to connect your account appears here.
					{conn ? ' Your keys are kept meanwhile.' : ''}
				</Text>
			</Panel>
		);

	const run = async (p: Promise<any>, ok: (r: any) => string) => {
		try {
			const r = await p;
			toaster.create({ type: r?.connection?.test?.ok === false ? 'warning' : 'success', title: ok(r) });
		} catch (e) {
			toaster.error({ title: errText(e) });
		}
	};
	const typed = Object.fromEntries(Object.entries(keys).filter(([k, v]) => v && v !== conn?.keys?.[k]?.value));
	const onSave = () =>
		run(save({ id: c.id, mode, keys: typed, settings: Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, v])) }).unwrap(), r => r?.connection?.test?.message || 'Saved');
	const status = conn?.test;

	return (
		<Panel
			id={anchor}
			title={c.name}
			subtitle={conn?.tested ? status?.message : conn ? 'Not connected yet' : 'Connect your own account'}
			actions={<GuideLink section={anchor} />}>
			<Flex
				direction='column'
				gap={4}
				p={4}>
				<Box
					as='ol'
					pl={5}
					listStyleType='decimal'
					fontSize='13px'
					color='fg.muted'
					display='flex'
					flexDirection='column'
					gap={1}>
					{STEPS[c.id]?.(c).map((s, i) => (
						<li key={i}>{s}</li>
					))}
				</Box>

				{c.sandbox && (
					<Box maxW='260px'>
						<Text
							fontSize='13px'
							fontWeight='500'
							mb={1}>
							Mode
						</Text>
						<Dropdown
							size='sm'
							value={mode}
							onChange={setMode}
							items={[
								{ value: 'live', label: 'Live — real parcels' },
								{ value: 'test', label: `Test — ${c.name}’s sandbox` },
							]}
						/>
					</Box>
				)}

				{c.fields.credentials.length > 0 && (
					<Flex
						gap={3}
						wrap='wrap'>
						{c.fields.credentials.map(f => (
							<Box
								key={f.key}
								flex='1 1 240px'>
								<Text
									fontSize='13px'
									fontWeight='500'
									mb={1}>
									{f.label}
								</Text>
								<Input
									size='sm'
									type={f.secret ? 'password' : f.kind === 'email' ? 'email' : 'text'}
									autoComplete='off'
									placeholder={f.secret && conn?.keys?.[f.key]?.set ? '•••••••• saved — type to replace' : ''}
									value={keys[f.key] ?? ''}
									onChange={e => setKeys(k => ({ ...k, [f.key]: e.target.value }))}
								/>
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
				)}

				{c.fields.settings.length > 0 && (
					<Flex
						gap={3}
						wrap='wrap'>
						{c.fields.settings.map(f => (
							<Box
								key={f.key}
								flex={f.key === 'names' || f.key === 'hookReply' ? '1 1 100%' : '1 1 200px'}>
								<SettingInput
									c={c}
									field={f}
									value={settings[f.key]}
									onChange={v => setSettings(s => ({ ...s, [f.key]: v }))}
								/>
							</Box>
						))}
					</Flex>
				)}

				{status && (
					<Flex
						gap={2}
						align='flex-start'
						fontSize='13px'
						color={conn?.tested ? 'green.fg' : 'red.fg'}>
						{conn?.tested ? <CircleCheck size={15} /> : <CircleAlert size={15} />}
						<Text>
							{status.message}
							<Text
								as='span'
								color='fg.muted'>
								{' '}
								· tested {dateTime(status.at)}
							</Text>
						</Text>
					</Flex>
				)}

				{c.warnings.map(w => (
					<Box
						key={w}
						p={3}
						borderRadius='md'
						bg='orange.subtle'
						color='orange.fg'
						fontSize='13px'>
						{w}
					</Box>
				))}

				<Flex
					gap={2}
					wrap='wrap'
					justify='flex-end'>
					{conn && (
						<Button
							size='sm'
							variant='ghost'
							colorPalette='red'
							onClick={() => setAskDisconnect(true)}>
							Disconnect
						</Button>
					)}
					{c.id === 'pathao' && (
						<Button
							size='sm'
							variant='outline'
							loading={saving.isLoading}
							onClick={() => run(save({ id: c.id, sandbox: true, settings }).unwrap(), r => r?.connection?.test?.message || 'Saved')}>
							Try Pathao’s sandbox
						</Button>
					)}
					{conn && (
						<Button
							size='sm'
							variant='outline'
							loading={testing.isLoading}
							onClick={() => run(test(c.id).unwrap(), r => r?.connection?.test?.message || 'Tested')}>
							<RefreshCw size={14} /> Test again
						</Button>
					)}
					<Button
						size='sm'
						loading={saving.isLoading}
						onClick={onSave}>
						{c.fields.credentials.length ? 'Save & test' : 'Save'}
					</Button>
				</Flex>

				{conn?.webhook && c.id !== 'manual' && (
					<Box
						borderTopWidth='1px'
						pt={4}>
						<Text
							fontSize='14px'
							fontWeight='600'
							mb={1}>
							Webhook — so {c.name} tells Mint where each parcel is
						</Text>
						<Text
							fontSize='13px'
							color='fg.muted'
							mb={3}>
							Paste these into {c.name}’s webhook page
							{conn.webhook.panel ? <> ({ext(conn.webhook.panel, 'open it')})</> : null}. Mint also checks your parcels every 15 minutes, so nothing is missed if a call gets lost.
						</Text>
						<Flex
							direction='column'
							gap={2}
							fontSize='13px'>
							<Flex
								gap={2}
								align='center'
								wrap='wrap'>
								<Text
									w='120px'
									color='fg.muted'>
									Callback URL
								</Text>
								<CopyValue value={conn.webhook.url} />
							</Flex>
							{conn.webhook.secret && (
								<Flex
									gap={2}
									align='center'
									wrap='wrap'>
									<Text
										w='120px'
										color='fg.muted'>
										{c.id === 'steadfast' ? 'Auth token' : 'Secret'}
									</Text>
									<CopyValue
										value={conn.webhook.secret}
										display={`${conn.webhook.secret.slice(0, 6)}••••••••`}
									/>
									{conn.webhook.pasted && <Text color='fg.muted'>(the one you pasted from {c.name})</Text>}
								</Flex>
							)}
							<Text color='fg.muted'>
								{conn.webhook.lastAt ? `Last update from ${c.name}: ${dateTime(conn.webhook.lastAt)}` : `${c.name} hasn’t sent an update yet.`}
								{conn.webhook.refusedCalls ? ` · ${conn.webhook.refusedCalls} call${conn.webhook.refusedCalls === 1 ? '' : 's'} refused (wrong secret)` : ''}
							</Text>
						</Flex>
						<Flex
							gap={2}
							mt={3}
							wrap='wrap'
							align='center'>
							{c.ownWebhookSecret && (
								<>
									<Input
										size='sm'
										maxW='320px'
										placeholder={`Or paste the token ${c.name} generated`}
										value={token}
										onChange={e => setToken(e.target.value)}
									/>
									<Button
										size='sm'
										variant='outline'
										disabled={!token.trim()}
										loading={saving.isLoading}
										onClick={() => run(save({ id: c.id, webhookSecret: token.trim() }).unwrap(), () => 'Token saved').then(() => setToken(''))}>
										Use this token
									</Button>
								</>
							)}
							<Button
								size='sm'
								variant='ghost'
								onClick={() => setAskRenew(true)}>
								New secret
							</Button>
						</Flex>
					</Box>
				)}
			</Flex>

			<PromptDialog
				open={askRenew}
				onClose={() => setAskRenew(false)}
				onConfirm={() => run(renew(c.id).unwrap(), () => 'A new secret — paste it into the courier’s panel').then(() => setAskRenew(false))}
				tone='warning'
				title={`A new webhook secret for ${c.name}?`}
				description={`${c.name}’s calls with the old one are refused from now on — paste the new ${c.id === 'redx' ? 'address' : 'secret'} into ${c.name}’s panel straight away.`}
				confirmLabel='Make a new one'
				loading={renewing.isLoading}
			/>
			<PromptDialog
				open={askDisconnect}
				onClose={() => setAskDisconnect(false)}
				onConfirm={() => run(disconnect(c.id).unwrap(), () => `${c.name} disconnected`).then(() => setAskDisconnect(false))}
				tone='danger'
				title={`Disconnect ${c.name}?`}
				description={`Its keys are forgotten and orders can’t be sent to ${c.name} until you connect again. Parcels already delivered keep their history. It’s refused while parcels are still on their way.`}
				confirmLabel='Disconnect'
				loading={disconnecting.isLoading}
			/>
		</Panel>
	);
};

/** The courier cards under Delivery settings. */
const CourierCards: FC = () => {
	const { data, isLoading, error } = useGetStoreCouriersQuery();
	if (isLoading) return <Skeleton h='200px' />;
	if (error || !data) return null;
	const list = [...data.couriers].sort((a, b) => Number(b.on) - Number(a.on));
	return (
		<Flex
			direction='column'
			gap={4}
			id='store-couriers'>
			<Flex
				justify='space-between'
				align='baseline'
				gap={3}>
				<Box>
					<Text fontWeight='600'>Your courier accounts</Text>
					<Text
						fontSize='13px'
						color='fg.muted'>
						Each courier is your own merchant account: they bill you and pay your cash on delivery straight to you.
					</Text>
				</Box>
				<GuideLink section='store-couriers' />
			</Flex>
			{list.map(c => (
				<CourierPanel
					key={c.id}
					c={c}
				/>
			))}
		</Flex>
	);
};

export default CourierCards;
