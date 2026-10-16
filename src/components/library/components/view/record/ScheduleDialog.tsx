'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { Box, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { CalendarClock, X } from 'lucide-react';
import { PromptDialog } from '../../../modals';
import { useScheduleRecordMutation } from '../../../store';
import type { RecordSchedule } from '../../../store/services/commonApi';
import { toaster } from '@/components/ui/toaster';
import GuideLink from '../../../tenant/GuideLink';

/**
 * Publish at / take off at on a drafts record (backend docs/cms D7, CMS-11):
 * two times in the person's own time zone, either one cleared with its ×.
 * The server checks them (future, take-off after publish, something to take
 * off) and applies them within a minute of the time — the draft as it is then.
 */

/** An ISO time as a datetime-local value, in this browser's time zone. */
const toLocal = (iso?: string | null) => {
	if (!iso) return '';
	const d = new Date(iso);
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
/** A datetime-local value (local time) as ISO, or null when empty. */
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

/** "20 Oct, 09:00" — short, in the reader's own time. */
export const whenText = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const ZONE = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';

const Field: FC<{ label: string; hint: ReactNode; value: string; onChange: (v: string) => void; min: string }> = ({ label, hint, value, onChange, min }) => (
	<Box>
		<Text
			fontSize='13px'
			fontWeight='600'
			mb={1}>
			{label}
		</Text>
		<Flex
			gap={2}
			align='center'>
			<Input
				size='sm'
				type='datetime-local'
				value={value}
				min={min}
				onChange={e => onChange(e.target.value)}
			/>
			<IconButton
				size='sm'
				variant='ghost'
				aria-label={`Clear ${label.toLowerCase()}`}
				title='Clear'
				disabled={!value}
				onClick={() => onChange('')}>
				<X size={14} />
			</IconButton>
		</Flex>
		<Text
			fontSize='12px'
			color='fg.muted'
			mt={1}>
			{hint}
		</Text>
	</Box>
);

const ScheduleDialog: FC<{
	open: boolean;
	onClose: () => void;
	path: string;
	id: string;
	schedule: RecordSchedule | null;
	/** Whether it's on the site now — a take-off needs it live, or a publish before it. */
	live: boolean;
}> = ({ open, onClose, path, id, schedule, live }) => {
	const [save, { isLoading }] = useScheduleRecordMutation();
	const [publishAt, setPublishAt] = useState('');
	const [unpublishAt, setUnpublishAt] = useState('');
	const [problem, setProblem] = useState('');

	// Each opening starts from what's saved.
	useEffect(() => {
		if (!open) return;
		setPublishAt(toLocal(schedule?.publishAt));
		setUnpublishAt(toLocal(schedule?.unpublishAt));
		setProblem('');
	}, [open, schedule?.publishAt, schedule?.unpublishAt]);

	const now = toLocal(new Date().toISOString());
	const order = publishAt && unpublishAt && unpublishAt <= publishAt ? 'Take off has to come after publish.' : '';
	const nothingLive = unpublishAt && !publishAt && !live ? 'It isn’t on the site yet — set a time to publish it too.' : '';
	const changed = publishAt !== toLocal(schedule?.publishAt) || unpublishAt !== toLocal(schedule?.unpublishAt);

	const go = async () => {
		const res: any = await save({ path, id, publishAt: fromLocal(publishAt), unpublishAt: fromLocal(unpublishAt) });
		if ('error' in res) return setProblem(res.error?.data?.message || 'Didn’t work');
		const s: RecordSchedule = res.data.schedule;
		toaster.create({
			type: 'success',
			title: s.publishAt || s.unpublishAt ? 'Scheduled' : 'Schedule cleared',
			description: [s.publishAt && `Publishes ${whenText(s.publishAt)}`, s.unpublishAt && `comes off ${whenText(s.unpublishAt)}`].filter(Boolean).join(', ') || undefined,
		});
		onClose();
	};

	return (
		<PromptDialog
			open={open}
			onClose={onClose}
			tone='default'
			icon={<CalendarClock size={18} />}
			title='Schedule'
			description='Pick when it goes live, when it comes off, or both. It happens within a minute of the time, and you’re told when it has.'
			confirmLabel='Save schedule'
			loading={isLoading}
			disabled={!changed || !!order || !!nothingLive}
			onConfirm={go}
			aside={<GuideLink section='models-schedule' />}>
			<Flex
				direction='column'
				gap={4}>
				<Field
					label='Publish at'
					value={publishAt}
					onChange={setPublishAt}
					min={now}
					hint={live ? 'Puts the changes made by then live — what’s published now stays until then.' : 'The draft as it is then goes live.'}
				/>
				<Field
					label='Take off at'
					value={unpublishAt}
					onChange={setUnpublishAt}
					min={publishAt || now}
					hint='It leaves your site and API then. The draft stays here.'
				/>
				<Text
					fontSize='12px'
					color={order || nothingLive || problem ? 'red.fg' : 'fg.muted'}>
					{order || nothingLive || problem || `Times are in your time zone${ZONE ? ` (${ZONE})` : ''}.`}
				</Text>
			</Flex>
		</PromptDialog>
	);
};

export default ScheduleDialog;
