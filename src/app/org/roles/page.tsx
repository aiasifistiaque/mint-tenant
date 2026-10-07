'use client';

import { FC, FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Checkbox, Field, Flex, Grid, Input, Skeleton, Text } from '@chakra-ui/react';
import { Lock, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import {
	Dialog,
	DialogBody,
	DialogCloseButton,
	DialogFooter,
	DialogHeader,
	DiscardButton,
	Layout,
	PromptDialog,
	useCreateOrgRoleMutation,
	useDeleteOrgRoleMutation,
	useGetOrgPermissionsQuery,
	useGetOrgRolesQuery,
	useUpdateOrgRoleMutation,
} from '@/components/library';
import { Panel } from '@/components/library/cl';
import { styles } from '@/components/library/config';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { OrgRole, PermissionCatalog } from '@/components/library/store/services/tenantApi';

/**
 * The organization's roles (tenant panel): Owner, Admin and Member come with
 * every organization; others are made here. A role is a set of the standard
 * permissions (WO-21): records — view, add, edit, delete — in the projects a
 * member can open, then project and organization actions. Which projects
 * each member opens is set per member (Members, WO-22).
 */

const errorText = (e: any) => e?.data?.message || 'Something went wrong — try again.';

/** "Records: view, add · Build · Manage members" — a role at a glance. */
const RECORD_LABEL: Record<string, string> = { 'records:view': 'view', 'records:create': 'add', 'records:edit': 'edit', 'records:delete': 'delete' };
const summary = (permissions: string[], catalog?: PermissionCatalog) => {
	if (permissions.includes('*')) return 'Everything';
	const records = permissions.filter(k => RECORD_LABEL[k]).map(k => RECORD_LABEL[k]);
	const rest = permissions.filter(k => !RECORD_LABEL[k]).map(k => catalog?.organization.find(p => p.key === k)?.label || k);
	const parts = [...(records.length ? [`Records: ${records.join(', ')}`] : []), ...rest];
	return parts.length ? parts.join(' · ') : 'No permissions';
};

const RoleDialog: FC<{ role: OrgRole | null; open: boolean; onClose: () => void }> = ({ role, open, onClose }) => {
	const { data: catalog } = useGetOrgPermissionsQuery();
	const [create, creating] = useCreateOrgRoleMutation();
	const [update, updating] = useUpdateOrgRoleMutation();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [perms, setPerms] = useState<string[]>([]);
	const everything = role?.system === 'owner' || role?.system === 'admin';
	const error = creating.error || updating.error;

	useEffect(() => {
		if (!open) return;
		setName(role?.name || '');
		setDescription(role?.description || '');
		setPerms(role?.permissions || []);
		creating.reset();
		updating.reset();
	}, [open, role?._id]);

	// The standard permissions (WO-21) in their groups: Records first, then Projects, Organization.
	const groups = useMemo(() => {
		const out = new Map<string, PermissionCatalog['organization']>();
		for (const p of catalog?.organization || []) out.set(p.group, [...(out.get(p.group) || []), p]);
		return [...out.entries()];
	}, [catalog]);

	const toggle = (key: string) => setPerms(p => (p.includes(key) ? p.filter(k => k !== key) : [...p, key]));

	const submit = async (e?: FormEvent) => {
		e?.preventDefault();
		const body = { name: name.trim(), description: description.trim(), permissions: perms };
		const res = role ? await update({ id: role._id, ...body }) : await create(body);
		if ('data' in res) onClose();
	};

	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='lg'
			forceModal>
			<DialogHeader
				divider
				icon={<ShieldCheck size={17} strokeWidth={1.75} />}
				description={everything ? 'This role can do everything; its permissions can’t be narrowed.' : 'What people with this role can do.'}>
				{role ? `Edit ${role.name}` : 'New role'}
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<form
					id='role'
					onSubmit={submit}>
					<Flex
						direction='column'
						gap={5}>
						<Grid
							templateColumns={{ base: '1fr', md: '1fr 2fr' }}
							gap={3}>
							<Field.Root required>
								<Field.Label {...labelCss}>Name</Field.Label>
								<Input
									size='sm'
									value={name}
									maxLength={60}
									autoFocus={!role}
									onChange={e => setName(e.target.value)}
								/>
							</Field.Root>
							<Field.Root>
								<Field.Label {...labelCss}>Description</Field.Label>
								<Input
									size='sm'
									value={description}
									maxLength={300}
									placeholder='Optional'
									onChange={e => setDescription(e.target.value)}
								/>
							</Field.Root>
						</Grid>

						{!everything && (
							<Flex
								direction='column'
								gap={4}>
								{groups.map(([group, items]) =>
									group === 'Records' ? (
										<Box key={group}>
											<Text {...sectionCss}>Records</Text>
											<Text
												fontSize='12px'
												color='fg.muted'
												mt={0.5}>
												Every model’s records — and the project’s media, customers and analytics — in the projects each member can open.
											</Text>
											<Grid
												templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }}
												gap={2}
												mt={2}>
												{items.map(p => (
													<Checkbox.Root
														key={p.key}
														size='sm'
														checked={perms.includes(p.key)}
														onCheckedChange={() => toggle(p.key)}
														alignItems='flex-start'
														p={2.5}
														borderWidth='1px'
														borderColor={perms.includes(p.key) ? 'border.emphasized' : 'border.muted'}
														borderRadius='md'>
														<Checkbox.HiddenInput />
														<Checkbox.Control mt='2px' />
														<Checkbox.Label>
															<Text
																fontSize='13px'
																fontWeight='500'>
																{p.label}
															</Text>
															<Text
																fontSize='11.5px'
																color='fg.muted'>
																{p.description}
															</Text>
														</Checkbox.Label>
													</Checkbox.Root>
												))}
											</Grid>
										</Box>
									) : (
										<Box key={group}>
											<Text {...sectionCss}>{group}</Text>
											<Flex
												direction='column'
												gap={2.5}
												mt={2}>
												{items.map(p => (
													<Checkbox.Root
														key={p.key}
														size='sm'
														checked={perms.includes(p.key)}
														onCheckedChange={() => toggle(p.key)}
														alignItems='flex-start'>
														<Checkbox.HiddenInput />
														<Checkbox.Control mt='2px' />
														<Checkbox.Label>
															<Text
																fontSize='13px'
																fontWeight='500'>
																{p.label}
															</Text>
															<Text
																fontSize='12px'
																color='fg.muted'>
																{p.description}
															</Text>
														</Checkbox.Label>
													</Checkbox.Root>
												))}
											</Flex>
										</Box>
									)
								)}
							</Flex>
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
				<DiscardButton onClick={onClose}>Cancel</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					type='submit'
					form='role'
					disabled={!name.trim()}
					loading={creating.isLoading || updating.isLoading}>
					{role ? 'Save role' : 'Create role'}
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

export default function RolesPage() {
	const { can } = useWorkspace();
	const { data, isLoading } = useGetOrgRolesQuery();
	const { data: catalog } = useGetOrgPermissionsQuery();
	const [remove, removing] = useDeleteOrgRoleMutation();
	const [editing, setEditing] = useState<OrgRole | null>(null);
	const [open, setOpen] = useState(false);
	const [deleting, setDeleting] = useState<OrgRole | null>(null);
	const canManage = can('manage-roles');

	const edit = (role: OrgRole | null) => {
		setEditing(role);
		setOpen(true);
	};

	return (
		<Layout
			title='Roles'
			path='org-roles'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				<Panel
					title='Roles'
					subtitle='What each member can do in this organization'
					actions={
						<Flex
							align='center'
							gap={3}>
							<GuideLink section='roles' />
							{canManage && (
								<Button
									size='xs'
									onClick={() => edit(null)}>
									<Plus size={14} />
									New role
								</Button>
							)}
						</Flex>
					}
					flush>
					{isLoading ? (
						<Box p={4}>
							<Skeleton h='120px' />
						</Box>
					) : (
						(data?.doc || []).map(r => (
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
										{r.system && (
											<Badge
												size='sm'
												variant='outline'
												gap={1}>
												<Lock size={10} />
												Built in
											</Badge>
										)}
									</Flex>
									<Text
										fontSize='12.5px'
										color='fg.muted'
										truncate>
										{r.description || summary(r.permissions, catalog)}
									</Text>
								</Box>
								<Text
									fontSize='12.5px'
									color='fg.muted'
									flexShrink={0}>
									{r.members} member{r.members === 1 ? '' : 's'}
								</Text>
								{canManage && r.system !== 'owner' && (
									<Button
										size='xs'
										variant='ghost'
										onClick={() => edit(r)}>
										Edit
									</Button>
								)}
								{canManage && !r.system && (
									<Button
										aria-label={`Delete ${r.name}`}
										size='xs'
										variant='ghost'
										color='fg.muted'
										onClick={() => setDeleting(r)}>
										<Trash2 size={15} />
									</Button>
								)}
							</Flex>
						))
					)}
				</Panel>
			</Flex>
			<RoleDialog
				role={editing}
				open={open}
				onClose={() => setOpen(false)}
			/>
			<PromptDialog
				open={!!deleting}
				onClose={() => {
					setDeleting(null);
					removing.reset();
				}}
				onConfirm={async () => {
					const res = await remove(deleting!._id);
					if ('data' in res) setDeleting(null);
				}}
				title={`Delete the ${deleting?.name} role?`}
				description={removing.error ? errorText(removing.error) : 'Only a role no one has can be deleted.'}
				subject={deleting?.name}
				loading={removing.isLoading}
			/>
		</Layout>
	);
}

const labelCss: any = { fontSize: '13px', fontWeight: '600', m: 0 };
const sectionCss: any = { fontSize: '13px', fontWeight: '600' };

