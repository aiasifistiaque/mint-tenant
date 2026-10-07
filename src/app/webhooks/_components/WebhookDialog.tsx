'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { Box, Checkbox, Flex, Input, Text } from '@chakra-ui/react';
import { Send } from 'lucide-react';
import { PromptDialog } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { Webhook, WebhookEvent, WebhookInput } from '@/components/library/store/services/tenantApi';

/**
 * Adding or changing a webhook: which model, on which events, where to, and a
 * note on what the other side does with it. The secret isn't here — it's
 * made by the server and shown once.
 */

export const EVENT_LABEL: Record<WebhookEvent, string> = { create: 'Created', update: 'Changed', delete: 'Deleted' };
const EVENTS: WebhookEvent[] = ['create', 'update', 'delete'];

const Field: FC<{ label: string; hint?: string; children: ReactNode }> = ({ label, hint, children }) => (
	<Box>
		<Text
			fontSize='13px'
			fontWeight='600'
			mb={1}>
			{label}
		</Text>
		{hint && (
			<Text
				fontSize='12px'
				color='fg.muted'
				mb={1.5}>
				{hint}
			</Text>
		)}
		{children}
	</Box>
);

const WebhookDialog: FC<{
	open: boolean;
	onClose: () => void;
	/** The webhook being changed; none to add one. */
	hook?: Webhook | null;
	models: { route: string; title: string }[];
	loading?: boolean;
	error?: string;
	onSave: (input: WebhookInput) => void;
}> = ({ open, onClose, hook, models, loading, error, onSave }) => {
	const [route, setRoute] = useState('');
	const [events, setEvents] = useState<WebhookEvent[]>(EVENTS);
	const [url, setUrl] = useState('');
	const [note, setNote] = useState('');
	useEffect(() => {
		if (!open) return;
		setRoute(hook?.route || models[0]?.route || '');
		setEvents(hook?.events || EVENTS);
		setUrl(hook?.url || '');
		setNote(hook?.note || '');
	}, [open, hook?._id]);

	const looksLikeUrl = /^https?:\/\/\S+$/.test(url.trim());
	return (
		<PromptDialog
			open={open}
			onClose={onClose}
			tone='default'
			icon={<Send size={18} />}
			title={hook ? 'Change the webhook' : 'Add a webhook'}
			description='When a record of the model is created, changed or deleted — in this panel or through the public API — it’s sent to the address, signed with the webhook’s secret.'
			confirmLabel={hook ? 'Save' : 'Add the webhook'}
			loading={loading}
			disabled={!route || !events.length || (!!url.trim() && !looksLikeUrl)}
			onConfirm={() => onSave({ route, events, url: url.trim(), note: note.trim() })}
			aside={<GuideLink section='webhooks' />}>
			<Flex
				direction='column'
				gap={4}
				mt={1}>
				<Field
					label='Model'
					hint='Its records are what’s sent.'>
					<Dropdown
						size='sm'
						value={route}
						onChange={setRoute}
						placeholder='Pick a model'
						items={models.map(m => ({ value: m.route, label: m.title }))}
					/>
				</Field>
				<Field
					label='Send it when a record is'
					hint='Each change sends one request.'>
					<Flex gap={4}>
						{EVENTS.map(ev => (
							<Checkbox.Root
								key={ev}
								size='sm'
								checked={events.includes(ev)}
								onCheckedChange={e => setEvents(list => EVENTS.filter(x => (x === ev ? !!e.checked : list.includes(x))))}>
								<Checkbox.HiddenInput />
								<Checkbox.Control />
								<Checkbox.Label fontSize='13px'>{EVENT_LABEL[ev]}</Checkbox.Label>
							</Checkbox.Root>
						))}
					</Flex>
				</Field>
				<Field
					label='Address'
					hint='Where your server listens, starting with https://. Leave it empty to set it later — the webhook stays off until then.'>
					<Input
						size='sm'
						value={url}
						placeholder='https://example.com/hooks/mint'
						fontFamily='mono'
						onChange={e => setUrl(e.target.value)}
					/>
					{!!url.trim() && !looksLikeUrl && (
						<Text
							fontSize='12px'
							color='red.fg'
							mt={1}>
							Give the whole address, starting with https://
						</Text>
					)}
				</Field>
				<Field
					label='Note'
					hint='What the other side does with it — for whoever looks after this later.'>
					<Input
						size='sm'
						value={note}
						maxLength={300}
						placeholder='Tells the warehouse to pack the order'
						onChange={e => setNote(e.target.value)}
					/>
				</Field>
				{error && (
					<Text
						fontSize='12.5px'
						color='red.fg'>
						{error}
					</Text>
				)}
			</Flex>
		</PromptDialog>
	);
};

export default WebhookDialog;
