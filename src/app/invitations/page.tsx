'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Center, Flex, Skeleton, Text } from '@chakra-ui/react';
import { Check, MailOpen, X } from 'lucide-react';
import { Layout } from '@/components/library';
import { EmptyState, PageHeader, Panel, date } from '@/components/library/cl';
import { HOME } from '@/components/library/config/lib/constants/panel';
import { useAcceptMyInvitationMutation, useDeclineMyInvitationMutation, useGetMyInvitationsQuery } from '@/components/library/store';
import type { MyInvitation } from '@/components/library/store/services/tenantApi';
import GuideLink from '@/components/library/tenant/GuideLink';
import { VerifyEmail, useEnter } from '@/components/library/tenant/Workspaces';

/**
 * Invitations sent to this account's email, to accept or decline (WO-50).
 * An invitation's notification opens /invitations?id=<invitation>, which
 * puts that one first and marks it. Accepting opens the organization — or
 * the project, for a project's invitation.
 */

const errorText = (e: any) => e?.data?.message || 'Something went wrong — try again.';

const what = (i: MyInvitation) => (i.project ? `${i.projects[0] || 'A project'} in ${i.organization.name}` : i.organization.name);
const reach = (i: MyInvitation) => (i.project ? 'This project only' : i.allProjects ? 'Every project' : i.projects.join(', ') || 'No projects yet');

const Card: FC<{ i: MyInvitation; picked: boolean }> = ({ i, picked }) => {
	const [accept, accepting] = useAcceptMyInvitationMutation();
	const [decline, declining] = useDeclineMyInvitationMutation();
	const enter = useEnter();
	const error = accepting.error || declining.error;
	return (
		<Panel>
			<Flex
				id={`invitation-${i._id}`}
				gap={4}
				align={{ base: 'stretch', md: 'center' }}
				direction={{ base: 'column', md: 'row' }}
				p={picked ? 3 : 0}
				m={picked ? -3 : 0}
				borderRadius='md'
				bg={picked ? 'orange.subtle' : undefined}>
				<Center
					boxSize='40px'
					flexShrink={0}
					borderRadius='md'
					bg='bg.muted'
					color='fg.muted'>
					<MailOpen size={18} />
				</Center>
				<Box
					flex={1}
					minW={0}>
					<Text
						fontSize='15px'
						fontWeight='600'>
						{i.invitedBy ? `${i.invitedBy} invited you to ${what(i)}` : `You’re invited to ${what(i)}`}
					</Text>
					<Text
						fontSize='13px'
						color='fg.muted'
						mt={0.5}>
						{[i.role && `As ${i.role}`, reach(i), `Open until ${date(i.expiresAt)}`].filter(Boolean).join(' · ')}
					</Text>
					{error && (
						<Text
							role='alert'
							fontSize='12.5px'
							color='red.fg'
							mt={1}>
							{errorText(error)}
						</Text>
					)}
				</Box>
				<Flex
					gap={2}
					flexShrink={0}>
					<Button
						size='sm'
						variant='outline'
						loading={declining.isLoading}
						disabled={accepting.isLoading}
						onClick={() => decline(i._id)}>
						<X size={14} />
						Decline
					</Button>
					<Button
						size='sm'
						loading={accepting.isLoading}
						disabled={declining.isLoading}
						onClick={async () => {
							const res = await accept(i._id);
							if ('data' in res) enter(res.data?.token, res.data?.project);
						}}>
						<Check size={14} />
						Accept
					</Button>
				</Flex>
			</Flex>
		</Panel>
	);
};

export default function InvitationsPage() {
	const { data, isLoading } = useGetMyInvitationsQuery();
	// Read once on the client (no useSearchParams: it needs a Suspense boundary to build).
	const [picked, setPicked] = useState<string | null>(null);
	useEffect(() => setPicked(new URLSearchParams(window.location.search).get('id')), []);

	const list = [...(data?.doc || [])].sort((a, b) => Number(b._id === picked) - Number(a._id === picked));
	// The one the notification named, gone: accepted, declined, cancelled or expired.
	const missing = !!picked && !!data?.verified && !list.some(i => i._id === picked);

	return (
		<Layout
			title='Invitations'
			path='invitations'>
			<Flex
				direction='column'
				gap={5}
				maxW='760px'>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '#', title: 'Invitations' },
					]}
					title='Invitations'
					meta={data?.email ? `Sent to ${data.email}` : 'Invitations sent to your email'}
					actions={<GuideLink section='invitations' />}
				/>
				{isLoading ? (
					<Skeleton h='96px' />
				) : data && !data.verified ? (
					<Panel>
						<VerifyEmail email={data.email} />
					</Panel>
				) : (
					<>
						{missing && (
							<Text
								fontSize='13px'
								color='fg.muted'>
								That invitation isn’t open any more — it was accepted, declined, cancelled or it expired.
							</Text>
						)}
						{list.length ? (
							list.map(i => (
								<Card
									key={i._id}
									i={i}
									picked={i._id === picked}
								/>
							))
						) : (
							<EmptyState
								title='No invitations waiting'
								description='When someone invites you to an organization or a project, it shows here to accept or decline.'
							/>
						)}
					</>
				)}
			</Flex>
		</Layout>
	);
}
