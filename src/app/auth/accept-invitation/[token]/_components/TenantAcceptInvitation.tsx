'use client';

import { FC, FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';
import { Text } from '@chakra-ui/react';
import {
	LoginContainer,
	VInput,
	VPassword,
	login,
	useAcceptTenantInvitationMutation,
	useAppDispatch,
	useGetTenantInvitationQuery,
} from '@/components/library';
import { rememberProject } from '@/components/library/config/lib/constants/panel';

/**
 * Joining an organization from an emailed invitation (tenant panel —
 * /tenant/api/invitations/:token). Someone new makes their account here; an
 * existing account proves it's theirs with its password — or, already signed
 * in to it, joins in one click (WO-24). Either way they land in the
 * organization that invited them, with the projects it gives (WO-22) — or,
 * invited into one project (WO-47), straight in that project.
 */
const TenantAcceptInvitation: FC = () => {
	const { token } = useParams<{ token: string }>();
	const dispatch = useAppDispatch();
	const { data: invitation, isLoading: loadingInfo, isError } = useGetTenantInvitationQuery(token);
	const [accept, { isLoading, error }] = useAcceptTenantInvitationMutation();
	const [form, setForm] = useState({ name: '', phone: '', password: '', confirm: '' });
	const existing = !!invitation?.existingAccount;
	const oneClick = !!invitation?.signedInAsInvitee;
	const projects = invitation ? (invitation.allProjects ? 'every project' : invitation.projects.join(', ') || 'no projects yet') : '';
	// Into one project (WO-47): "Shop in Acme".
	const where = invitation ? (invitation.project ? `${invitation.projects[0] || 'a project'} in ${invitation.organization.name}` : invitation.organization.name) : '';
	const joinAs = invitation ? (invitation.project ? `you'll join ${where} as ${invitation.role}` : `you'll join as ${invitation.role}, with ${projects}`) : '';
	const mismatch = !existing && form.confirm.length > 0 && form.password !== form.confirm;

	const set = (k: keyof typeof form) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		if (mismatch) return;
		const res = await accept(
			oneClick ? { token } : { token, password: form.password, ...(!existing && { name: (form.name || invitation?.name || '').trim(), phone: form.phone }) }
		);
		if ('data' in res && res.data?.token) {
			// A project's invitation opens that project (the proxy follows the remembered project).
			if (res.data.project) rememberProject(res.data.project);
			dispatch(login({ token: res.data.token }));
		}
	};

	if (!loadingInfo && (isError || !invitation))
		return (
			<LoginContainer
				title='This invitation has expired'
				hideSubmit
				isLoading={false}
				handleSubmit={(e: any) => e.preventDefault()}>
				<Text
					fontSize='sm'
					color='fg.muted'
					textAlign='center'>
					The link is invalid, was already used, or is more than 7 days old. Ask for a new one.
				</Text>
			</LoginContainer>
		);

	return (
		<LoginContainer
			title={invitation ? `Join ${invitation.project ? invitation.projects[0] || invitation.organization.name : invitation.organization.name}` : 'Join'}
			subtitle={
				invitation
					? oneClick
						? `You're signed in as ${invitation.email}. ${joinAs[0].toUpperCase()}${joinAs.slice(1)}.`
						: existing
						? `Sign in to accept — ${joinAs}.`
						: `Create your account — ${joinAs}.`
					: undefined
			}
			submitLabel={oneClick ? `Join ${(invitation?.project ? invitation.projects[0] : invitation?.organization.name) || ''}`.trim() : existing ? 'Sign in and join' : 'Create account and join'}
			isLoading={isLoading || loadingInfo}
			handleSubmit={submit}>
			<VInput
				label='Email'
				size='md'
				value={invitation?.email || ''}
				disabled
				readOnly
				name='email'
			/>
			{!existing && (
				<>
					<VInput
						label='Your name'
						isRequired
						size='md'
						autoComplete='name'
						autoFocus
						value={form.name || invitation?.name || ''}
						onChange={set('name')}
						name='name'
					/>
					<VInput
						label='Phone'
						size='md'
						autoComplete='tel'
						value={form.phone}
						onChange={set('phone')}
						name='phone'
					/>
				</>
			)}
			{!oneClick && (
				<VPassword
					label={existing ? 'Your password' : 'Password'}
					isRequired
					size='md'
					autoComplete={existing ? 'current-password' : 'new-password'}
					autoFocus={existing}
					value={form.password}
					onChange={set('password')}
					name='password'
				/>
			)}
			{!existing && (
				<VPassword
					label='Confirm password'
					isRequired
					size='md'
					value={form.confirm}
					onChange={set('confirm')}
					name='confirm'
					helper={mismatch ? 'Passwords don’t match.' : undefined}
				/>
			)}
			{error && (
				<Text
					role='alert'
					fontSize='13px'
					color='red.fg'>
					{(error as any)?.data?.message || 'Something went wrong — try again.'}
				</Text>
			)}
		</LoginContainer>
	);
};

export default TenantAcceptInvitation;
