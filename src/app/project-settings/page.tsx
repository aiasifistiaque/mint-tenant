'use client';

import { FC, FormEvent, ReactNode, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Field, Flex, Grid, Input, Link, Skeleton, Text, Textarea } from '@chakra-ui/react';
import { Layout, useGetTenantProjectQuery, useUpdateProjectMutation } from '@/components/library';
import { CopyValue, EmptyState, Panel, date } from '@/components/library/cl';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import BusinessFields, { Business, EMPTY_BUSINESS } from '@/components/library/tenant/BusinessDetails';
import { API_ORIGIN, IS_TENANT_PANEL, projectHref } from '@/components/library/config/lib/constants/panel';
import type { TenantProject } from '@/components/library/store/services/tenantApi';

/**
 * A project's settings (tenant panel, inside a project): what it is — kind,
 * address, who made it, its members (WO-48) — its name and description, and
 * its business details — logo, address, phone… — that its invoices and
 * receipts print (backend docs/pdf-templates D14). A new project starts with
 * the organization's; these are the project's own. Everyone in the project
 * sees them; `manage-projects` changes them.
 */

const errorText = (e: any) => e?.data?.message || 'Something went wrong — try again.';
const labelCss: any = { fontSize: '13px', fontWeight: '600', m: 0 };

/** Save, with what came of it. */
const SaveRow: FC<{ saving: boolean; error: any; saved: boolean; savedText?: ReactNode; disabled?: boolean }> = ({ saving, error, saved, savedText = 'Saved', disabled }) => (
	<Flex
		align='center'
		justify='flex-end'
		gap={3}>
		{error && (
			<Text
				fontSize='13px'
				color='red.fg'>
				{errorText(error)}
			</Text>
		)}
		{saved && (
			<Text
				fontSize='13px'
				color='fg.muted'>
				{savedText}
			</Text>
		)}
		<Button
			type='submit'
			size='sm'
			loading={saving}
			disabled={disabled}>
			Save
		</Button>
	</Flex>
);

const KIND: Record<string, string> = { app: 'App', website: 'Website', api: 'API' };

/** One line of About: a label, and what it is. */
const Fact: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
	<>
		<Text
			fontSize='13px'
			color='fg.muted'>
			{label}
		</Text>
		<Box
			fontSize='13px'
			minW={0}>
			{children}
		</Box>
	</>
);

/** What the project is, read-only (WO-48): kind, addresses, who made it and when, members, models, media, template. */
const About: FC<{ project: TenantProject }> = ({ project: p }) => {
	const origin = typeof window === 'undefined' ? '' : window.location.origin;
	const api = `${API_ORIGIN}/public/api/${p.publicSlug}`;
	const link = (href: string, text: ReactNode) => (
		<Link
			asChild
			color='fg'
			textDecoration='underline'
			textUnderlineOffset='3px'>
			<NextLink href={projectHref(href)}>{text}</NextLink>
		</Link>
	);
	return (
		<Panel
			title='About this project'
			subtitle={p.organizationName ? `In ${p.organizationName}` : undefined}
			actions={<GuideLink section='project-settings' />}>
			<Grid
				templateColumns={{ base: '1fr', sm: '160px 1fr' }}
				columnGap={4}
				rowGap={{ base: 1, sm: 3 }}
				alignItems='center'>
				<Fact label='Kind'>{KIND[p.type] || 'App'}{p.isActive ? '' : ' · archived'}</Fact>
				<Fact label='Address'>
					<CopyValue value={`${origin}/${p.publicSlug}`} />
				</Fact>
				<Fact label='Public API'>
					<CopyValue value={api} />
				</Fact>
				{p.type === 'website' && (
					<Fact label='Domains'>{p.domains?.length ? p.domains.join(', ') : <Text color='fg.muted'>None yet — add them in Site setup</Text>}</Fact>
				)}
				<Fact label='Members'>{link('/project-people', `${p.people ?? '—'} ${p.people === 1 ? 'person opens' : 'people open'} it`)}</Fact>
				<Fact label='Models'>{link('/model-builder', `${p.models ?? 0} model${p.models === 1 ? '' : 's'}`)}</Fact>
				<Fact label='Media library'>{p.mediaScope === 'organization' ? 'Shared with the organization' : 'Its own'}</Fact>
				{p.fromTemplate && (
					<Fact label='Built from'>
						{p.fromTemplate.name}
						{p.fromTemplate.version ? ` (version ${p.fromTemplate.version})` : ''}
					</Fact>
				)}
				<Fact label='Created'>
					{p.createdAt ? date(p.createdAt) : '—'}
					{p.createdBy?.name ? ` by ${p.createdBy.name}` : ''}
				</Fact>
				{p.updatedAt && <Fact label='Last changed'>{date(p.updatedAt)}</Fact>}
			</Grid>
		</Panel>
	);
};

const General: FC<{ id: string; editable: boolean }> = ({ id, editable }) => {
	const { data: project } = useGetTenantProjectQuery(id);
	const [save, { isLoading, error, isSuccess, reset }] = useUpdateProjectMutation();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	useEffect(() => {
		if (!project) return;
		setName(project.name);
		setDescription(project.description || '');
	}, [project?._id, project?.name, project?.description]);

	if (!project)
		return (
			<Panel title='Project'>
				<Skeleton h='120px' />
			</Panel>
		);

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		await save({ id, name: name.trim(), description: description.trim() });
	};
	return (
		<Panel
			title='Name and description'
			actions={<GuideLink section='project-settings' />}>
			<form onSubmit={submit}>
				<fieldset disabled={!editable}>
					<Flex
						direction='column'
						gap={4}>
						<Field.Root required>
							<Field.Label {...labelCss}>Name</Field.Label>
							<Input
								size='sm'
								maxLength={80}
								value={name}
								onChange={e => {
									reset();
									setName(e.target.value);
								}}
							/>
						</Field.Root>
						<Field.Root>
							<Field.Label {...labelCss}>Description</Field.Label>
							<Textarea
								size='sm'
								rows={2}
								maxLength={500}
								value={description}
								onChange={e => {
									reset();
									setDescription(e.target.value);
								}}
							/>
						</Field.Root>
						{editable && (
							<SaveRow
								saving={isLoading}
								error={error}
								saved={isSuccess}
								disabled={!name.trim()}
							/>
						)}
					</Flex>
				</fieldset>
			</form>
		</Panel>
	);
};

const BusinessPanel: FC<{ id: string; editable: boolean }> = ({ id, editable }) => {
	const { data: project } = useGetTenantProjectQuery(id);
	const [save, { isLoading, error, isSuccess, reset }] = useUpdateProjectMutation();
	const [b, setB] = useState<Business>(EMPTY_BUSINESS);
	useEffect(() => {
		if (project?.business) setB({ ...EMPTY_BUSINESS, ...project.business });
	}, [project?._id, JSON.stringify(project?.business)]);

	if (!project) return null;
	return (
		<Panel
			title='Business details'
			subtitle='Your logo, address and contacts — what this project’s invoices, bills and receipts print.'
			actions={<GuideLink section='project-settings' />}>
			<form
				onSubmit={async e => {
					e.preventDefault();
					await save({ id, business: b });
				}}>
				<Flex
					direction='column'
					gap={4}>
					<BusinessFields
						value={b}
						disabled={!editable}
						onChange={v => {
							reset();
							setB(v);
						}}
					/>
					{editable && (
						<SaveRow
							saving={isLoading}
							error={error}
							saved={isSuccess}
							savedText='Saved — every PDF prints these now'
						/>
					)}
				</Flex>
			</form>
		</Panel>
	);
};

const AboutPanel: FC<{ id: string }> = ({ id }) => {
	const { data } = useGetTenantProjectQuery(id);
	return data ? <About project={data} /> : <Skeleton h='200px' />;
};

export default function ProjectSettingsPage() {
	const { project, can, isLoading } = useWorkspace();
	const editable = can('manage-projects');
	return (
		<Layout
			title='Project settings'
			path='project-settings'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				{!IS_TENANT_PANEL || (!isLoading && !project) ? (
					<EmptyState
						title='Open a project first'
						description='Each project keeps its own settings.'
					/>
				) : !project ? (
					<Skeleton h='240px' />
				) : (
					<>
						<AboutPanel id={project._id} />
						<General
							id={project._id}
							editable={editable}
						/>
						<BusinessPanel
							id={project._id}
							editable={editable}
						/>
					</>
				)}
			</Flex>
		</Layout>
	);
}
