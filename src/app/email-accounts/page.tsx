'use client';

import { FC, useState } from 'react';
import { Badge, Box, Button, Flex, IconButton, Input, Menu, Portal, Skeleton, Table, Text } from '@chakra-ui/react';
import { Ellipsis, Mail, Plus } from 'lucide-react';
import { Layout, PromptDialog } from '@/components/library';
import { Dropdown, EmptyState, Panel } from '@/components/library/cl';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import {
	useGetMailAccountsQuery,
	useRemoveMailAccountMutation,
	useSendMailAccountTestMutation,
	useSetDefaultMailAccountMutation,
} from '@/components/library/store/services/tenantApi';
import type { MailAccount, MailLogEntry } from '@/components/library/store/services/tenantApi';
import ConnectDialog from './_components/ConnectDialog';

/**
 * A project's email accounts (tenant panel, Project → Email; docs/messaging
 * M-14): the SMTP accounts its emails go out through, with nodemailer. Connect
 * one in a dialog (tested green or red before saving), pick which is the
 * default — every email the project sends uses it — edit, send a real test,
 * remove; and the project's recent sends. Backend:
 * routes-tenant/mailAccounts.router.ts. Needs `manage-projects`.
 */

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
const KIND_LABEL: Record<string, string> = { test: 'Test', 'customer-welcome': 'Customer welcome', record: 'Receipt', campaign: 'Newsletter', automation: 'Automation' };

/** Green when the last check or send worked, red when the last one failed, grey before any. */
const statusOf = (a: MailAccount) => {
	const failed = !!a.lastError && (!a.verifiedAt || (a.lastErrorAt || '') > a.verifiedAt);
	if (failed) return { color: 'red', label: 'Not working', detail: a.lastError };
	if (a.verifiedAt) return { color: 'green', label: 'Working', detail: `Checked ${when(a.verifiedAt)}` };
	return { color: 'gray', label: 'Not checked', detail: '' };
};

const AccountRow: FC<{ account: MailAccount; onEdit: () => void; onSendTest: () => void; onRemove: () => void; onDefault: () => void }> = ({
	account: a,
	onEdit,
	onSendTest,
	onRemove,
	onDefault,
}) => {
	const s = statusOf(a);
	return (
		<Flex
			data-testid='mail-account'
			align='center'
			gap={3}
			px={3}
			py={3}
			borderWidth='1px'
			borderColor={a.isDefault ? 'border.emphasized' : 'border'}
			borderRadius='lg'>
			<Flex
				align='center'
				justify='center'
				boxSize='36px'
				borderRadius='full'
				bg='bg.muted'
				color='fg.muted'
				flexShrink={0}>
				<Mail size={16} />
			</Flex>
			<Box
				flex='1'
				minW={0}>
				<Flex
					align='center'
					gap={2}
					wrap='wrap'>
					<Text
						fontSize='14px'
						fontWeight='600'>
						{a.name}
					</Text>
					{a.isDefault && (
						<Badge
							size='sm'
							colorPalette='blue'>
							Default
						</Badge>
					)}
				</Flex>
				<Text
					fontSize='13px'
					color='fg.muted'
					truncate>
					{a.fromName ? `${a.fromName} <${a.email}>` : a.email} · {a.host}:{a.port}
				</Text>
			</Box>
			<Box
				textAlign='right'
				maxW={{ base: '120px', md: '280px' }}
				display={{ base: 'none', sm: 'block' }}>
				<Flex
					align='center'
					gap={1.5}
					justify='flex-end'
					fontSize='13px'
					fontWeight='500'
					color={`${s.color}.fg`}>
					<Box
						boxSize='8px'
						borderRadius='full'
						bg='currentColor'
					/>
					{s.label}
				</Flex>
				{s.detail && (
					<Text
						fontSize='12px'
						color='fg.muted'
						lineClamp={2}
						title={s.detail}>
						{s.detail}
					</Text>
				)}
			</Box>
			<Menu.Root positioning={{ placement: 'bottom-end' }}>
				<Menu.Trigger asChild>
					<IconButton
						aria-label={`More for ${a.name}`}
						size='sm'
						variant='ghost'>
						<Ellipsis size={16} />
					</IconButton>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content minW='180px'>
							{!a.isDefault && (
								<Menu.Item
									value='default'
									onClick={onDefault}>
									Make default
								</Menu.Item>
							)}
							<Menu.Item
								value='edit'
								onClick={onEdit}>
								Edit
							</Menu.Item>
							<Menu.Item
								value='send-test'
								onClick={onSendTest}>
								Send a test email
							</Menu.Item>
							<Menu.Separator />
							<Menu.Item
								value='remove'
								color='fg.error'
								onClick={onRemove}>
								Remove
							</Menu.Item>
						</Menu.Content>
					</Menu.Positioner>
				</Portal>
			</Menu.Root>
		</Flex>
	);
};

const Accounts: FC<{ accounts: MailAccount[]; ports: number[]; fallback: string | null; projectName: string; userEmail: string }> = ({
	accounts,
	ports,
	fallback,
	projectName,
	userEmail,
}) => {
	const [setDefault] = useSetDefaultMailAccountMutation();
	const [remove, removing] = useRemoveMailAccountMutation();
	const [sendTest, sending] = useSendMailAccountTestMutation();
	// The dialogs live beside the rows, not inside their menus (a closed menu unmounts what's in it).
	const [connect, setConnect] = useState<{ account: MailAccount | null } | null>(null);
	const [removingOne, setRemovingOne] = useState<MailAccount | null>(null);
	const [testing, setTesting] = useState<MailAccount | null>(null);
	const [to, setTo] = useState('');
	const defaultAccount = accounts.find(a => a.isDefault);

	const makeDefault = async (id: string) => {
		try {
			await setDefault(id).unwrap();
			toaster.create({ type: 'success', title: `Emails now go out through ${accounts.find(a => a._id === id)?.name}.` });
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Not changed — try again.' });
		}
	};

	return (
		<Panel
			id='email-accounts'
			title='Email accounts'
			subtitle='The project’s emails — receipts, welcomes, automations — go out through the default account'
			actions={
				<Flex
					align='center'
					gap={3}>
					<GuideLink section='email-accounts' />
					<Button
						size='sm'
						px={3}
						onClick={() => setConnect({ account: null })}>
						<Plus size={14} />
						Connect an account
					</Button>
				</Flex>
			}>
			{accounts.length === 0 ? (
				<Flex
					direction='column'
					align='center'
					textAlign='center'
					gap={3}
					py={8}>
					<Text
						fontSize='14px'
						fontWeight='600'>
						No email account yet
					</Text>
					<Text
						fontSize='13px'
						color='fg.muted'
						maxW='460px'>
						{fallback
							? `Until you connect one, this project’s emails go out through your organization’s server, as ${fallback}.`
							: 'Connect the email account your business sends from — your customers get no emails from this project until you do.'}
					</Text>
					<Button
						size='sm'
						px={3}
						onClick={() => setConnect({ account: null })}>
						<Plus size={14} />
						Connect an account
					</Button>
				</Flex>
			) : (
				<Flex
					direction='column'
					gap={4}>
					<Flex
						id='default-account'
						align={{ base: 'stretch', md: 'center' }}
						direction={{ base: 'column', md: 'row' }}
						gap={{ base: 1.5, md: 3 }}>
						<Text
							fontSize='13px'
							fontWeight='600'
							flexShrink={0}>
							Send from
						</Text>
						<Box
							w={{ base: 'full', md: '320px' }}
							data-testid='default-account'>
							<Dropdown
								size='sm'
								value={defaultAccount?._id || ''}
								onChange={v => v && v !== defaultAccount?._id && makeDefault(v)}
								items={accounts.map(a => ({ value: a._id, label: `${a.name} — ${a.email}` }))}
							/>
						</Box>
						<Text
							fontSize='12px'
							color='fg.muted'>
							The default account. Every email this project sends uses it.
						</Text>
					</Flex>
					<Flex
						direction='column'
						gap={2}>
						{accounts.map(a => (
							<AccountRow
								key={a._id}
								account={a}
								onDefault={() => makeDefault(a._id)}
								onEdit={() => setConnect({ account: a })}
								onSendTest={() => {
									setTo('');
									setTesting(a);
								}}
								onRemove={() => setRemovingOne(a)}
							/>
						))}
					</Flex>
				</Flex>
			)}

			<ConnectDialog
				open={!!connect}
				account={connect?.account || null}
				ports={ports}
				projectName={projectName}
				onClose={() => setConnect(null)}
			/>

			<PromptDialog
				open={!!testing}
				onClose={() => setTesting(null)}
				title='Send a test email'
				description={testing ? `A short email through ${testing.name} (${testing.email}), to check it arrives.` : ''}
				confirmLabel='Send'
				loading={sending.isLoading}
				onConfirm={async () => {
					if (!testing) return;
					try {
						const r = await sendTest({ id: testing._id, to: to.trim() || undefined }).unwrap();
						setTesting(null);
						toaster.create({ type: 'success', title: r.message });
					} catch (e: any) {
						toaster.create({ type: 'error', title: e?.data?.message || 'The test didn’t go — try again.' });
					}
				}}>
				<Input
					size='sm'
					type='email'
					value={to}
					placeholder={userEmail || 'you@example.com'}
					onChange={e => setTo(e.target.value)}
				/>
				<Text
					fontSize='12px'
					color='fg.muted'
					mt={1}>
					Empty sends it to you.
				</Text>
			</PromptDialog>

			<PromptDialog
				open={!!removingOne}
				onClose={() => setRemovingOne(null)}
				tone='danger'
				title='Remove this email account?'
				subject={removingOne ? `${removingOne.name} — ${removingOne.email}` : undefined}
				description={
					removingOne?.isDefault
						? accounts.length > 1
							? 'It’s the default — the oldest account left becomes the default.'
							: fallback
							? `It’s the only one — the project’s emails go back to your organization’s server (${fallback}).`
							: 'It’s the only one — the project’s emails stop until you connect another.'
						: 'Emails keep going out through the default account.'
				}
				confirmLabel='Remove'
				loading={removing.isLoading}
				onConfirm={async () => {
					if (!removingOne) return;
					try {
						await remove(removingOne._id).unwrap();
						setRemovingOne(null);
						toaster.create({ type: 'success', title: 'Removed.' });
					} catch (e: any) {
						toaster.create({ type: 'error', title: e?.data?.message || 'Not removed — try again.' });
					}
				}}
			/>
		</Panel>
	);
};

const Log: FC<{ messages: MailLogEntry[]; accounts: MailAccount[] }> = ({ messages, accounts }) => {
	const nameOf = (id?: string | null) => (id ? accounts.find(a => a._id === id)?.name || 'Removed account' : 'Organization server');
	return (
		<Panel
			id='email-log'
			title='Sent from this project'
			subtitle='The last 50 — subject only, kept 180 days'
			actions={<GuideLink section='email-log' />}>
			{messages.length === 0 ? (
				<Text
					fontSize='13px'
					color='fg.muted'>
					Nothing yet. Tests, receipts, welcomes and automation emails show up here.
				</Text>
			) : (
				<Box overflowX='auto'>
					<Table.Root size='sm'>
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeader>When</Table.ColumnHeader>
								<Table.ColumnHeader>What</Table.ColumnHeader>
								<Table.ColumnHeader>Through</Table.ColumnHeader>
								<Table.ColumnHeader>To</Table.ColumnHeader>
								<Table.ColumnHeader>Subject</Table.ColumnHeader>
								<Table.ColumnHeader>Result</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{messages.map(m => (
								<Table.Row key={m._id}>
									<Table.Cell whiteSpace='nowrap'>{when(m.createdAt)}</Table.Cell>
									<Table.Cell whiteSpace='nowrap'>{KIND_LABEL[m.kind] || m.kind}</Table.Cell>
									<Table.Cell whiteSpace='nowrap'>{nameOf(m.account)}</Table.Cell>
									<Table.Cell>{m.to}</Table.Cell>
									<Table.Cell>{m.subject}</Table.Cell>
									<Table.Cell>
										<Badge
											size='sm'
											colorPalette={m.status === 'sent' ? 'green' : 'red'}>
											{m.status === 'sent' ? 'Sent' : 'Failed'}
										</Badge>
										{m.error && (
											<Text
												fontSize='12px'
												color='fg.muted'
												mt={1}
												maxW='360px'>
												{m.error}
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

export default function EmailAccountsPage() {
	const { can, project, self, isLoading: loadingSelf } = useWorkspace();
	const allowed = can('manage-projects');
	const { data, isLoading, isError } = useGetMailAccountsQuery(undefined, { skip: !allowed });

	return (
		<Layout
			title='Email'
			path='email-accounts'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				{!allowed && !loadingSelf ? (
					<EmptyState
						title='Email accounts are set up by people who manage projects'
						description='Ask your organization’s owner or an admin.'
					/>
				) : isError ? (
					<EmptyState
						title='Email accounts aren’t available yet'
						description='They arrive with the next update of MINT — try again later.'
					/>
				) : isLoading || !data ? (
					<Skeleton h='320px' />
				) : (
					<>
						<Accounts
							accounts={data.doc}
							ports={data.ports}
							fallback={data.fallback}
							projectName={project?.name || ''}
							userEmail={self?.user?.email || ''}
						/>
						<Log
							messages={data.messages}
							accounts={data.doc}
						/>
					</>
				)}
			</Flex>
		</Layout>
	);
}
