'use client';

import { FC, useState } from 'react';
import { Badge, Box, Flex, Skeleton, Text } from '@chakra-ui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { StatusDot, when } from '@/components/library/cl';
import { useGetWebhookDeliveriesQuery } from '@/components/library/store/services/tenantApi';
import type { WebhookDelivery } from '@/components/library/store/services/tenantApi';

/**
 * A webhook's last 50 deliveries, newest first: what happened, where it came
 * from, how many tries, and — opened — what was sent and what came back.
 */

const SOURCE: Record<WebhookDelivery['source'], string> = { panel: 'From the panel', api: 'From the public API', test: 'A test' };
const EVENT: Record<string, string> = { create: 'Created', update: 'Changed', delete: 'Deleted', test: 'Test' };

const pretty = (raw: string) => {
	try {
		return JSON.stringify(JSON.parse(raw), null, 2);
	} catch {
		return raw;
	}
};

const Pre: FC<{ label: string; children: string }> = ({ label, children }) => (
	<Box>
		<Text
			fontSize='11.5px'
			fontWeight='600'
			color='fg.muted'
			mb={1}>
			{label}
		</Text>
		<Box
			as='pre'
			m={0}
			p={2.5}
			fontSize='11.5px'
			fontFamily='mono'
			bg='bg.subtle'
			borderWidth='1px'
			borderColor='border.muted'
			borderRadius='md'
			whiteSpace='pre-wrap'
			wordBreak='break-all'
			maxH='240px'
			overflowY='auto'>
			{children}
		</Box>
	</Box>
);

const Row: FC<{ d: WebhookDelivery }> = ({ d }) => {
	const [open, setOpen] = useState(false);
	const tone = d.pending ? 'pending' : d.ok ? 'running' : 'failed';
	return (
		<Box
			borderTopWidth='1px'
			borderColor='border.muted'>
			<Flex
				align='center'
				gap={3}
				px={4}
				py={2}
				cursor='pointer'
				_hover={{ bg: 'bg.subtle' }}
				onClick={() => setOpen(o => !o)}>
				<Box color='fg.muted'>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</Box>
				<StatusDot
					tone={tone}
					label={d.pending ? 'Retrying' : d.ok ? 'Delivered' : 'Failed'}
				/>
				<Badge
					size='sm'
					variant='subtle'>
					{EVENT[d.event] || d.event}
				</Badge>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					flex={1}
					truncate>
					{SOURCE[d.source]}
					{d.status ? ` · ${d.status}` : ''}
					{d.attempts > 1 ? ` · ${d.attempts} tries` : ''}
					{!d.ok && d.error ? ` · ${d.error}` : ''}
				</Text>
				<Text
					fontSize='12px'
					color='fg.muted'
					whiteSpace='nowrap'>
					{when(d.createdAt)}
				</Text>
			</Flex>
			{open && (
				<Flex
					direction='column'
					gap={3}
					px={4}
					pb={4}
					pl={{ base: 4, md: '42px' }}>
					<Text
						fontSize='12px'
						color='fg.muted'>
						Delivery <code>{d.delivery}</code> to <code>{d.url}</code>
						{d.durationMs != null ? ` · ${d.durationMs} ms in all` : ''}
					</Text>
					<Pre label='Sent'>{pretty(d.body)}</Pre>
					<Pre label='Answer'>{d.response || d.error || '—'}</Pre>
				</Flex>
			)}
		</Box>
	);
};

const DeliveryLog: FC<{ id: string }> = ({ id }) => {
	const { data, isLoading } = useGetWebhookDeliveriesQuery(id, { pollingInterval: 5000 });
	const list = data?.doc || [];
	if (isLoading)
		return (
			<Box p={4}>
				<Skeleton h='60px' />
			</Box>
		);
	if (!list.length)
		return (
			<Text
				px={4}
				py={3}
				fontSize='12.5px'
				color='fg.muted'
				borderTopWidth='1px'
				borderColor='border.muted'>
				Nothing sent yet. Change a record, or send a test.
			</Text>
		);
	return (
		<Box>
			{list.map(d => (
				<Row
					key={d._id}
					d={d}
				/>
			))}
		</Box>
	);
};

export default DeliveryLog;
