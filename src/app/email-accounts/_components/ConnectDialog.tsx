'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Dialog, Field, Flex, Grid, Input, Portal, Text } from '@chakra-ui/react';
import { CircleCheck, CircleX } from 'lucide-react';
import { ModalFooter, radius } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { PasswordInput } from '@/components/ui/password-input';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useAddMailAccountMutation, useTestMailAccountMutation, useUpdateMailAccountMutation } from '@/components/library/store/services/tenantApi';
import type { MailAccount, MailAccountInput } from '@/components/library/store/services/tenantApi';

/**
 * Connect (or edit) one of a project's email accounts (docs/messaging M-14):
 * a name for it, the sender name people see, SMTP server, port, address and
 * password. "Test connection" signs in without sending anything and shows
 * the answer green or red; changing a field clears it. Saving closes the
 * dialog and the account shows in the list.
 */

const labelCss: any = { fontSize: '13px', fontWeight: '600', m: 0 };
const hint = { fontSize: '12px', color: 'fg.muted' } as const;

/** Common providers: picking one fills in the server and port. */
const PRESETS: { value: string; label: string; host: string; port: number; note: string }[] = [
	{ value: 'gmail', label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: 587, note: 'Use an app password (Google Account → Security → App passwords), not your normal one.' },
	{ value: 'outlook', label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587, note: 'Your admin may need to allow “Authenticated SMTP” for the mailbox.' },
	{ value: 'zoho', label: 'Zoho Mail', host: 'smtp.zoho.com', port: 465, note: 'Accounts outside the US may use smtp.zoho.eu or smtp.zoho.in.' },
	{ value: 'privateemail', label: 'Namecheap Private Email', host: 'mail.privateemail.com', port: 465, note: '' },
	{ value: 'hostinger', label: 'Hostinger', host: 'smtp.hostinger.com', port: 465, note: '' },
	{ value: 'other', label: 'Another server', host: '', port: 587, note: 'Your email host’s help pages list its SMTP server and port.' },
];

const PORT_NOTE: Record<number, string> = { 465: 'secure from the start (SSL)', 587: 'secure after connecting (STARTTLS)', 2465: 'SSL', 25: 'often blocked' };

const blank = (fromName: string): MailAccountInput => ({ name: '', fromName, host: '', port: 587, email: '', password: '' });
const formOf = (a: MailAccount): MailAccountInput => ({ name: a.name, fromName: a.fromName, host: a.host, port: a.port, email: a.email, password: '' });

type Props = {
	open: boolean;
	/** The account to edit; none = connect a new one. */
	account: MailAccount | null;
	ports: number[];
	projectName: string;
	onClose: () => void;
};

const ConnectDialog: FC<Props> = ({ open, account, ports, projectName, onClose }) => {
	const [add, adding] = useAddMailAccountMutation();
	const [update, updating] = useUpdateMailAccountMutation();
	const [test, testing] = useTestMailAccountMutation();
	const [form, setForm] = useState<MailAccountInput>(blank(projectName));
	const [preset, setPreset] = useState('');
	const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!open) return;
		setForm(account ? formOf(account) : blank(projectName));
		setPreset(account ? PRESETS.find(p => p.host === account.host)?.value || 'other' : '');
		setResult(null);
		setError('');
	}, [open, account?._id]);

	const set = <K extends keyof MailAccountInput>(k: K, v: MailAccountInput[K]) => {
		setForm(f => ({ ...f, [k]: v }));
		setResult(null);
		setError('');
	};
	const note = PRESETS.find(p => p.value === preset)?.note;
	const filled = !!form.host && !!form.email && (!!form.password || !!account);
	const body = { ...form, name: form.name.trim(), fromName: form.fromName.trim(), host: form.host.trim(), email: form.email.trim() };

	const runTest = async () => {
		setError('');
		try {
			setResult(await test({ ...body, ...(account && { id: account._id }) }).unwrap());
		} catch (e: any) {
			setResult({ ok: false, message: e?.data?.message || 'Couldn’t test — try again.' });
		}
	};

	const save = async () => {
		setError('');
		try {
			if (account) await update({ ...body, id: account._id }).unwrap();
			else await add(body).unwrap();
			toaster.create({ type: 'success', title: account ? 'Saved.' : `Connected ${body.email}.` });
			onClose();
		} catch (e: any) {
			setError(e?.data?.message || 'Not saved — try again.');
		}
	};

	return (
		<Dialog.Root
			placement='center'
			size='lg'
			open={open}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content
						borderRadius={radius.MODAL}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'>
						<Dialog.Header
							px={{ base: 4, md: 6 }}
							pt={{ base: 4, md: 5 }}
							pb={{ base: 3, md: 4 }}>
							<Flex
								align='center'
								justify='space-between'
								gap={3}
								pr={2}
								w='full'>
								<Dialog.Title fontSize='16px'>{account ? `Edit ${account.name}` : 'Connect an email account'}</Dialog.Title>
								<GuideLink section='connect-email' />
							</Flex>
						</Dialog.Header>

						<Dialog.Body
							px={{ base: 4, md: 6 }}
							pt={0}
							pb={{ base: 4, md: 5 }}>
							<Flex
								direction='column'
								gap={4}>
								<Grid
									templateColumns={{ base: '1fr', md: '1fr 1fr' }}
									gap={3}>
									<Field.Root>
										<Field.Label {...labelCss}>Account name</Field.Label>
										<Input
											size='sm'
											autoFocus
											maxLength={80}
											value={form.name}
											placeholder='e.g. Sales'
											onChange={e => set('name', e.target.value)}
										/>
										<Field.HelperText {...hint}>For your team, to tell accounts apart.</Field.HelperText>
									</Field.Root>
									<Field.Root>
										<Field.Label {...labelCss}>Sender name</Field.Label>
										<Input
											size='sm'
											maxLength={120}
											value={form.fromName}
											placeholder={projectName || 'Your business'}
											onChange={e => set('fromName', e.target.value)}
										/>
										<Field.HelperText {...hint}>The name people see the email is from.</Field.HelperText>
									</Field.Root>
								</Grid>

								<Field.Root>
									<Field.Label {...labelCss}>Email provider</Field.Label>
									<Box w='full'>
										<Dropdown
											size='sm'
											value={preset}
											placeholder='Pick one to fill in the server and port'
											onChange={v => {
												setPreset(v);
												const p = PRESETS.find(x => x.value === v);
												if (p && p.value !== 'other') {
													setForm(f => ({ ...f, host: p.host, port: p.port }));
													setResult(null);
												}
											}}
											items={PRESETS.map(p => ({ value: p.value, label: p.label }))}
										/>
									</Box>
									{note && <Field.HelperText {...hint}>{note}</Field.HelperText>}
								</Field.Root>

								<Grid
									templateColumns={{ base: '1fr', md: '2fr 1fr' }}
									gap={3}>
									<Field.Root required>
										<Field.Label {...labelCss}>SMTP server</Field.Label>
										<Input
											size='sm'
											value={form.host}
											placeholder='smtp.example.com'
											onChange={e => set('host', e.target.value.trim().toLowerCase())}
										/>
									</Field.Root>
									<Field.Root required>
										<Field.Label {...labelCss}>Port</Field.Label>
										<Dropdown
											size='sm'
											value={String(form.port)}
											onChange={v => set('port', Number(v))}
											items={ports.map(p => ({ value: String(p), label: PORT_NOTE[p] ? `${p} — ${PORT_NOTE[p]}` : String(p) }))}
										/>
									</Field.Root>
								</Grid>

								<Grid
									templateColumns={{ base: '1fr', md: '1fr 1fr' }}
									gap={3}>
									<Field.Root required>
										<Field.Label {...labelCss}>Email</Field.Label>
										<Input
											size='sm'
											type='email'
											autoComplete='off'
											value={form.email}
											placeholder='hello@yourbusiness.com'
											onChange={e => set('email', e.target.value.trim())}
										/>
										<Field.HelperText {...hint}>Emails come from this address; it’s also the sign-in.</Field.HelperText>
									</Field.Root>
									<Field.Root required={!account}>
										<Field.Label {...labelCss}>Password</Field.Label>
										<PasswordInput
											size='sm'
											autoComplete='new-password'
											value={form.password}
											placeholder={account ? 'Unchanged' : ''}
											onChange={e => set('password', e.target.value)}
										/>
										<Field.HelperText {...hint}>{account ? 'Leave empty to keep the saved one.' : 'Stored encrypted; nobody can read it back.'}</Field.HelperText>
									</Field.Root>
								</Grid>

								<Flex
									align='flex-start'
									gap={3}
									direction={{ base: 'column', md: 'row' }}>
									<Button
										size='sm'
										variant='outline'
										px={3}
										flexShrink={0}
										loading={testing.isLoading}
										loadingText='Testing…'
										disabled={!filled}
										onClick={runTest}>
										Test connection
									</Button>
									{result && (
										<Flex
											data-testid='mail-test-result'
											data-ok={result.ok ? 'true' : 'false'}
											flex='1'
											gap={2}
											align='flex-start'
											fontSize='13px'
											px={3}
											py={2}
											borderRadius='md'
											borderWidth='1px'
											bg={result.ok ? 'green.subtle' : 'red.subtle'}
											color={result.ok ? 'green.fg' : 'red.fg'}
											borderColor={result.ok ? 'green.muted' : 'red.muted'}>
											<Box
												pt='1px'
												flexShrink={0}>
												{result.ok ? <CircleCheck size={16} /> : <CircleX size={16} />}
											</Box>
											<Text>{result.message}</Text>
										</Flex>
									)}
								</Flex>

								{error && (
									<Text
										fontSize='13px'
										color='red.fg'>
										{error}
									</Text>
								)}
							</Flex>
						</Dialog.Body>

						<ModalFooter>
							<Button
								size='sm'
								variant='outline'
								px={3}
								onClick={onClose}>
								Cancel
							</Button>
							<Button
								size='sm'
								px={3}
								loading={adding.isLoading || updating.isLoading}
								disabled={!filled}
								onClick={save}>
								{account ? 'Save' : 'Connect'}
							</Button>
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default ConnectDialog;
