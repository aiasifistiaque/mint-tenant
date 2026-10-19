'use client';

import { FC, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Dialog, Flex, Input, Portal, Skeleton, Text } from '@chakra-ui/react';
import { KeyRound, Plus, ShieldAlert } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, Layout, ModalFooter, PromptDialog } from '@/components/library';
import { CopyValue, EmptyState, PageHeader, Panel } from '@/components/library/cl';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { ago } from '@/components/library/modals/CreateModal/CreateModal';
import { toaster } from '@/components/ui/toaster';
import {
	useCreateServerKeyMutation,
	useGetApiEndpointsQuery,
	useGetServerKeysQuery,
	useRevokeServerKeyMutation,
} from '@/components/library/store/services/apiBuilderApi';
import type { ServerKey } from '@/components/library/store/services/apiBuilderApi';
import { ApiTabs, MethodBadge, apiBase, apiHref, errorOf, useProjectKey } from '../_components/shared';
import { withKey } from '../_components/api';
import ProjectKey from '../_components/ProjectKey';

/**
 * API → Keys (backend docs/api-builder D8, D14): first the project key every
 * call carries (?apiKey=) and its Regenerate; then secret server keys for endpoints
 * whose "who" is a server key — the business's own server, scripts or
 * partners. A key's secret is shown once, when it's made; afterwards only its
 * last four characters. Revoking one stops it at once.
 */

const NewKeyDialog: FC<{ open: boolean; onClose: () => void; base: string; keyPath?: string }> = ({ open, onClose, base, keyPath }) => {
	const apiKey = useProjectKey();
	const [name, setName] = useState('');
	const [made, setMade] = useState<ServerKey | null>(null);
	const [error, setError] = useState<{ message: string; on?: string } | null>(null);
	const [create, { isLoading }] = useCreateServerKeyMutation();
	useEffect(() => {
		if (!open) return;
		setName('');
		setMade(null);
		setError(null);
	}, [open]);

	const submit = async () => {
		setError(null);
		const res = await create({ name });
		if ('error' in res) return setError(errorOf(res.error, 'Couldn’t make the key — try again.'));
		setMade(res.data);
	};

	return (
		<Dialog.Root
			placement='center'
			size='md'
			open={open}
			closeOnInteractOutside={!made}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						borderWidth='1px'
						borderColor='border'
						_dark={{ bg: 'background.dark' }}>
						<AlertDialogHeader>{made ? 'Copy your key now' : 'New server key'}</AlertDialogHeader>
						<Dialog.Body
							p={4}
							pb={5}>
							{made ? (
								<Flex
									direction='column'
									gap={3}>
									<Flex
										gap={2.5}
										p={3}
										borderRadius='lg'
										bg='orange.subtle'
										color='orange.fg'
										align='flex-start'>
										<ShieldAlert
											size={16}
											style={{ flexShrink: 0, marginTop: 2 }}
										/>
										<Text fontSize='12.5px'>
											This is the only time it’s shown. Keep it on your server — in an environment variable or a secrets store — never in a
											website, an app, or a message.
										</Text>
									</Flex>
									<CopyValue value={made.secret || ''} />
									<Text
										fontSize='12.5px'
										color='fg.muted'>
										Send it as <code>Authorization: Bearer &lt;key&gt;</code> (or <code>X-Api-Key</code>) to the endpoints that need a server key:
									</Text>
									<Box
										as='pre'
										m={0}
										p={3}
										fontSize='12px'
										fontFamily='mono'
										whiteSpace='pre-wrap'
										wordBreak='break-all'
										bg='bg.subtle'
										borderWidth='1px'
										borderColor='border'
										borderRadius='md'>
										{`curl '${withKey(`${base}${keyPath || '/<path>'}`, apiKey)}' \\\n  -H "Authorization: Bearer $MINT_SERVER_KEY"`}
									</Box>
								</Flex>
							) : (
								<>
									<Text
										fontSize='12.5px'
										fontWeight='500'
										mb={1.5}>
										What will use it?
									</Text>
									<Input
										size='sm'
										value={name}
										onChange={e => setName(e.target.value)}
										onKeyDown={e => e.key === 'Enter' && name.trim() && submit()}
										placeholder='The shop’s till, the nightly import…'
										maxLength={80}
										autoFocus
										aria-label='Key name'
									/>
									{error && (
										<Text
											fontSize='12.5px'
											color='red.fg'
											mt={1.5}>
											{error.message}
										</Text>
									)}
									<Text
										fontSize='12px'
										color='fg.muted'
										mt={2}>
										One key per thing that calls the API, so you can revoke one without stopping the others.
									</Text>
								</>
							)}
						</Dialog.Body>
						<ModalFooter>
							{made ? (
								<Button
									size='sm'
									px={3}
									onClick={onClose}>
									I’ve copied it
								</Button>
							) : (
								<>
									<Button
										variant='outline'
										size='sm'
										px={3}
										onClick={onClose}>
										Cancel
									</Button>
									<Button
										size='sm'
										px={3}
										loading={isLoading}
										disabled={!name.trim()}
										onClick={submit}>
										Make key
									</Button>
								</>
							)}
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

const KeyRow: FC<{ k: ServerKey; onRevoke: () => void }> = ({ k, onRevoke }) => (
	<Flex
		align='center'
		gap={3}
		px={4}
		py={3}
		borderTopWidth='1px'
		borderColor='border.muted'
		_first={{ borderTopWidth: 0 }}
		opacity={k.revokedAt ? 0.6 : 1}>
		<Box color='fg.muted'>
			<KeyRound
				size={16}
				strokeWidth={1.75}
			/>
		</Box>
		<Box
			flex={1}
			minW={0}>
			<Text
				fontSize='13.5px'
				fontWeight='500'
				truncate>
				{k.name}
			</Text>
			<Text
				fontSize='12px'
				color='fg.muted'>
				<Text
					as='span'
					fontFamily='mono'
					fontSize='inherit'>
					mint_sk_…{k.last4}
				</Text>
				{' · '}made {ago(k.createdAt)}
				{k.createdByName ? ` by ${k.createdByName}` : ''}
				{' · '}
				{k.revokedAt ? `revoked ${ago(k.revokedAt)}` : k.lastUsedAt ? `last used ${ago(k.lastUsedAt)}` : 'not used yet'}
			</Text>
		</Box>
		{!k.revokedAt && (
			<Button
				size='xs'
				variant='outline'
				colorPalette='red'
				onClick={onRevoke}>
				Revoke
			</Button>
		)}
	</Flex>
);

export default function ApiKeysPage() {
	const { project, can, isLoading: loadingSelf } = useWorkspace();
	const allowed = IS_TENANT_PANEL && can('build');
	const { data, isLoading } = useGetServerKeysQuery(undefined, { skip: !allowed || !project });
	const { data: eps } = useGetApiEndpointsQuery(undefined, { skip: !allowed || !project });
	const [revoke, revoking] = useRevokeServerKeyMutation();
	const [making, setMaking] = useState(false);
	const [revokingKey, setRevokingKey] = useState<ServerKey | null>(null);
	const keys = data?.doc || [];
	const active = keys.filter(k => !k.revokedAt);
	const old = keys.filter(k => k.revokedAt);
	const keyEndpoints = (eps?.doc || []).filter(e => e.access.who === 'key');

	return (
		<Layout
			title='Keys'
			path='public-api-keys'>
			<Flex
				direction='column'
				gap={5}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: apiHref(), title: 'API' },
						{ href: '#', title: 'Keys' },
					]}
					title='Keys'
					meta='The project key every call carries, and secret keys for your own server, scripts or partners.'
					actions={
						allowed && (
							<>
								<GuideLink section='api-keys' />
								<Button
									size='sm'
									onClick={() => setMaking(true)}>
									<Plus size={14} />
									New key
								</Button>
							</>
						)
					}
				/>
				<ApiTabs />
				{!loadingSelf && !allowed ? (
					<EmptyState
						title='For people who build'
						description='Roles with Build make and revoke the project’s keys.'
					/>
				) : isLoading ? (
					<Skeleton h='160px' />
				) : (
					<>
						<ProjectKey canChange={allowed} />
						{active.length ? (
							<Panel
								title='Keys in use'
								flush>
								{active.map(k => (
									<KeyRow
										key={k._id}
										k={k}
										onRevoke={() => setRevokingKey(k)}
									/>
								))}
							</Panel>
						) : (
							<EmptyState
								title='No keys yet'
								description='Make one when your own server, a script or a partner needs to call an endpoint that asks for a server key.'
								action={
									<Button
										size='sm'
										onClick={() => setMaking(true)}>
										<Plus size={14} />
										New key
									</Button>
								}
							/>
						)}
						<Panel
							title='Endpoints that need a key'
							subtitle='Any key in use opens all of them.'
							flush>
							{keyEndpoints.length ? (
								keyEndpoints.map(e => (
									<NextLink
										key={e._id}
										href={apiHref(`/endpoints/${e._id}`)}>
										<Flex
											align='center'
											gap={3}
											px={4}
											py={2.5}
											borderTopWidth='1px'
											borderColor='border.muted'
											_hover={{ bg: 'bg.subtle' }}>
											<MethodBadge method={e.method} />
											<Text
												fontSize='13px'
												fontFamily='mono'
												flex={1}
												truncate>
												{e.path}
											</Text>
											<Text
												fontSize='12px'
												color='fg.muted'
												truncate>
												{e.name}
											</Text>
										</Flex>
									</NextLink>
								))
							) : (
								<Text
									p={4}
									fontSize='13px'
									color='fg.muted'>
									None yet — on an endpoint’s Access tab, pick “A server key”.
								</Text>
							)}
						</Panel>
						{old.length > 0 && (
							<Panel
								title='Revoked'
								flush>
								{old.map(k => (
									<KeyRow
										key={k._id}
										k={k}
										onRevoke={() => setRevokingKey(k)}
									/>
								))}
							</Panel>
						)}
					</>
				)}
			</Flex>
			<NewKeyDialog
				open={making}
				onClose={() => setMaking(false)}
				base={apiBase()}
				keyPath={keyEndpoints[0]?.path}
			/>
			<PromptDialog
				open={!!revokingKey}
				onClose={() => setRevokingKey(null)}
				onConfirm={async () => {
					const res = await revoke(revokingKey!._id);
					if ('data' in res) {
						toaster.create({ type: 'success', title: 'Key revoked' });
						setRevokingKey(null);
					}
				}}
				title={`Revoke “${revokingKey?.name}”?`}
				description='Calls with it stop working at once. Whatever uses it needs a new key. This can’t be undone.'
				loading={revoking.isLoading}
				confirmLabel='Revoke'
			/>
		</Layout>
	);
}
