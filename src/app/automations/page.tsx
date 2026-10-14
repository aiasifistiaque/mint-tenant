'use client';

import { FC, useMemo, useState } from 'react';
import { Box, Button, Flex, IconButton, Skeleton, Switch, Tabs, Text } from '@chakra-ui/react';
import { FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react';
import { Layout, PromptDialog } from '@/components/library';
import { ConsoleTabs, EmptyState, Panel, PageHeader, StatusDot } from '@/components/library/cl';
import { ago } from '@/components/library/modals/CreateModal/CreateModal';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useGetBuiltModelsQuery } from '@/components/library/store/services/builderApi';
import {
	useCreateAutomationMutation,
	useDeleteAutomationMutation,
	useGetAutomationQuery,
	useGetAutomationsQuery,
	useGetProjectPeopleQuery,
	useToggleAutomationMutation,
	useUpdateAutomationMutation,
} from '@/components/library/store/services/tenantApi';
import type { Automation, AutomationInput } from '@/components/library/store/services/tenantApi';
import AutomationDialog from './_components/AutomationDialog';
import TestDialog from './_components/TestDialog';
import RunsList from './_components/RunsList';
import { Page, pagesOf, sentence } from './_components/model';

/**
 * A project's automations (tenant panel; backend docs/automations): "when a
 * record is created or changed, and it matches these conditions, then send an
 * email, call a webhook, update or create a record, or notify someone." Each
 * one on its own switch, with its sentence and how its runs went; Runs lists
 * what happened. For roles with Build.
 */

const message = (e: any, fallback: string) => e?.data?.message || fallback;

const Row: FC<{ a: Automation; pages: Page[]; onEdit: () => void; onTry: () => void; onDelete: () => void }> = ({ a, pages, onEdit, onTry, onDelete }) => {
	const [toggle, toggling] = useToggleAutomationMutation();
	const s = a.stats || { runs: 0, failures: 0 };
	const last = s.lastStatus;
	return (
		<Flex
			align='center'
			gap={4}
			px={4}
			py={3.5}
			borderTopWidth='1px'
			borderColor='border.muted'
			_first={{ borderTopWidth: 0 }}>
			<Box
				flex={1}
				minW={0}>
				<Text
					fontSize='14px'
					fontWeight='600'
					truncate>
					{a.name}
				</Text>
				<Text
					fontSize='12.5px'
					color='fg.muted'>
					{sentence(a, pages)}
				</Text>
				<Flex
					mt={1}
					align='center'
					gap={2}
					fontSize='12px'
					color='fg.muted'>
					{s.lastRunAt ? (
						<>
							<StatusDot
								tone={last === 'success' ? 'running' : last === 'failed' ? 'failed' : 'pending'}
								label={last === 'success' ? 'Last run done' : last === 'failed' ? 'Last run failed' : 'Last run skipped'}
							/>
							<Text>
								{ago(s.lastRunAt)} · {s.runs} run{s.runs === 1 ? '' : 's'}
								{s.failures ? `, ${s.failures} failed` : ''}
							</Text>
						</>
					) : (
						<Text>Hasn’t run yet</Text>
					)}
				</Flex>
				{last !== 'success' && s.lastError && (
					<Text
						fontSize='12px'
						color={last === 'failed' ? 'red.fg' : 'orange.fg'}
						mt={0.5}>
						{s.lastError}
					</Text>
				)}
			</Box>
			<Switch.Root
				size='sm'
				checked={a.enabled}
				disabled={toggling.isLoading}
				onCheckedChange={e =>
					toggle({ id: a._id, enabled: !!e.checked })
						.unwrap()
						.catch(err => toaster.create({ type: 'error', title: 'Not changed', description: message(err, 'Try again') }))
				}>
				<Switch.HiddenInput aria-label={`${a.name} on`} />
				<Switch.Control />
				<Switch.Label fontSize='12.5px'>{a.enabled ? 'On' : 'Off'}</Switch.Label>
			</Switch.Root>
			<Flex gap={0.5}>
				<IconButton
					aria-label='Try it on a record'
					title='Try it on a record'
					size='xs'
					variant='ghost'
					onClick={onTry}>
					<FlaskConical size={14} />
				</IconButton>
				<IconButton
					aria-label='Edit'
					size='xs'
					variant='ghost'
					onClick={onEdit}>
					<Pencil size={14} />
				</IconButton>
				<IconButton
					aria-label='Delete'
					size='xs'
					variant='ghost'
					onClick={onDelete}>
					<Trash2 size={14} />
				</IconButton>
			</Flex>
		</Flex>
	);
};

export default function AutomationsPage() {
	const { project, can, isLoading: loadingSelf } = useWorkspace();
	const allowed = IS_TENANT_PANEL && can('build');
	const { data, isLoading } = useGetAutomationsQuery(undefined, { skip: !allowed || !project });
	const { data: models } = useGetBuiltModelsQuery(undefined, { skip: !allowed || !project });
	const { data: peopleData } = useGetProjectPeopleQuery(undefined, { skip: !allowed || !project });
	const pages = useMemo(() => pagesOf(models?.doc), [models]);
	const people = useMemo(() => (peopleData?.doc || []).map(p => ({ _id: p.user._id, name: p.user.name, email: p.user.email })), [peopleData]);

	const [tab, setTab] = useState('list');
	const [editing, setEditing] = useState<'new' | string | null>(null);
	const [trying, setTrying] = useState<Automation | null>(null);
	const [deleting, setDeleting] = useState<Automation | null>(null);
	const [saveError, setSaveError] = useState<{ message: string; on?: string } | null>(null);
	const { data: full } = useGetAutomationQuery(editing && editing !== 'new' ? editing : '', { skip: !editing || editing === 'new' });
	const [create, creating] = useCreateAutomationMutation();
	const [update, updating] = useUpdateAutomationMutation();
	const [remove, removing] = useDeleteAutomationMutation();
	const list = data?.doc || [];

	const close = () => {
		setEditing(null);
		setSaveError(null);
	};
	const save = async (input: AutomationInput) => {
		setSaveError(null);
		const res = editing === 'new' ? await create(input) : await update({ id: editing!, ...input });
		if ('error' in res) {
			const e: any = res.error;
			return setSaveError({ message: e?.data?.message || 'Couldn’t save — try again.', on: e?.data?.on });
		}
		toaster.create({ type: 'success', title: editing === 'new' ? 'Automation added' : 'Saved' });
		close();
	};

	return (
		<Layout
			title='Automations'
			path='automations'>
			<Flex
				direction='column'
				gap={5}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '#', title: 'Automations' },
					]}
					title='Automations'
					meta='When a record is created, changed or deleted: notify people, send an email, call a webhook, update or create a record.'
					actions={
						allowed && (
							<>
								<GuideLink section='automations' />
								<Button
									size='sm'
									disabled={!pages.length}
									title={pages.length ? undefined : 'Make a model first'}
									onClick={() => setEditing('new')}>
									<Plus size={14} />
									New automation
								</Button>
							</>
						)
					}
				/>
				{!loadingSelf && !allowed ? (
					<EmptyState
						title='For people who build'
						description='Roles with Build make and change a project’s automations.'
					/>
				) : (
					<ConsoleTabs
						value={tab}
						onChange={setTab}
						tabs={[
							{ value: 'list', label: 'Automations' },
							{ value: 'runs', label: 'Runs' },
						]}>
						<Tabs.Content value='list'>
							{isLoading ? (
								<Skeleton h='160px' />
							) : list.length ? (
								<Panel flush>
									{list.map(a => (
										<Row
											key={a._id}
											a={a}
											pages={pages}
											onEdit={() => setEditing(a._id)}
											onTry={() => setTrying(a)}
											onDelete={() => setDeleting(a)}
										/>
									))}
								</Panel>
							) : (
								<EmptyState
									title='No automations yet'
									description='Tell the team when a deal is won, email a customer when their order ships, add a task for every new client — without anyone doing it by hand.'
									action={
										pages.length ? (
											<Button
												size='sm'
												onClick={() => setEditing('new')}>
												<Plus size={14} />
												New automation
											</Button>
										) : undefined
									}
								/>
							)}
						</Tabs.Content>
						<Tabs.Content value='runs'>
							<RunsList
								pages={pages}
								automations={list.map(a => ({ _id: a._id, name: a.name }))}
							/>
						</Tabs.Content>
					</ConsoleTabs>
				)}
			</Flex>
			<AutomationDialog
				open={!!editing && (editing === 'new' || !!full)}
				onClose={close}
				automation={editing === 'new' ? null : full}
				pages={pages}
				people={people}
				saving={creating.isLoading || updating.isLoading}
				error={saveError}
				onEdit={() => saveError && setSaveError(null)}
				onSave={save}
			/>
			<TestDialog
				automation={trying}
				page={pages.find(p => p.route === trying?.route)}
				onClose={() => setTrying(null)}
			/>
			<PromptDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={async () => {
					const res = await remove(deleting!._id);
					if ('data' in res) setDeleting(null);
				}}
				title={`Delete “${deleting?.name}”?`}
				description='It stops running, and its runs are deleted too. This can’t be undone — turn it off instead to keep it.'
				loading={removing.isLoading}
				confirmLabel='Delete'
			/>
		</Layout>
	);
}
