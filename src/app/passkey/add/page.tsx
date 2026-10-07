'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { Box, Button, Center, Flex, Heading, Input, Spinner, Text } from '@chakra-ui/react';
import { CheckCircle2, KeyRound, TimerOff } from 'lucide-react';
import { useFinishPasskeyLinkMutation, useOpenPasskeyLinkMutation } from '@/components/library';
import { passkeyError, passkeysSupported, startRegistration } from '@/components/library/utils/functions/passkeys';

type Opened = { admin: { name?: string; email: string }; suggestedName: string; options: any };
type Stage = 'loading' | 'ready' | 'saving' | 'done' | 'gone' | 'unsupported';

const Shell: FC<{ icon: ReactNode; title: string; children: ReactNode }> = ({ icon, title, children }) => (
	<Center
		minH='100dvh'
		px={4}
		py={10}
		bg='sidebar.light'
		_dark={{ bg: 'container.dark' }}>
		<Flex
			direction='column'
			gap={5}
			w='full'
			maxW='400px'
			p={{ base: 6, md: 8 }}
			bg='bg.panel'
			_dark={{ bg: 'sidebar.dark' }}
			borderWidth={1}
			borderColor='border'
			borderRadius='24px'
			boxShadow='lg'>
			<Flex
				direction='column'
				align='center'
				textAlign='center'
				gap={3}>
				<Center
					w='48px'
					h='48px'
					borderRadius='full'
					bg='bg.muted'>
					{icon}
				</Center>
				<Heading size='lg'>{title}</Heading>
			</Flex>
			{children}
		</Flex>
	</Center>
);

/**
 * Opened on a phone (or any device) from the QR code in Settings →
 * Sign-in & security → Add passkey → On your phone. The link's token is
 * after the `#`, so it never reaches a server log. This page makes a passkey
 * for that account in this device's own keychain (iCloud Keychain, Google
 * Password Manager) — no sign-in needed; the link is single-use and expires
 * in 10 minutes. The computer that showed the QR sees it arrive.
 */
const AddPasskeyPage = () => {
	const [open] = useOpenPasskeyLinkMutation();
	const [finish] = useFinishPasskeyLinkMutation();
	const [stage, setStage] = useState<Stage>('loading');
	const [info, setInfo] = useState<Opened | null>(null);
	const [name, setName] = useState('');
	const [error, setError] = useState('');
	const [added, setAdded] = useState('');
	const token = useRef('');

	useEffect(() => {
		token.current = decodeURIComponent(window.location.hash.slice(1));
		if (!token.current) {
			setError('This link is missing its code. Scan the QR code on your computer again.');
			return setStage('gone');
		}
		if (!passkeysSupported()) return setStage('unsupported');
		open({ token: token.current })
			.unwrap()
			.then(r => {
				setInfo(r);
				setName(r.suggestedName);
				setStage('ready');
			})
			.catch((e: any) => {
				setError(e?.data?.message || 'This QR code has expired or was already used.');
				setStage('gone');
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const create = async () => {
		if (!info) return;
		setError('');
		setStage('saving');
		try {
			const response = await startRegistration(info.options);
			const r = await finish({ token: token.current, response, name: name.trim() || info.suggestedName }).unwrap();
			setAdded(r.passkey.name);
			setStage('done');
		} catch (e: any) {
			if (e?.data?.code === 'link_expired') {
				setError(e.data.message);
				setStage('gone');
				return;
			}
			setError(passkeyError(e, true));
			setStage('ready');
		}
	};

	if (stage === 'loading')
		return (
			<Shell
				icon={<Spinner size='sm' />}
				title='Opening…'>
				<Text
					fontSize='14px'
					color='fg.muted'
					textAlign='center'>
					Checking the QR code.
				</Text>
			</Shell>
		);

	if (stage === 'gone')
		return (
			<Shell
				icon={<TimerOff size={22} />}
				title='This code can’t be used'>
				<Text
					fontSize='14px'
					color='fg.muted'
					textAlign='center'>
					{error}
				</Text>
			</Shell>
		);

	if (stage === 'unsupported')
		return (
			<Shell
				icon={<KeyRound size={22} />}
				title='Passkeys aren’t available here'>
				<Text
					fontSize='14px'
					color='fg.muted'
					textAlign='center'>
					This browser can’t create passkeys. Open the link in Safari on iPhone or iPad, or Chrome on Android, and try again.
				</Text>
			</Shell>
		);

	if (stage === 'done')
		return (
			<Shell
				icon={
					<Box color='green.fg'>
						<CheckCircle2 size={26} />
					</Box>
				}
				title='Passkey saved'>
				<Text
					fontSize='14px'
					color='fg.muted'
					textAlign='center'>
					“{added}” is saved on this device. When you sign in to MINT here, choose <strong>Continue with passkey</strong> and confirm with
					Face ID, Touch ID or your screen lock. You can close this page — your computer already shows it.
				</Text>
			</Shell>
		);

	return (
		<Shell
			icon={<KeyRound size={22} />}
			title='Add a passkey to this device'>
			<Text
				fontSize='14px'
				color='fg.muted'
				textAlign='center'>
				For <strong>{info?.admin.name || 'your account'}</strong> ({info?.admin.email}). The passkey is saved in this device’s keychain, so you
				can sign in here with Face ID, Touch ID or your screen lock.
			</Text>
			<Box>
				<Text
					fontSize='12px'
					fontWeight='600'
					mb={1.5}>
					Name
				</Text>
				<Input
					value={name}
					maxLength={60}
					onChange={e => setName(e.target.value)}
					size='lg'
				/>
			</Box>
			{error && (
				<Box
					role='alert'
					px={3}
					py={2.5}
					borderRadius='lg'
					bg='red.subtle'
					color='red.fg'
					fontSize='13px'>
					{error}
				</Box>
			)}
			<Button
				size='lg'
				loading={stage === 'saving'}
				loadingText='Waiting for your device'
				onClick={create}>
				<KeyRound size={17} />
				Create passkey
			</Button>
			<Text
				fontSize='12px'
				color='fg.subtle'
				textAlign='center'>
				Didn’t scan this from your own computer just now? Close this page.
			</Text>
		</Shell>
	);
};

export default AddPasskeyPage;
