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
 * A project's payments (tenant panel; docs/widgets W-06/W-07): its own Stripe
 * account (keys never shown again), the webhook Stripe must call — the only
 * thing that marks an order paid — where buyers come back to, and every
 * payment checkout made. Backend: routes-tenant/payments.router.ts. At
 * /site-payments because /payments is the old platform's page.
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

type Form = { enabled: boolean; mode: 'test' | 'live'; publishableKey: string; secretKey: string; webhookSecret: string; successUrl: string; cancelUrl: string };
const formOf = (s: SitePaymentSettings): Form => ({
	enabled: s.stripe.enabled,
	mode: s.stripe.mode,
	publishableKey: s.stripe.publishableKey,
	secretKey: '',
	webhookSecret: '',
	successUrl: s.successUrl,
	cancelUrl: s.cancelUrl,
});

const StripePanel: FC<{ s: SitePaymentSettings }> = ({ s }) => {
	const [save, saving] = useSaveSitePaymentSettingsMutation();
	const [check, checking] = useCheckSitePaymentKeysMutation();
	const [form, setForm] = useState<Form>(formOf(s));
	const [goLive, setGoLive] = useState(false);
	useEffect(() => setForm(formOf(s)), [JSON.stringify(s)]);
	const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));
	const dirty = JSON.stringify(form) !== JSON.stringify(formOf(s));
	const modeChanged = form.mode !== s.stripe.mode;

	const submit = async () => {
		try {
			await save({
				stripe: { enabled: form.enabled, mode: form.mode, publishableKey: form.publishableKey.trim(), secretKey: form.secretKey.trim() || undefined, webhookSecret: form.webhookSecret.trim() || undefined },
				successUrl: form.successUrl.trim(),
				cancelUrl: form.cancelUrl.trim(),
			}).unwrap();
			setGoLive(false);
			toaster.create({ type: 'success', title: form.enabled ? `Saved — your checkout takes ${form.mode === 'live' ? 'real' : 'test'} card payments.` : 'Saved.' });
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Not saved — try again.' });
		}
	};
	const onCheck = async () => {
		try {
			const r = await check().unwrap();
			toaster.create({ type: 'success', title: `Stripe accepted the ${r.mode} key.` });
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Couldn’t check — try again.' });
		}
	};

	return (
		<>
			<Panel
				id='stripe'
				title='Card payments — Stripe'
				subtitle='Your own Stripe account: buyers pay on Stripe’s page, the money goes to you'
				actions={<GuideLink section='stripe' />}>
				<Box
					mb={4}
					fontSize='13px'
					p={2.5}
					borderRadius='md'
					bg={s.stripe.enabled ? (s.stripe.mode === 'live' ? 'green.subtle' : 'orange.subtle') : 'bg.subtle'}
					color={s.stripe.enabled ? (s.stripe.mode === 'live' ? 'green.fg' : 'orange.fg') : 'fg'}>
					{s.stripe.enabled
						? s.stripe.mode === 'live'
							? 'On, live — real cards are charged.'
							: 'On, in test mode — use Stripe’s test cards (4242 4242 4242 4242); nothing is charged.'
						: 'Off — your checkout offers no card payments.'}
				</Box>
				<Flex
					direction='column'
					gap={4}>
					<Grid
						templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
						gap={3}>
						<Box>
							<Text {...labelCss}>Mode</Text>
							<Box mt={1.5}>
								<Dropdown
									size='sm'
									value={form.mode}
									onChange={v => set('mode', v as Form['mode'])}
									items={[
										{ value: 'test', label: 'Test — no real money' },
										{ value: 'live', label: 'Live — real payments' },
									]}
								/>
							</Box>
							{modeChanged && <Text {...help}>Switching mode needs that mode’s keys — the stored ones are for {s.stripe.mode}.</Text>}
						</Box>
						<Field.Root>
							<Field.Label {...labelCss}>Publishable key</Field.Label>
							<Input
								size='sm'
								fontFamily='mono'
								value={form.publishableKey}
								placeholder={`pk_${form.mode}_…`}
								onChange={e => set('publishableKey', e.target.value)}
							/>
							<Text {...help}>Stripe → Developers → API keys.</Text>
						</Field.Root>
						<Field.Root>
							<Field.Label {...labelCss}>Secret key</Field.Label>
							<Input
								size='sm'
								type='password'
								autoComplete='new-password'
								fontFamily='mono'
								value={form.secretKey}
								placeholder={s.stripe.secretKeySet && !modeChanged ? 'Stored — leave empty to keep it' : `sk_${form.mode}_…`}
								onChange={e => set('secretKey', e.target.value)}
							/>
							<Text {...help}>Kept encrypted; never shown again.</Text>
						</Field.Root>
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

					<Switch.Root
						size='sm'
						checked={form.enabled}
						onCheckedChange={e => set('enabled', !!e.checked)}>
						<Switch.HiddenInput />
						<Switch.Control />
						<Switch.Label fontSize='13px'>Offer card payments at checkout</Switch.Label>
					</Switch.Root>
				</Flex>
			</Panel>

			<Panel
				id='return-pages'
				title='After paying'
				subtitle='Where Stripe sends buyers back to on your site'
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
							onChange={e => set('successUrl', e.target.value)}
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
							onChange={e => set('cancelUrl', e.target.value)}
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
						onClick={() => (form.enabled && form.mode === 'live' && (s.stripe.mode !== 'live' || !s.stripe.enabled) ? setGoLive(true) : submit())}>
						Save
					</Button>
					{dirty && (
						<Button
							size='sm'
							variant='ghost'
							onClick={() => setForm(formOf(s))}>
							Discard
						</Button>
					)}
					<Button
						size='sm'
						variant='outline'
						disabled={!s.stripe.secretKeySet || dirty}
						loading={checking.isLoading}
						onClick={onCheck}>
						Check the key with Stripe
					</Button>
				</Flex>
			</Panel>

			<PromptDialog
				open={goLive}
				onClose={() => setGoLive(false)}
				tone='warning'
				title='Take real payments?'
				description='From now on your checkout charges real cards on your live Stripe account. Make a test payment in test mode first if you haven’t.'
				confirmLabel='Go live'
				loading={saving.isLoading}
				onConfirm={submit}
			/>
		</>
	);
};

const PaymentsList: FC = () => {
	const { data, isLoading } = useGetSitePaymentsQuery();
	const rows = data?.doc || [];
	return (
		<Panel
			id='payments-list'
			title='Payments'
			subtitle='Every checkout, newest first — only Stripe’s confirmation makes one Paid'
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
	const others = (data?.offered || []).filter(p => p !== 'stripe').map(p => data?.providers?.[p]?.name || p);

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
								provider’s secure page. The money goes straight to your own account — MINT never holds it. The order turns{' '}
								<b>Paid</b> only when the provider confirms it to MINT, so nobody can mark their own order paid. Set up the Shop’s
								orders on the Widgets page first.
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
