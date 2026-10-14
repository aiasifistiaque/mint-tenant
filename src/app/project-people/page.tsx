'use client';

import { FC, FormEvent, useState } from 'react';
import { Badge, Box, Button, Center, Field, Flex, Input, Skeleton, Text } from '@chakra-ui/react';
import { MailPlus, RotateCw, UserMinus } from 'lucide-react';
import {
	Dialog,
	DialogBody,
	DialogCloseButton,
	DialogFooter,
	DialogHeader,
	DiscardButton,
	Layout,
	PromptDialog,
	useCancelProjectInvitationMutation,
	useGetProjectPeopleQuery,
	useInviteToProjectMutation,
	useRemoveFromProjectMutation,
	useResendProjectInvitationMutation,
	useSetProjectRoleMutation,
} from '@/components/library';
import { Dropdown, EmptyState, Panel, date } from '@/components/library/cl';
import { styles } from '@/components/library/config';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { ProjectInviteRole, ProjectPerson } from '@/components/library/store/services/tenantApi';

/**
 * The open project's members (tenant panel, WO-47; sidebar Project → Members,
 * WO-48): everyone in the project sees who works in it. The owner, admins and
 * roles with Invite to projects also invite someone into it as Member or
 * Developer, change their role or take the project away, and see pending
 * invitations. Someone new joins the organization as a guest who opens this
 * project only, and sees it on their dashboard under this organization's
 * name; someone already in the organization gets it at once.
 */

const errorText = (e: any) => e?.data?.message || 'Something went wrong — try again.';
const labelCss: any = { fontSize: '13px', fontWeight: '600', m: 0 };

const initials = (name = '') =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(p => p[0])
		.join('')
		.toUpperCase();

const ROLE_HINT: Record<ProjectInviteRole, string> = {
	member: 'Works with the records — view, add, edit, delete.',
	developer: 'Works with the records and builds the project: models, pages, AI keys.',
};

const InviteDialog: FC<{ open: boolean; onClose: () => void; projectName: string }> = ({ open, onClose, projectName }) => {
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [role, setRole] = useState<ProjectInviteRole>('member');
	const [invite, { isLoading, error, reset }] = useInviteToProjectMutation();
	const [added, setAdded] = useState('');

	const close = () => {
		setEmail('');
		setName('');
		setRole('member');
		setAdded('');
		reset();
		onClose();
	};

	const submit = async (e?: FormEvent) => {
		e?.preventDefault();
		const res = await invite({ email: email.trim(), name: name.trim(), role });
		if ('data' in res) {
			// Already in the organization: added at once, nothing emailed.
			if (res.data?.added) setAdded(res.data.message || 'Added');
			else close();
		}
	};

	return (
		<Dialog
			isOpen={open}
			onClose={close}
			size='sm'
			forceModal>
			<DialogHeader
				divider
				icon={<MailPlus size={17} strokeWidth={1.75} />}
				description={`They get an email with a link to join ${projectName}. It works for 7 days.`}>
				Invite to {projectName}
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<form
					id='invite-project'
					onSubmit={submit}>
					<Flex
						direction='column'
						gap={4}>
						<Field.Root required>
							<Field.Label {...labelCss}>Email</Field.Label>
							<Input
								size='sm'
								type='email'
								autoFocus
								value={email}
								placeholder='name@company.com'
								onChange={e => setEmail(e.target.value)}
							/>
						</Field.Root>
						<Field.Root>
							<Field.Label {...labelCss}>Name</Field.Label>
							<Input
								size='sm'
								value={name}
								placeholder='Optional — used in the email'
								onChange={e => setName(e.target.value)}
							/>
						</Field.Root>
						<Box>
							<Text {...labelCss}>Role in this project</Text>
							<Box mt={1.5}>
								<Dropdown
									value={role}
									onChange={(v: string) => setRole(v as ProjectInviteRole)}
									items={[
										{ value: 'member', label: 'Member' },
										{ value: 'developer', label: 'Developer' },
									]}
								/>
							</Box>
							<Text
								fontSize='12px'
								color='fg.muted'
								mt={1.5}>
								{ROLE_HINT[role]}
							</Text>
						</Box>
						{added && (
							<Text
								fontSize='13px'
								color='green.fg'>
								{added} — they were already in this organization.
							</Text>
						)}
						{error && (
							<Text
								role='alert'
								fontSize='13px'
								color='red.fg'>
								{errorText(error)}
							</Text>
						)}
					</Flex>
				</form>
			</DialogBody>
			<DialogFooter>
				<DiscardButton onClick={close}>{added ? 'Done' : 'Cancel'}</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					type='submit'
					form='invite-project'
					disabled={!/\S+@\S+\.\S+/.test(email)}
					loading={isLoading}>
					Send invitation
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

const PersonRow: FC<{ p: ProjectPerson; me: boolean; projectName: string; canManage: boolean }> = ({ p, me, projectName, canManage }) => {
	const [setRole, setting] = useSetProjectRoleMutation();
	const [remove, removing] = useRemoveFromProjectMutation();
	const [confirm, setConfirm] = useState(false);
	const given = p.access === 'project';
	const changeable = canManage && given;

	return (
		<Flex
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
				borderRadius='full'
				bg='bg.muted'
				fontSize='12px'
				fontWeight='600'
				color='fg.muted'>
				{initials(p.user?.name)}
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
						{p.user?.name}
					</Text>
					{me && (
						<Badge
							size='sm'
							variant='outline'>
							You
						</Badge>
					)}
					{p.guest && (
						<Badge
							size='sm'
							variant='outline'>
							Project guest
						</Badge>
					)}
				</Flex>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					truncate>
					{p.user?.email} · {given ? `given this project ${date(p.joinedAt)}` : `${p.organizationRole?.name} — opens every project`}
				</Text>
			</Box>
			{changeable && (p.role?.system === 'member' || p.role?.system === 'developer') ? (
				<Box w='140px'>
					<Dropdown
						value={p.role.system}
						onChange={(v: string) => setRole({ id: p._id, role: v as ProjectInviteRole })}
						items={[
							{ value: 'member', label: 'Member' },
							{ value: 'developer', label: 'Developer' },
						]}
						disabled={setting.isLoading}
					/>
				</Box>
			) : (
				<Text
					fontSize='12.5px'
					color='fg.muted'>
					{p.role?.name}
				</Text>
			)}
			{changeable && !me && (
				<Button
					size='xs'
					variant='ghost'
					color='fg.muted'
					aria-label={`Remove ${p.user?.name} from ${projectName}`}
					onClick={() => setConfirm(true)}>
					<UserMinus size={14} />
				</Button>
			)}
			<PromptDialog
				open={confirm}
				onClose={() => setConfirm(false)}
				onConfirm={async () => {
					const res = await remove(p._id);
					if ('data' in res) setConfirm(false);
				}}
				title={`Remove ${p.user?.name} from ${projectName}?`}
				description={
					p.guest
						? 'They can no longer open this project. If it was their last one here, they leave the organization too.'
						: 'They can no longer open this project. They stay in the organization.'
				}
				loading={removing.isLoading}
				confirmLabel='Remove'
			/>
		</Flex>
	);
};

export default function ProjectPeoplePage() {
	const { self, project, can } = useWorkspace();
	const { data, isLoading, error } = useGetProjectPeopleQuery(undefined, { skip: !project });
	// The server says who may change them (WO-48): everyone else sees the list only. A backend from
	// before WO-48 doesn't say — then the role decides, as it did (WO-47).
	const canManage = data?.canManage ?? (can('invite-to-projects') || can('manage-members'));
	const [resend, resending] = useResendProjectInvitationMutation();
	const [cancel] = useCancelProjectInvitationMutation();
	const [inviting, setInviting] = useState(false);
	const name = project?.name || 'this project';
	const invitations = data?.invitations || [];

	return (
		<Layout
			title='Members'
			path='project-people'>
			{!project ? (
				<EmptyState
					title='Open a project first'
					description='Each project has its own members.'
				/>
			) : (
				<Flex
					direction='column'
					gap={4}
					pt={2}>
					<Panel
						title='Members'
						subtitle={data ? `${data.doc.length} ${data.doc.length === 1 ? 'person opens' : 'people open'} ${name}` : undefined}
						actions={
							<Flex
								align='center'
								gap={3}>
								<GuideLink section='project-people' />
								{canManage && (
									<Button
										size='xs'
										onClick={() => setInviting(true)}>
										<MailPlus size={14} />
										Invite
									</Button>
								)}
							</Flex>
						}
						flush>
						{error ? (
							<Text
								role='alert'
								p={4}
								fontSize='13px'
								color='red.fg'>
								{errorText(error)}
							</Text>
						) : isLoading ? (
							<Box p={4}>
								{[0, 1, 2].map(i => (
									<Skeleton
										key={i}
										h='44px'
										mb={2}
									/>
								))}
							</Box>
						) : (
							(data?.doc || []).map(p => (
								<PersonRow
									key={p._id}
									p={p}
									me={p.user?._id === self?._id}
									projectName={name}
									canManage={canManage}
								/>
							))
						)}
					</Panel>
					{invitations.length > 0 && (
						<Panel
							title='Pending invitations'
							subtitle='Sent, not accepted yet'
							flush>
							{invitations.map(i => (
								<Flex
									key={i._id}
									align='center'
									gap={3}
									px={4}
									py={3}
									borderTopWidth='1px'
									borderColor='border.muted'
									_first={{ borderTopWidth: 0 }}>
									<Box
										minW={0}
										flex={1}>
										<Text
											fontSize='13.5px'
											fontWeight='600'
											truncate>
											{i.email}
										</Text>
										<Text
											fontSize='12.5px'
											color={i.expired ? 'orange.fg' : 'fg.muted'}>
											{i.role?.name} · {i.expired ? 'expired' : `expires ${date(i.expiresAt)}`}
											{i.invitedBy ? ` · by ${i.invitedBy.name}` : ''}
										</Text>
									</Box>
									<Button
										size='xs'
										variant='ghost'
										loading={resending.isLoading && resending.originalArgs === i._id}
										onClick={() => resend(i._id)}>
										<RotateCw size={14} />
										Resend
									</Button>
									<Button
										size='xs'
										variant='ghost'
										color='fg.muted'
										onClick={() => cancel(i._id)}>
										Cancel
									</Button>
								</Flex>
							))}
						</Panel>
					)}
				</Flex>
			)}
			<InviteDialog
				open={inviting}
				onClose={() => setInviting(false)}
				projectName={name}
			/>
		</Layout>
	);
}
