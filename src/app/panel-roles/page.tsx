'use client';

import { useState } from 'react';
import { Badge, Box, Button, Flex, IconButton, Skeleton, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Layout, PromptDialog } from '@/components/library';
import { EmptyState, Panel } from '@/components/library/cl';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import { toaster } from '@/components/ui/toaster';
import {
	useAddPanelRoleMutation,
	useGetPanelRolesQuery,
	useRemovePanelRoleMutation,
	useUpdatePanelRoleMutation,
} from '@/components/library/store/services/tenantApi';
import type { PanelRole } from '@/components/library/store/services/tenantApi';
import RoleDialog from '../project-people/_components/RoleDialog';

/**
 * Project → Panel roles (backend docs/panel-users PU-03): what each panel user
 * may do — per model view / add / edit / delete (publish where records are
 * drafts), the media library and History, plus seeing and downloading reports.
 * Nothing here builds the project: panel users are never developers. The
 * project's managers edit them here, and a panel super admin in the panel app.
 * Backend: routes-tenant/panelRoles.router.ts.
 */

const summary = (r: PanelRole, names: Map<string, string>) => {
	const routes = new Set(r.permissions.filter(k => /^(view|create|edit|delete|publish)-/.test(k)).map(k => k.replace(/^\w+-/, '')));
	const parts = [...routes].map(route => names.get(route) || route);
	const shown = parts.slice(0, 4).join(', ') + (parts.length > 4 ? ` and ${parts.length - 4} more` : '');
	return shown || 'No tables';
};

export default function PanelRolesPage() {
	const { can, project, isLoading: loadingSelf } = useWorkspace();
	const allowed = can('manage-projects') || can('invite-to-projects') || can('manage-panel-users');
	const { data, isLoading, isError } = useGetPanelRolesQuery(undefined, { skip: !allowed || !project });
	const [editing, setEditing] = useState<PanelRole | 'new' | null>(null);
	const [deleting, setDeleting] = useState<PanelRole | null>(null);
	const [error, setError] = useState<{ message: string; on?: string } | null>(null);
	const [add, adding] = useAddPanelRoleMutation();
	const [update, updating] = useUpdatePanelRoleMutation();
	const [remove, removing] = useRemovePanelRoleMutation();
	const names = new Map((data?.targets || []).map(t => [t.route, t.name]));
	const store = project?.type === 'ecommerce';

	const save = async (input: { name: string; description?: string; permissions: string[] }) => {
		try {
			if (editing && editing !== 'new') await update({ id: editing._id, ...input }).unwrap();
			else await add(input).unwrap();
			setEditing(null);
			toaster.create({ type: 'success', title: 'Role saved.' });
		} catch (e: any) {
			setError({ message: e?.data?.message || 'Not saved — try again.', on: e?.data?.on });
		}
	};

	return (
		<Layout
			title='Panel roles'
			path='panel-roles'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				{loadingSelf ? (
					<Skeleton h='240px' />
				) : !allowed ? (
					<EmptyState
						title='Panel roles are made by people who manage the project'
						description='Ask your organization’s owner or an admin.'
					/>
				) : isError ? (
					<EmptyState
						title='Panel roles aren’t available yet'
						description='They arrive with the next update of MINT — try again later.'
					/>
				) : isLoading || !data ? (
					<Skeleton h='240px' />
				) : (
					<Panel
						id='panel-roles'
						title='Panel roles'
						subtitle='What each panel user can do with the project’s tables and reports. Nobody with a panel role builds or changes settings.'
						actions={
							<Flex gap={2}>
								<Button
									asChild
									size='sm'
									variant='outline'>
									<NextLink href={projectHref(store ? '/panel-admins' : '/panel-users')}>{store ? 'Panel admins' : 'Panel users'}</NextLink>
								</Button>
								<Button
									size='sm'
									onClick={() => {
										setError(null);
										setEditing('new');
									}}>
									<Plus size={14} /> New role
								</Button>
							</Flex>
						}>
						<Flex
							direction='column'
							gap={2}>
							{data.doc.length === 0 ? (
								<Text
									fontSize='13px'
									color='fg.muted'>
									No roles yet. Make one — say “Milk recorder” who adds milk records and sees the milk reports — then give it to panel users.
								</Text>
							) : (
								data.doc.map(r => (
									<Flex
										key={r._id}
										data-testid='panel-role'
										align='center'
										gap={3}
										px={3}
										py={3}
										borderWidth='1px'
										borderColor='border'
										borderRadius='lg'>
										<Flex
											align='center'
											justify='center'
											boxSize='36px'
											borderRadius='full'
											bg='bg.muted'
											color='fg.muted'
											flexShrink={0}>
											<ShieldCheck size={16} />
										</Flex>
										<Box
											flex='1'
											minW={0}>
											<Flex
												align='center'
												gap={2}
												wrap='wrap'>
												<Text
													fontSize='14px'
													fontWeight='600'>
													{r.name}
												</Text>
												{r.permissions.includes('reports:view') && (
													<Badge
														size='sm'
														colorPalette='blue'>
														Reports
													</Badge>
												)}
												{r.permissions.includes('reports:export') && (
													<Badge
														size='sm'
														colorPalette='green'>
														Downloads
													</Badge>
												)}
											</Flex>
											<Text
												fontSize='13px'
												color='fg.muted'
												truncate>
												{r.description ? `${r.description} · ` : ''}
												{summary(r, names)}
											</Text>
										</Box>
										<Text
											fontSize='12px'
											color='fg.muted'
											display={{ base: 'none', sm: 'block' }}>
											{r.holders} {r.holders === 1 ? 'login' : 'logins'}
										</Text>
										<IconButton
											aria-label={`Edit ${r.name}`}
											size='sm'
											variant='ghost'
											onClick={() => {
												setError(null);
												setEditing(r);
											}}>
											<Pencil size={15} />
										</IconButton>
										<IconButton
											aria-label={`Delete ${r.name}`}
											size='sm'
											variant='ghost'
											onClick={() => setDeleting(r)}>
											<Trash2 size={15} />
										</IconButton>
									</Flex>
								))
							)}
						</Flex>
						<RoleDialog
							open={!!editing}
							onClose={() => setEditing(null)}
							role={editing === 'new' ? null : (editing as any)}
							targets={data.targets as any}
							extras={data.reports}
							intro='For this project’s panel users. Pick what it may do with each model’s records, and with reports.'
							guide='panel-roles'
							saving={adding.isLoading || updating.isLoading}
							error={error}
							onEdit={() => error && setError(null)}
							onSave={save}
						/>
						<PromptDialog
							open={!!deleting}
							onClose={() => setDeleting(null)}
							tone='danger'
							title='Delete this role?'
							subject={deleting?.name}
							description={deleting?.holders ? 'Logins still hold it — give them another role first.' : 'Nobody holds it. This can’t be undone.'}
							confirmLabel='Delete'
							disabled={!!deleting?.holders}
							loading={removing.isLoading}
							onConfirm={async () => {
								if (!deleting) return;
								try {
									await remove(deleting._id).unwrap();
									setDeleting(null);
									toaster.create({ type: 'success', title: 'Role deleted.' });
								} catch (e: any) {
									toaster.create({ type: 'error', title: e?.data?.message || 'Not deleted — try again.' });
								}
							}}
						/>
					</Panel>
				)}
			</Flex>
		</Layout>
	);
}
