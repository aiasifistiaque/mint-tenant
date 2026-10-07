'use client';

import { FC, FormEvent, useEffect, useState } from 'react';
import { Badge, Box, Button, Field, Flex, Grid, Input, Skeleton, Switch, Table, Text } from '@chakra-ui/react';
import { Layout, PromptDialog } from '@/components/library';
import { Dropdown, EmptyState, Panel } from '@/components/library/cl';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useGetOrgMailQuery, useRemoveOrgMailMutation, useSaveOrgMailMutation, useTestOrgMailMutation } from '@/components/library/store/services/tenantApi';
import type { MailSettings, MailSettingsInput } from '@/components/library/store/services/tenantApi';

/**
 * Organization → Email (tenant panel; docs/messaging M-02): the email server
 * MINT sends the organization's emails through (nodemailer, its own SMTP), a
 * test send, and the log of what went out. Backend:
 * routes-tenant/org/mail.router.ts. Needs `manage-organization`.
 */

const labelCss: any = { fontSize: '13px', fontWeight: '600', m: 0 };
const help = { fontSize: '12px', color: 'fg.muted', mt: 1 } as const;

/** Common providers: picking one fills in the server, port and SSL. */
const PRESETS: { value: string; label: string; host: string; port: number; secure: boolean; note: string }[] = [
	{ value: 'gmail', label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: 587, secure: false, note: 'Use an app password (Google Account → Security → App passwords), not your normal one.' },
	{ value: 'outlook', label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587, secure: false, note: 'Your admin may need to allow “Authenticated SMTP” for the mailbox.' },
	{ value: 'zoho', label: 'Zoho Mail', host: 'smtp.zoho.com', port: 465, secure: true, note: 'Accounts outside the US may use smtp.zoho.eu or smtp.zoho.in.' },
	{ value: 'privateemail', label: 'Namecheap Private Email', host: 'mail.privateemail.com', port: 465, secure: true, note: '' },
	{ value: 'hostinger', label: 'Hostinger', host: 'smtp.hostinger.com', port: 465, secure: true, note: '' },
	{ value: 'other', label: 'Another server', host: '', port: 587, secure: false, note: 'Your email host’s help pages list its SMTP server and port.' },
];

const KIND_LABEL: Record<string, string> = { test: 'Test', 'customer-welcome': 'Customer welcome', record: 'From a record', campaign: 'Newsletter', automation: 'Automation' };

const blank: MailSettingsInput = { host: '', port: 587, secure: false, username: '', password: '', fromName: '', fromAddress: '', replyTo: '', customerWelcome: true };
const fromSaved = (s: MailSettings | null): MailSettingsInput =>
	s ? { host: s.host, port: s.port, secure: s.secure, username: s.username, password: '', fromName: s.fromName, fromAddress: s.fromAddress, replyTo: s.replyTo, customerWelcome: s.customerWelcome } : blank;
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

const Server: FC<{ saved: MailSettings | null; ports: number[]; orgName: string }> = ({ saved, ports, orgName }) => {
	const [save, saving] = useSaveOrgMailMutation();
	const [test, testing] = useTestOrgMailMutation();
	const [remove, removing] = useRemoveOrgMailMutation();
	const [form, setForm] = useState<MailSettingsInput>(fromSaved(saved));
	const [preset, setPreset] = useState('');
	const [to, setTo] = useState('');
	const [removingOpen, setRemovingOpen] = useState(false);

	useEffect(() => {
		setForm(fromSaved(saved));
		setPreset(PRESETS.find(p => p.host === saved?.host)?.value || (saved ? 'other' : ''));
	}, [saved?.updatedAt]);

	const set = <K extends keyof MailSettingsInput>(k: K, v: MailSettingsInput[K]) => setForm(f => ({ ...f, [k]: v }));
	const dirty = JSON.stringify(form) !== JSON.stringify(fromSaved(saved));
	const note = PRESETS.find(p => p.value === preset)?.note;

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			await save({ ...form, fromName: form.fromName || orgName }).unwrap();
			toaster.create({ type: 'success', title: 'Saved — send a test to check it works.' });
		} catch (err: any) {
			toaster.create({ type: 'error', title: err?.data?.message || 'Not saved — try again.' });
		}
	};
	const sendTest = async () => {
		try {
			const res = await test({ to: to.trim() || undefined }).unwrap();
			toaster.create({ type: 'success', title: res.message });
		} catch (err: any) {
			toaster.create({ type: 'error', title: err?.data?.message || 'The test didn’t go — try again.' });
		}
	};

	return (
		<Panel
			id='email-server'
			title='Your email server'
			subtitle='MINT sends your emails to customers through it, from your own address'
			actions={<GuideLink section='email-server' />}>
			<Box
				mb={4}
				fontSize='13px'
				p={2.5}
				borderRadius='md'
				bg={!saved ? 'bg.subtle' : saved.lastError && (!saved.verifiedAt || saved.lastErrorAt! > saved.verifiedAt) ? 'orange.subtle' : saved.verifiedAt ? 'green.subtle' : 'bg.subtle'}
				color={!saved ? 'fg' : saved.lastError && (!saved.verifiedAt || saved.lastErrorAt! > saved.verifiedAt) ? 'orange.fg' : saved.verifiedAt ? 'green.fg' : 'fg'}>
				{!saved
					? 'Not set up — your customers get no emails from you yet. Add the server your business email uses.'
					: saved.lastError && (!saved.verifiedAt || saved.lastErrorAt! > saved.verifiedAt)
					? `Last try failed (${when(saved.lastErrorAt)}): ${saved.lastError}`
					: saved.verifiedAt
					? `Working — last email went out ${when(saved.verifiedAt)}, as ${saved.fromAddress}.`
					: 'Saved, not tested yet — send a test below.'}
			</Box>
			<form onSubmit={submit}>
				<Flex
					direction='column'
					gap={4}>
					<Grid
						templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
						gap={3}>
						<Box>
							<Text {...labelCss}>Your email provider</Text>
							<Box mt={1.5}>
								<Dropdown
									size='sm'
									value={preset}
									placeholder='Pick one to fill in the server'
									onChange={v => {
										setPreset(v);
										const p = PRESETS.find(x => x.value === v);
										if (p && p.value !== 'other') setForm(f => ({ ...f, host: p.host, port: p.port, secure: p.secure }));
									}}
									items={PRESETS.map(p => ({ value: p.value, label: p.label }))}
								/>
							</Box>
							{note && <Text {...help}>{note}</Text>}
						</Box>
						<Field.Root required>
							<Field.Label {...labelCss}>Server</Field.Label>
							<Input
								size='sm'
								value={form.host}
								placeholder='smtp.example.com'
								onChange={e => set('host', e.target.value.trim())}
							/>
						</Field.Root>
						<Box>
							<Text {...labelCss}>Port and SSL</Text>
							<Flex
								mt={1.5}
								gap={3}
								align='center'>
								<Box flex='1'>
									<Dropdown
										size='sm'
										value={String(form.port)}
										onChange={v => setForm(f => ({ ...f, port: Number(v), secure: Number(v) === 465 || Number(v) === 2465 ? true : Number(v) === 587 ? false : f.secure }))}
										items={ports.map(p => ({ value: String(p), label: String(p) }))}
									/>
								</Box>
								<Switch.Root
									size='sm'
									checked={form.secure}
									onCheckedChange={e => set('secure', !!e.checked)}>
									<Switch.HiddenInput />
									<Switch.Control />
									<Switch.Label fontSize='13px'>SSL</Switch.Label>
								</Switch.Root>
							</Flex>
						</Box>
						<Field.Root>
							<Field.Label {...labelCss}>Username</Field.Label>
							<Input
								size='sm'
								value={form.username}
								autoComplete='off'
								placeholder='usually your email address'
								onChange={e => set('username', e.target.value)}
							/>
						</Field.Root>
						<Field.Root>
							<Field.Label {...labelCss}>Password</Field.Label>
							<Input
								size='sm'
								type='password'
								autoComplete='new-password'
								value={form.password}
								placeholder={saved?.passwordSet ? 'Stored — leave empty to keep it' : ''}
								onChange={e => set('password', e.target.value)}
							/>
							<Text {...help}>Kept encrypted; never shown again.</Text>
						</Field.Root>
					</Grid>
					<Grid
						templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
						gap={3}>
						<Field.Root>
							<Field.Label {...labelCss}>From name</Field.Label>
							<Input
								size='sm'
								value={form.fromName}
								placeholder={orgName}
								onChange={e => set('fromName', e.target.value)}
							/>
							<Text {...help}>What customers see as the sender.</Text>
						</Field.Root>
						<Field.Root required>
							<Field.Label {...labelCss}>From address</Field.Label>
							<Input
								size='sm'
								type='email'
								value={form.fromAddress}
								placeholder='hello@yourbusiness.com'
								onChange={e => set('fromAddress', e.target.value.trim())}
							/>
							<Text {...help}>Must be an address this server may send as — usually the username’s.</Text>
						</Field.Root>
						<Field.Root>
							<Field.Label {...labelCss}>Replies go to</Field.Label>
							<Input
								size='sm'
								type='email'
								value={form.replyTo}
								placeholder='Same as the from address'
								onChange={e => set('replyTo', e.target.value.trim())}
							/>
						</Field.Root>
					</Grid>
					<Switch.Root
						size='sm'
						checked={form.customerWelcome}
						onCheckedChange={e => set('customerWelcome', !!e.checked)}>
						<Switch.HiddenInput />
						<Switch.Control />
						<Switch.Label fontSize='13px'>Welcome customers who sign up on your sites, by email</Switch.Label>
					</Switch.Root>
					<Flex
						gap={2}
						wrap='wrap'
						align='center'>
						<Button
							size='sm'
							type='submit'
							disabled={!dirty || !form.host || !form.fromAddress}
							loading={saving.isLoading}>
							Save
						</Button>
						{dirty && saved && (
							<Button
								size='sm'
								variant='ghost'
								onClick={() => setForm(fromSaved(saved))}>
								Discard
							</Button>
						)}
						{saved && (
							<Button
								size='sm'
								variant='ghost'
								colorPalette='red'
								onClick={() => setRemovingOpen(true)}>
								Remove
							</Button>
						)}
					</Flex>
				</Flex>
			</form>

			{saved && (
				<Box
					id='email-test'
					mt={5}
					pt={4}
					borderTopWidth='1px'
					borderColor='border'>
					<Text
						fontSize='13px'
						fontWeight='600'
						mb={1.5}>
						Send a test
					</Text>
					<Flex
						gap={2}
						wrap='wrap'>
						<Input
							size='sm'
							maxW='320px'
							type='email'
							value={to}
							placeholder='To you — or type another address'
							onChange={e => setTo(e.target.value)}
						/>
						<Button
							size='sm'
							variant='outline'
							disabled={dirty}
							loading={testing.isLoading}
							onClick={sendTest}>
							Send test
						</Button>
					</Flex>
					<Text {...help}>{dirty ? 'Save your changes first — the test uses what’s saved.' : 'Goes out through your server, just like your customers’ emails.'}</Text>
				</Box>
			)}

			<PromptDialog
				open={removingOpen}
				onClose={() => setRemovingOpen(false)}
				tone='danger'
				title='Remove your email server?'
				description='Your customers stop getting emails from you straight away. The log of what was sent stays.'
				confirmLabel='Remove'
				loading={removing.isLoading}
				onConfirm={async () => {
					try {
						await remove().unwrap();
						setRemovingOpen(false);
						toaster.create({ type: 'success', title: 'Removed — your emails have stopped.' });
					} catch (err: any) {
						toaster.create({ type: 'error', title: err?.data?.message || 'Not removed — try again.' });
					}
				}}
			/>
		</Panel>
	);
};

const Log: FC<{ messages: { _id: string; kind: string; to: string; subject: string; status: 'sent' | 'failed'; error: string; createdAt: string }[] }> = ({ messages }) => (
	<Panel
		id='email-log'
		title='Sent'
		subtitle='The last 50 emails sent through your server — kept 180 days'
		actions={<GuideLink section='email-log' />}
		flush>
		{!messages.length ? (
			<Box p={4}>
				<Text
					fontSize='13px'
					color='fg.muted'>
					Nothing yet. A test, and every welcome to a new customer, shows up here.
				</Text>
			</Box>
		) : (
			<Box overflowX='auto'>
				<Table.Root size='sm'>
					<Table.Header>
						<Table.Row>
							<Table.ColumnHeader>When</Table.ColumnHeader>
							<Table.ColumnHeader>What</Table.ColumnHeader>
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

export default function OrgEmailPage() {
	const { can, organization, isLoading: loadingSelf } = useWorkspace();
	const allowed = can('manage-organization');
	const { data, isLoading, isError } = useGetOrgMailQuery(undefined, { skip: !allowed });

	return (
		<Layout
			title='Email'
			path='org-email'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				{!allowed && !loadingSelf ? (
					<EmptyState
						title='Email is set up by people who manage the organization'
						description='Ask your organization’s owner or an admin.'
					/>
				) : isError ? (
					<EmptyState
						title='Email isn’t available yet'
						description='It arrives with the next update of MINT — try again later.'
					/>
				) : isLoading || !data ? (
					<Skeleton h='320px' />
				) : (
					<>
						<Server
							saved={data.settings}
							ports={data.ports}
							orgName={organization?.name || ''}
						/>
						<Log messages={data.messages} />
						<Panel
							title='Who sends what'
							actions={<GuideLink section='email' />}>
							<Text
								fontSize='13px'
								color='fg.muted'
								lineHeight='1.6'>
								<b>From you, through this server:</b> emails to your customers — a welcome when they sign up on your sites
								now; emails from a record, newsletters and automations next. <b>From MINT:</b> emails to you and your team —
								the welcome when you signed up, invitations, password resets and sign-in codes.
							</Text>
						</Panel>
					</>
				)}
			</Flex>
		</Layout>
	);
}
