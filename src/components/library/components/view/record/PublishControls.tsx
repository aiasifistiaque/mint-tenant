'use client';

import { FC, useState } from 'react';
import { Badge, Button, Flex, Text } from '@chakra-ui/react';
import { Send, Undo2, EyeOff, CalendarClock } from 'lucide-react';
import { PromptDialog } from '../../../modals';
import { usePublishRecordActionMutation } from '../../../store';
import { toaster } from '@/components/ui/toaster';
import { ago } from '../../../modals/CreateModal/CreateModal';
import { useWorkspace } from '../../../tenant/useWorkspace';
import type { RecordSchedule } from '../../../store/services/commonApi';
import ScheduleDialog, { whenText } from './ScheduleDialog';

/**
 * Drafts and publishing on a record's page (backend docs/cms D5): where it
 * stands — Draft (never published), Published, or Changes not published —
 * and the buttons that move it: Publish, Discard changes, Take off, and
 * Schedule — publish at / take off at (CMS-11), its label the next time set. They need
 * the Publish right (D11, `publish-<route>`); without it an editor's changes
 * wait for someone who has it.
 */

type Status = 'draft' | 'published' | 'modified';

const LABEL: Record<Status, { text: string; palette: string }> = {
	draft: { text: 'Draft', palette: 'gray' },
	published: { text: 'Published', palette: 'green' },
	modified: { text: 'Changes not published', palette: 'orange' },
};

export const PublishBadge: FC<{ status: Status; publishedAt?: string | null }> = ({ status, publishedAt }) => (
	<Badge
		size='sm'
		variant='subtle'
		colorPalette={LABEL[status].palette}
		title={publishedAt ? `Last published ${ago(publishedAt)}` : 'Not on the site or API yet'}>
		{LABEL[status].text}
	</Badge>
);

/** What's set next: "Publishes 20 Oct, 09:00" — or null. */
export const nextScheduled = (s?: RecordSchedule | null) => {
	if (!s?.publishAt && !s?.unpublishAt) return null;
	const pub = s.publishAt && (!s.unpublishAt || s.publishAt <= s.unpublishAt);
	return pub ? `Publishes ${whenText(s.publishAt!)}` : `Comes off ${whenText(s.unpublishAt!)}`;
};

const PublishControls: FC<{ path: string; id: string; status: Status; canEdit: boolean; schedule?: RecordSchedule | null }> = ({ path, id, status, canEdit, schedule }) => {
	const [run, { isLoading }] = usePublishRecordActionMutation();
	const [confirm, setConfirm] = useState<'unpublish' | 'discard' | null>(null);
	const [scheduling, setScheduling] = useState(false);
	const next = nextScheduled(schedule);
	const { can, self } = useWorkspace();
	if (!canEdit) return null;
	if (self && !can(`publish-${path}`))
		return status === 'published' ? null : (
			<Text
				fontSize='12.5px'
				color='fg.muted'>
				Someone who can publish puts it live
			</Text>
		);

	const go = async (action: 'publish' | 'unpublish' | 'discard') => {
		const res: any = await run({ path, id, action });
		if ('error' in res) return toaster.create({ type: 'error', title: 'Didn’t work', description: res.error?.data?.message });
		toaster.create({
			type: 'success',
			title: action === 'publish' ? 'Published' : action === 'unpublish' ? 'Taken off the site' : 'Changes discarded',
			description: action === 'publish' ? 'It’s live on your site and API.' : undefined,
		});
		setConfirm(null);
	};

	return (
		<Flex
			gap={2}
			align='center'>
			{status === 'modified' && (
				<Button
					size='sm'
					variant='ghost'
					onClick={() => setConfirm('discard')}>
					<Undo2 size={14} />
					Discard changes
				</Button>
			)}
			{status !== 'draft' && (
				<Button
					size='sm'
					variant='ghost'
					onClick={() => setConfirm('unpublish')}>
					<EyeOff size={14} />
					Take off
				</Button>
			)}
			<Button
				size='sm'
				variant={next ? 'subtle' : 'ghost'}
				colorPalette={next ? 'blue' : undefined}
				title={next ? 'Change or clear the schedule' : 'Publish or take it off at a time'}
				onClick={() => setScheduling(true)}>
				<CalendarClock size={14} />
				{next || 'Schedule'}
			</Button>
			{status !== 'published' && (
				<Button
					size='sm'
					colorPalette='green'
					loading={isLoading && !confirm}
					onClick={() => go('publish')}>
					<Send size={14} />
					Publish
				</Button>
			)}
			<PromptDialog
				open={!!confirm}
				onClose={() => setConfirm(null)}
				onConfirm={() => confirm && go(confirm)}
				title={confirm === 'discard' ? 'Discard the changes?' : 'Take it off the site?'}
				description={
					confirm === 'discard'
						? 'The record goes back to what’s published. The changes since can’t be brought back.'
						: 'It leaves your site and API until you publish it again. Your draft stays here.'
				}
				loading={isLoading}
				confirmLabel={confirm === 'discard' ? 'Discard' : 'Take off'}
			/>
			<ScheduleDialog
				open={scheduling}
				onClose={() => setScheduling(false)}
				path={path}
				id={id}
				schedule={schedule || null}
				live={status !== 'draft'}
			/>
		</Flex>
	);
};

export default PublishControls;
