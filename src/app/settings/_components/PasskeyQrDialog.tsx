'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Center, Dialog, Flex, Image, Link, Portal, Spinner, Text } from '@chakra-ui/react';
import { CheckCircle2, Copy, ExternalLink, Smartphone, TimerOff } from 'lucide-react';
import QRCode from 'qrcode';
import { AlertDialogContent, AlertDialogHeader, ModalFooter, useCancelPasskeyLinkMutation, useGetPasskeyLinkQuery } from '@/components/library';
import { toaster } from '@/components/ui/toaster';
import { docsPath } from '@/components/library/config/lib/constants/panel';

export type ShownLink = { _id: string; url: string; expiresAt: string | null };

const mmss = (ms: number) => {
	const s = Math.max(0, Math.ceil(ms / 1000));
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * The QR code for adding a passkey on a phone (or any other device): scanning
 * it opens /passkey/add on that device, which makes the passkey in its own
 * keychain. This dialog polls the link and follows along — waiting, opened on
 * "Safari on iPhone", added — and cancels the link if closed before then.
 */
const PasskeyQrDialog: FC<{ link: ShownLink | null; onClose: () => void; onRenew: () => void; onAdded: () => void }> = ({
	link,
	onClose,
	onRenew,
	onAdded,
}) => {
	const [qr, setQr] = useState('');
	const [now, setNow] = useState(Date.now());
	const [cancel] = useCancelPasskeyLinkMutation();

	const expiresAt = link?.expiresAt ? new Date(link.expiresAt).getTime() : 0;
	const timedOut = !!link && !!expiresAt && now >= expiresAt;

	const { data } = useGetPasskeyLinkQuery(link?._id || '', {
		skip: !link,
		pollingInterval: 2000,
		skipPollingIfUnfocused: false,
		refetchOnMountOrArgChange: true,
	});
	const status = timedOut && data?.status !== 'added' ? 'expired' : data?.status || 'waiting';
	const done = status === 'added';

	useEffect(() => {
		if (!link?.url) return setQr('');
		// Dark on white whatever the theme: phone cameras read contrast, not colour.
		QRCode.toDataURL(link.url, { margin: 1, width: 440, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } })
			.then(setQr)
			.catch(() => setQr(''));
	}, [link?.url]);

	useEffect(() => {
		if (!link || done) return;
		// This dialog is mounted with the page: start the countdown from now, not from then.
		setNow(Date.now());
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, [link, done]);

	useEffect(() => {
		if (done) onAdded();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [done]);

	const close = () => {
		if (link && !done && status !== 'expired') cancel(link._id);
		onClose();
	};

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(link?.url || '');
			toaster.create({ type: 'success', title: 'Link copied — open it on the other device' });
		} catch {
			toaster.create({ type: 'error', title: 'Couldn’t copy the link' });
		}
	};

	return (
		<Dialog.Root
			placement='center'
			size='sm'
			lazyMount
			unmountOnExit
			open={!!link}
			closeOnInteractOutside={false}
			onOpenChange={e => !e.open && close()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						borderWidth='1px'
						borderColor='border'
						_dark={{ bg: 'background.dark' }}>
						<AlertDialogHeader>{done ? 'Passkey added' : 'Add a passkey on your phone'}</AlertDialogHeader>
						<Dialog.Body
							p={4}
							pb={5}>
							{done ? (
								<Flex
									direction='column'
									align='center'
									textAlign='center'
									gap={3}
									py={4}>
									<Box color='green.fg'>
										<CheckCircle2
											size={44}
											strokeWidth={1.5}
										/>
									</Box>
									<Text
										fontSize='15px'
										fontWeight='600'>
										“{data?.passkey?.name}” is ready
									</Text>
									<Text
										fontSize='13px'
										color='fg.muted'>
										Next time you sign in on {data?.device || 'that device'}, use its passkey — Face ID, Touch ID or the phone’s screen lock.
									</Text>
								</Flex>
							) : (
								<Flex
									direction='column'
									align='center'
									gap={4}>
									<Text
										fontSize='13px'
										color='fg.muted'
										textAlign='center'>
										Scan this with your phone’s camera. It opens a page that saves a passkey for this account in the phone’s keychain — iCloud
										Keychain on iPhone, Google Password Manager on Android.
									</Text>
									<Center
										position='relative'
										w='220px'
										h='220px'
										p={2.5}
										bg='white'
										borderRadius='xl'
										borderWidth={1}
										borderColor='border'>
										{qr ? (
											<Image
												src={qr}
												alt='QR code to add a passkey on another device'
												w='full'
												h='full'
												opacity={status === 'waiting' ? 1 : 0.12}
												transition='opacity 200ms'
											/>
										) : (
											<Spinner color='gray.600' />
										)}
										{status === 'opened' && (
											<Flex
												position='absolute'
												inset={0}
												direction='column'
												align='center'
												justify='center'
												gap={2}
												color='gray.800'
												textAlign='center'
												px={4}>
												<Smartphone size={28} />
												<Text
													fontSize='13px'
													fontWeight='600'>
													Opened on {data?.device || 'your phone'}
												</Text>
												<Text fontSize='12px'>Finish on the phone…</Text>
											</Flex>
										)}
										{status === 'expired' && (
											<Flex
												position='absolute'
												inset={0}
												direction='column'
												align='center'
												justify='center'
												gap={2}
												color='gray.800'>
												<TimerOff size={26} />
												<Text
													fontSize='13px'
													fontWeight='600'>
													This code expired
												</Text>
												<Button
													size='xs'
													onClick={onRenew}>
													Make a new one
												</Button>
											</Flex>
										)}
									</Center>
									{status !== 'expired' && (
										<Flex
											align='center'
											gap={2}
											fontSize='12px'
											color='fg.muted'>
											<Spinner size='xs' />
											{status === 'opened' ? 'Waiting for the phone to save it' : 'Waiting for a scan'}
											{expiresAt ? ` · expires in ${mmss(expiresAt - now)}` : ''}
										</Flex>
									)}
									<Flex
										gap={3}
										align='center'
										flexWrap='wrap'
										justify='center'>
										<Button
											size='xs'
											variant='ghost'
											disabled={status === 'expired'}
											onClick={copy}>
											<Copy size={13} />
											Copy link instead
										</Button>
										<Link
											href={docsPath('/docs/two-factor#passkey-qr')}
											target='_blank'
											rel='noreferrer'
											fontSize='12px'
											color='fg.muted'
											display='inline-flex'
											alignItems='center'
											gap={1}
											_hover={{ color: 'fg' }}>
											How this works
											<ExternalLink size={11} />
										</Link>
									</Flex>
									<Text
										fontSize='11px'
										color='fg.subtle'
										textAlign='center'>
										Anyone with this code can add a passkey to your account for the next few minutes — only scan it with your own phone.
									</Text>
								</Flex>
							)}
						</Dialog.Body>
						<ModalFooter>
							<Button
								variant={done ? 'solid' : 'outline'}
								onClick={close}>
								{done ? 'Done' : 'Cancel'}
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default PasskeyQrDialog;
