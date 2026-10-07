'use client';

import { FC, ReactNode } from 'react';
import NextLink from 'next/link';
import { Badge, Button, Flex, Link, Skeleton, Text } from '@chakra-ui/react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { useGetMySessionsQuery, useGetTwoFactorQuery } from '@/components/library';
import { deviceLabel, placeLabel } from '@/components/library/components/sessions/sessionView';
import { Row, SettingsCard } from './ui';

const PAGE = '/settings/security';

/** A row's value, linking to its section of the Sign-in & security page. */
const Go: FC<{ anchor: string; children: ReactNode }> = ({ anchor, children }) => (
	<Link
		asChild
		display='flex'
		alignItems='center'
		justifyContent='space-between'
		gap={3}
		color='fg'
		minH='32px'
		_hover={{ textDecoration: 'none', color: 'fg.muted' }}>
		<NextLink href={`${PAGE}#${anchor}`}>
			<Flex
				align='center'
				gap={2}
				minW={0}
				flexWrap='wrap'>
				{children}
			</Flex>
			<ChevronRight
				size={15}
				style={{ flexShrink: 0 }}
			/>
		</NextLink>
	</Link>
);

/**
 * Settings → Sign-in & security, at a glance: the password, two-factor
 * status and the devices signed in (this one, and where). The details and
 * every change are on /settings/security.
 */
const SecuritySummaryCard: FC = () => {
	const { data: twoFactor, isLoading: loadingTwoFactor } = useGetTwoFactorQuery();
	const { data: sessions, isLoading: loadingSessions } = useGetMySessionsQuery();

	const devices = sessions?.doc || [];
	const here = devices.find(s => s.current);
	const methods = twoFactor
		? [
				twoFactor.email.enabled && 'Email code',
				twoFactor.passkeys.length && `${twoFactor.passkeys.length} passkey${twoFactor.passkeys.length === 1 ? '' : 's'}`,
				twoFactor.enabled && `${twoFactor.backupCodes.remaining} backup code${twoFactor.backupCodes.remaining === 1 ? '' : 's'} left`,
		  ].filter(Boolean)
		: [];

	return (
		<SettingsCard
			id='security'
			icon={<ShieldCheck size={16} />}
			title='Sign-in & security'
			description='Your password, two-factor authentication, and every device you’re signed in on — where it is and when it was last active.'
			note={twoFactor && !twoFactor.enabled ? 'Tip: turn on two-factor so a password alone can’t sign in.' : undefined}
			actions={
				<Button
					asChild
					size='sm'
					px={3}>
					<NextLink href={PAGE}>
						Manage sign-in & security
						<ChevronRight size={14} />
					</NextLink>
				</Button>
			}>
			<Row label='Password'>
				<Go anchor='password'>
					<Text fontSize='13px'>••••••••</Text>
					<Text
						fontSize='12px'
						color='fg.muted'>
						Change it any time
					</Text>
				</Go>
			</Row>
			<Row label='Two-factor authentication'>
				{loadingTwoFactor ? (
					<Skeleton h='20px' />
				) : (
					<Go anchor='two-factor'>
						<Badge
							size='sm'
							colorPalette={twoFactor?.enabled ? 'green' : 'gray'}>
							{twoFactor?.enabled ? 'On' : 'Off'}
						</Badge>
						<Text
							fontSize='12px'
							color='fg.muted'
							truncate>
							{twoFactor?.enabled ? methods.join(' · ') : 'Your password alone signs you in'}
						</Text>
					</Go>
				)}
			</Row>
			<Row
				label='Signed-in devices'
				hint={loadingSessions ? undefined : `${devices.length} device${devices.length === 1 ? '' : 's'}`}>
				{loadingSessions ? (
					<Skeleton h='20px' />
				) : (
					<Go anchor='devices'>
						<Text
							fontSize='13px'
							truncate>
							{here ? `This device: ${deviceLabel(here)}` : 'This device'}
						</Text>
						{here && (
							<Text
								fontSize='12px'
								color='fg.muted'
								truncate>
								{placeLabel(here)}
								{devices.length > 1 ? ` · and ${devices.length - 1} other${devices.length === 2 ? '' : 's'}` : ''}
							</Text>
						)}
					</Go>
				)}
			</Row>
		</SettingsCard>
	);
};

export default SecuritySummaryCard;
