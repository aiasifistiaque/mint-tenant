'use client';

import { FC } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import { Box, Button, Center, Flex, Image, Skeleton, Text } from '@chakra-ui/react';
import { Check, Clock, FolderKanban, ShieldCheck, X } from 'lucide-react';
import { Layout } from '@/components/library';
import { Panel, date } from '@/components/library/cl';
import { HOME } from '@/components/library/config/lib/constants/panel';
import { useAcceptMyInvitationMutation, useDeclineMyInvitationMutation, useGetMyInvitationQuery } from '@/components/library/store';
import type { MyInvitationDetail } from '@/components/library/store/services/tenantApi';
import GuideLink from '@/components/library/tenant/GuideLink';
import { VerifyEmail, useEnter } from '@/components/library/tenant/Workspaces';

/**
 * One invitation on its own page (WO-50), like GitHub's: who invited you,
 * where to, with which role — then Accept or Decline. An invitation's
 * notification opens it (/invitations/<id>). One that can't be answered any
 * more says why: accepted, declined, withdrawn, expired, or already yours.
 */

const errorText = (e: any) => e?.data?.message || 'Something went wrong — try again.';

const where = (i: MyInvitationDetail) => (i.project ? i.projects[0] || 'a project' : i.organization.name);

const CLOSED: Record<MyInvitationDetail['state'], string> = {
	open: '',
	accepted: 'You accepted this invitation.',
	joined: 'You already have this — nothing to accept.',
	declined: 'You declined this invitation.',
	cancelled: 'This invitation was withdrawn.',
	expired: 'This invitation has expired. Ask whoever sent it for a new one.',
};

const Line: FC<{ icon: any; label: string; children: any }> = ({ icon: Icon, label, children }) => (
	<Flex
		gap={3}
		align='flex-start'>
		<Box
			color='fg.muted'
			mt={0.5}
			flexShrink={0}>
			<Icon size={16} />
		</Box>
		<Box minW={0}>
			<Text
				fontSize='12px'
				color='fg.muted'>
				{label}
			</Text>
			<Box fontSize='14px'>{children}</Box>
		</Box>
	</Flex>
);

const Invitation: FC<{ i: MyInvitationDetail }> = ({ i }) => {
	const [accept, accepting] = useAcceptMyInvitationMutation();
	const [decline, declining] = useDeclineMyInvitationMutation();
	const enter = useEnter();
	const open = i.state === 'open';
	const error = accepting.error || declining.error;
	const initials = i.organization.name
		.split(/\s+/)
		.slice(0, 2)
		.map(w => w[0])
		.join('')
		.toUpperCase();

	return (
		<Panel>
			<Flex
				direction='column'
				align='center'
				textAlign='center'
				gap={4}
				py={4}>
				{i.organization.logo ? (
					<Image
						src={i.organization.logo}
						alt=''
						boxSize='64px'
						borderRadius='lg'
						objectFit='cover'
					/>
				) : (
					<Center
						boxSize='64px'
						borderRadius='lg'
						bg='bg.muted'
						fontSize='22px'
						fontWeight='600'>
						{initials}
					</Center>
				)}
				<Box>
					<Text
						fontSize='20px'
						fontWeight='600'
						lineHeight='1.3'>
						{i.invitedBy ? `${i.invitedBy} invited you to join ${where(i)}` : `You’re invited to join ${where(i)}`}
					</Text>
					{i.project && (
						<Text
							fontSize='14px'
							color='fg.muted'
							mt={1}>
							in {i.organization.name}
						</Text>
					)}
				</Box>
			</Flex>

			<Flex
				direction='column'
				gap={3.5}
				borderTopWidth='1px'
				borderColor='border.muted'
				pt={4}>
				<Line
					icon={ShieldCheck}
					label='Your role'>
					<Text fontWeight='600'>{i.role || '—'}</Text>
					{i.roleDescription && (
						<Text
							fontSize='13px'
							color='fg.muted'>
							{i.roleDescription}
						</Text>
					)}
				</Line>
				<Line
					icon={FolderKanban}
					label='You’ll open'>
					{i.project ? `${i.projects[0] || 'The project'} only` : i.allProjects ? `Every project in ${i.organization.name}` : i.projects.join(', ') || 'No projects yet'}
				</Line>
				{open && (
					<Line
						icon={Clock}
						label='Open until'>
						{date(i.expiresAt)}
					</Line>
				)}
			</Flex>

			{error && (
				<Text
					role='alert'
					mt={4}
					fontSize='13px'
					color='red.fg'>
					{errorText(error)}
				</Text>
			)}

			{open ? (
				<Flex
					mt={5}
					gap={2}
					direction={{ base: 'column', sm: 'row' }}>
					<Button
						flex={1}
						loading={accepting.isLoading}
						disabled={declining.isLoading}
						onClick={async () => {
							const res = await accept(i._id);
							if ('data' in res) enter(res.data?.token, res.data?.project);
						}}>
						<Check size={15} />
						Accept invitation
					</Button>
					<Button
						flex={1}
						variant='outline'
						loading={declining.isLoading}
						disabled={accepting.isLoading}
						onClick={() => decline(i._id)}>
						<X size={15} />
						Decline
					</Button>
				</Flex>
			) : (
				<Flex
					mt={5}
					p={3}
					borderRadius='md'
					bg='bg.muted'
					align='center'
					justify='space-between'
					gap={3}
					wrap='wrap'>
					<Text fontSize='13.5px'>{CLOSED[i.state]}</Text>
					<Button
						size='sm'
						variant='outline'
						asChild>
						<NextLink href={i.address ? `/${i.address}` : HOME}>{i.address ? `Open ${i.projects[0] || 'the project'}` : 'Go home'}</NextLink>
					</Button>
				</Flex>
			)}
		</Panel>
	);
};

export default function InvitationPage() {
	const { id } = useParams<{ id: string }>();
	const { data, isLoading, error } = useGetMyInvitationQuery(id, { skip: !id });

	return (
		<Layout
			title='Invitation'
			path='invitations'>
			<Flex
				direction='column'
				gap={4}
				maxW='520px'
				mx='auto'
				pt={{ base: 2, md: 8 }}>
				{isLoading ? (
					<Skeleton h='360px' />
				) : error ? (
					<Panel>
						<Text
							fontSize='15px'
							fontWeight='600'>
							Invitation not found
						</Text>
						<Text
							fontSize='13.5px'
							color='fg.muted'
							mt={1}>
							{errorText(error)}
						</Text>
					</Panel>
				) : data && !data.verified ? (
					<Panel>
						<VerifyEmail email={data.email} />
					</Panel>
				) : data?.invitation ? (
					<Invitation i={data.invitation} />
				) : null}
				<Flex
					justify='space-between'
					fontSize='13px'
					color='fg.muted'>
					<NextLink href='/invitations'>All your invitations</NextLink>
					<GuideLink section='invited' />
				</Flex>
			</Flex>
		</Layout>
	);
}
