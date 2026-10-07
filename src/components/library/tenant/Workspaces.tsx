'use client';

import { FC, FormEvent, useState } from 'react';
import { Badge, Box, Button, Center, Flex, Input, Text } from '@chakra-ui/react';
import { Building2, Check, MailCheck, MailOpen } from 'lucide-react';
import { useAppDispatch } from '../hooks';
import {
	refreshAuth,
	useAcceptMyInvitationMutation,
	useDeclineMyInvitationMutation,
	useGetMyInvitationsQuery,
	useSendEmailCodeMutation,
	useSwitchOrganizationMutation,
	useVerifyEmailMutation,
} from '../store';
import { HOME, rememberProject } from '../config/lib/constants/panel';
import { Panel } from '../cl';
import { useWorkspace } from './useWorkspace';
import GuideLink from './GuideLink';

/**
 * Everywhere this account can work (WO-24), under the projects: invitations
 * sent to its email — accept or decline here, once the email is verified —
 * and every organization it belongs to, one click to switch. Joining or
 * switching trades the token for one in that organization and starts the
 * panel over.
 */

const errorText = (e: any) => e?.data?.message || 'Something went wrong — try again.';

const useEnter = () => {
	const dispatch = useAppDispatch();
	return (token?: string) => {
		if (!token) return;
		rememberProject(null);
		dispatch(refreshAuth(token));
		window.location.href = HOME;
	};
};

/** Proving the account reads its email, so invitations sent to it can show here. */
const VerifyEmail: FC<{ email: string }> = ({ email }) => {
	const [send, sending] = useSendEmailCodeMutation();
	const [verify, verifying] = useVerifyEmailMutation();
	const [sent, setSent] = useState(false);
	const [code, setCode] = useState('');
	const error = sending.error || verifying.error;

	const submit = async (e?: FormEvent) => {
		e?.preventDefault();
		await verify({ code: code.trim() });
	};

	return (
		<Flex
			as='form'
			onSubmit={submit}
			direction={{ base: 'column', md: 'row' }}
			align={{ base: 'flex-start', md: 'center' }}
			gap={3}>
			<Center
				boxSize='36px'
				flexShrink={0}
				borderRadius='full'
				bg='bg.muted'
				color='fg.muted'>
				<MailCheck size={17} />
			</Center>
			<Box
				flex={1}
				minW={0}>
				<Text
					fontSize='13.5px'
					fontWeight='600'>
					Invited to another organization?
				</Text>
				<Text
					fontSize='12.5px'
					color='fg.muted'>
					{sent ? `Type the 6-digit code we sent to ${email}.` : `Verify ${email} and invitations sent to it show up here.`}
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
			{sent ? (
				<Flex gap={2}>
					<Input
						size='sm'
						w='120px'
						value={code}
						inputMode='numeric'
						autoComplete='one-time-code'
						placeholder='123456'
						aria-label='Verification code'
						maxLength={6}
						onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
					/>
					<Button
						size='sm'
						type='submit'
						disabled={code.length !== 6}
						loading={verifying.isLoading}>
						Verify
					</Button>
				</Flex>
			) : (
				<Button
					size='sm'
					variant='outline'
					loading={sending.isLoading}
					onClick={async () => {
						const res = await send();
						if ('data' in res) setSent(true);
					}}>
					Send a code
				</Button>
			)}
		</Flex>
	);
};

const InvitationsForYou: FC = () => {
	const { data } = useGetMyInvitationsQuery();
	const [accept, accepting] = useAcceptMyInvitationMutation();
	const [decline] = useDeclineMyInvitationMutation();
	const enter = useEnter();

	if (!data) return null;
	if (!data.verified)
		return (
			<Panel>
				<VerifyEmail email={data.email} />
			</Panel>
		);
	if (!data.doc.length) return null;

	return (
		<Panel
			title='Invitations for you'
			subtitle={`Sent to ${data.email}`}
			actions={<GuideLink section='invitations' />}
			flush>
			{data.doc.map(i => (
				<Flex
					key={i._id}
					align='center'
					gap={3}
					px={4}
					py={3}
					borderTopWidth='1px'
					borderColor='border.muted'
					_first={{ borderTopWidth: 0 }}>
					<Center
						boxSize='32px'
						flexShrink={0}
						borderRadius='md'
						bg='bg.muted'
						color='fg.muted'>
						<MailOpen size={16} />
					</Center>
					<Box
						minW={0}
						flex={1}>
						<Text
							fontSize='13.5px'
							fontWeight='600'
							truncate>
							{i.organization.name}
						</Text>
						<Text
							fontSize='12.5px'
							color='fg.muted'
							truncate>
							{[i.invitedBy && `From ${i.invitedBy}`, i.role, i.allProjects ? 'all projects' : i.projects.join(', ') || 'no projects yet']
								.filter(Boolean)
								.join(' · ')}
						</Text>
						{accepting.error && accepting.originalArgs === i._id && (
							<Text
								role='alert'
								fontSize='12.5px'
								color='red.fg'>
								{errorText(accepting.error)}
							</Text>
						)}
					</Box>
					<Button
						size='xs'
						variant='ghost'
						color='fg.muted'
						onClick={() => decline(i._id)}>
						Decline
					</Button>
					<Button
						size='xs'
						loading={accepting.isLoading && accepting.originalArgs === i._id}
						onClick={async () => {
							const res = await accept(i._id);
							if ('data' in res) enter(res.data?.token);
						}}>
						Join
					</Button>
				</Flex>
			))}
		</Panel>
	);
};

/** Every organization this account belongs to — shown once there's more than one. */
const YourOrganizations: FC = () => {
	const { organization, organizations } = useWorkspace();
	const [switchOrg, switching] = useSwitchOrganizationMutation();
	const enter = useEnter();
	if (organizations.length < 2) return null;

	return (
		<Panel
			title='Your organizations'
			subtitle='Every workspace you belong to'
			actions={<GuideLink section='switching' />}
			flush>
			{organizations.map(o => {
				const current = o._id === organization?._id;
				return (
					<Flex
						key={o._id}
						align='center'
						gap={3}
						px={4}
						py={3}
						borderTopWidth='1px'
						borderColor='border.muted'
						_first={{ borderTopWidth: 0 }}>
						<Center
							boxSize='32px'
							flexShrink={0}
							borderRadius='md'
							bg='bg.muted'
							color='fg.muted'>
							<Building2 size={16} />
						</Center>
						<Box
							minW={0}
							flex={1}>
							<Flex
								align='center'
								gap={2}>
								<Text
									fontSize='13.5px'
									fontWeight='600'
									truncate>
									{o.name}
								</Text>
								{o.system === 'owner' && (
									<Badge
										size='sm'
										variant='outline'>
										Yours
									</Badge>
								)}
							</Flex>
							<Text
								fontSize='12.5px'
								color='fg.muted'>
								{o.role}
							</Text>
						</Box>
						{current ? (
							<Text
								fontSize='12.5px'
								color='fg.muted'
								display='flex'
								alignItems='center'
								gap={1}>
								<Check size={14} />
								Open
							</Text>
						) : (
							<Button
								size='xs'
								variant='outline'
								loading={switching.isLoading && switching.originalArgs === o._id}
								onClick={async () => {
									const res = await switchOrg(o._id);
									if ('data' in res) enter(res.data?.token);
								}}>
								Switch
							</Button>
						)}
					</Flex>
				);
			})}
		</Panel>
	);
};

const Workspaces: FC = () => (
	<>
		<InvitationsForYou />
		<YourOrganizations />
	</>
);

export default Workspaces;
