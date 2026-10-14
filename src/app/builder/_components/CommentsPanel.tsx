'use client';

import { FC } from 'react';
import { Box, Flex, Switch, Text } from '@chakra-ui/react';
import { MessagesSquare } from 'lucide-react';
import { Panel } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import { ToneTitle } from './areas';

/**
 * A page's comments and @mentions (WO-50; tenant projects): two switches on
 * its Fields & rules tab, kept in the page config as `route.comments` and
 * `route.mentions` — on unless turned off — and taking effect when published.
 * The comments API refuses a page that has them off.
 */

const Toggle: FC<{ label: string; hint: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }> = ({ label, hint, checked, disabled, onChange }) => (
	<Flex
		align='flex-start'
		justify='space-between'
		gap={4}>
		<Box minW={0}>
			<Text
				fontSize='13.5px'
				fontWeight='600'>
				{label}
			</Text>
			<Text
				fontSize='12.5px'
				color='fg.muted'>
				{hint}
			</Text>
		</Box>
		<Switch.Root
			checked={checked}
			disabled={disabled}
			aria-label={label}
			onCheckedChange={d => onChange(d.checked)}>
			<Switch.HiddenInput />
			<Switch.Control />
		</Switch.Root>
	</Flex>
);

const CommentsPanel: FC<{ value?: { comments?: boolean; mentions?: boolean }; disabled?: boolean; onChange: (patch: { comments?: boolean; mentions?: boolean }) => void }> = ({
	value,
	disabled,
	onChange,
}) => {
	const comments = value?.comments !== false;
	const mentions = comments && value?.mentions !== false;
	return (
		<Panel
			title={
				<ToneTitle
					icon={MessagesSquare}
					palette='blue'>
					Comments and mentions
				</ToneTitle>
			}
			subtitle='How people talk about one of these records — on its Comments tab. Takes effect once published.'
			actions={<GuideLink section='project-comments' />}>
			<Flex
				direction='column'
				gap={4}>
				<Toggle
					label='Comments'
					hint='A Comments tab on each record’s page. Turning it off keeps the comments already written, read-only.'
					checked={comments}
					disabled={disabled}
					onChange={v => onChange({ comments: v })}
				/>
				<Toggle
					label='@mentions'
					hint='Type @ in a comment to tell someone — they get a notification. Only people who can see the record can be mentioned: on a private record its owner and the people it’s shared with; on an Only me record no one.'
					checked={mentions}
					disabled={disabled || !comments}
					onChange={v => onChange({ mentions: v })}
				/>
			</Flex>
		</Panel>
	);
};

export default CommentsPanel;
