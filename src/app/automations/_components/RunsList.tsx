'use client';

import { FC, useState } from 'react';
import NextLink from 'next/link';
import { Box, Flex, Link, Skeleton, Text } from '@chakra-ui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Dropdown, EmptyState, Panel, StatusDot, when } from '@/components/library/cl';
import { ago } from '@/components/library/modals/CreateModal/CreateModal';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import GuideLink from '@/components/library/tenant/GuideLink';
import { useGetAutomationRunsQuery } from '@/components/library/store/services/tenantApi';
import type { AutomationRun } from '@/components/library/store/services/tenantApi';
import { ACTION_LABEL, EVENT_WORD, Page } from './model';

/**
 * Recent runs (docs/automations): which automation ran on which record, and
 * each action's result — or why it failed or was skipped. Kept 30 days.
 */

const TONE: Record<AutomationRun['status'], 'running' | 'failed' | 'pending'> = { success: 'running', failed: 'failed', skipped: 'pending' };
const STATUS_WORD: Record<AutomationRun['status'], string> = { success: 'Done', failed: 'Failed', skipped: 'Skipped' };

const RunRow: FC<{ r: AutomationRun; pages: Page[] }> = ({ r, pages }) => {
	const [open, setOpen] = useState(r.status === 'failed');
	const page = pages.find(p => p.route === r.route);
	const recordText = r.recordName || page?.noun || 'a record';
	return (
		<Box
			px={4}
			py={3}
			borderTopWidth='1px'
			borderColor='border.muted'
			_first={{ borderTopWidth: 0 }}>
			<Flex
				align='center'
				gap={3}
				cursor='pointer'
				onClick={() => setOpen(o => !o)}>
				{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
				<StatusDot
					tone={TONE[r.status]}
					label={STATUS_WORD[r.status]}
				/>
				<Box
					flex={1}
					minW={0}>
					<Text
						fontSize='13.5px'
						fontWeight='600'
						truncate>
						{r.name}
					</Text>
					<Text
						fontSize='12.5px'
						color='fg.muted'
						truncate>
						{page?.noun || r.route}{' '}
						{r.record && r.event !== 'delete' ? (
							<Link
								asChild
								textDecoration='underline'
								onClick={e => e.stopPropagation()}>
								<NextLink href={projectHref(`/${r.route}/${r.record}`)}>{recordText}</NextLink>
							</Link>
						) : (
							recordText
						)}{' '}
						{EVENT_WORD[r.event]}
						{r.actorName ? ` by ${r.actorName}` : ''}
						{r.depth > 1 ? ` · started by another automation (step ${r.depth})` : ''}
					</Text>
				</Box>
				<Text
					fontSize='12px'
					color='fg.muted'
					title={when(r.createdAt)}
					flexShrink={0}>
					{ago(r.createdAt)}
				</Text>
			</Flex>
			{open && (
				<Flex
					direction='column'
					gap={1.5}
					mt={2.5}
					pl='54px'>
					{r.steps.map((s, i) => (
						<Text
							key={i}
							fontSize='12.5px'
							color={s.ok ? 'fg' : 'red.fg'}>
							{i + 1}. {ACTION_LABEL[s.type as keyof typeof ACTION_LABEL] || s.type} — {s.detail}
						</Text>
					))}
					{r.error && !r.steps.some(s => !s.ok) && (
						<Text
							fontSize='12.5px'
							color={r.status === 'skipped' ? 'orange.fg' : 'red.fg'}>
							{r.error}
						</Text>
					)}
				</Flex>
			)}
		</Box>
	);
};

const RunsList: FC<{ pages: Page[]; automation?: string; automations: { _id: string; name: string }[] }> = ({ pages, automations, automation: fixed }) => {
	const [automation, setAutomation] = useState(fixed || '');
	const [status, setStatus] = useState('');
	const { data, isLoading } = useGetAutomationRunsQuery({ automation: automation || undefined, status: status || undefined, limit: 100 }, { pollingInterval: 15000 });
	const runs = data?.doc || [];
	return (
		<Panel
			flush
			title='Runs'
			subtitle='The last 30 days, newest first. Open one to see each action’s result.'
			actions={
				<Flex
					align='center'
					gap={2}>
					<Dropdown
						size='xs'
						w='180px'
						value={automation}
						aria-label='Automation'
						items={[{ value: '', label: 'Every automation' }, ...automations.map(a => ({ value: a._id, label: a.name }))]}
						onChange={setAutomation}
					/>
					<Dropdown
						size='xs'
						w='120px'
						value={status}
						aria-label='Result'
						items={[
							{ value: '', label: 'Any result' },
							{ value: 'success', label: 'Done' },
							{ value: 'failed', label: 'Failed' },
							{ value: 'skipped', label: 'Skipped' },
						]}
						onChange={setStatus}
					/>
					<GuideLink section='automation-runs' />
				</Flex>
			}>
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
			) : runs.length ? (
				runs.map(r => (
					<RunRow
						key={r._id}
						r={r}
						pages={pages}
					/>
				))
			) : (
				<Box p={4}>
					<EmptyState
						title='No runs yet'
						description='When a record starts an automation, its run shows here.'
					/>
				</Box>
			)}
		</Panel>
	);
};

export default RunsList;
