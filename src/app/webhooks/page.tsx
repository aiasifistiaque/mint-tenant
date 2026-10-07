'use client';

import { FC, useState } from 'react';
import { Box, Button, Flex, IconButton, Skeleton, Switch, Text } from '@chakra-ui/react';
import { KeyRound, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { Layout, PromptDialog } from '@/components/library';
import { CopyValue, EmptyState, Panel, StatusDot, when } from '@/components/library/cl';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import {
	useCreateWebhookMutation,
	useDeleteWebhookMutation,
	useGetWebhooksQuery,
	useReplaceWebhookSecretMutation,
	useTestWebhookMutation,
	useUpdateWebhookMutation,
} from '@/components/library/store/services/tenantApi';
import type { Webhook, WebhookInput } from '@/components/library/store/services/tenantApi';
import WebhookDialog, { EVENT_LABEL } from './_components/WebhookDialog';
import DeliveryLog from './_components/DeliveryLog';
import { PAYLOAD_EXAMPLE, VERIFY_NODE } from './_components/verify';

/**
 * The project's outgoing webhooks (tenant panel; backend
 * routes-tenant/webhooks.router.ts, docs/templates T-09): when a record is
 * created, changed or deleted — here or through the public API — the project
 * POSTs it to an address of the tenant's, signed with the webhook's secret.
 * Each webhook: its model, events, address and note, on/off, Send test, a new
 * secret, and the log of its last 50 deliveries. Building permission (`build`).
 */

const message = (e: any, fallback: string) => e?.data?.message || fallback;

const Code: FC<{ children: string }> = ({ children }) => (
	<Box
		as='pre'
		m={0}
		p={3}
		fontSize='12px'
		fontFamily='mono'
		bg='bg.subtle'
		borderWidth='1px'
		borderColor='border'
		borderRadius='md'
		whiteSpace='pre-wrap'
		wordBreak='break-all'>
		{children}
	</Box>
);

const HookPanel: FC<{
	hook: Webhook;
	title: string;
	onEdit: () => void;
	onDelete: () => void;
	onSecret: () => void;
}> = ({ hook, title, onEdit, onDelete, onSecret }) => {
	const [log, setLog] = useState(false);
	const [update, updating] = useUpdateWebhookMutation();
	const [test, testing] = useTestWebhookMutation();
	const last = hook.lastDelivery;
	return (
		<Panel
			flush
			title={title}
			subtitle={`When a record is ${hook.events.map(ev => EVENT_LABEL[ev].toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' or $1')}`}
			actions={
				<Flex
					align='center'
					gap={1}>
					<Switch.Root
						size='sm'
						mr={2}
						checked={hook.active}
						disabled={!hook.url || updating.isLoading}
						title={hook.url ? undefined : 'Give it an address first'}
						onCheckedChange={e =>
							update({ id: hook._id, active: !!e.checked })
								.unwrap()
								.catch(err => toaster.create({ type: 'error', title: 'Not changed', description: message(err, 'Try again') }))
						}>
						<Switch.HiddenInput aria-label={`Webhook for ${title} on`} />
						<Switch.Control />
						<Switch.Label fontSize='12.5px'>{hook.active ? 'On' : 'Off'}</Switch.Label>
					</Switch.Root>
					<IconButton
						aria-label='Change it'
						size='xs'
						variant='ghost'
						onClick={onEdit}>
						<Pencil size={13} />
					</IconButton>
					<IconButton
						aria-label='A new secret'
						title='A new secret'
						size='xs'
						variant='ghost'
						onClick={onSecret}>
						<KeyRound size={13} />
					</IconButton>
					<IconButton
						aria-label='Delete the webhook'
						size='xs'
						variant='ghost'
						onClick={onDelete}>
						<Trash2 size={13} />
					</IconButton>
				</Flex>
			}>
			<Flex
				direction='column'
				gap={2}
				px={4}
				py={3}>
				<Text
					fontSize='12.5px'
					fontFamily='mono'
					color={hook.url ? 'fg' : 'fg.muted'}
					wordBreak='break-all'>
					{hook.url || 'No address yet — it’s off until you give it one.'}
				</Text>
				{hook.note && (
					<Text
						fontSize='12.5px'
						color='fg.muted'>
						{hook.note}
					</Text>
				)}
				<Flex
					align='center'
					gap={3}
					wrap='wrap'>
					{last ? (
						<Flex
							align='center'
							gap={2}
							minW={0}>
							<StatusDot
								tone={last.ok ? 'running' : 'failed'}
								showLabel={false}
							/>
							<Text
								fontSize='12px'
								color='fg.muted'
								truncate>
								{`${last.test ? 'The test' : 'The last delivery'} ${last.ok ? 'got through' : `failed${last.error ? ` — ${last.error}` : ''}`} · ${when(last.at)}`}
							</Text>
						</Flex>
					) : (
						<Text
							fontSize='12px'
							color='fg.muted'>
							Nothing sent yet.
						</Text>
					)}
					<Box flex={1} />
					<Button
						size='xs'
						variant='outline'
						disabled={!hook.url}
						loading={testing.isLoading}
						onClick={() =>
							test(hook._id)
								.unwrap()
								.then(d =>
									toaster.create(
										d.ok
											? { type: 'success', title: 'Test delivered', description: `Your server answered ${d.status}.` }
											: { type: 'error', title: 'The test didn’t get through', description: d.error || 'See the log below.' }
									)
								)
								.catch(err => toaster.create({ type: 'error', title: 'Not sent', description: message(err, 'Try again') }))
						}>
						<Send size={12} />
						Send test
					</Button>
					<Button
						size='xs'
						variant='ghost'
						onClick={() => setLog(o => !o)}>
						{log ? 'Hide the log' : 'Deliveries'}
					</Button>
				</Flex>
			</Flex>
			{log && <DeliveryLog id={hook._id} />}
		</Panel>
	);
};

export default function WebhooksPage() {
	const { can } = useWorkspace();
	const { data, isLoading } = useGetWebhooksQuery(undefined, { skip: !can('build') });
	const hooks = data?.doc || [];
	const models = data?.models || [];
	const titleOf = (route: string) => models.find(m => m.route === route)?.title || route;

	const [editing, setEditing] = useState<Webhook | null | undefined>(undefined);
	const [deleting, setDeleting] = useState<Webhook | null>(null);
	const [rolling, setRolling] = useState<Webhook | null>(null);
	const [secret, setSecret] = useState<{ value: string; fresh: boolean } | null>(null);
	const [create, creating] = useCreateWebhookMutation();
	const [update, updating] = useUpdateWebhookMutation();
	const [remove, removing] = useDeleteWebhookMutation();
	const [replace, replacing] = useReplaceWebhookSecretMutation();
	const [formError, setFormError] = useState('');

	const save = async (input: WebhookInput) => {
		setFormError('');
		try {
			if (editing) await update({ id: editing._id, ...input }).unwrap();
			else {
				const res = await create(input).unwrap();
				setSecret({ value: res.secret, fresh: true });
			}
			setEditing(undefined);
		} catch (e) {
			setFormError(message(e, 'Not saved — try again.'));
		}
	};

	if (!can('build'))
		return (
			<Layout
				title='Webhooks'
				path='webhooks'>
				<EmptyState
					title='Webhooks are set up by people who build the project'
					description='Ask someone with the Build permission.'
				/>
			</Layout>
		);

	return (
		<Layout
			title='Webhooks'
			path='webhooks'>
			<Flex
				direction='column'
				gap={4}>
				<Panel
					title='Webhooks'
					subtitle='Tell your own systems when records change'
					actions={<GuideLink section='webhooks' />}>
					<Text
						fontSize='13px'
						color='fg.muted'
						lineHeight='1.6'>
						When a record is created, changed or deleted — in this panel or through the public API — the project sends it to an
						address of yours: your server, Zapier, a Slack bridge. Each request is signed with the webhook’s secret so you can
						tell it came from here. If your server doesn’t answer with a 2xx, it’s tried 3 more times, waiting longer each time;
						every try is in the webhook’s log.
					</Text>
					<Button
						mt={3}
						size='sm'
						disabled={!models.length}
						onClick={() => {
							setFormError('');
							setEditing(null);
						}}>
						<Plus size={14} />
						Add a webhook
					</Button>
					{!isLoading && !models.length && (
						<Text
							mt={2}
							fontSize='12.5px'
							color='fg.muted'>
							Build a model first — webhooks send its records.
						</Text>
					)}
				</Panel>

				{isLoading ? (
					<Skeleton h='120px' />
				) : (
					hooks.map(h => (
						<HookPanel
							key={h._id}
							hook={h}
							title={titleOf(h.route)}
							onEdit={() => {
								setFormError('');
								setEditing(h);
							}}
							onDelete={() => setDeleting(h)}
							onSecret={() => setRolling(h)}
						/>
					))
				)}

				<Panel
					title='Checking a request came from here'
					subtitle='Every delivery is signed with the webhook’s secret'
					actions={<GuideLink section='verify-signatures' />}>
					<Flex
						direction='column'
						gap={3}>
						<Text
							fontSize='12.5px'
							color='fg.muted'
							lineHeight='1.6'>
							The headers <code>x-mint-event</code>, <code>x-mint-delivery</code>, <code>x-mint-timestamp</code> and{' '}
							<code>x-mint-signature</code> come with each request. The signature is <code>sha256=</code> and the HMAC-SHA256 of
							the timestamp, a dot and the body as it arrived, keyed with the secret. Work it out and compare; turn away anything
							that doesn’t match or is more than a few minutes old.
						</Text>
						<Code>{VERIFY_NODE}</Code>
						<Text
							fontSize='12.5px'
							color='fg.muted'>
							The body:
						</Text>
						<Code>{PAYLOAD_EXAMPLE}</Code>
					</Flex>
				</Panel>
			</Flex>

			<WebhookDialog
				open={editing !== undefined}
				onClose={() => setEditing(undefined)}
				hook={editing}
				models={models}
				loading={creating.isLoading || updating.isLoading}
				error={formError}
				onSave={save}
			/>

			<PromptDialog
				open={!!secret}
				onClose={() => setSecret(null)}
				tone='warning'
				icon={<KeyRound size={18} />}
				title={secret?.fresh ? 'The webhook’s secret' : 'The new secret'}
				description='Copy it into your server now — it isn’t shown again. If it’s lost, make a new one.'
				confirmLabel='I’ve copied it'
				onConfirm={() => setSecret(null)}>
				<CopyValue value={secret?.value || ''} />
			</PromptDialog>

			<PromptDialog
				open={!!rolling}
				onClose={() => setRolling(null)}
				tone='warning'
				title='Make a new secret?'
				subject={rolling ? titleOf(rolling.route) : ''}
				description='Requests are signed with the new one straight away, and the old one stops matching — update your server as soon as you’ve copied it.'
				confirmLabel='Make a new secret'
				loading={replacing.isLoading}
				onConfirm={async () => {
					try {
						const res = await replace(rolling!._id).unwrap();
						setRolling(null);
						setSecret({ value: res.secret, fresh: false });
					} catch (e) {
						toaster.create({ type: 'error', title: 'Not changed', description: message(e, 'Try again') });
					}
				}}
			/>

			<PromptDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				tone='danger'
				title='Delete this webhook?'
				subject={deleting ? `${titleOf(deleting.route)}${deleting.url ? ` → ${deleting.url}` : ''}` : ''}
				description='Nothing more is sent to the address, and its log goes too. Retries still waiting are dropped.'
				confirmLabel='Delete'
				loading={removing.isLoading}
				onConfirm={async () => {
					try {
						await remove(deleting!._id).unwrap();
						setDeleting(null);
					} catch (e) {
						toaster.create({ type: 'error', title: 'Not deleted', description: message(e, 'Try again') });
					}
				}}
			/>
		</Layout>
	);
}
