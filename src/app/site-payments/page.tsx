'use client';

import { FC, useEffect, useState } from 'react';
import { Badge, Box, Button, Field, Flex, Grid, Input, Skeleton, Switch, Table, Text } from '@chakra-ui/react';
import { Layout, PromptDialog } from '@/components/library';
import { CopyValue, Dropdown, EmptyState, Panel } from '@/components/library/cl';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import {
	useCheckSitePaymentKeysMutation,
	useGetSitePaymentSettingsQuery,
	useGetSitePaymentsQuery,
	useSaveSitePaymentSettingsMutation,
} from '@/components/library/store/services/tenantApi';
import type { SitePayment, SitePaymentSettings } from '@/components/library/store/services/tenantApi';

/**
 * A project's payments (tenant panel; docs/widgets W-06/W-07/W-07b): its own
 * Stripe account (keys never shown again) and the webhook Stripe must call;
 * in Bangladesh also its own SSLCommerz store and bKash merchant account —
 * each sandbox or live, on or off; where buyers come back to; and every
 * payment checkout made. Only the provider, asked by MINT's server, marks an
 * order paid. Backend: routes-tenant/payments.router.ts. At /site-payments
 * because /payments is the old platform's page.
 */

const labelCss: any = { fontSize: '13px', fontWeight: '600', m: 0 };
const help = { fontSize: '12px', color: 'fg.muted', mt: 1 } as const;
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
const STATUS: Record<SitePayment['status'], { label: string; color: string }> = {
	created: { label: 'Started', color: 'gray' },
	pending: { label: 'Waiting', color: 'orange' },
	paid: { label: 'Paid', color: 'green' },
	failed: { label: 'Failed', color: 'red' },
	cancelled: { label: 'Cancelled', color: 'gray' },
	expired: { label: 'Abandoned', color: 'gray' },
	refunded: { label: 'Refunded', color: 'purple' },
};
const EVENTS = ['checkout.session.completed', 'checkout.session.expired', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed'];

const PROVIDER_NAME: Record<string, string> = { stripe: 'Stripe', sslcommerz: 'SSLCommerz', bkash: 'bKash' };
const MODES = (sandbox: boolean) => [
	{ value: 'test', label: sandbox ? 'Sandbox — no real money' : 'Test — no real money' },
	{ value: 'live', label: 'Live — real payments' },
];
const errorOf = (e: any, fallback: string) => e?.data?.message || fallback;

/** The coloured line at the top of each provider: off, on in sandbox/test, on live. */
const StateLine: FC<{ enabled: boolean; mode: 'test' | 'live'; off: string; test: string; live: string }> = ({ enabled, mode, off, test, live }) => (
	<Box
		mb={4}
		fontSize='13px'
		p={2.5}
		borderRadius='md'
		bg={enabled ? (mode === 'live' ? 'green.subtle' : 'orange.subtle') : 'bg.subtle'}
		color={enabled ? (mode === 'live' ? 'green.fg' : 'orange.fg') : 'fg'}>
		{enabled ? (mode === 'live' ? live : test) : off}
	</Box>
);

const ModeField: FC<{ value: 'test' | 'live'; stored: 'test' | 'live'; sandbox?: boolean; onChange: (v: 'test' | 'live') => void }> = ({ value, stored, sandbox, onChange }) => (
	<Box>
		<Text {...labelCss}>Mode</Text>
		<Box mt={1.5}>
			<Dropdown
				size='sm'
				value={value}
				onChange={v => onChange(v as 'test' | 'live')}
				items={MODES(!!sandbox)}
			/>
		</Box>
		{value !== stored && <Text {...help}>Switching mode needs that mode’s details — the stored ones are for {stored === 'live' ? 'live' : sandbox ? 'the sandbox' : 'test'}.</Text>}
	</Box>
);

const SecretField: FC<{ label: string; value: string; stored: boolean; placeholder: string; hint?: string; onChange: (v: string) => void }> = ({ label, value, stored, placeholder, hint, onChange }) => (
	<Field.Root>
		<Field.Label {...labelCss}>{label}</Field.Label>
		<Input
			size='sm'
			type='password'
			autoComplete='new-password'
			fontFamily='mono'
			value={value}
			placeholder={stored ? 'Stored — leave empty to keep it' : placeholder}
			onChange={e => onChange(e.target.value)}
		/>
		<Text {...help}>{hint || 'Kept encrypted; never shown again.'}</Text>
	</Field.Root>
);

const PlainField: FC<{ label: string; value: string; placeholder: string; hint?: string; onChange: (v: string) => void }> = ({ label, value, placeholder, hint, onChange }) => (
	<Field.Root>
		<Field.Label {...labelCss}>{label}</Field.Label>
		<Input
			size='sm'
			fontFamily='mono'
			value={value}
			placeholder={placeholder}
			onChange={e => onChange(e.target.value)}
		/>
		{hint && <Text {...help}>{hint}</Text>}
	</Field.Root>
);

const OnSwitch: FC<{ checked: boolean; label: string; onChange: (v: boolean) => void }> = ({ checked, label, onChange }) => (
	<Switch.Root
		size='sm'
		checked={checked}
		onCheckedChange={e => onChange(!!e.checked)}>
		<Switch.HiddenInput />
		<Switch.Control />
		<Switch.Label fontSize='13px'>{label}</Switch.Label>
	</Switch.Root>
);

/**
 * One provider's form: its own draft, Save (asking first when it's about to
 * take real money), Discard and "check the details with <provider>".
 */
const useProviderForm = <F extends { enabled: boolean; mode: 'test' | 'live' }>(
	provider: 'stripe' | 'sslcommerz' | 'bkash',
	stored: F,
	toBody: (f: F) => any,
	savedText: (f: F) => string
) => {
	const [save, saving] = useSaveSitePaymentSettingsMutation();
	const [check, checking] = useCheckSitePaymentKeysMutation();
	const [form, setForm] = useState<F>(stored);
	const [goLive, setGoLive] = useState(false);
	useEffect(() => setForm(stored), [JSON.stringify(stored)]);
	const set = <K extends keyof F>(k: K, v: F[K]) => setForm(f => ({ ...f, [k]: v }));
	const dirty = JSON.stringify(form) !== JSON.stringify(stored);
	const submit = async () => {
		try {
			await save({ [provider]: toBody(form) }).unwrap();
			setGoLive(false);
			toaster.create({ type: 'success', title: savedText(form) });
		} catch (e: any) {
			toaster.create({ type: 'error', title: errorOf(e, 'Not saved — try again.') });
		}
	};
	const onSave = () => (form.enabled && form.mode === 'live' && (stored.mode !== 'live' || !stored.enabled) ? setGoLive(true) : submit());
	const onCheck = async () => {
		try {
			const r = await check({ provider }).unwrap();
			toaster.create({ type: 'success', title: `${PROVIDER_NAME[provider]} accepted the ${r.mode === 'live' ? 'live' : provider === 'stripe' ? 'test' : 'sandbox'} details.` });
		} catch (e: any) {
			toaster.create({ type: 'error', title: errorOf(e, 'Couldn’t check — try again.') });
		}
	};
	return { form, set, dirty, saving: saving.isLoading, checking: checking.isLoading, onSave, submit, onCheck, goLive, setGoLive, reset: () => setForm(stored) };
};

const FormButtons: FC<{ f: ReturnType<typeof useProviderForm<any>>; name: string; canCheck: boolean }> = ({ f, name, canCheck }) => (
	<Flex
		gap={2}
		wrap='wrap'>
		<Button
			size='sm'
			disabled={!f.dirty}
			loading={f.saving}
			onClick={f.onSave}>
			Save
		</Button>
		{f.dirty && (
			<Button
				size='sm'
				variant='ghost'
				onClick={f.reset}>
				Discard
			</Button>
		)}
		<Button
			size='sm'
			variant='outline'
			disabled={!canCheck || f.dirty}
			loading={f.checking}
			onClick={f.onCheck}>
			Check the details with {name}
		</Button>
	</Flex>
);

const GoLiveDialog: FC<{ f: ReturnType<typeof useProviderForm<any>>; description: string }> = ({ f, description }) => (
	<PromptDialog
		open={f.goLive}
		onClose={() => f.setGoLive(false)}
		tone='warning'
		title='Take real payments?'
		description={description}
		confirmLabel='Go live'
		loading={f.saving}
		onConfirm={f.submit}
	/>
);

/** A note when the shop's currency is one this provider can't take. */
const CurrencyNote: FC<{ s: SitePaymentSettings; currencies: string[]; name: string }> = ({ s, currencies, name }) =>
	s.currency && !currencies.includes(s.currency) ? (
		<Box
			fontSize='12px'
			p={2.5}
			borderRadius='md'
			bg='red.subtle'
			color='red.fg'>
			Your shop’s prices are in {s.currency}; {name} takes {currencies.length === 1 ? currencies[0] : currencies.join(', ')} only — checkout won’t offer it until the
			Shop’s currency is {currencies.length === 1 ? currencies[0] : 'one of those'}.
		</Box>
	) : null;

type StripeForm = { enabled: boolean; mode: 'test' | 'live'; publishableKey: string; secretKey: string; webhookSecret: string };
const stripeOf = (s: SitePaymentSettings): StripeForm => ({ enabled: s.stripe.enabled, mode: s.stripe.mode, publishableKey: s.stripe.publishableKey, secretKey: '', webhookSecret: '' });

const StripePanel: FC<{ s: SitePaymentSettings }> = ({ s }) => {
	const f = useProviderForm<StripeForm>(
		'stripe',
		stripeOf(s),
		form => ({ enabled: form.enabled, mode: form.mode, publishableKey: form.publishableKey.trim(), secretKey: form.secretKey.trim() || undefined, webhookSecret: form.webhookSecret.trim() || undefined }),
		form => (form.enabled ? `Saved — your checkout takes ${form.mode === 'live' ? 'real' : 'test'} card payments.` : 'Saved.')
	);
	const { form, set } = f;
	const modeChanged = form.mode !== s.stripe.mode;

	return (
		<Panel
			id='stripe'
			title='Card payments — Stripe'
			subtitle='Your own Stripe account: buyers pay on Stripe’s page, the money goes to you'
			actions={<GuideLink section='stripe' />}>
			<StateLine
				enabled={s.stripe.enabled}
				mode={s.stripe.mode}
				off='Off — your checkout offers no card payments through Stripe.'
				test='On, in test mode — use Stripe’s test cards (4242 4242 4242 4242); nothing is charged.'
				live='On, live — real cards are charged.'
			/>
			<Flex
				direction='column'
				gap={4}>
				<Grid
					templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
					gap={3}>
					<ModeField
						value={form.mode}
						stored={s.stripe.mode}
						onChange={v => set('mode', v)}
					/>
					<PlainField
						label='Publishable key'
						value={form.publishableKey}
						placeholder={`pk_${form.mode}_…`}
						hint='Stripe → Developers → API keys.'
						onChange={v => set('publishableKey', v)}
					/>
					<SecretField
						label='Secret key'
						value={form.secretKey}
						stored={s.stripe.secretKeySet && !modeChanged}
						placeholder={`sk_${form.mode}_…`}
						onChange={v => set('secretKey', v)}
					/>
				</Grid>

				<Box
					id='stripe-webhook'
					p={3}
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'>
					<Text
						fontSize='13px'
						fontWeight='600'
						mb={1}>
						The webhook — how Stripe tells MINT an order is paid
					</Text>
					<Text
						fontSize='12px'
						color='fg.muted'
						lineHeight='1.6'
						mb={2}>
						In Stripe → Developers → Webhooks, add an endpoint with this address and the events{' '}
						{EVENTS.map((e, i) => (
							<span key={e}>
								<Box
									as='code'
									fontSize='11px'
									fontFamily='mono'>
									{e}
								</Box>
								{i < EVENTS.length - 1 ? ', ' : ''}
							</span>
						))}
						. Then paste its signing secret below. Without it no order can be marked paid.
					</Text>
					<CopyValue value={s.stripe.webhookUrl} />
					<Field.Root mt={3}>
						<Field.Label {...labelCss}>Signing secret</Field.Label>
						<Input
							size='sm'
							type='password'
							autoComplete='new-password'
							fontFamily='mono'
							maxW='420px'
							value={form.webhookSecret}
							placeholder={s.stripe.webhookSecretSet && !modeChanged ? 'Stored — leave empty to keep it' : 'whsec_…'}
							onChange={e => set('webhookSecret', e.target.value)}
						/>
					</Field.Root>
				</Box>

				<OnSwitch
					checked={form.enabled}
					label='Offer card payments through Stripe at checkout'
					onChange={v => set('enabled', v)}
				/>
				<FormButtons
					f={f}
					name='Stripe'
					canCheck={s.stripe.secretKeySet}
				/>
			</Flex>
			<GoLiveDialog
				f={f}
				description='From now on your checkout charges real cards on your live Stripe account. Make a test payment in test mode first if you haven’t.'
			/>
		</Panel>
	);
};

type SslForm = { enabled: boolean; mode: 'test' | 'live'; storeId: string; storePassword: string };
const sslOf = (s: SitePaymentSettings): SslForm => ({ enabled: s.sslcommerz.enabled, mode: s.sslcommerz.mode, storeId: s.sslcommerz.storeId, storePassword: '' });

const SslcommerzPanel: FC<{ s: SitePaymentSettings }> = ({ s }) => {
	const f = useProviderForm<SslForm>(
		'sslcommerz',
		sslOf(s),
		form => ({ enabled: form.enabled, mode: form.mode, storeId: form.storeId.trim(), storePassword: form.storePassword.trim() || undefined }),
		form => (form.enabled ? `Saved — your checkout takes ${form.mode === 'live' ? 'real' : 'sandbox'} payments through SSLCommerz.` : 'Saved.')
	);
	const { form, set } = f;
	const modeChanged = form.mode !== s.sslcommerz.mode;
	return (
		<Panel
			id='sslcommerz'
			title='Cards, mobile banking and net banking — SSLCommerz'
			subtitle='Your own SSLCommerz store: buyers pay by card, bKash, Nagad, Rocket or their bank on SSLCommerz’s page'
			actions={<GuideLink section='sslcommerz' />}>
			<StateLine
				enabled={s.sslcommerz.enabled}
				mode={s.sslcommerz.mode}
				off='Off — your checkout doesn’t offer SSLCommerz.'
				test='On, in the sandbox — SSLCommerz’s test page; nothing is charged.'
				live='On, live — real payments go to your SSLCommerz store.'
			/>
			<Flex
				direction='column'
				gap={4}>
				<CurrencyNote
					s={s}
					currencies={s.sslcommerz.currencies}
					name='SSLCommerz'
				/>
				<Grid
					templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
					gap={3}>
					<ModeField
						value={form.mode}
						stored={s.sslcommerz.mode}
						sandbox
						onChange={v => set('mode', v)}
					/>
					<PlainField
						label='Store id'
						value={form.storeId}
						placeholder={form.mode === 'live' ? 'yourstorelive' : 'yourstore123abc'}
						hint={form.mode === 'live' ? 'From SSLCommerz’s email when your store went live.' : 'A free sandbox store: developer.sslcommerz.com.'}
						onChange={v => set('storeId', v)}
					/>
					<SecretField
						label='Store password'
						value={form.storePassword}
						stored={s.sslcommerz.storePasswordSet && !modeChanged}
						placeholder='The API password, not your panel login'
						onChange={v => set('storePassword', v)}
					/>
				</Grid>
				<Box
					id='sslcommerz-ipn'
					p={3}
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'>
					<Text
						fontSize='13px'
						fontWeight='600'
						mb={1}>
						The IPN — how SSLCommerz tells MINT about a payment
					</Text>
					<Text
						fontSize='12px'
						color='fg.muted'
						lineHeight='1.6'
						mb={2}>
						MINT sends this address with every payment, so there’s nothing to set up. You can also put it in SSLCommerz’s merchant
						panel → My Stores → IPN Settings. Whatever arrives, MINT asks SSLCommerz’s validation service before an order turns Paid.
					</Text>
					<CopyValue value={s.sslcommerz.ipnUrl} />
				</Box>
				<OnSwitch
					checked={form.enabled}
					label='Offer SSLCommerz at checkout'
					onChange={v => set('enabled', v)}
				/>
				<FormButtons
					f={f}
					name='SSLCommerz'
					canCheck={s.sslcommerz.storePasswordSet}
				/>
			</Flex>
			<GoLiveDialog
				f={f}
				description='From now on your checkout takes real payments into your live SSLCommerz store. Make a sandbox payment first if you haven’t.'
			/>
		</Panel>
	);
};

type BkashForm = { enabled: boolean; mode: 'test' | 'live'; username: string; appKey: string; password: string; appSecret: string };
const bkashOf = (s: SitePaymentSettings): BkashForm => ({ enabled: s.bkash.enabled, mode: s.bkash.mode, username: s.bkash.username, appKey: s.bkash.appKey, password: '', appSecret: '' });

const BkashPanel: FC<{ s: SitePaymentSettings }> = ({ s }) => {
	const f = useProviderForm<BkashForm>(
		'bkash',
		bkashOf(s),
		form => ({
			enabled: form.enabled,
			mode: form.mode,
			username: form.username.trim(),
			appKey: form.appKey.trim(),
			password: form.password.trim() || undefined,
			appSecret: form.appSecret.trim() || undefined,
		}),
		form => (form.enabled ? `Saved — your checkout takes ${form.mode === 'live' ? 'real' : 'sandbox'} bKash payments.` : 'Saved.')
	);
	const { form, set } = f;
	const modeChanged = form.mode !== s.bkash.mode;
	return (
		<Panel
			id='bkash'
			title='bKash'
			subtitle='Your own bKash merchant account (Tokenized Checkout): buyers approve the payment in bKash with their PIN'
			actions={<GuideLink section='bkash' />}>
			<StateLine
				enabled={s.bkash.enabled}
				mode={s.bkash.mode}
				off='Off — your checkout doesn’t offer bKash.'
				test='On, in the sandbox — use bKash’s test wallet; nothing is charged.'
				live='On, live — real bKash payments go to your merchant account.'
			/>
			<Flex
				direction='column'
				gap={4}>
				<CurrencyNote
					s={s}
					currencies={s.bkash.currencies}
					name='bKash'
				/>
				<Grid
					templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
					gap={3}>
					<ModeField
						value={form.mode}
						stored={s.bkash.mode}
						sandbox
						onChange={v => set('mode', v)}
					/>
					<PlainField
						label='Username'
						value={form.username}
						placeholder='As bKash sent it'
						hint='bKash sends all four details when it opens your merchant account.'
						onChange={v => set('username', v)}
					/>
					<SecretField
						label='Password'
						value={form.password}
						stored={s.bkash.passwordSet && !modeChanged}
						placeholder='The API password'
						onChange={v => set('password', v)}
					/>
					<Box display={{ base: 'none', md: 'block' }} />
					<PlainField
						label='App key'
						value={form.appKey}
						placeholder='App key'
						onChange={v => set('appKey', v)}
					/>
					<SecretField
						label='App secret'
						value={form.appSecret}
						stored={s.bkash.appSecretSet && !modeChanged}
						placeholder='App secret'
						onChange={v => set('appSecret', v)}
					/>
				</Grid>
				<OnSwitch
					checked={form.enabled}
					label='Offer bKash at checkout'
					onChange={v => set('enabled', v)}
				/>
				<FormButtons
					f={f}
					name='bKash'
					canCheck={s.bkash.passwordSet && s.bkash.appSecretSet}
				/>
			</Flex>
			<GoLiveDialog
				f={f}
				description='From now on your checkout takes real bKash payments into your live merchant account. Make a sandbox payment first if you haven’t.'
			/>
		</Panel>
	);
};

const ReturnPagesPanel: FC<{ s: SitePaymentSettings }> = ({ s }) => {
	const [save, saving] = useSaveSitePaymentSettingsMutation();
	const stored = { successUrl: s.successUrl, cancelUrl: s.cancelUrl };
	const [form, setForm] = useState(stored);
	useEffect(() => setForm(stored), [s.successUrl, s.cancelUrl]);
	const dirty = form.successUrl !== s.successUrl || form.cancelUrl !== s.cancelUrl;
	const submit = async () => {
		try {
			await save({ successUrl: form.successUrl.trim(), cancelUrl: form.cancelUrl.trim() }).unwrap();
			toaster.create({ type: 'success', title: 'Saved.' });
		} catch (e: any) {
			toaster.create({ type: 'error', title: errorOf(e, 'Not saved — try again.') });
		}
	};
	return (
		<Panel
			id='return-pages'
			title='After paying'
			subtitle='Where buyers come back to on your site, whichever way they paid'
			actions={<GuideLink section='return-pages' />}>
			<Grid
				templateColumns={{ base: '1fr', md: '1fr 1fr' }}
				gap={3}>
				<Field.Root>
					<Field.Label {...labelCss}>Thank-you page</Field.Label>
					<Input
						size='sm'
						value={form.successUrl}
						placeholder={s.siteOrigin ? `${s.siteOrigin}/thank-you?ref={ref}` : 'https://yoursite.com/thank-you?ref={ref}'}
						onChange={e => setForm(f => ({ ...f, successUrl: e.target.value }))}
					/>
					<Text {...help}>
						Put the Thank-you widget there. <code>{'{ref}'}</code> becomes the payment’s reference.
						{s.siteOrigin ? ' Empty: the address shown.' : ' Needed until your site has a domain in Site setup.'}
					</Text>
				</Field.Root>
				<Field.Root>
					<Field.Label {...labelCss}>If they go back</Field.Label>
					<Input
						size='sm'
						value={form.cancelUrl}
						placeholder={s.siteOrigin ? `${s.siteOrigin}/cart` : 'https://yoursite.com/cart'}
						onChange={e => setForm(f => ({ ...f, cancelUrl: e.target.value }))}
					/>
					<Text {...help}>Usually your cart page.</Text>
				</Field.Root>
			</Grid>
			<Flex
				gap={2}
				mt={4}
				wrap='wrap'>
				<Button
					size='sm'
					disabled={!dirty}
					loading={saving.isLoading}
					onClick={submit}>
					Save
				</Button>
				{dirty && (
					<Button
						size='sm'
						variant='ghost'
						onClick={() => setForm(stored)}>
						Discard
					</Button>
				)}
			</Flex>
		</Panel>
	);
};

const PaymentsList: FC = () => {
	const { data, isLoading } = useGetSitePaymentsQuery();
	const rows = data?.doc || [];
	return (
		<Panel
			id='payments-list'
			title='Payments'
			subtitle='Every checkout, newest first — only the provider’s confirmation makes one Paid'
			actions={<GuideLink section='payments-list' />}
			flush>
			{isLoading ? (
				<Box p={4}>
					<Skeleton h='80px' />
				</Box>
			) : !rows.length ? (
				<Box p={4}>
					<Text
						fontSize='13px'
						color='fg.muted'>
						None yet. Each checkout on your site appears here, with its order.
					</Text>
				</Box>
			) : (
				<Box overflowX='auto'>
					<Table.Root size='sm'>
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeader>When</Table.ColumnHeader>
								<Table.ColumnHeader>Order</Table.ColumnHeader>
								<Table.ColumnHeader>Buyer</Table.ColumnHeader>
								<Table.ColumnHeader>Paid with</Table.ColumnHeader>
								<Table.ColumnHeader textAlign='end'>Amount</Table.ColumnHeader>
								<Table.ColumnHeader>Status</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{rows.map(p => (
								<Table.Row key={p._id}>
									<Table.Cell whiteSpace='nowrap'>{when(p.createdAt)}</Table.Cell>
									<Table.Cell whiteSpace='nowrap'>{p.orderCode || p.order.slice(-6)}</Table.Cell>
									<Table.Cell>{p.email}</Table.Cell>
									<Table.Cell whiteSpace='nowrap'>{PROVIDER_NAME[p.provider] || p.provider}</Table.Cell>
									<Table.Cell
										textAlign='end'
										whiteSpace='nowrap'>
										{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {p.currency}
									</Table.Cell>
									<Table.Cell>
										<Flex
											gap={1.5}
											align='center'
											wrap='wrap'>
											<Badge
												size='sm'
												colorPalette={STATUS[p.status]?.color || 'gray'}>
												{STATUS[p.status]?.label || p.status}
											</Badge>
											{p.mode === 'test' && (
												<Badge
													size='sm'
													variant='outline'>
													Test
												</Badge>
											)}
										</Flex>
										{p.error && (
											<Text
												fontSize='12px'
												color='fg.muted'
												mt={1}>
												{p.error}
											</Text>
										)}
									</Table.Cell>
								</Table.Row>
							))}
						</Table.Body>
					</Table.Root>
				</Box>
			)}
		</Panel>
	);
};

export default function SitePaymentsPage() {
	const { can, isLoading: loadingSelf } = useWorkspace();
	const allowed = can('manage-projects');
	const { data, isLoading, isError } = useGetSitePaymentSettingsQuery(undefined, { skip: !allowed });
	// Providers the country offers that this page can't set up yet.
	const others = (data?.offered || []).filter(p => !['stripe', 'sslcommerz', 'bkash'].includes(p) || data?.providers?.[p]?.ready === false).map(p => data?.providers?.[p]?.name || p);

	return (
		<Layout
			title='Payments'
			path='site-payments'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				{!allowed && !loadingSelf ? (
					<EmptyState
						title='Payments are set up by people who manage projects'
						description='Ask your organization’s owner or an admin.'
					/>
				) : isError ? (
					<EmptyState
						title='Payments aren’t available yet'
						description='They arrive with the next update of MINT — try again later.'
					/>
				) : isLoading || !data ? (
					<Skeleton h='320px' />
				) : (
					<>
						<Panel
							title='How payments work'
							actions={<GuideLink section='payments' />}>
							<Text
								fontSize='13px'
								color='fg.muted'
								lineHeight='1.6'>
								Your site’s Checkout widget writes the order at your catalogue’s prices and sends the buyer to your payment
								provider’s secure page — Stripe{data.offered.includes('sslcommerz') || data.offered.includes('bkash') ? ', SSLCommerz or bKash, whichever you switch on' : ''}. The
								money goes straight to your own account — MINT never holds it. The order turns <b>Paid</b> only when MINT’s server
								has asked the provider and it confirms the payment, so nobody can mark their own order paid. Set up the Shop’s orders
								on the Widgets page first.
							</Text>
						</Panel>
						{data.offered.includes('stripe') ? (
							<StripePanel s={data} />
						) : (
							<Panel title='Card payments — Stripe'>
								<Text
									fontSize='13px'
									color='fg.muted'>
									Stripe isn’t offered in your organization’s country.
								</Text>
							</Panel>
						)}
						{data.offered.includes('sslcommerz') && <SslcommerzPanel s={data} />}
						{data.offered.includes('bkash') && <BkashPanel s={data} />}
						<ReturnPagesPanel s={data} />
						{others.length > 0 && (
							<Panel
								title={`Also for your country: ${others.join(', ')}`}
								actions={<GuideLink section='coming' />}>
								<Text
									fontSize='13px'
									color='fg.muted'>
									Coming next, with cash on delivery and bank transfer.
								</Text>
							</Panel>
						)}
						<PaymentsList />
					</>
				)}
			</Flex>
		</Layout>
	);
}
