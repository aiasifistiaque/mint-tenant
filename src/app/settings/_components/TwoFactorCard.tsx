'use client';

import { FC, ReactNode, useState } from 'react';
import { Badge, Box, Button, Dialog, Flex, Grid, IconButton, Input, Link, Portal, Skeleton, Switch, Text } from '@chakra-ui/react';
import { Copy, Download, ExternalLink, KeyRound, Laptop, Pencil, Plus, QrCode, ShieldCheck, Trash2 } from 'lucide-react';
import {
	AlertDialogContent,
	AlertDialogHeader,
	ModalFooter,
	PromptDialog,
	TwoFactorPasskey,
	useAddPasskeyMutation,
	useDisableTwoFactorMutation,
	useEnableTwoFactorMutation,
	useGetTwoFactorQuery,
	useNewBackupCodesMutation,
	usePasskeyCreationOptionsMutation,
	useRemovePasskeyMutation,
	useRenamePasskeyMutation,
	useSetTwoFactorEmailMutation,
	useCreatePasskeyLinkMutation,
} from '@/components/library';
import { deviceName, passkeyError, passkeysSupported, startRegistration } from '@/components/library/utils/functions/passkeys';
import { toaster } from '@/components/ui/toaster';
import { Row, SettingsCard } from './ui';
import PasskeyQrDialog, { ShownLink } from './PasskeyQrDialog';
import { docsPath } from '@/components/library/config/lib/constants/panel';

const COMPACT = { size: 'sm', px: 3 } as const;
const GUIDE = docsPath('/docs/two-factor');

const DocLink: FC<{ anchor: string; children?: ReactNode }> = ({ anchor, children }) => (
	<Link
		href={`${GUIDE}#${anchor}`}
		target='_blank'
		rel='noreferrer'
		fontSize='12px'
		color='fg.muted'
		display='inline-flex'
		alignItems='center'
		gap={1}
		_hover={{ color: 'fg' }}>
		{children || 'How this works'}
		<ExternalLink size={11} />
	</Link>
);

const errorOf = (e: any) => e?.data?.message || e?.message || 'Something went wrong';
const fail = (title: string, e: any) => toaster.create({ type: 'error', title, description: errorOf(e) });
const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/* ------------------------------------------------------------ dialogs */

/** Asks for the current password before a change that weakens or resets sign-in. */
const PasswordDialog: FC<{
	open: boolean;
	title: string;
	description: ReactNode;
	confirmLabel: string;
	tone?: 'danger' | 'warning' | 'default';
	loading?: boolean;
	anchor: string;
	onClose: () => void;
	onConfirm: (password: string) => void;
}> = ({ open, title, description, confirmLabel, tone = 'default', loading, anchor, onClose, onConfirm }) => {
	const [password, setPassword] = useState('');
	const close = () => {
		setPassword('');
		onClose();
	};
	return (
		<PromptDialog
			open={open}
			onClose={close}
			onConfirm={() => password && onConfirm(password)}
			title={title}
			description={description}
			tone={tone}
			icon={<ShieldCheck size={18} strokeWidth={1.75} />}
			confirmLabel={confirmLabel}
			loading={loading}
			disabled={!password}
			aside={<DocLink anchor={anchor} />}>
			<Box
				as='form'
				mt={1}
				onSubmit={(e: any) => {
					e.preventDefault();
					if (password) onConfirm(password);
				}}>
				<Text
					fontSize='12px'
					fontWeight='600'
					mb={1.5}>
					Current password
				</Text>
				<Input
					type='password'
					size='sm'
					autoFocus
					autoComplete='current-password'
					value={password}
					onChange={e => setPassword(e.target.value)}
				/>
			</Box>
		</PromptDialog>
	);
};

/** The backup codes, shown once: copy them, download them, then close. */
const BackupCodesDialog: FC<{ codes: string[] | null; onClose: () => void }> = ({ codes, onClose }) => {
	const text = (codes || []).join('\n');
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			toaster.create({ type: 'success', title: 'Backup codes copied' });
		} catch {
			toaster.create({ type: 'error', title: 'Couldn’t copy — select the codes and copy them yourself' });
		}
	};
	const download = () => {
		const body = `MINT admin — backup codes\nCreated ${new Date().toLocaleString()}\n\nEach code works once. Keep them somewhere safe.\n\n${text}\n`;
		const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = 'mint-backup-codes.txt';
		a.click();
		URL.revokeObjectURL(url);
	};
	return (
		<Dialog.Root
			placement='center'
			size='sm'
			lazyMount
			unmountOnExit
			open={!!codes}
			closeOnInteractOutside={false}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						borderWidth='1px'
						borderColor='border'
						_dark={{ bg: 'background.dark' }}>
						<AlertDialogHeader>Save your backup codes</AlertDialogHeader>
						<Dialog.Body
							p={4}
							pb={5}>
							<Text
								fontSize='13px'
								color='fg.muted'
								mb={4}>
								If you can’t use a passkey or get the email, each of these codes signs you in once. They’re shown only now — keep them in a password manager or somewhere safe. <DocLink anchor='backup-codes' />
							</Text>
							<Grid
								templateColumns='1fr 1fr'
								gap={2}
								p={4}
								borderRadius='lg'
								bg='bg.subtle'
								borderWidth={1}
								borderColor='border.muted'>
								{(codes || []).map(c => (
									<Text
										key={c}
										fontFamily='mono'
										fontSize='15px'
										letterSpacing='0.06em'
										textAlign='center'>
										{c}
									</Text>
								))}
							</Grid>
							<Flex
								gap={2}
								mt={3}>
								<Button
									{...COMPACT}
									variant='outline'
									flex={1}
									onClick={copy}>
									<Copy size={14} />
									Copy
								</Button>
								<Button
									{...COMPACT}
									variant='outline'
									flex={1}
									onClick={download}>
									<Download size={14} />
									Download .txt
								</Button>
							</Flex>
						</Dialog.Body>
						<ModalFooter>
							<Button onClick={onClose}>I’ve saved them</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

/** A passkey's name — asked when it's added, and to rename it. */
const NameDialog: FC<{
	open: boolean;
	title: string;
	initial: string;
	confirmLabel: string;
	loading?: boolean;
	onClose: () => void;
	onConfirm: (name: string) => void;
}> = ({ open, title, initial, confirmLabel, loading, onClose, onConfirm }) => {
	const [name, setName] = useState(initial);
	const [seen, setSeen] = useState(initial);
	// A new initial (another passkey, another device) resets the field.
	if (initial !== seen) {
		setSeen(initial);
		setName(initial);
	}
	return (
		<PromptDialog
			open={open}
			onClose={onClose}
			onConfirm={() => name.trim() && onConfirm(name.trim())}
			title={title}
			description='A name to tell your passkeys apart, like the device or password manager it lives in.'
			tone='default'
			icon={<KeyRound size={18} strokeWidth={1.75} />}
			confirmLabel={confirmLabel}
			loading={loading}
			disabled={!name.trim()}
			aside={<DocLink anchor='passkeys' />}>
			<Box
				as='form'
				mt={1}
				onSubmit={(e: any) => {
					e.preventDefault();
					if (name.trim()) onConfirm(name.trim());
				}}>
				<Input
					size='sm'
					autoFocus
					maxLength={60}
					value={name}
					onChange={e => setName(e.target.value)}
				/>
			</Box>
		</PromptDialog>
	);
};

/** "Add passkey": on this device, or on a phone / another device by QR code. */
const WhereDialog: FC<{ open: boolean; supported: boolean; onClose: () => void; onThisDevice: () => void; onAnotherDevice: () => void }> = ({
	open,
	supported,
	onClose,
	onThisDevice,
	onAnotherDevice,
}) => {
	return (
		<Dialog.Root
			placement='center'
			size='sm'
			lazyMount
			unmountOnExit
			open={open}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						borderWidth='1px'
						borderColor='border'
						_dark={{ bg: 'background.dark' }}>
						<AlertDialogHeader>Add a passkey</AlertDialogHeader>
						<Dialog.Body
							p={4}
							pb={5}>
							<Flex
								direction='column'
								gap={2}>
								<WhereOption
									icon={<Laptop size={18} />}
									title='On this device'
									hint={supported ? 'Touch ID, Face ID, Windows Hello, or this browser’s password manager' : 'This browser doesn’t support passkeys'}
									disabled={!supported}
									onClick={onThisDevice}
								/>
								<WhereOption
									icon={<QrCode size={18} />}
									title='On your phone or another device'
									hint='Scan a QR code — the passkey is saved on that phone (iCloud Keychain, Google Password Manager)'
									onClick={onAnotherDevice}
								/>
							</Flex>
						</Dialog.Body>
						<ModalFooter>
							<DocLink anchor='passkeys' />
							<Button
								variant='outline'
								ml='auto'
								onClick={onClose}>
								Cancel
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

const WhereOption: FC<{ icon: ReactNode; title: string; hint: string; disabled?: boolean; onClick: () => void }> = ({
	icon,
	title,
	hint,
	disabled,
	onClick,
}) => (
	<Button
		variant='outline'
		h='auto'
		p={3}
		justifyContent='flex-start'
		gap={3}
		textAlign='left'
		whiteSpace='normal'
		fontWeight='400'
		borderRadius='xl'
		disabled={disabled}
		onClick={onClick}>
		<Flex
			flexShrink={0}
			w='36px'
			h='36px'
			align='center'
			justify='center'
			borderRadius='lg'
			bg='bg.muted'>
			{icon}
		</Flex>
		<Box minW={0}>
			<Text
				fontSize='14px'
				fontWeight='600'>
				{title}
			</Text>
			<Text
				fontSize='12px'
				color='fg.muted'>
				{hint}
			</Text>
		</Box>
	</Button>
);

/* --------------------------------------------------------------- card */

const PasskeyRow: FC<{ passkey: TwoFactorPasskey; onRename: () => void; onRemove: () => void }> = ({ passkey, onRename, onRemove }) => (
	<Flex
		align='center'
		gap={3}
		py={2}
		px={3}
		borderWidth={1}
		borderColor='border.muted'
		borderRadius='lg'>
		<Box color='fg.muted'>
			<KeyRound size={15} />
		</Box>
		<Box
			flex={1}
			minW={0}>
			<Flex
				align='center'
				gap={2}>
				<Text
					fontSize='13px'
					fontWeight='500'
					truncate>
					{passkey.name}
				</Text>
				{passkey.backedUp && (
					<Badge
						size='xs'
						variant='subtle'
						title='Saved in a password manager that syncs it across your devices'>
						Synced
					</Badge>
				)}
			</Flex>
			<Text
				fontSize='12px'
				color='fg.muted'>
				Added {day(passkey.createdAt)} · {passkey.lastUsedAt ? `last used ${day(passkey.lastUsedAt)}` : 'not used yet'}
			</Text>
		</Box>
		<IconButton
			aria-label={`Rename ${passkey.name}`}
			title='Rename'
			size='xs'
			variant='ghost'
			onClick={onRename}>
			<Pencil size={14} />
		</IconButton>
		<IconButton
			aria-label={`Remove ${passkey.name}`}
			title='Remove'
			size='xs'
			variant='ghost'
			color='red.fg'
			onClick={onRemove}>
			<Trash2 size={14} />
		</IconButton>
	</Flex>
);

/**
 * Settings → Two-factor authentication: on/off (with the password), the
 * email-code method, passkeys (add, rename, remove) and backup codes (made
 * when it's turned on, shown once, remade with the password). Guide:
 * /docs/two-factor.
 */
const TwoFactorCard: FC = () => {
	const { data, isLoading, refetch } = useGetTwoFactorQuery();
	const [enable, enabling] = useEnableTwoFactorMutation();
	const [disable, disabling] = useDisableTwoFactorMutation();
	const [setEmail, settingEmail] = useSetTwoFactorEmailMutation();
	const [newCodes, making] = useNewBackupCodesMutation();
	const [creationOptions] = usePasskeyCreationOptionsMutation();
	const [addPasskey] = useAddPasskeyMutation();
	const [renamePasskey, renaming] = useRenamePasskeyMutation();
	const [removePasskey, removing] = useRemovePasskeyMutation();
	const [createLink, linking] = useCreatePasskeyLinkMutation();

	const [ask, setAsk] = useState<'enable' | 'disable' | 'codes' | 'link' | null>(null);
	const [where, setWhere] = useState(false); // "Add passkey": this device, or a phone?
	const [link, setLink] = useState<ShownLink | null>(null);
	// Kept for "Make a new one" when a QR code expires, without asking again.
	const [linkPassword, setLinkPassword] = useState('');
	const [codes, setCodes] = useState<string[] | null>(null);
	const [naming, setNaming] = useState<string | null>(null); // a new passkey's suggested name
	const [adding, setAdding] = useState(false);
	const [renameOf, setRenameOf] = useState<TwoFactorPasskey | null>(null);
	const [removeOf, setRemoveOf] = useState<TwoFactorPasskey | null>(null);

	const on = !!data?.enabled;
	const passkeys = data?.passkeys || [];
	const supported = passkeysSupported();

	const confirmPassword = async (password: string) => {
		try {
			if (ask === 'enable') {
				const r = await enable({ password }).unwrap();
				setCodes(r.backupCodes);
				toaster.create({ type: 'success', title: 'Two-factor authentication is on' });
			} else if (ask === 'disable') {
				await disable({ password }).unwrap();
				toaster.create({ type: 'success', title: 'Two-factor authentication is off' });
			} else if (ask === 'codes') {
				const r = await newCodes({ password }).unwrap();
				setCodes(r.backupCodes);
			} else if (ask === 'link') {
				const r = await createLink({ password }).unwrap();
				setLinkPassword(password);
				setLink({ _id: r._id, url: r.url, expiresAt: r.expiresAt });
			}
			setAsk(null);
		} catch (e) {
			fail(ask === 'link' ? 'Couldn’t make the QR code' : 'Couldn’t change two-factor authentication', e);
		}
	};

	const renewLink = async () => {
		try {
			const r = await createLink({ password: linkPassword }).unwrap();
			setLink({ _id: r._id, url: r.url, expiresAt: r.expiresAt });
		} catch (e) {
			setLink(null);
			fail('Couldn’t make a new QR code', e);
		}
	};

	/** Add passkey: name it, then the browser creates it. */
	const createPasskey = async (name: string) => {
		setNaming(null);
		setAdding(true);
		try {
			const options = await creationOptions().unwrap();
			const response = await startRegistration(options);
			await addPasskey({ response, name }).unwrap();
			toaster.create({ type: 'success', title: `Passkey “${name}” added` });
		} catch (e: any) {
			toaster.create({ type: 'error', title: 'The passkey wasn’t added', description: passkeyError(e, true) });
		} finally {
			setAdding(false);
		}
	};

	const toggleEmail = async (enabled: boolean) => {
		try {
			await setEmail({ enabled }).unwrap();
		} catch (e) {
			fail('Couldn’t change email codes', e);
		}
	};

	return (
		<>
			<SettingsCard
				id='two-factor'
				icon={<ShieldCheck size={16} />}
				title='Two-factor authentication'
				description={
					<>
						After your password, ask for a second step: a code by email, a passkey, or a backup code. <DocLink anchor='overview' />
					</>
				}
				note={
					isLoading ? '' : on ? (
						<Flex
							as='span'
							align='center'
							gap={2}>
							<Badge
								colorPalette='green'
								size='sm'>
								On
							</Badge>
							{data?.updatedAt && `Since ${day(data.updatedAt)}`}
						</Flex>
					) : (
						'Off — your password alone signs you in.'
					)
				}
				actions={
					on ? (
						<Button
							{...COMPACT}
							variant='outline'
							onClick={() => setAsk('disable')}>
							Turn off
						</Button>
					) : (
						<Button
							{...COMPACT}
							disabled={isLoading}
							onClick={() => setAsk('enable')}>
							Turn on
						</Button>
					)
				}>
				{isLoading ? (
					<Skeleton h='120px' />
				) : (
					<Box>
						<Row
							label='Email code'
							hint={`A 6-digit code to ${data?.email.address || 'your email'}`}>
							<Flex
								align='center'
								justify='space-between'
								gap={3}>
								<Text
									fontSize='13px'
									color={on ? 'fg' : 'fg.subtle'}>
									{!on ? 'Available once two-factor is on' : data?.email.enabled ? 'On — offered at sign-in' : 'Off'}
								</Text>
								<Switch.Root
									size='sm'
									disabled={!on || settingEmail.isLoading}
									checked={!!data?.email.enabled}
									onCheckedChange={e => toggleEmail(e.checked)}>
									<Switch.HiddenInput />
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
								</Switch.Root>
							</Flex>
						</Row>

						<Row
							label='Passkeys'
							hint='Apple Keychain, Google Password Manager, this browser, your phone or a security key'>
							<Flex
								direction='column'
								gap={2}>
								{passkeys.map(k => (
									<PasskeyRow
										key={k._id}
										passkey={k}
										onRename={() => setRenameOf(k)}
										onRemove={() => setRemoveOf(k)}
									/>
								))}
								{!passkeys.length && (
									<Text
										fontSize='13px'
										color='fg.subtle'>
										None yet. With a passkey, signing in is one touch — and email stays as the other way.
									</Text>
								)}
								<Flex
									align='center'
									gap={3}
									flexWrap='wrap'>
									<Button
										{...COMPACT}
										variant='outline'
										alignSelf='flex-start'
										loading={adding}
										loadingText='Waiting for the browser'
										onClick={() => setWhere(true)}>
										<Plus size={14} />
										Add passkey
									</Button>
									<DocLink anchor='passkeys' />
								</Flex>
							</Flex>
						</Row>

						<Row
							label='Backup codes'
							hint='Single-use codes for when nothing else works'>
							<Flex
								align='center'
								justify='space-between'
								gap={3}
								flexWrap='wrap'>
								<Text
									fontSize='13px'
									color={on ? (data!.backupCodes.remaining <= 3 ? 'orange.fg' : 'fg') : 'fg.subtle'}>
									{on
										? `${data!.backupCodes.remaining} of ${data!.backupCodes.total} left${data!.backupCodes.remaining <= 3 ? ' — make new ones' : ''}`
										: 'Made for you when you turn two-factor on'}
								</Text>
								{on && (
									<Button
										{...COMPACT}
										variant='outline'
										onClick={() => setAsk('codes')}>
										Make new codes
									</Button>
								)}
							</Flex>
						</Row>
					</Box>
				)}
			</SettingsCard>

			<PasswordDialog
				open={!!ask}
				anchor={ask === 'codes' ? 'backup-codes' : ask === 'disable' ? 'turn-off' : ask === 'link' ? 'passkey-qr' : 'turn-on'}
				title={
					ask === 'enable'
						? 'Turn on two-factor authentication?'
						: ask === 'disable'
						? 'Turn off two-factor authentication?'
						: ask === 'link'
						? 'Add a passkey on your phone'
						: 'Make new backup codes?'
				}
				description={
					ask === 'link'
						? 'You’ll get a QR code to scan with your phone. Anyone holding it could add a passkey to your account, so confirm it’s you first.'
						: ask === 'enable'
						? 'Signing in will ask for a code by email (or a passkey, once you add one) after your password. You’ll get 10 backup codes to keep.'
						: ask === 'disable'
						? 'Your password alone will sign you in. Your backup codes stop working; your passkeys stay, for when you turn it on again.'
						: 'Your current backup codes stop working, and you get 10 new ones.'
				}
				confirmLabel={ask === 'enable' ? 'Turn on' : ask === 'disable' ? 'Turn off' : ask === 'link' ? 'Show QR code' : 'Make new codes'}
				tone={ask === 'disable' ? 'warning' : 'default'}
				loading={enabling.isLoading || disabling.isLoading || making.isLoading || linking.isLoading}
				onClose={() => setAsk(null)}
				onConfirm={confirmPassword}
			/>

			<BackupCodesDialog
				codes={codes}
				onClose={() => setCodes(null)}
			/>

			<WhereDialog
				open={where}
				supported={supported}
				onClose={() => setWhere(false)}
				onThisDevice={() => {
					setWhere(false);
					setNaming(deviceName());
				}}
				onAnotherDevice={() => {
					setWhere(false);
					setAsk('link');
				}}
			/>

			<PasskeyQrDialog
				link={link}
				onClose={() => {
					setLink(null);
					setLinkPassword('');
				}}
				onRenew={renewLink}
				onAdded={() => {
					refetch();
					toaster.create({ type: 'success', title: 'Passkey added on your other device' });
				}}
			/>

			<NameDialog
				open={naming !== null}
				title='Add a passkey'
				initial={naming || ''}
				confirmLabel='Continue'
				onClose={() => setNaming(null)}
				onConfirm={createPasskey}
			/>

			<NameDialog
				open={!!renameOf}
				title='Rename passkey'
				initial={renameOf?.name || ''}
				confirmLabel='Save'
				loading={renaming.isLoading}
				onClose={() => setRenameOf(null)}
				onConfirm={async name => {
					try {
						await renamePasskey({ id: renameOf!._id, name }).unwrap();
						setRenameOf(null);
					} catch (e) {
						fail('Couldn’t rename the passkey', e);
					}
				}}
			/>

			<PromptDialog
				open={!!removeOf}
				onClose={() => setRemoveOf(null)}
				onConfirm={async () => {
					try {
						await removePasskey(removeOf!._id).unwrap();
						setRemoveOf(null);
						toaster.create({ type: 'success', title: 'Passkey removed' });
					} catch (e) {
						fail('Couldn’t remove the passkey', e);
					}
				}}
				title='Remove this passkey?'
				description='It won’t sign you in to MINT any more. The passkey itself stays in your password manager until you delete it there.'
				subject={removeOf?.name}
				confirmLabel='Remove'
				loading={removing.isLoading}
				aside={<DocLink anchor='passkeys' />}
			/>
		</>
	);
};

export default TwoFactorCard;
