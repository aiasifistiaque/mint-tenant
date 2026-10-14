'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { CheckCircle2, FlaskConical, XCircle } from 'lucide-react';
import { PromptDialog } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import RecordPicker from '@/app/builder/_components/RecordPicker';
import { useTestAutomationMutation } from '@/components/library/store/services/tenantApi';
import type { Automation, AutomationEvent } from '@/components/library/store/services/tenantApi';
import { EVENT_WORD, Page } from './model';

/**
 * "Run on a record" (docs/automations A10): pick a record of the page and see
 * what each action would do — who'd be notified or emailed, what would be
 * updated or added. Nothing is sent or written.
 */
const TestDialog: FC<{ automation: Automation | null; page?: Page; onClose: () => void }> = ({ automation, page, onClose }) => {
	const [record, setRecord] = useState('');
	const [event, setEvent] = useState<AutomationEvent>('update');
	const [test, { data, isLoading, error, reset }] = useTestAutomationMutation();
	useEffect(() => {
		setRecord('');
		setEvent(automation?.on?.[0] || 'update');
		reset();
	}, [automation?._id]);
	if (!automation) return null;
	return (
		<PromptDialog
			open
			onClose={onClose}
			tone='default'
			icon={<FlaskConical size={18} />}
			title={`Try “${automation.name}”`}
			description='Pick a record and see what each action would do. Nothing is sent, changed or added.'
			confirmLabel='Try it'
			loading={isLoading}
			disabled={!record}
			onConfirm={() => test({ id: automation._id, record, event })}
			aside={<GuideLink section='automation-try' />}>
			<Flex
				direction='column'
				gap={3}
				mt={1}>
				<Box>
					<Text
						fontSize='12.5px'
						fontWeight='600'
						mb={1}>
						{page ? `A ${page.noun}` : 'A record'}
					</Text>
					<RecordPicker
						route={automation.route}
						value={record}
						onChange={v => {
							reset();
							setRecord(String(v || ''));
						}}
					/>
				</Box>
				{automation.on.length > 1 && (
					<Box>
						<Text
							fontSize='12.5px'
							fontWeight='600'
							mb={1}>
							As if it was
						</Text>
						<Dropdown
							size='sm'
							value={event}
							aria-label='Event'
							items={automation.on.map(e => ({ value: e, label: EVENT_WORD[e] }))}
							onChange={v => setEvent(v as AutomationEvent)}
						/>
					</Box>
				)}
				{error && (
					<Text
						role='alert'
						fontSize='13px'
						color='red.fg'>
						{(error as any)?.data?.message || 'Couldn’t try it — try again.'}
					</Text>
				)}
				{data && (
					<Flex
						direction='column'
						gap={2}
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						p={3}>
						<Text
							fontSize='13px'
							color={data.conditions ? 'fg' : 'orange.fg'}>
							{data.conditions
								? `The conditions hold for ${data.record.name || 'this record'} — it would run:`
								: `The conditions don’t hold for ${data.record.name || 'this record'}, so it wouldn’t run. If they did:`}
						</Text>
						{data.steps.map((s, i) => (
							<Flex
								key={i}
								gap={2}
								align='flex-start'
								fontSize='13px'>
								{s.ok ? <CheckCircle2 size={15} color='var(--chakra-colors-green-fg)' /> : <XCircle size={15} color='var(--chakra-colors-red-fg)' />}
								<Text>{s.detail}</Text>
							</Flex>
						))}
						{data.error && (
							<Text
								fontSize='12.5px'
								color='red.fg'>
								{data.error}
							</Text>
						)}
					</Flex>
				)}
			</Flex>
		</PromptDialog>
	);
};

export default TestDialog;
