'use client';

import { FC, ReactNode, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, Link, Skeleton, Text } from '@chakra-ui/react';
import { ExternalLink, MonitorSmartphone } from 'lucide-react';
import {
	AdminSessionView,
	PromptDialog,
	logout,
	useAppDispatch,
	useGetMySessionsQuery,
	useSignOutOtherSessionsMutation,
	useSignOutSessionMutation,
} from '@/components/library';
import { DeviceIcon, ago, deviceLabel, methodLabel, placeLabel, when } from '@/components/library/components/sessions/sessionView';
import { toaster } from '@/components/ui/toaster';
import { SettingsCard } from './ui';
import { docsPath } from '@/components/library/config/lib/constants/panel';

const COMPACT = { size: 'sm', px: 3 } as const;
const COLUMNS = { base: '1fr', md: 'minmax(0, 1.35fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) 84px' };

const DocLink: FC<{ anchor: string }> = ({ anchor }) => (
	<Link
		href={docsPath(`/docs/two-factor#${anchor}`)}
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
);

/** One cell: its value, a muted second line, and (on a phone) the column name above. */
const Cell: FC<{ label: string; children: ReactNode; sub?: ReactNode; title?: string }> = ({ label, children, sub, title }) => (
	<Box
		minW={0}
		title={title}>
		<Text
			display={{ base: 'block', md: 'none' }}
			fontSize='11px'
			fontWeight='500'
			letterSpacing='0.04em'
			textTransform='uppercase'
			color='fg.subtle'>
			{label}
		</Text>
		<Text
			fontSize='13px'
			truncate>
			{children}
		</Text>
		{sub && (
			<Text
				fontSize='12px'
				color='fg.muted'
				truncate>
				{sub}
			</Text>
		)}
	</Box>
);

const SessionRow: FC<{ s: AdminSessionView; onSignOut: () => void }> = ({ s, onSignOut }) => {
	const moved = s.signInLocation && s.location && s.signInLocation !== s.location;
	return (
		<Grid
			templateColumns={COLUMNS}
			gap={{ base: 2, md: 4 }}
			alignItems='center'
			py={3.5}
			borderTopWidth='1px'
			borderColor='border.muted'>
			<Flex
				align='center'
				gap={3}
				minW={0}>
				<Flex
					flexShrink={0}
					w='36px'
					h='36px'
					align='center'
					justify='center'
					borderRadius='lg'
					bg='bg.muted'
					color='fg.muted'>
					<DeviceIcon type={s.deviceType} />
				</Flex>
				<Box minW={0}>
					<Flex
						align='center'
						gap={2}
						flexWrap='wrap'>
						<Text
							fontSize='13px'
							fontWeight='500'>
							{deviceLabel(s)}
						</Text>
						{s.current && (
							<Badge
								size='xs'
								colorPalette='green'>
								This device
							</Badge>
						)}
					</Flex>
					<Text
						fontSize='12px'
						color='fg.muted'
						truncate>
						{methodLabel(s.method)}
					</Text>
				</Box>
			</Flex>

			<Cell
				label='Location'
				sub={s.ip || 'IP unknown'}
				title={moved ? `Signed in from ${s.signInLocation}${s.signInIp ? ` (${s.signInIp})` : ''}` : undefined}>
				{placeLabel(s)}
			</Cell>

			<Cell
				label='Signed in'
				sub={ago(s.signedInAt)}>
				{when(s.signedInAt)}
			</Cell>

			<Cell
				label='Last active'
				sub={s.current || s.online ? when(s.lastActiveAt) : ago(s.lastActiveAt)}>
				{s.current || s.online ? (
					<Flex
						as='span'
						align='center'
						gap={1.5}>
						<Box
							as='span'
							w='7px'
							h='7px'
							borderRadius='full'
							bg='green.solid'
						/>
						Active now
					</Flex>
				) : (
					when(s.lastActiveAt)
				)}
			</Cell>

			<Flex justify={{ base: 'flex-start', md: 'flex-end' }}>
				<Button
					{...COMPACT}
					variant='outline'
					onClick={onSignOut}>
					Sign out
				</Button>
			</Flex>
		</Grid>
	);
};

/**
 * Sign-in & security → Signed-in devices: every device this account is
 * signed in on — where it is, when it signed in and when it was last active —
 * and signing one (or all the others) out. A signed-out device's next request
 * is refused and it lands on the login page.
 */
const SessionsCard: FC = () => {
	const dispatch = useAppDispatch();
	const { data, isLoading } = useGetMySessionsQuery();
	const [signOut, signingOut] = useSignOutSessionMutation();
	const [signOutOthers, signingOutOthers] = useSignOutOtherSessionsMutation();
	const [target, setTarget] = useState<AdminSessionView | 'others' | null>(null);

	const list = data?.doc || [];
	const others = list.filter(s => !s.current).length;

	const confirm = async () => {
		try {
			if (target === 'others') {
				const r = await signOutOthers().unwrap();
				toaster.create({ type: 'success', title: r.message });
			} else if (target) {
				await signOut(target._id).unwrap();
				if (target.current) {
					dispatch(logout());
					return;
				}
				toaster.create({ type: 'success', title: `Signed out ${deviceLabel(target)}` });
			}
			setTarget(null);
		} catch (e: any) {
			toaster.create({ type: 'error', title: 'Couldn’t sign out', description: e?.data?.message });
		}
	};

	return (
		<>
			<SettingsCard
				id='devices'
				icon={<MonitorSmartphone size={16} />}
				title='Signed-in devices'
				description={
					<>
						Every device your account is signed in on — where it is, when it signed in and when it was last active. Sign out any you
						don’t recognise. <DocLink anchor='devices' />
					</>
				}
				note={isLoading ? '' : `${list.length} device${list.length === 1 ? '' : 's'} signed in`}
				actions={
					<Button
						{...COMPACT}
						variant='outline'
						disabled={!others}
						onClick={() => setTarget('others')}>
						Sign out other devices
					</Button>
				}>
				{isLoading ? (
					<Skeleton h='120px' />
				) : (
					<Box mt={-3}>
						<Grid
							display={{ base: 'none', md: 'grid' }}
							templateColumns={COLUMNS}
							gap={4}
							pb={2}
							fontSize='11px'
							fontWeight='500'
							letterSpacing='0.04em'
							textTransform='uppercase'
							color='fg.subtle'>
							<Text>Device</Text>
							<Text>Location</Text>
							<Text>Signed in</Text>
							<Text>Last active</Text>
							<Text />
						</Grid>
						{list.map(s => (
							<SessionRow
								key={s._id}
								s={s}
								onSignOut={() => setTarget(s)}
							/>
						))}
					</Box>
				)}
			</SettingsCard>

			<PromptDialog
				open={!!target}
				onClose={() => setTarget(null)}
				onConfirm={confirm}
				tone='warning'
				title={
					target === 'others'
						? `Sign out ${others} other device${others === 1 ? '' : 's'}?`
						: target && target.current
						? 'Sign out on this device?'
						: 'Sign out this device?'
				}
				description={
					target === 'others'
						? 'Every device except this one is signed out straight away. They’ll need your password (and two-factor, if it’s on) to sign in again.'
						: target && target.current
						? 'You’ll go to the login page.'
						: 'It’s signed out straight away — its next click goes to the login page.'
				}
				subject={target && target !== 'others' ? `${deviceLabel(target)}${target.location ? ` · ${target.location}` : ''}` : undefined}
				confirmLabel='Sign out'
				loading={signingOut.isLoading || signingOutOthers.isLoading}
				aside={<DocLink anchor='devices' />}
			/>
		</>
	);
};

export default SessionsCard;
