'use client';

import { FC, ReactNode, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, Code, Dialog, Flex, Input, Portal, Switch, Text } from '@chakra-ui/react';
import { Plus, Sparkles } from 'lucide-react';
import {
	AlertDialogContent,
	AlertDialogHeader,
	Layout,
	ModalFooter,
	useCreateApiKeyMutation,
	useGetApiKeysQuery,
	useRevokeApiKeyMutation,
} from '@/components/library';
import DiscardButton from '@/components/library/components/buttons/DiscardButton';
import { ConfirmAction, ConsoleTabs, CopyValue, Dropdown, EmptyState, PageHeader, Panel, TableSkeleton, when } from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import { DocLink } from '@/app/builder/_components/ui';
import { HOME } from '@/components/library/config/lib/constants/panel';

/**
 * Connect your own AI — Claude (Desktop, claude.ai, Claude Code), ChatGPT,
 * Cursor or any MCP client — to the builder. The user's own subscription does
 * the thinking: they describe a feature in their chat, the AI walks them
 * through each model, and builds it here through the /mcp endpoint
 * (backend library/controllers/mcp), with the same checks and build as the
 * feature wizard.
 *
 * A key acts as the admin who made it, never beyond their role. The secret is
 * shown once, when it's made.
 */

const COMPACT = { size: 'xs', h: '28px', px: 3 } as const;

/**
 * The backend's MCP endpoint, from the API base: /mcp for the admin API
 * (…/admin/api), /tenant/mcp for the tenant API (…/tenant/api) — where a
 * project key builds inside its project (docs/multi-tenancy WO-10).
 */
const mcpUrl = () => {
	const api = (process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:5000/admin/api').replace(/\/$/, '');
	if (/\/tenant\/api$/.test(api)) return `${api.replace(/\/api$/, '')}/mcp`;
	return `${api.replace(/\/admin\/api$/, '')}/mcp`;
};

const Snippet: FC<{ value: string }> = ({ value }) => (
	<Box
		position='relative'
		borderWidth='1px'
		borderColor='border'
		borderRadius='md'
		bg='bg.subtle'
		px={3}
		py={2.5}>
		<Code
			display='block'
			whiteSpace='pre-wrap'
			wordBreak='break-all'
			bg='transparent'
			fontSize='12px'
			pr={8}>
			{value}
		</Code>
		<Box
			position='absolute'
			top={1.5}
			right={1.5}>
			<CopyValue
				value={value}
				display=''
				ariaLabel='Copy'
			/>
		</Box>
	</Box>
);

const Steps: FC<{ items: ReactNode[] }> = ({ items }) => (
	<Box
		as='ol'
		pl={5}
		fontSize='sm'
		listStyleType='decimal'
		display='flex'
		flexDirection='column'
		gap={2}>
		{items.map((x, i) => (
			<li key={i}>{x}</li>
		))}
	</Box>
);

/** How to connect each client, with the key filled in when there is one to show. */
const ConnectGuide: FC<{ secret?: string }> = ({ secret }) => {
	const [tab, setTab] = useState('claude');
	const key = secret || 'emk_YOUR_KEY';
	const url = mcpUrl();
	const local = /localhost|127\.0\.0\.1/.test(url);

	return (
		<Flex
			direction='column'
			gap={3}>
			{local && (
				<Text
					fontSize='xs'
					color='orange.fg'>
					The backend is on {url.replace(/\/mcp$/, '')}. claude.ai, Claude Desktop connectors and ChatGPT reach it from the internet, so they need
					the deployed backend’s https address; Claude Code and Cursor on this computer can use localhost.
				</Text>
			)}
			<ConsoleTabs
				value={tab}
				onChange={setTab}
				tabs={[
					{ value: 'claude', label: 'Claude Desktop / claude.ai' },
					{ value: 'chatgpt', label: 'ChatGPT' },
					{ value: 'code', label: 'Claude Code' },
					{ value: 'cursor', label: 'Cursor' },
					{ value: 'other', label: 'Other' },
				]}>
				<Box pt={3}>
					{tab === 'claude' && (
						<Steps
							items={[
								<>Open Claude → Settings → Connectors → Add custom connector.</>,
								<>
									Name it “e-mint” and paste this URL (the key is part of it, so keep it private):
									<Box mt={1.5}>
										<Snippet value={`${url}/${key}`} />
									</Box>
								</>,
								<>Leave the OAuth fields empty and add it. In a chat, turn the e-mint connector on from the tools menu.</>,
								<>Describe a feature — Claude plans it with you step by step, then builds it here.</>,
							]}
						/>
					)}
					{tab === 'chatgpt' && (
						<Steps
							items={[
								<>In ChatGPT: Settings → Apps & Connectors → Advanced settings → turn on Developer mode.</>,
								<>
									Create a connector: name “e-mint”, MCP server URL:
									<Box mt={1.5}>
										<Snippet value={`${url}/${key}`} />
									</Box>
								</>,
								<>Authentication: No authentication (the key is in the URL). Tick “I trust this application” and create it.</>,
								<>In a new chat, pick the connector under “+” → Developer mode, and describe a feature.</>,
							]}
						/>
					)}
					{tab === 'code' && (
						<Steps
							items={[
								<>
									Run in a terminal:
									<Box mt={1.5}>
										<Snippet value={`claude mcp add --transport http emint ${url} --header "Authorization: Bearer ${key}"`} />
									</Box>
								</>,
								<>Start Claude Code and ask it to build a feature in e-mint.</>,
							]}
						/>
					)}
					{tab === 'cursor' && (
						<Steps
							items={[
								<>
									Add to <Code fontSize='xs'>~/.cursor/mcp.json</Code> (or the project’s <Code fontSize='xs'>.cursor/mcp.json</Code>):
									<Box mt={1.5}>
										<Snippet
											value={JSON.stringify({ mcpServers: { emint: { url, headers: { Authorization: `Bearer ${key}` } } } }, null, 2)}
										/>
									</Box>
								</>,
								<>Reload Cursor; the e-mint tools appear in Agent mode.</>,
							]}
						/>
					)}
					{tab === 'other' && (
						<Steps
							items={[
								<>
									Any MCP client that speaks Streamable HTTP. Endpoint:
									<Box mt={1.5}>
										<Snippet value={url} />
									</Box>
								</>,
								<>
									Send the key as a header — or, when the client only takes a URL, append it: <Code fontSize='xs'>{url}/{'<key>'}</Code>
									<Box mt={1.5}>
										<Snippet value={`Authorization: Bearer ${key}`} />
									</Box>
								</>,
							]}
						/>
					)}
				</Box>
			</ConsoleTabs>
		</Flex>
	);
};

const NewKeyDialog: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
	const [create, { isLoading }] = useCreateApiKeyMutation();
	const [name, setName] = useState('');
	const [build, setBuild] = useState(true);
	const [data, setData] = useState(false);
	const [days, setDays] = useState('');
	const [made, setMade] = useState<{ secret: string; name: string } | null>(null);

	const close = () => {
		setName('');
		setBuild(true);
		setData(false);
		setDays('');
		setMade(null);
		onClose();
	};

	const run = async () => {
		try {
			const scopes = ['read', ...(build ? ['build'] : []), ...(data ? ['data'] : [])];
			const res = await create({ name: name.trim(), scopes, ...(days && { expiresInDays: Number(days) }) }).unwrap();
			setMade({ secret: res.secret, name: res.doc.name });
		} catch (e: any) {
			toaster.create({ type: 'error', title: 'Could not create the key', description: e?.data?.message });
		}
	};

	return (
		<Dialog.Root
			placement='center'
			size={made ? 'lg' : 'md'}
			lazyMount
			unmountOnExit
			open={open}
			onOpenChange={e => !e.open && !isLoading && close()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						borderWidth='1px'
						borderColor='border'
						_dark={{ bg: 'background.dark' }}>
						<AlertDialogHeader>{made ? `“${made.name}” is ready` : 'New API key'}</AlertDialogHeader>
						<Dialog.Body
							p={4}
							pb={6}>
							{made ? (
								<Flex
									direction='column'
									gap={4}>
									<Box>
										<Text
											fontSize='sm'
											fontWeight='600'
											mb={1}>
											The key — shown only now
										</Text>
										<Text
											fontSize='xs'
											color='fg.muted'
											mb={2}>
											Copy it into your AI client. It isn’t stored in a form that can be shown again; if it’s lost, revoke it and make another.
										</Text>
										<Snippet value={made.secret} />
									</Box>
									<ConnectGuide secret={made.secret} />
								</Flex>
							) : (
								<Flex
									direction='column'
									gap={4}>
									<Box>
										<Text
											fontSize='xs'
											fontWeight='600'
											mb={1.5}>
											Name
										</Text>
										<Input
											size='sm'
											autoFocus
											value={name}
											placeholder='e.g. Claude Desktop'
											onChange={e => setName(e.target.value)}
											onKeyDown={e => e.key === 'Enter' && name.trim() && run()}
										/>
									</Box>
									<Switch.Root
										size='sm'
										checked={build}
										onCheckedChange={e => setBuild(e.checked)}>
										<Switch.HiddenInput />
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
										<Switch.Label fontSize='sm'>Can build (off: it can only read the models and check plans)</Switch.Label>
									</Switch.Root>
									<Switch.Root
										size='sm'
										checked={data}
										onCheckedChange={e => setData(e.checked)}>
										<Switch.HiddenInput />
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
										<Switch.Label fontSize='sm'>Can read records (for questions and analysis — only pages you can view, read-only)</Switch.Label>
									</Switch.Root>
									<Box maxW='240px'>
										<Text
											fontSize='xs'
											fontWeight='600'
											mb={1.5}>
											Expires
										</Text>
										<Dropdown
											size='sm'
											value={days}
											onChange={setDays}>
											<option value=''>Never</option>
											<option value='7'>In 7 days</option>
											<option value='30'>In 30 days</option>
											<option value='90'>In 90 days</option>
											<option value='365'>In a year</option>
										</Dropdown>
									</Box>
									<Text
										fontSize='xs'
										color='fg.muted'>
										The key acts as you, and can never do more than your role allows.
									</Text>
								</Flex>
							)}
						</Dialog.Body>
						<ModalFooter>
							{made ? (
								<Button
									{...COMPACT}
									onClick={close}>
									Done
								</Button>
							) : (
								<>
									<DiscardButton
										{...COMPACT}
										disabled={isLoading}
										onClick={close}>
										Cancel
									</DiscardButton>
									<Button
										{...COMPACT}
										loading={isLoading}
										disabled={!name.trim()}
										onClick={run}>
										Create key
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

const statusOf = (k: any) =>
	k.revokedAt ? { label: 'Revoked', tone: 'gray' } : k.expiresAt && new Date(k.expiresAt) < new Date() ? { label: 'Expired', tone: 'orange' } : { label: 'Active', tone: 'green' };

const ConnectPage = () => {
	const { data, isLoading } = useGetApiKeysQuery();
	const [revoke, { isLoading: revoking }] = useRevokeApiKeyMutation();
	const [creating, setCreating] = useState(false);
	const [toRevoke, setToRevoke] = useState<any>(null);
	const keys = data?.doc || [];

	return (
		<Layout
			title='Connect your AI'
			path='model-builder'>
			<Flex
				direction='column'
				gap={5}
				pb={10}
				maxW='960px'>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '/model-builder', title: 'Models' },
						{ href: '/model-builder/connect', title: 'Connect your AI' },
					]}
					title='Connect your AI'
					meta='Use your own Claude or ChatGPT to plan features and build them here'
					actions={
						<Button
							size='sm'
							onClick={() => setCreating(true)}>
							<Plus size={14} />
							New key
						</Button>
					}
				/>

				<Panel
					title='How it works'
					actions={<DocLink section='mcp' />}>
					<Flex
						direction='column'
						gap={2}
						fontSize='sm'>
						<Text>
							Your AI connects over MCP with a key from this page, using your own subscription. Describe a feature in your chat — “leave management
							for our staff” — and it:
						</Text>
						<Steps
							items={[
								'looks at the models you already have,',
								'plans the new models and how they link, reusing what exists,',
								'walks you through each model one at a time — for an existing model, only what changes — and waits for you to confirm,',
								'builds it all here once you say go: models, fields, tabs, pages and sidebar entries.',
							]}
						/>
						<Text color='fg.muted'>
							It uses the same checks and build as{' '}
							<NextLink
								href='/model-builder/features/new'
								style={{ textDecoration: 'underline' }}>
								the feature wizard
							</NextLink>
							, and every build shows up under{' '}
							<NextLink
								href='/model-builder/features'
								style={{ textDecoration: 'underline' }}>
								Features
							</NextLink>
							.
						</Text>
					</Flex>
				</Panel>

				<Panel
					title='API keys'
					subtitle='Each key acts as the admin who made it. Revoke one and it stops working at once.'
					actions={<DocLink section='mcp-keys' />}
					flush>
					{isLoading ? (
						<Box p={4}>
							<TableSkeleton rows={3} />
						</Box>
					) : !keys.length ? (
						<Box p={4}>
							<EmptyState
								title='No keys yet'
								description='Make one for each AI client you connect.'
								action={
									<Button
										size='sm'
										onClick={() => setCreating(true)}>
										<Plus size={14} />
										New key
									</Button>
								}
							/>
						</Box>
					) : (
						keys.map((k: any, i: number) => {
							const status = statusOf(k);
							return (
								<Flex
									key={k._id}
									align='center'
									gap={3}
									px={4}
									py={3}
									borderTopWidth={i ? '1px' : 0}
									borderColor='border.muted'
									flexWrap='wrap'>
									<Box
										flex={1}
										minW='200px'>
										<Flex
											align='center'
											gap={2}>
											<Text
												fontSize='sm'
												fontWeight='600'>
												{k.name}
											</Text>
											<Badge
												size='sm'
												colorPalette={status.tone}
												variant='subtle'>
												{status.label}
											</Badge>
										</Flex>
										<Text
											fontSize='xs'
											color='fg.muted'>
											<Text
												as='span'
												fontFamily='mono'>
												{k.prefix}…
											</Text>{' '}
											· {k.scopes?.includes('build') ? 'read & build' : 'read only'}
										{k.scopes?.includes('data') ? ' + records' : ''} · by {k.createdBy?.name || k.createdBy?.email || 'someone'} · last used{' '}
											{k.lastUsedAt ? when(k.lastUsedAt) : 'never'}
											{k.expiresAt ? ` · expires ${when(k.expiresAt)}` : ''}
										</Text>
									</Box>
									{!k.revokedAt && (
										<Button
											size='xs'
											variant='ghost'
											colorPalette='red'
											onClick={() => setToRevoke(k)}>
											Revoke
										</Button>
									)}
								</Flex>
							);
						})
					)}
				</Panel>

				<Panel
					title='Connect a client'
					subtitle='Make a key first — the instructions then show it filled in. These use a placeholder.'
					actions={<DocLink section='mcp-connect' />}>
					<ConnectGuide />
				</Panel>

				<Panel title='Try it'>
					<Flex
						align='flex-start'
						gap={2}
						fontSize='sm'>
						<Sparkles
							size={14}
							style={{ marginTop: 3 }}
						/>
						<Text>
							“Using e-mint, build a leave management feature: leave types with a yearly allowance, leave requests by staff members with dates, a status
							and an approver. Walk me through each model before building.”
						</Text>
					</Flex>
				</Panel>
			</Flex>

			<NewKeyDialog
				open={creating}
				onClose={() => setCreating(false)}
			/>
			<ConfirmAction
				isOpen={!!toRevoke}
				onClose={() => setToRevoke(null)}
				onConfirm={async () => {
					try {
						await revoke(toRevoke._id).unwrap();
						toaster.create({ type: 'success', title: `“${toRevoke.name}” revoked` });
					} catch (e: any) {
						toaster.create({ type: 'error', title: 'Could not revoke the key', description: e?.data?.message });
					}
					setToRevoke(null);
				}}
				title={`Revoke “${toRevoke?.name}”?`}
				consequence='Any AI client using it stops working straight away. This can’t be undone — make a new key to reconnect.'
				confirmLabel='Revoke'
				destructive
				isLoading={revoking}
			/>
		</Layout>
	);
};

export default ConnectPage;
