'use client';

import { FC, useState } from 'react';
import { Badge, Box, Button, Flex, IconButton, Input, Link, Menu, Portal, Skeleton, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Ellipsis, ExternalLink, Plus, UserCog } from 'lucide-react';
import { Layout, PromptDialog } from '@/components/library';
import { Dropdown, EmptyState, Panel } from '@/components/library/cl';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import { toaster } from '@/components/ui/toaster';
import {
	useAddPanelAdminMutation,
	useGetPanelAdminsQuery,
	useRemovePanelAdminMutation,
	useUpdatePanelAdminMutation,
} from '@/components/library/store/services/tenantApi';
import type { PanelAdmin } from '@/components/library/store/services/tenantApi';
import GuideLink from '@/components/library/tenant/GuideLink';

/**
 * A project's panel logins (Project → Panel admins / Panel users; backend
 * docs/panel-users PU-03). A store's (below) sign in to the commerce panel; every
 * other project's sign in to the panel app (panel.tcrypt.site) with a panel role
 * (Project → Panel roles) or as a super admin, who can make roles and logins there.
 *
 * Before: an e-commerce project's store logins (Project → Panel admins; backend
 * docs/commerce-panel CP-03): the people who run the store sign in to the
 * commerce panel with an email and a password made here. They work with the
 * store's records, couriers and email accounts — never its models, settings or
 * developer tools. One email opens one store. Switching a login off, a new
 * password or removing it signs them out everywhere.
 * Backend: routes-tenant/panelAdmins.router.ts. Needs manage-projects or invite-to-projects.
 */

const COMMERCE_URL = (process.env.NEXT_PUBLIC_COMMERCE_URL || 'https://commerce.mintapp.site').replace(/\/+$/, '');
const PANEL_URL = (process.env.NEXT_PUBLIC_PANEL_URL || 'https://panel.tcrypt.site').replace(/\/+$/, '');

/** The access dropdown's value: a role id, SUPER, or '' (a store's own fixed access). */
const SUPER = '__super';
const accessOf = (a: { role?: string | null; superAdmin?: boolean }) => (a.superAdmin ? SUPER : a.role || '');
const accessBody = (v: string) => (v === SUPER ? { superAdmin: true, role: null } : { superAdmin: false, role: v || null });

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');

const Field: FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
	<Box mb={3}>
		<Text
			fontSize='13px'
			fontWeight='500'
			mb={1}>
			{label}
		</Text>
		{children}
		{hint && (
			<Text
				fontSize='12px'
				color='fg.muted'
				mt={1}>
				{hint}
			</Text>
		)}
	</Box>
);

const Row: FC<{ admin: PanelAdmin; access: string; onAccess: () => void; onPassword: () => void; onToggle: () => void; onRemove: () => void }> = ({ admin: a, access, onAccess, onPassword, onToggle, onRemove }) => (
	<Flex
		data-testid='panel-admin'
		align='center'
		gap={3}
		px={3}
		py={3}
		borderWidth='1px'
		borderColor='border'
		borderRadius='lg'
		opacity={a.isActive ? 1 : 0.6}>
		<Flex
			align='center'
			justify='center'
			boxSize='36px'
			borderRadius='full'
			bg='bg.muted'
			color='fg.muted'
			flexShrink={0}>
			<UserCog size={16} />
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
					{a.name}
				</Text>
				{access && (
					<Badge
						size='sm'
						colorPalette={a.superAdmin ? 'purple' : 'blue'}>
						{access}
					</Badge>
				)}
				{!a.isActive && (
					<Badge
						size='sm'
						colorPalette='gray'>
						Switched off
					</Badge>
				)}
			</Flex>
			<Text
				fontSize='13px'
				color='fg.muted'
				truncate>
				{a.email}
				{a.phone ? ` · ${a.phone}` : ''}
			</Text>
		</Box>
		<Box
			textAlign='right'
			display={{ base: 'none', sm: 'block' }}>
			<Text
				fontSize='12px'
				color='fg.muted'>
				Last signed in
			</Text>
			<Text fontSize='13px'>{when(a.lastLoginAt)}</Text>
		</Box>
		<Menu.Root positioning={{ placement: 'bottom-end' }}>
			<Menu.Trigger asChild>
				<IconButton
					aria-label={`More for ${a.name}`}
					size='sm'
					variant='ghost'>
					<Ellipsis size={16} />
				</IconButton>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content minW='180px'>
						<Menu.Item
							value='access'
							onClick={onAccess}>
							Change role
						</Menu.Item>
						<Menu.Item
							value='password'
							onClick={onPassword}>
							Set a new password
						</Menu.Item>
						<Menu.Item
							value='toggle'
							onClick={onToggle}>
							{a.isActive ? 'Switch off' : 'Switch on'}
						</Menu.Item>
						<Menu.Item
							value='remove'
							color='fg.error'
							onClick={onRemove}>
							Remove
						</Menu.Item>
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	</Flex>
);

const Logins: FC<{ admins: PanelAdmin[]; roles: { _id: string; name: string }[]; projectName: string; store: boolean }> = ({ admins, roles, projectName, store }) => {
	const appUrl = store ? COMMERCE_URL : PANEL_URL;
	const choices = [
		...(store ? [{ value: '', label: 'Store admin — the store’s orders, products, POS, couriers' }] : []),
		{ value: SUPER, label: 'Super admin — every table and report, and makes panel users' },
		...roles.map(r => ({ value: r._id, label: r.name })),
	];
	const label = (a: PanelAdmin) => (a.superAdmin ? 'Super admin' : roles.find(r => r._id === a.role)?.name || (store ? '' : 'No role'));
	const [accessFor, setAccessFor] = useState<PanelAdmin | null>(null);
	const [access, setAccess] = useState('');
	const [adding, setAdding] = useState(false);
	const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', access: '' });
	const [pwFor, setPwFor] = useState<PanelAdmin | null>(null);
	const [pw, setPw] = useState('');
	const [removingOne, setRemovingOne] = useState<PanelAdmin | null>(null);
	const [add, added] = useAddPanelAdminMutation();
	const [update, updating] = useUpdatePanelAdminMutation();
	const [remove, removing] = useRemovePanelAdminMutation();

	const fail = (e: any, fallback: string) => toaster.create({ type: 'error', title: e?.data?.message || fallback });

	return (
		<Panel
			id='panel-admins'
			title={store ? 'Store logins' : 'Panel users'}
			subtitle={
				store
					? `The people who run ${projectName || 'the store'} sign in to the commerce panel with these — orders, products, POS, couriers and email, no building or settings`
					: `The people who work in ${projectName || 'the project'} sign in to the panel app with these — the tables and reports their role allows, never building or settings`
			}
			actions={
				<Flex
					gap={2}
					align='center'>
					{!store && <GuideLink section='panel-users' />}
					<Button
						asChild
						size='sm'
						variant='outline'>
						<NextLink href={projectHref('/panel-roles')}>Panel roles</NextLink>
					</Button>
					<Button
						size='sm'
						onClick={() => {
							setForm({ name: '', email: '', password: '', phone: '', access: store ? '' : roles[0]?._id || SUPER });
							setAdding(true);
						}}>
						<Plus size={14} /> Add a login
					</Button>
				</Flex>
			}>
			<Flex
				direction='column'
				gap={2}>
				{admins.length === 0 ? (
					<Text
						fontSize='13px'
						color='fg.muted'>
						{`No logins yet. Add one with an email and a password${store ? '' : ' and a role'}, then share the ${store ? 'commerce panel’s' : 'panel app’s'} address with them.`}
					</Text>
				) : (
					admins.map(a => (
						<Row
							key={a._id}
							admin={a}
							access={label(a)}
							onAccess={() => {
								setAccess(accessOf(a));
								setAccessFor(a);
							}}
							onPassword={() => {
								setPw('');
								setPwFor(a);
							}}
							onToggle={async () => {
								try {
									await update({ id: a._id, isActive: !a.isActive }).unwrap();
									toaster.create({ type: 'success', title: a.isActive ? 'Switched off — they’re signed out.' : 'Switched on.' });
								} catch (e) {
									fail(e, 'Not changed — try again.');
								}
							}}
							onRemove={() => setRemovingOne(a)}
						/>
					))
				)}
				<Flex
					align='center'
					gap={1.5}
					fontSize='13px'
					color='fg.muted'
					pt={2}>
					They sign in at
					<Link
						href={`${appUrl}/auth/login`}
						target='_blank'
						rel='noreferrer'
						color='fg'
						fontWeight='500'>
						{appUrl.replace(/^https?:\/\//, '')} <ExternalLink size={12} />
					</Link>
				</Flex>
			</Flex>

			<PromptDialog
				open={adding}
				onClose={() => setAdding(false)}
				title={store ? 'Add a store login' : 'Add a panel user'}
				description={`One email opens one ${store ? 'store' : 'project'}. You can set a new password for them here later.`}
				confirmLabel='Add'
				loading={added.isLoading}
				onConfirm={async () => {
					try {
						await add({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone.trim() || undefined, ...accessBody(form.access) }).unwrap();
						setAdding(false);
						toaster.create({ type: 'success', title: 'Login added.' });
					} catch (e) {
						fail(e, 'Not added — try again.');
					}
				}}>
				<Field label='Name'>
					<Input
						size='sm'
						value={form.name}
						onChange={e => setForm({ ...form, name: e.target.value })}
					/>
				</Field>
				<Field label='Email'>
					<Input
						size='sm'
						type='email'
						value={form.email}
						onChange={e => setForm({ ...form, email: e.target.value })}
					/>
				</Field>
				<Field
					label='Password'
					hint='At least 8 characters.'>
					<Input
						size='sm'
						type='text'
						autoComplete='new-password'
						value={form.password}
						onChange={e => setForm({ ...form, password: e.target.value })}
					/>
				</Field>
				<Field label='Phone (optional)'>
					<Input
						size='sm'
						value={form.phone}
						onChange={e => setForm({ ...form, phone: e.target.value })}
					/>
				</Field>
				<Field
					label='Role'
					hint={roles.length ? undefined : 'No panel roles yet — make one under Panel roles, or add a super admin.'}>
					<Dropdown
						size='sm'
						value={form.access}
						onChange={v => setForm({ ...form, access: v })}
						items={choices}
					/>
				</Field>
			</PromptDialog>

			<PromptDialog
				open={!!accessFor}
				onClose={() => setAccessFor(null)}
				title='Change role'
				subject={accessFor ? `${accessFor.name} — ${accessFor.email}` : undefined}
				description='It applies from their next page — they stay signed in.'
				confirmLabel='Save'
				loading={updating.isLoading}
				onConfirm={async () => {
					if (!accessFor) return;
					try {
						await update({ id: accessFor._id, ...accessBody(access) }).unwrap();
						setAccessFor(null);
						toaster.create({ type: 'success', title: 'Role changed.' });
					} catch (e) {
						fail(e, 'Not changed — try again.');
					}
				}}>
				<Field label='Role'>
					<Dropdown
						size='sm'
						value={access}
						onChange={setAccess}
						items={choices}
					/>
				</Field>
			</PromptDialog>

			<PromptDialog
				open={!!pwFor}
				onClose={() => setPwFor(null)}
				title='Set a new password'
				subject={pwFor ? `${pwFor.name} — ${pwFor.email}` : undefined}
				description='They’re signed out everywhere and sign in again with this one.'
				confirmLabel='Save'
				loading={updating.isLoading}
				onConfirm={async () => {
					if (!pwFor) return;
					try {
						await update({ id: pwFor._id, password: pw }).unwrap();
						setPwFor(null);
						toaster.create({ type: 'success', title: 'Password changed.' });
					} catch (e) {
						fail(e, 'Not changed — try again.');
					}
				}}>
				<Field
					label='New password'
					hint='At least 8 characters.'>
					<Input
						size='sm'
						type='text'
						autoComplete='new-password'
						value={pw}
						onChange={e => setPw(e.target.value)}
					/>
				</Field>
			</PromptDialog>

			<PromptDialog
				open={!!removingOne}
				onClose={() => setRemovingOne(null)}
				tone='danger'
				title='Remove this login?'
				subject={removingOne ? `${removingOne.name} — ${removingOne.email}` : undefined}
				description='They’re signed out and can’t sign in again. The email can be used for a login again.'
				confirmLabel='Remove'
				loading={removing.isLoading}
				onConfirm={async () => {
					if (!removingOne) return;
					try {
						await remove(removingOne._id).unwrap();
						setRemovingOne(null);
						toaster.create({ type: 'success', title: 'Removed.' });
					} catch (e) {
						fail(e, 'Not removed — try again.');
					}
				}}
			/>
		</Panel>
	);
};

export default function PanelAdminsPage() {
	const { can, project, isLoading: loadingSelf } = useWorkspace();
	const allowed = can('manage-projects') || can('invite-to-projects') || can('manage-panel-users');
	const store = project?.type === 'ecommerce';
	const { data, isLoading, isError } = useGetPanelAdminsQuery(undefined, { skip: !allowed || !project });

	return (
		<Layout
			title={store ? 'Panel admins' : 'Panel users'}
			path={store ? 'panel-admins' : 'panel-users'}>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				{loadingSelf ? (
					<Skeleton h='240px' />
				) : !project ? (
					<EmptyState
						title='Open a project'
						description='Panel logins belong to a project.'
					/>
				) : !allowed ? (
					<EmptyState
						title='Panel logins are made by people who manage the project'
						description='Ask your organization’s owner or an admin.'
					/>
				) : isError ? (
					<EmptyState
						title='Panel logins aren’t available yet'
						description='They arrive with the next update of MINT — try again later.'
					/>
				) : isLoading || !data ? (
					<Skeleton h='240px' />
				) : (
					<Logins
						admins={data.doc}
						roles={data.roles || []}
						projectName={project?.name || ''}
						store={store}
					/>
				)}
			</Flex>
		</Layout>
	);
}
