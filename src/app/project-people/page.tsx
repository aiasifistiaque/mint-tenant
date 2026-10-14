'use client';

import { FC, FormEvent, useState } from 'react';
import { Badge, Box, Button, Center, Field, Flex, Input, Skeleton, Text } from '@chakra-ui/react';
import { MailPlus, Pencil, Plus, RotateCw, ShieldCheck, Trash2, UserMinus } from 'lucide-react';
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
	useCreateProjectRoleMutation,
	useDeleteProjectRoleMutation,
	useGetProjectPeopleQuery,
	useUpdateProjectRoleMutation,
	useInviteToProjectMutation,
	useRemoveFromProjectMutation,
	useResendProjectInvitationMutation,
	useSetProjectRoleMutation,
} from '@/components/library';
import { Dropdown, EmptyState, Panel, date } from '@/components/library/cl';
import { styles } from '@/components/library/config';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { ProjectInviteRole, ProjectPerson, ProjectRoleInput, ProjectRoleOption } from '@/components/library/store/services/tenantApi';
import RoleDialog from './_components/RoleDialog';

/**
 * The open project's members (tenant panel, WO-47; sidebar Project → Members,
 * WO-48) — for the owner, admins and roles with Invite to projects (WO-50:
 * hidden from everyone else). They invite someone into it as Full access,
 * Member, Developer or one of the project's own roles, change their role or
 * take the project away, see pending invitations, and make the project's own
 * roles — per model, what each may view, add, edit, delete. Someone new joins the organization as a guest who opens this
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

/** A role's value when choosing it: a standard one by its name, the project's own by id. */
const STANDARD = ['full', 'member', 'developer'];
const roleValue = (r: { _id: string; system?: string | null }) => (r.system && STANDARD.includes(r.system) ? r.system : r._id);
const roleItems = (roles: ProjectRoleOption[]) => roles.map(r => ({ value: roleValue(r), label: r.name }));

/** In words: what one of the project's own roles allows, by model. */
const allows = (r: ProjectRoleOption, names: Map<string, string>) => {
	const by = new Map<string, string[]>();
	for (const k of r.permissions || []) {
		const [action, ...rest] = k.split('-');
		const route = rest.join('-');
		by.set(route, [...(by.get(route) || []), action]);
	}
	const words: Record<string, string> = { view: 'view', create: 'add', edit: 'edit', delete: 'delete' };
	return [...by.entries()]
		.map(([route, acts]) => `${names.get(route) || route}: ${['view', 'create', 'edit', 'delete'].filter(a => acts.includes(a)).map(a => words[a]).join(', ')}`)
		.join(' · ');
};

const InviteDialog: FC<{ open: boolean; onClose: () => void; projectName: string; roles: ProjectRoleOption[] }> = ({ open, onClose, projectName, roles }) => {
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
									items={roleItems(roles)}
								/>
							</Box>
							<Text
								fontSize='12px'
								color='fg.muted'
								mt={1.5}>
								{roles.find(r => roleValue(r) === role)?.description}
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

const PersonRow: FC<{ p: ProjectPerson; me: boolean; projectName: string; canManage: boolean; roles: ProjectRoleOption[] }> = ({ p, me, projectName, canManage, roles }) => {
	const [setRole, setting] = useSetProjectRoleMutation();
	const [remove, removing] = useRemoveFromProjectMutation();
	const [confirm, setConfirm] = useState(false);
	const given = p.access === 'project';
	const changeable = canManage && given;
	const current = p.role ? roleValue(p.role) : '';
	const offered = !!current && roles.some(r => roleValue(r) === current);

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
			{changeable && offered ? (
				<Box w='160px'>
					<Dropdown
						value={current}
						onChange={(v: string) => setRole({ id: p._id, role: v as ProjectInviteRole })}
						items={roleItems(roles)}
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
	const roles = data?.roles || [];
	const targets = data?.models || [];
	const targetNames = new Map(targets.map(t => [t.route, t.name]));

	// The project's own roles (WO-50).
	const [editingRole, setEditingRole] = useState<ProjectRoleOption | 'new' | null>(null);
	const [deletingRole, setDeletingRole] = useState<ProjectRoleOption | null>(null);
	const [roleError, setRoleError] = useState<{ message: string; on?: string } | null>(null);
	const [createRole, creatingRole] = useCreateProjectRoleMutation();
	const [updateRole, updatingRole] = useUpdateProjectRoleMutation();
	const [deleteRole, deletingRoleState] = useDeleteProjectRoleMutation();
	const closeRole = () => {
		setEditingRole(null);
		setRoleError(null);
	};
	const saveRole = async (input: ProjectRoleInput) => {
		setRoleError(null);
		const res = editingRole === 'new' ? await createRole(input) : await updateRole({ id: (editingRole as ProjectRoleOption)._id, ...input });
		if ('error' in res) {
			const e: any = res.error;
			return setRoleError({ message: errorText(e), on: e?.data?.on });
		}
		closeRole();
	};

	return (
		<Layout
			title='Members'
			path='project-people'>
			{!project ? (
				<EmptyState
					title='Open a project first'
					description='Each project has its own members.'
				/>
			) : data && !canManage ? (
				<EmptyState
					title='For people who manage this project'
					description='The owner, admins and roles that can invite to projects see and change who works here.'
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
									roles={roles}
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
					{canManage && data && (
						<Panel
							title='Roles'
							subtitle='What each role can do in this project'
							actions={
								<Flex
									align='center'
									gap={3}>
									<GuideLink section='project-roles' />
									<Button
										size='xs'
										variant='outline'
										disabled={!targets.length}
										onClick={() => setEditingRole('new')}>
										<Plus size={14} />
										New role
									</Button>
								</Flex>
							}
							flush>
							{roles.map(r => (
								<Flex
									key={r._id}
									align='center'
									gap={3}
									px={4}
									py={3}
									borderTopWidth='1px'
									borderColor='border.muted'
									_first={{ borderTopWidth: 0 }}>
									<Box
										color='fg.muted'
										flexShrink={0}>
										<ShieldCheck size={16} />
									</Box>
									<Box
										minW={0}
										flex={1}>
										<Flex
											align='center'
											gap={2}>
											<Text
												fontSize='13.5px'
												fontWeight='600'>
												{r.name}
											</Text>
											{!r.custom && (
												<Badge
													size='sm'
													variant='outline'>
													Standard
												</Badge>
											)}
										</Flex>
										<Text
											fontSize='12.5px'
											color='fg.muted'>
											{r.custom ? [r.description, allows(r, targetNames)].filter(Boolean).join(' — ') : r.description}
										</Text>
									</Box>
									{r.custom && (
										<Flex gap={0.5}>
											<Button
												size='xs'
												variant='ghost'
												aria-label={`Edit ${r.name}`}
												onClick={() => setEditingRole(r)}>
												<Pencil size={14} />
											</Button>
											<Button
												size='xs'
												variant='ghost'
												color='fg.muted'
												aria-label={`Delete ${r.name}`}
												onClick={() => setDeletingRole(r)}>
												<Trash2 size={14} />
											</Button>
										</Flex>
									)}
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
				roles={roles}
			/>
			<RoleDialog
				open={!!editingRole}
				onClose={closeRole}
				role={editingRole === 'new' ? null : editingRole}
				targets={targets}
				saving={creatingRole.isLoading || updatingRole.isLoading}
				error={roleError}
				onEdit={() => roleError && setRoleError(null)}
				onSave={saveRole}
			/>
			<PromptDialog
				open={!!deletingRole}
				onClose={() => {
					setDeletingRole(null);
					deletingRoleState.reset();
				}}
				onConfirm={async () => {
					const res = await deleteRole(deletingRole!._id);
					if ('data' in res) setDeletingRole(null);
				}}
				title={`Delete “${deletingRole?.name}”?`}
				description={
					deletingRoleState.error
						? errorText(deletingRoleState.error)
						: 'Nobody can be given it any more. A role someone still has can’t be deleted — give them another first.'
				}
				loading={deletingRoleState.isLoading}
				confirmLabel='Delete'
			/>

		</Layout>
	);
}
