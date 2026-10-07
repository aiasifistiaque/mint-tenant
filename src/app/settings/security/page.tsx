'use client';

import { useEffect } from 'react';
import NextLink from 'next/link';
import { Box, Button, Flex, Link, Text } from '@chakra-ui/react';
import { ChevronLeft, KeyRound } from 'lucide-react';
import { Layout, UpdatePasswordModal } from '@/components/library';
import { SettingsCard } from '../_components/ui';
import TwoFactorCard from '../_components/TwoFactorCard';
import SessionsCard from '../_components/SessionsCard';

/**
 * Settings → Sign-in & security: the password, two-factor authentication and
 * the signed-in devices list (device, location, signed in, last active). The
 * Settings page shows a summary that links here; guides link to
 * #password, #two-factor and #devices.
 */
const SecurityPage = () => {
	// The page renders after the auth check, so the browser's own jump to
	// `#section` has already happened (to nothing). Do it once content exists.
	useEffect(() => {
		const id = decodeURIComponent(window.location.hash.slice(1));
		if (!id) return;
		const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 300);
		return () => clearTimeout(t);
	}, []);

	return (
		<Layout
			title='Sign-in & security'
			path='settings'>
			<Flex
				direction='column'
				gap={5}
				w='full'
				maxW='960px'
				mx='auto'
				pt={4}
				pb={10}>
				<Box mb={1}>
					<Link
						asChild
						fontSize='12px'
						color='fg.muted'
						display='inline-flex'
						alignItems='center'
						gap={1}
						mb={2}
						_hover={{ color: 'fg', textDecoration: 'none' }}>
						<NextLink href='/settings'>
							<ChevronLeft size={13} />
							Settings
						</NextLink>
					</Link>
					<Text
						fontSize='20px'
						fontWeight='600'
						letterSpacing='-0.01em'>
						Sign-in & security
					</Text>
					<Text
						fontSize='13px'
						color='fg.muted'>
						How you sign in, and everywhere your account is signed in right now.
					</Text>
				</Box>

				<SettingsCard
					id='password'
					icon={<KeyRound size={16} />}
					title='Password'
					description='The password you sign in with. You’ll need your current one to change it.'
					note='Use at least 8 characters, and one you don’t use elsewhere.'
					actions={
						<UpdatePasswordModal
							trigger={
								<Button
									size='sm'
									px={3}
									variant='outline'>
									Change password
								</Button>
							}
						/>
					}
				/>

				<TwoFactorCard />

				<SessionsCard />
			</Flex>
		</Layout>
	);
};

export default SecurityPage;
