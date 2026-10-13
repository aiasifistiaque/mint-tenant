'use client';

import { FC, FormEvent, ReactNode, useEffect, useState } from 'react';
import { Button, Field, Flex, Input, Skeleton, Text, Textarea } from '@chakra-ui/react';
import { Layout, useGetTenantProjectQuery, useUpdateProjectMutation } from '@/components/library';
import { EmptyState, Panel } from '@/components/library/cl';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import BusinessFields, { Business, EMPTY_BUSINESS } from '@/components/library/tenant/BusinessDetails';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';

/**
 * A project's settings (tenant panel, inside a project): its name and
 * description, and its business details — logo, address, phone… — that its
 * invoices and receipts print (backend docs/pdf-templates D14). A new project
 * starts with the organization's; these are the project's own. Needs
 * `manage-projects` to change.
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
			title='Project'
			subtitle={`${project.type === 'website' ? 'Website' : project.type === 'api' ? 'API' : 'App'} · ${project.models ?? 0} models`}
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
