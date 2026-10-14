'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { Box, Button, Center, Dialog, Flex, Image, Portal, Spinner, Text } from '@chakra-ui/react';
import { Download, EllipsisVertical, Share } from 'lucide-react';
import QRCode from 'qrcode';
import AlertDialogContent from '../modals/modal-components/AlertContent';
import AlertDialogHeader from '../modals/modal-components/AlertDialogHeader';
import ModalFooter from '../modals/modal-components/CustomModalFooter';
import GuideLink from './GuideLink';
import { InstallPlatform, installPlatform, promptInstall, useInstallApp } from './installApp';

/** "Share" etc. as it looks in the browser: a small chip with the browser's own icon. */
const Chip: FC<{ icon?: ReactNode; children: ReactNode }> = ({ icon, children }) => (
	<Box
		as='span'
		display='inline-flex'
		alignItems='center'
		gap={1}
		px={1.5}
		py='1px'
		mx='2px'
		borderRadius='md'
		borderWidth='1px'
		borderColor='border'
		bg='bg.subtle'
		fontSize='12px'
		fontWeight='500'
		color='fg'
		verticalAlign='middle'>
		{icon}
		{children}
	</Box>
);

const Steps: FC<{ steps: ReactNode[] }> = ({ steps }) => (
	<Flex
		as='ol'
		direction='column'
		gap={2.5}
		listStyleType='none'
		m={0}
		p={0}>
		{steps.map((step, i) => (
			<Flex
				as='li'
				key={i}
				gap={2.5}
				align='baseline'>
				<Center
					flexShrink={0}
					boxSize='20px'
					borderRadius='full'
					borderWidth='1px'
					borderColor='border'
					fontSize='11px'
					color='fg.muted'
					fontFamily='mono'>
					{i + 1}
				</Center>
				<Text
					fontSize='13px'
					lineHeight='1.6'>
					{step}
				</Text>
			</Flex>
		))}
	</Flex>
);

/** This browser's own way to install, for the ones that don't hand over a prompt. */
const STEPS: Record<InstallPlatform, ReactNode[]> = {
	ios: [
		<>
			Tap <Chip icon={<Share size={12} />}>Share</Chip> — at the bottom of Safari, or in the address bar in Chrome.
		</>,
		<>
			Scroll down and tap <Chip>Add to Home Screen</Chip>.
		</>,
		<>
			Tap <Chip>Add</Chip>. MINT is on your home screen.
		</>,
	],
	android: [
		<>
			Open the browser’s menu <Chip icon={<EllipsisVertical size={12} />}>Menu</Chip>.
		</>,
		<>
			Tap <Chip>Install app</Chip> or <Chip>Add to Home screen</Chip>.
		</>,
		<>Confirm. MINT is on your home screen and in your apps.</>,
	],
	'mac-safari': [
		<>
			In the menu bar, choose <Chip>File</Chip> → <Chip>Add to Dock</Chip>.
		</>,
		<>
			Click <Chip>Add</Chip>. MINT opens from the Dock in its own window.
		</>,
	],
	other: [
		<>
			In Chrome or Edge, click the install icon at the right end of the address bar, or open the browser’s menu and choose{' '}
			<Chip>Install MINT</Chip>.
		</>,
		<>Firefox on a computer can’t install apps — use the code below to put MINT on your phone instead.</>,
	],
};

const SectionLabel: FC<{ children: ReactNode }> = ({ children }) => (
	<Text
		fontFamily='mono'
		fontSize='11px'
		letterSpacing='0.12em'
		textTransform='uppercase'
		color='fg.muted'
		mb={2.5}>
		{children}
	</Text>
);

/**
 * Account menu → Install app: MINT as an app on this device, from its own
 * icon and full screen. With a browser prompt it's one button; otherwise the
 * browser's own steps. On a computer, a QR code opens MINT on the phone.
 */
const InstallAppDialog: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
	const { canPrompt } = useInstallApp();
	const [platform, setPlatform] = useState<InstallPlatform>('other');
	const [qr, setQr] = useState('');
	const onPhone = platform === 'ios' || platform === 'android';

	useEffect(() => {
		if (open) setPlatform(installPlatform());
	}, [open]);

	useEffect(() => {
		if (!open || onPhone) return;
		// Dark on white whatever the theme: phone cameras read contrast, not colour.
		QRCode.toDataURL(`${window.location.origin}/dashboard`, {
			margin: 1,
			width: 360,
			errorCorrectionLevel: 'M',
			color: { dark: '#111111', light: '#ffffff' },
		})
			.then(setQr)
			.catch(() => setQr(''));
	}, [open, onPhone]);

	const install = async () => {
		if ((await promptInstall()) === 'accepted') onClose();
	};

	return (
		<Dialog.Root
			placement='center'
			size='sm'
			open={open}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						borderWidth='1px'
						borderColor='border'
						_dark={{ bg: 'background.dark' }}>
						<AlertDialogHeader>Install the MINT app</AlertDialogHeader>
						<Dialog.Body
							p={4}
							pb={5}>
							<Text
								fontSize='13px'
								color='fg.muted'
								mb={5}>
								MINT opens from its own icon, full screen without the browser’s bars — like any other app on your{' '}
								{onPhone ? 'phone' : 'phone or computer'}.
							</Text>

							<SectionLabel>On this {onPhone ? 'phone' : 'computer'}</SectionLabel>
							{canPrompt ? (
								<Flex
									align='center'
									gap={3}
									flexWrap='wrap'>
									<Button
										size='sm'
										px={3}
										onClick={install}>
										<Download size={14} />
										Install MINT
									</Button>
									<Text
										fontSize='12px'
										color='fg.muted'>
										Your browser asks you to confirm.
									</Text>
								</Flex>
							) : (
								<Steps steps={STEPS[platform]} />
							)}

							{!onPhone && (
								<>
									<Box
										h='1px'
										bg='border.muted'
										my={5}
									/>
									<SectionLabel>On your phone</SectionLabel>
									<Flex
										gap={4}
										align='center'>
										<Center
											flexShrink={0}
											boxSize='120px'
											p={1.5}
											bg='white'
											borderRadius='lg'
											borderWidth='1px'
											borderColor='border'>
											{qr ? (
												<Image
													src={qr}
													alt='QR code that opens MINT on your phone'
													w='full'
													h='full'
												/>
											) : (
												<Spinner color='gray.600' />
											)}
										</Center>
										<Text
											fontSize='13px'
											color='fg.muted'>
											Scan this with your phone’s camera to open MINT there, then choose Install app from the account menu on the phone.
										</Text>
									</Flex>
								</>
							)}

							<Text
								fontSize='11.5px'
								color='fg.subtle'
								mt={5}>
								Sign in once inside the app — on iPhone it doesn’t share Safari’s sign-in.
							</Text>
						</Dialog.Body>
						<ModalFooter>
							<Flex
								w='full'
								justify='space-between'
								align='center'
								gap={3}>
								<GuideLink
									section='install-app'
									label='How this works'
								/>
								<Button
									px={3}
									size='sm'
									onClick={onClose}>
									Done
								</Button>
							</Flex>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default InstallAppDialog;
