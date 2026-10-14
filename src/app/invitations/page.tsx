'use client';

import { FC, useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
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
 * Each opens its own page, /invitations/<id> — where an invitation's
 * notification leads; an older /invitations?id= link goes there too.
 * Accepting opens the organization — or the project, for a project's
 * invitation.
 */

const errorText = (e: any) => e?.data?.message || 'Something went wrong — try again.';

const what = (i: MyInvitation) => (i.project ? `${i.projects[0] || 'A project'} in ${i.organization.name}` : i.organization.name);
const reach = (i: MyInvitation) => (i.project ? 'This project only' : i.allProjects ? 'Every project' : i.projects.join(', ') || 'No projects yet');

const Card: FC<{ i: MyInvitation }> = ({ i }) => {
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
>
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
						fontWeight='600'
						_hover={{ textDecoration: 'underline' }}
						asChild>
						<NextLink href={`/invitations/${i._id}`}>{i.invitedBy ? `${i.invitedBy} invited you to ${what(i)}` : `You’re invited to ${what(i)}`}</NextLink>
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
	const router = useRouter();
	// An older notification's /invitations?id=… opens that invitation's own page (no useSearchParams: it needs a Suspense boundary).
	useEffect(() => {
		const id = new URLSearchParams(window.location.search).get('id');
		if (id) router.replace(`/invitations/${id}`);
	}, []);
	const list = data?.doc || [];

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
						{list.length ? (
							list.map(i => (
								<Card
									key={i._id}
									i={i}
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
