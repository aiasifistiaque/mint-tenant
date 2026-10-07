'use client';

import { FC, FormEvent, useMemo, useState } from 'react';
import { Badge, Box, Button, Center, Field, Flex, Input, Skeleton, Text } from '@chakra-ui/react';
import { FolderKanban, MailPlus, RotateCw, ShieldCheck, Trash2, UserMinus, Users } from 'lucide-react';
import {
	Dialog,
	DialogBody,
	DialogCloseButton,
	DialogFooter,
	DialogHeader,
	DiscardButton,
	Layout,
	PromptDialog,
	useCancelInvitationMutation,
	useGetInvitationsQuery,
	useGetMembersQuery,
	useGetOrgRolesQuery,
	useGetProjectsQuery,
	useInviteMemberMutation,
	useRemoveMemberMutation,
	useResendInvitationMutation,
	useUpdateMemberMutation,
} from '@/components/library';
import { Dropdown, Panel, date } from '@/components/library/cl';
import { styles } from '@/components/library/config';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import ProjectAccessPicker, { accessSummary } from '@/components/library/tenant/ProjectAccessPicker';
import type { Member, ProjectAccess } from '@/components/library/store/services/tenantApi';

/**
 * The organization's people (tenant panel): who's in it, with which role and
 * which projects (WO-22), inviting someone by email with both, and the
 * invitations still waiting. Changing roles and projects, removing people and
 * inviting need the `manage-members` permission; everyone can see the list.
 */

const errorText = (e: any) => e?.data?.message || 'Something went wrong — try again.';

const initials = (name = '') =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(p => p[0])
		.join('')
		.toUpperCase();

const ALL: ProjectAccess = { allProjects: true, projects: [] };

/** Owner and Admin open every project, whatever access says (WO-22). */
const opensEverything = (system?: string | null) => system === 'owner' || system === 'admin';

const InviteDialog: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
	const { data: roles } = useGetOrgRolesQuery();
	const assignable = (roles?.doc || []).filter(r => r.system !== 'owner');
	const member = assignable.find(r => r.system === 'member');
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [role, setRole] = useState('');
	const [access, setAccess] = useState<ProjectAccess>(ALL);
	const [invite, { isLoading, error, reset }] = useInviteMemberMutation();
	const chosen = assignable.find(r => r._id === (role || member?._id));

	const close = () => {
		setEmail('');
		setName('');
		setRole('');
		setAccess(ALL);
		reset();
		onClose();
	};

	const submit = async (e?: FormEvent) => {
		e?.preventDefault();
		const res = await invite({ email: email.trim(), name: name.trim(), role: role || member?._id || '', ...access });
		if ('data' in res) close();
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
				description='They get an email with a link to join. It works for 7 days.'>
				Invite someone
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<form
					id='invite'
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
							<Text {...labelCss}>Role</Text>
							<Box mt={1.5}>
								<Dropdown
									value={role || member?._id || ''}
									onChange={setRole}
									items={assignable.map(r => ({ value: r._id, label: r.name }))}
								/>
							</Box>
						</Box>
						<Box>
							<Text {...labelCss}>Projects</Text>
							<Box mt={1.5}>
								<ProjectAccessPicker
									value={access}
									onChange={setAccess}
									everything={opensEverything(chosen?.system)}
								/>
							</Box>
						</Box>
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
				<DiscardButton onClick={close}>Cancel</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					type='submit'
					form='invite'
					disabled={!/\S+@\S+\.\S+/.test(email)}
					loading={isLoading}>
					Send invitation
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

/** Which projects a member opens (WO-22), changed in a dialog. */
const AccessDialog: FC<{ m: Member; open: boolean; onClose: () => void }> = ({ m, open, onClose }) => {
	const [update, { isLoading, error, reset }] = useUpdateMemberMutation();
	const [access, setAccess] = useState<ProjectAccess>({ allProjects: m.allProjects, projects: m.projects });
	const close = () => {
		reset();
		onClose();
	};
	return (
		<Dialog
			isOpen={open}
			onClose={close}
			size='sm'
			forceModal>
			<DialogHeader
				divider
				icon={<FolderKanban size={17} strokeWidth={1.75} />}
				description={`The projects ${m.user?.name} can open. Their role decides what they can do in them.`}>
				Projects for {m.user?.name}
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<Flex
					direction='column'
					gap={3}>
					<ProjectAccessPicker
						value={access}
						onChange={setAccess}
					/>
					{error && (
						<Text
							role='alert'
							fontSize='13px'
							color='red.fg'>
							{errorText(error)}
						</Text>
					)}
				</Flex>
			</DialogBody>
			<DialogFooter>
				<DiscardButton onClick={close}>Cancel</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					loading={isLoading}
					onClick={async () => {
						const res = await update({ id: m._id, ...access });
						if ('data' in res) close();
					}}>
					Save
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

const MemberRow: FC<{ m: Member; me: boolean; canManage: boolean; roles: { value: string; label: string }[]; projectNames: Map<string, string> }> = ({
	m,
	me,
	canManage,
	roles,
	projectNames,
}) => {
	const [update, updating] = useUpdateMemberMutation();
	const [remove, removing] = useRemoveMemberMutation();
	const [confirm, setConfirm] = useState(false);
	const [editingAccess, setEditingAccess] = useState(false);
	const owner = m.role?.system === 'owner';
	const everything = opensEverything(m.role?.system);
	const access = everything ? 'All projects' : accessSummary(m, projectNames);

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
				{initials(m.user?.name)}
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
						{m.user?.name}
					</Text>
					{me && (
						<Badge
							size='sm'
							variant='outline'>
							You
						</Badge>
					)}
					{m.user?.twoFactorEnabled && (
						<Box
							color='green.fg'
							title='Two-factor authentication is on'>
							<ShieldCheck size={14} />
						</Box>
					)}
				</Flex>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					truncate>
					{m.user?.email} · joined {date(m.joinedAt)}
				</Text>
				{canManage && !everything ? (
					<Button
						size='2xs'
						variant='plain'
						px={0}
						h='auto'
						fontSize='12px'
						fontWeight='400'
						color='fg.muted'
						_hover={{ color: 'fg', textDecoration: 'underline' }}
						title='Change which projects they can open'
						onClick={() => setEditingAccess(true)}>
						<FolderKanban size={12} />
						{access}
					</Button>
				) : (
					<Text
						fontSize='12px'
						color='fg.muted'
						display='flex'
						alignItems='center'
						gap={1}
						truncate>
						<FolderKanban size={12} />
						{access}
					</Text>
				)}
			</Box>
			<Box
				w={{ base: '120px', md: '160px' }}
				flexShrink={0}>
				{canManage && !owner ? (
					<Dropdown
						size='sm'
						value={m.role?._id}
						onChange={role => update({ id: m._id, role })}
						disabled={updating.isLoading}
						items={roles}
					/>
				) : (
					<Text
						fontSize='13px'
						color='fg.muted'>
						{m.role?.name}
					</Text>
				)}
			</Box>
			{(canManage || me) && !owner ? (
				<Button
					aria-label={me ? 'Leave the organization' : `Remove ${m.user?.name}`}
					title={me ? 'Leave' : 'Remove'}
					size='xs'
					variant='ghost'
					color='fg.muted'
					onClick={() => setConfirm(true)}>
					{me ? <UserMinus size={15} /> : <Trash2 size={15} />}
				</Button>
			) : (
				<Box w='32px' />
			)}
			<PromptDialog
				open={confirm}
				onClose={() => setConfirm(false)}
				onConfirm={async () => {
					const res = await remove(me ? 'me' : m._id);
					if ('data' in res) {
						setConfirm(false);
						if (me) window.location.href = '/auth/login';
					}
				}}
				title={me ? 'Leave this organization?' : `Remove ${m.user?.name}?`}
				description={
					me
						? 'You lose access to its projects straight away. Someone has to invite you again to come back.'
						: 'They lose access to every project here on their next click. Their records stay.'
				}
				subject={m.user?.email}
				loading={removing.isLoading}
				confirmLabel={me ? 'Leave' : 'Remove'}
			/>
			{editingAccess && (
				<AccessDialog
					m={m}
					open={editingAccess}
					onClose={() => setEditingAccess(false)}
				/>
			)}
		</Flex>
	);
};

const Invitations: FC = () => {
	const { data, isLoading } = useGetInvitationsQuery();
	const [resend, resending] = useResendInvitationMutation();
	const [cancel] = useCancelInvitationMutation();
	const list = data?.doc || [];
	if (isLoading || !list.length) return null;

	return (
		<Panel
			title='Pending invitations'
			subtitle='Sent, not accepted yet'
			flush>
			{list.map(i => (
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
							{i.role?.name} · {i.allProjects ? 'all projects' : `${i.projects.length} project${i.projects.length === 1 ? '' : 's'}`} ·{' '}
							{i.expired ? 'expired' : `expires ${date(i.expiresAt)}`}
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
	);
};

export default function MembersPage() {
	const { self, can } = useWorkspace();
	const { data, isLoading } = useGetMembersQuery();
	const { data: roles } = useGetOrgRolesQuery();
	const { data: projects } = useGetProjectsQuery();
	const projectNames = useMemo(() => new Map((projects?.doc || []).map(p => [p._id, p.name])), [projects]);
	const [inviting, setInviting] = useState(false);
	const canManage = can('manage-members');
	const roleItems = (roles?.doc || []).filter(r => r.system !== 'owner').map(r => ({ value: r._id, label: r.name }));

	return (
		<Layout
			title='Members'
			path='org-members'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				<Panel
					title='Members'
					subtitle={data ? `${data.total} ${data.total === 1 ? 'person' : 'people'} in this organization` : undefined}
					actions={
						<Flex
							align='center'
							gap={3}>
							<GuideLink section='members' />
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
					{isLoading ? (
						<Box p={4}>
							{[0, 1, 2].map(i => (
								<Skeleton
									key={i}
									h='44px'
									mb={2}
								/>
							))}
						</Box>
					) : data?.doc?.length ? (
						data.doc.map(m => (
							<MemberRow
								key={m._id}
								m={m}
								me={m.user?._id === self?._id}
								canManage={canManage}
								roles={roleItems}
								projectNames={projectNames}
							/>
						))
					) : (
						<Center
							flexDir='column'
							gap={2}
							py={10}
							color='fg.muted'>
							<Users size={20} />
							<Text fontSize='13px'>No members</Text>
						</Center>
					)}
				</Panel>
				{canManage && <Invitations />}
			</Flex>
			<InviteDialog
				open={inviting}
				onClose={() => setInviting(false)}
			/>
		</Layout>
	);
}

const labelCss: any = { fontSize: '13px', fontWeight: '600', m: 0 };
