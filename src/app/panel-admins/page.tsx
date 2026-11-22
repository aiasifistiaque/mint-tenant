'use client';

import { FC, ReactNode, useState } from 'react';
import { Badge, Box, Button, Flex, IconButton, Input, Link, Menu, Portal, Skeleton, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Copy, Ellipsis, ExternalLink, Plus, ShieldCheck, Sparkles, UserCog } from 'lucide-react';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton, Layout, PromptDialog } from '@/components/library';
import { styles } from '@/components/library/config';
import { Dropdown, EmptyState, Panel } from '@/components/library/cl';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import { toaster } from '@/components/ui/toaster';
import {
	useAddDemoLoginMutation,
	useAddPanelAdminMutation,
	useGetPanelAdminsQuery,
	useNewDemoLinkMutation,
	useGetPanelRolesQuery,
	useRemovePanelAdminMutation,
	useUpdatePanelAdminMutation,
} from '@/components/library/store/services/tenantApi';
import type { DemoLogin, PanelAdmin } from '@/components/library/store/services/tenantApi';
import GuideLink from '@/components/library/tenant/GuideLink';

/**
 * A project's panel logins (Project → Panel admins / Panel users; backend
 * docs/panel-users PU-03). A store's (below) sign in to the commerce panel; every
 * other project's sign in to the panel app (panel.tcrypt.site) with a panel role
 * (Project → Panel roles) or as a super admin, who can make roles and logins there.
 *
 * Before: an e-commerce project's store logins (Project → Panel admins; backend
 * docs/commerce-panel CP-03): the people who run the store sign in to the
 * commerce panel with a username (or email) and a password made here. They work with the
 * store's records, couriers and email accounts — never its models, settings or
 * developer tools. One username opens one store. Switching a login off, a new
 * password or removing it signs them out everywhere.
 * Backend: routes-tenant/panelAdmins.router.ts. Needs manage-projects or invite-to-projects.
 */

const COMMERCE_URL = (process.env.NEXT_PUBLIC_COMMERCE_URL || 'https://commerce.mintapp.site').replace(/\/+$/, '');
const PANEL_URL = (process.env.NEXT_PUBLIC_PANEL_URL || 'https://panel.tcrypt.site').replace(/\/+$/, '');
const SEO_URL = (process.env.NEXT_PUBLIC_SEO_URL || 'https://seo.tcrypt.site').replace(/\/+$/, '');

/**
 * Which app a project's logins open: a store's the commerce panel, a Mint SEO website's Mint SEO (backend
 * docs/seo-panel SP-11: fixed SEO access, no panel roles), every other project's the panel app.
 */
type AppKind = 'store' | 'seo' | 'panel';
const APP: Record<AppKind, { url: string; name: string }> = {
	store: { url: COMMERCE_URL, name: 'the commerce panel' },
	seo: { url: SEO_URL, name: 'Mint SEO' },
	panel: { url: PANEL_URL, name: 'the panel app' },
};
const SEO_ADMIN = 'SEO admin — pages, SEO, link previews, redirects, tracking, analytics and the site’s connection';

/** The access dropdown's value: a role id, SUPER, or '' (a store's own fixed access). */
const SUPER = '__super';
const accessOf = (a: { role?: string | null; superAdmin?: boolean }) => (a.superAdmin ? SUPER : a.role || '');
const accessBody = (v: string) => (v === SUPER ? { superAdmin: true, role: null } : { superAdmin: false, role: v || null });

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');

/**
 * The add / change dialogs: the app's standard modal (a bottom sheet on a
 * phone, a centred dialog on a computer) with a header, a scrolling form and
 * Cancel / the action on the footer. Enter in a field submits.
 */
const FormDialog: FC<{
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: ReactNode;
	description?: ReactNode;
	subject?: ReactNode;
	confirmLabel: ReactNode;
	loading?: boolean;
	icon?: ReactNode;
	children: ReactNode;
}> = ({ open, onClose, onConfirm, title, description, subject, confirmLabel, loading, icon, children }) => (
	<Dialog
		isOpen={open}
		onClose={() => !loading && onClose()}
		size='md'
		forceModal>
		<DialogHeader
			divider
			icon={icon || <UserCog size={17} strokeWidth={1.75} />}
			description={description}>
			{title}
		</DialogHeader>
		<DialogCloseButton />
		<DialogBody>
			<form
				id='panel-login-form'
				onSubmit={e => {
					e.preventDefault();
					if (!loading) onConfirm();
				}}>
				{subject && (
					<Box
						mb={4}
						px={3}
						py={2}
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						bg='bg.subtle'
						fontSize='13px'
						fontWeight='500'
						wordBreak='break-word'>
						{subject}
					</Box>
				)}
				{children}
			</form>
		</DialogBody>
		<DialogFooter>
			<DiscardButton
				disabled={loading}
				onClick={onClose}>
				Cancel
			</DiscardButton>
			<Button
				{...(styles.MODAL_BUTTON as any)}
				type='submit'
				form='panel-login-form'
				loading={loading}>
				{confirmLabel}
			</Button>
		</DialogFooter>
	</Dialog>
);

const ACTION_LABELS: Record<string, string> = { view: 'View', create: 'Add', edit: 'Edit', delete: 'Delete', publish: 'Publish' };
const ACTION_ORDER = Object.keys(ACTION_LABELS);

const Chip: FC<{ children: ReactNode }> = ({ children }) => (
	<Badge
		size='sm'
		variant='subtle'
		colorPalette='gray'>
		{children}
	</Badge>
);

/**
 * What one login may do, read from their panel role: each model with the
 * actions ticked, then reports and analytics. A super admin, a store admin and
 * a login with no role get a sentence instead. The standard modal — a bottom
 * sheet on a phone.
 */
const PermissionsDialog: FC<{ admin: PanelAdmin | null; store: boolean; seo: boolean; onClose: () => void; onChangeRole: () => void }> = ({ admin: a, store, seo, onClose, onChangeRole }) => {
	const { data, isLoading, isError } = useGetPanelRolesQuery(undefined, { skip: !a || a.superAdmin || !a.role || seo });
	const role = data?.doc.find(r => r._id === a?.role);
	const keys = new Set(role?.permissions || []);
	const rows = (data?.targets || [])
		.map(t => ({ name: t.name, actions: ACTION_ORDER.filter(k => t.actions.includes(k) && keys.has(`${k}-${t.route}`)) }))
		.filter(r => r.actions.length);
	const reports = (data?.reports || []).filter(r => keys.has(r.key));

	const sentence = !a
		? ''
		: seo
		? a.superAdmin
			? 'Super admin — everything in Mint SEO: pages, SEO, link previews, redirects, tracking, analytics and the site’s connection, and they add other SEO logins.'
			: `${SEO_ADMIN}. They can’t add other logins.`
		: a.superAdmin
		? 'Super admin — they see and work on every table and report, and make panel roles and other panel users. They can’t build.'
		: !a.role
		? store
			? 'Store admin — the store’s orders, products, POS, couriers and email. No building or settings.'
			: 'No role — they see nothing until you give them one.'
		: '';

	return (
		<Dialog
			isOpen={!!a}
			onClose={onClose}
			size='md'
			forceModal>
			<DialogHeader
				divider
				icon={<ShieldCheck size={17} strokeWidth={1.75} />}
				description={a ? `${a.username || a.email}${role ? ` · ${role.name}` : a.superAdmin ? ' · Super admin' : seo ? ' · SEO admin' : ''}` : undefined}>
				{a ? `What ${a.name} can do` : 'Permissions'}
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				{sentence ? (
					<Text
						fontSize='14px'
						lineHeight='1.6'>
						{sentence}
					</Text>
				) : isLoading ? (
					<Skeleton h='160px' />
				) : isError ? (
					<Text
						fontSize='14px'
						color='fg.muted'>
						Couldn’t load the role — try again later.
					</Text>
				) : !role ? (
					<Text
						fontSize='14px'
						color='fg.muted'>
						Their role was removed — give them another.
					</Text>
				) : (
					<Flex
						direction='column'
						gap={5}>
						{role.description && (
							<Text
								fontSize='13px'
								color='fg.muted'>
								{role.description}
							</Text>
						)}
						<Box>
							<Text
								fontSize='12px'
								fontWeight='600'
								color='fg.muted'
								textTransform='uppercase'
								letterSpacing='0.04em'
								mb={2}>
								Records
							</Text>
							{rows.length === 0 ? (
								<Text
									fontSize='13px'
									color='fg.muted'>
									No tables.
								</Text>
							) : (
								<Flex
									direction='column'
									borderWidth='1px'
									borderColor='border'
									borderRadius='lg'
									overflow='hidden'>
									{rows.map((r, i) => (
										<Flex
											key={r.name}
											data-testid='permission-row'
											align='center'
											justify='space-between'
											gap={3}
											wrap='wrap'
											px={3}
											py={2.5}
											borderTopWidth={i ? '1px' : 0}
											borderColor='border'>
											<Text
												fontSize='14px'
												fontWeight='500'>
												{r.name}
											</Text>
											<Flex
												gap={1}
												wrap='wrap'>
												{r.actions.length === ACTION_ORDER.filter(k => (data?.targets || []).find(t => t.name === r.name)?.actions.includes(k)).length && r.actions.length > 1 ? (
													<Chip>Everything</Chip>
												) : (
													r.actions.map(k => <Chip key={k}>{ACTION_LABELS[k]}</Chip>)
												)}
											</Flex>
										</Flex>
									))}
								</Flex>
							)}
						</Box>
						{reports.length > 0 && (
							<Box>
								<Text
									fontSize='12px'
									fontWeight='600'
									color='fg.muted'
									textTransform='uppercase'
									letterSpacing='0.04em'
									mb={2}>
									Reports
								</Text>
								<Flex
									gap={1}
									wrap='wrap'>
									{reports.map(r => (
										<Chip key={r.key}>{r.label}</Chip>
									))}
								</Flex>
							</Box>
						)}
					</Flex>
				)}
			</DialogBody>
			<DialogFooter>
				<DiscardButton onClick={onClose}>Close</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					onClick={onChangeRole}>
					{seo ? 'Change access' : 'Change role'}
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

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

const Row: FC<{ admin: PanelAdmin; access: string; accessLabel: string; onPermissions: () => void; onAccess: () => void; onSignIn: () => void; onPassword: () => void; onToggle: () => void; onRemove: () => void }> = ({ admin: a, access, accessLabel, onPermissions, onAccess, onSignIn, onPassword, onToggle, onRemove }) => (
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
				{a.username || a.email}
				{a.email && a.email !== a.username ? ` · ${a.email}` : ''}
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
							value='permissions'
							onClick={onPermissions}>
							See permissions
						</Menu.Item>
						<Menu.Item
							value='access'
							onClick={onAccess}>
							{accessLabel}
						</Menu.Item>
						<Menu.Item
							value='sign-in'
							onClick={onSignIn}>
							Change username or email
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

const Logins: FC<{ admins: PanelAdmin[]; roles: { _id: string; name: string }[]; projectName: string; kind: AppKind }> = ({ admins, roles, projectName, kind }) => {
	const store = kind === 'store';
	const seo = kind === 'seo';
	const appUrl = APP[kind].url;
	const choices = seo
		? [
				{ value: '', label: SEO_ADMIN },
				{ value: SUPER, label: 'Super admin — all of that, and adds other SEO logins' },
		  ]
		: [
				...(store ? [{ value: '', label: 'Store admin — the store’s orders, products, POS, couriers' }] : []),
				{ value: SUPER, label: 'Super admin — every table and report, and makes panel users' },
				...roles.map(r => ({ value: r._id, label: r.name })),
		  ];
	const label = (a: PanelAdmin) => (a.superAdmin ? 'Super admin' : seo ? 'SEO admin' : roles.find(r => r._id === a.role)?.name || (store ? '' : 'No role'));
	/** What a login's access is called: an SEO login has fixed access, not a panel role. */
	const accessWord = seo ? 'Access' : 'Role';
	const [accessFor, setAccessFor] = useState<PanelAdmin | null>(null);
	const [access, setAccess] = useState('');
	const [adding, setAdding] = useState(false);
	const [form, setForm] = useState({ name: '', username: '', email: '', password: '', phone: '', access: '' });
	const [signInFor, setSignInFor] = useState<PanelAdmin | null>(null);
	const [signIn, setSignIn] = useState({ username: '', email: '' });
	/** How a login is named in dialogs. */
	const who = (a: PanelAdmin | null) => (a ? `${a.name} — ${a.username || a.email}` : undefined);
	const [pwFor, setPwFor] = useState<PanelAdmin | null>(null);
	const [pw, setPw] = useState('');
	const [removingOne, setRemovingOne] = useState<PanelAdmin | null>(null);
	const [permsFor, setPermsFor] = useState<PanelAdmin | null>(null);
	const [add, added] = useAddPanelAdminMutation();
	const [update, updating] = useUpdatePanelAdminMutation();
	const [remove, removing] = useRemovePanelAdminMutation();

	const fail = (e: any, fallback: string) => toaster.create({ type: 'error', title: e?.data?.message || fallback });

	return (
		<Panel
			id='panel-admins'
			title={store ? 'Store logins' : seo ? 'SEO logins' : 'Panel users'}
			subtitle={
				store
					? `The people who run ${projectName || 'the store'} sign in to the commerce panel with these — orders, products, POS, couriers and email, no building or settings`
					: seo
					? `The people who look after ${projectName || 'the site'} sign in to Mint SEO with these — they connect the site, then manage its pages’ SEO and see its visits`
					: `The people who work in ${projectName || 'the project'} sign in to the panel app with these — the tables and reports their role allows, never building or settings`
			}
			actions={
				<Flex
					gap={2}
					align='center'>
					{!store && <GuideLink section={seo ? 'seo-logins' : 'panel-users'} />}
					{!seo && (
						<Button
							asChild
							size='sm'
							variant='outline'>
							<NextLink href={projectHref('/panel-roles')}>Panel roles</NextLink>
						</Button>
					)}
					<Button
						size='sm'
						onClick={() => {
							setForm({ name: '', username: '', email: '', password: '', phone: '', access: store ? '' : seo ? SUPER : roles[0]?._id || SUPER });
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
						{`No logins yet. Add one with a username and a password${store || seo ? '' : ' and a role'}, then share ${APP[kind].name}’s address with them.`}
					</Text>
				) : (
					admins.map(a => (
						<Row
							key={a._id}
							admin={a}
							access={label(a)}
							accessLabel={`Change ${accessWord.toLowerCase()}`}
							onPermissions={() => setPermsFor(a)}
							onAccess={() => {
								setAccess(accessOf(a));
								setAccessFor(a);
							}}
							onSignIn={() => {
								setSignIn({ username: a.username || '', email: a.email || '' });
								setSignInFor(a);
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

			<PermissionsDialog
				admin={permsFor}
				store={store}
				seo={seo}
				onClose={() => setPermsFor(null)}
				onChangeRole={() => {
					if (!permsFor) return;
					const a = permsFor;
					setPermsFor(null);
					setAccess(accessOf(a));
					setAccessFor(a);
				}}
			/>

			<FormDialog
				open={adding}
				onClose={() => setAdding(false)}
				title={store ? 'Add a store login' : seo ? 'Add an SEO login' : 'Add a panel user'}
				description={`They sign in ${seo ? 'to Mint SEO ' : ''}with the username (or the email, if you give one). One username opens one ${store ? 'store' : seo ? 'site' : 'project'}. You can set a new password for them here later.`}
				confirmLabel='Add'
				loading={added.isLoading}
				onConfirm={async () => {
					try {
						await add({ name: form.name.trim(), username: form.username.trim(), email: form.email.trim() || undefined, password: form.password, phone: form.phone.trim() || undefined, ...accessBody(form.access) }).unwrap();
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
				<Field
					label='Username'
					hint='What they sign in with — letters, numbers and . _ - @ +, like rahim or rahim.farm.'>
					<Input
						size='sm'
						autoCapitalize='none'
						autoComplete='off'
						spellCheck={false}
						value={form.username}
						onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
					/>
				</Field>
				<Field label='Email (optional)'>
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
					label={accessWord}
					hint={seo ? 'The first login is usually a super admin: they can add the rest themselves.' : roles.length ? undefined : 'No panel roles yet — make one under Panel roles, or add a super admin.'}>
					<Dropdown
						size='sm'
						value={form.access}
						onChange={v => setForm({ ...form, access: v })}
						items={choices}
					/>
				</Field>
			</FormDialog>

			<FormDialog
				open={!!accessFor}
				onClose={() => setAccessFor(null)}
				title={`Change ${accessWord.toLowerCase()}`}
				subject={who(accessFor)}
				description='It applies from their next page — they stay signed in.'
				confirmLabel='Save'
				loading={updating.isLoading}
				onConfirm={async () => {
					if (!accessFor) return;
					try {
						await update({ id: accessFor._id, ...accessBody(access) }).unwrap();
						setAccessFor(null);
						toaster.create({ type: 'success', title: `${accessWord} changed.` });
					} catch (e) {
						fail(e, 'Not changed — try again.');
					}
				}}>
				<Field label={accessWord}>
					<Dropdown
						size='sm'
						value={access}
						onChange={setAccess}
						items={choices}
					/>
				</Field>
			</FormDialog>

			<FormDialog
				open={!!signInFor}
				onClose={() => setSignInFor(null)}
				title='Change username or email'
				subject={who(signInFor)}
				description='Either one signs in. They stay signed in on their devices.'
				confirmLabel='Save'
				loading={updating.isLoading}
				onConfirm={async () => {
					if (!signInFor) return;
					try {
						await update({ id: signInFor._id, username: signIn.username.trim(), email: signIn.email.trim() }).unwrap();
						setSignInFor(null);
						toaster.create({ type: 'success', title: 'Saved.' });
					} catch (e) {
						fail(e, 'Not changed — try again.');
					}
				}}>
				<Field label='Username'>
					<Input
						size='sm'
						autoCapitalize='none'
						autoComplete='off'
						spellCheck={false}
						value={signIn.username}
						onChange={e => setSignIn({ ...signIn, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
					/>
				</Field>
				<Field label='Email (optional)'>
					<Input
						size='sm'
						type='email'
						value={signIn.email}
						onChange={e => setSignIn({ ...signIn, email: e.target.value })}
					/>
				</Field>
			</FormDialog>

			<FormDialog
				open={!!pwFor}
				onClose={() => setPwFor(null)}
				title='Set a new password'
				subject={who(pwFor)}
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
			</FormDialog>

			<PromptDialog
				open={!!removingOne}
				onClose={() => setRemovingOne(null)}
				tone='danger'
				title='Remove this login?'
				subject={who(removingOne)}
				description='They’re signed out and can’t sign in again. The username and email can be used for a login again.'
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

/**
 * The project's demo login (backend docs/panel-users/DEMO_LOGINS.md): one link that opens the app for an
 * hour as a visitor, for showing the work (the Thinkcrypt and Commerce OS websites' demo buttons). No
 * password. Its access is a role like any login's, but it never manages panel users. Only the project's
 * managers see this card; the panel apps' super admins don't.
 */
const DemoCard: FC<{ demo: DemoLogin | null; roles: { _id: string; name: string }[]; kind: AppKind }> = ({ demo, roles, kind }) => {
	const store = kind === 'store';
	// An SEO project's demo only looks (backend SEO_DEMO_PERMISSIONS): visitors could otherwise disconnect the real site.
	const seo = kind === 'seo';
	const appUrl = APP[kind].url;
	const link = demo ? `${appUrl}/demo/${demo.demoKey}` : '';
	const choices = [
		...(store ? [{ value: '', label: 'Store admin — the store’s orders, products, POS, couriers' }] : []),
		{ value: SUPER, label: 'Everything — every table and report (never panel users)' },
		...roles.map(r => ({ value: r._id, label: r.name })),
	];
	const label = (a: DemoLogin) => (seo ? 'View only' : a.superAdmin ? 'Everything' : roles.find(r => r._id === a.role)?.name || (store ? 'Store admin' : 'No role'));
	const [making, setMaking] = useState(false);
	const [changing, setChanging] = useState(false);
	const [access, setAccess] = useState('');
	const [renewing, setRenewing] = useState(false);
	const [removingDemo, setRemovingDemo] = useState(false);
	const [add, added] = useAddDemoLoginMutation();
	const [renew, renewed] = useNewDemoLinkMutation();
	const [update, updating] = useUpdatePanelAdminMutation();
	const [remove, removing] = useRemovePanelAdminMutation();
	const fail = (e: any, fallback: string) => toaster.create({ type: 'error', title: e?.data?.message || fallback });
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(link);
			toaster.create({ type: 'success', title: 'Demo link copied.' });
		} catch {
			toaster.create({ type: 'error', title: 'Couldn’t copy — select the link and copy it.' });
		}
	};
	const accessNote = 'Visitors can change whatever this role allows. Pick a role that only views to keep your data as it is.';

	return (
		<Panel
			id='demo-login'
			title='Demo login'
			subtitle={`A link that opens ${APP[kind].name} signed in, no password — for showing your work.${seo ? ' Visitors look around — pages, SEO, visits — but can’t change anything.' : ''} Each visit signs out whoever was signed in on that browser and lasts an hour; opening the link again starts a new hour.`}
			actions={
				<Flex
					gap={2}
					align='center'>
					<GuideLink section={seo ? 'seo-demo' : 'demo-login'} />
					{!demo && (
						<Button
							size='sm'
							onClick={() => {
								setAccess(store ? '' : roles[0]?._id || SUPER);
								setMaking(true);
							}}>
							<Sparkles size={14} /> Make a demo login
						</Button>
					)}
				</Flex>
			}>
			{!demo ? (
				<Text
					fontSize='13px'
					color='fg.muted'>
					{seo ? 'No demo login yet. Make one, then put its link on your website.' : 'No demo login yet. Make one, pick what visitors may see, then put its link on your website.'}
				</Text>
			) : (
				<Flex
					direction='column'
					gap={3}
					opacity={demo.isActive ? 1 : 0.6}>
					<Flex
						align='center'
						gap={2}
						wrap='wrap'>
						<Badge
							size='sm'
							colorPalette={!seo && demo.superAdmin ? 'purple' : 'blue'}>
							{label(demo)}
						</Badge>
						{!demo.isActive && (
							<Badge
								size='sm'
								colorPalette='gray'>
								Switched off — the link doesn’t work
							</Badge>
						)}
						<Text
							fontSize='12px'
							color='fg.muted'>
							{demo.lastLoginAt ? `Last opened ${when(demo.lastLoginAt)}` : 'Not opened yet'}
						</Text>
					</Flex>
					<Flex
						align='center'
						gap={2}>
						<Box
							data-testid='demo-link'
							flex='1'
							minW={0}
							px={3}
							py={2}
							borderWidth='1px'
							borderColor='border'
							borderRadius='md'
							bg='bg.subtle'
							fontFamily='mono'
							fontSize='12.5px'
							truncate>
							{link}
						</Box>
						<IconButton
							aria-label='Copy the demo link'
							size='sm'
							variant='outline'
							onClick={copy}>
							<Copy size={14} />
						</IconButton>
						<IconButton
							asChild
							aria-label='Open the demo'
							size='sm'
							variant='outline'>
							<a
								href={link}
								target='_blank'
								rel='noreferrer'>
								<ExternalLink size={14} />
							</a>
						</IconButton>
						<Menu.Root positioning={{ placement: 'bottom-end' }}>
							<Menu.Trigger asChild>
								<IconButton
									aria-label='More for the demo login'
									size='sm'
									variant='ghost'>
									<Ellipsis size={16} />
								</IconButton>
							</Menu.Trigger>
							<Portal>
								<Menu.Positioner>
									<Menu.Content minW='180px'>
										{!seo && (
											<Menu.Item
												value='access'
												onClick={() => {
													setAccess(accessOf(demo));
													setChanging(true);
												}}>
												Change what visitors see
											</Menu.Item>
										)}
										<Menu.Item
											value='new-link'
											onClick={() => setRenewing(true)}>
											Make a new link
										</Menu.Item>
										<Menu.Item
											value='toggle'
											onClick={async () => {
												try {
													await update({ id: demo._id, isActive: !demo.isActive }).unwrap();
													toaster.create({ type: 'success', title: demo.isActive ? 'Switched off — the link stops and visitors are signed out.' : 'Switched on — the link works again.' });
												} catch (e) {
													fail(e, 'Not changed — try again.');
												}
											}}>
											{demo.isActive ? 'Switch off' : 'Switch on'}
										</Menu.Item>
										<Menu.Item
											value='remove'
											color='fg.error'
											onClick={() => setRemovingDemo(true)}>
											Remove
										</Menu.Item>
									</Menu.Content>
								</Menu.Positioner>
							</Portal>
						</Menu.Root>
					</Flex>
				</Flex>
			)}

			<FormDialog
				open={making}
				onClose={() => setMaking(false)}
				icon={<Sparkles size={17} strokeWidth={1.75} />}
				title='Make a demo login'
				description={`One link, no password. Anyone who opens it is signed in for an hour${seo ? ' and can look but not change anything' : ''}.`}
				confirmLabel='Make it'
				loading={added.isLoading}
				onConfirm={async () => {
					try {
						await add(accessBody(seo ? '' : access)).unwrap();
						setMaking(false);
						toaster.create({ type: 'success', title: 'Demo login made — copy its link.' });
					} catch (e) {
						fail(e, 'Not made — try again.');
					}
				}}>
				{seo ? (
					<Text
						fontSize='13px'
						color='fg.muted'>
						Visitors see Home, Pages & SEO, Defaults, Link previews, Media, Analytics and Connection. Saving, connecting and
						disconnecting are switched off for them.
					</Text>
				) : (
					<Field
						label='What visitors see'
						hint={accessNote}>
						<Dropdown
							size='sm'
							value={access}
							onChange={setAccess}
							items={choices}
						/>
					</Field>
				)}
			</FormDialog>

			<FormDialog
				open={changing}
				onClose={() => setChanging(false)}
				icon={<Sparkles size={17} strokeWidth={1.75} />}
				title='Change what visitors see'
				description='Visitors already in the demo get it on their next page.'
				confirmLabel='Save'
				loading={updating.isLoading}
				onConfirm={async () => {
					if (!demo) return;
					try {
						await update({ id: demo._id, ...accessBody(access) }).unwrap();
						setChanging(false);
						toaster.create({ type: 'success', title: 'Saved.' });
					} catch (e) {
						fail(e, 'Not changed — try again.');
					}
				}}>
				<Field
					label='What visitors see'
					hint={accessNote}>
					<Dropdown
						size='sm'
						value={access}
						onChange={setAccess}
						items={choices}
					/>
				</Field>
			</FormDialog>

			<PromptDialog
				open={renewing}
				onClose={() => setRenewing(false)}
				tone='default'
				title='Make a new demo link?'
				description='The old link stops working and anyone using it is signed out. Put the new link on your website.'
				confirmLabel='Make a new link'
				loading={renewed.isLoading}
				onConfirm={async () => {
					try {
						await renew().unwrap();
						setRenewing(false);
						toaster.create({ type: 'success', title: 'New link made — copy it.' });
					} catch (e) {
						fail(e, 'Not made — try again.');
					}
				}}
			/>

			<PromptDialog
				open={removingDemo}
				onClose={() => setRemovingDemo(false)}
				tone='danger'
				title='Remove the demo login?'
				description='Its link stops working and visitors are signed out. You can make a new one later, with a new link.'
				confirmLabel='Remove'
				loading={removing.isLoading}
				onConfirm={async () => {
					if (!demo) return;
					try {
						await remove(demo._id).unwrap();
						setRemovingDemo(false);
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
	const kind: AppKind = store ? 'store' : project?.edition === 'seo' ? 'seo' : 'panel';
	const { data, isLoading, isError } = useGetPanelAdminsQuery(undefined, { skip: !allowed || !project });

	return (
		<Layout
			title={store ? 'Panel admins' : kind === 'seo' ? 'SEO logins' : 'Panel users'}
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
					<>
						<Logins
							admins={data.doc}
							roles={data.roles || []}
							projectName={project?.name || ''}
							kind={kind}
						/>
						{/* The project's managers only: the panel apps' super admins get no `demo` back. */}
						{data.demo !== undefined && (
							<DemoCard
								demo={data.demo}
								roles={data.roles || []}
								kind={kind}
								/>
								)}
					</>
				)}
			</Flex>
		</Layout>
	);
}
