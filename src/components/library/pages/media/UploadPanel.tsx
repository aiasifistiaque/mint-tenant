'use client';

import { FC, useState } from 'react';
import { Box, Button, Flex, IconButton, Progress, Text } from '@chakra-ui/react';
import { Check, ChevronDown, ChevronUp, RotateCcw, X, AlertCircle } from 'lucide-react';
import { uploadQueue, useUploadQueue } from './uploadQueue';

/**
 * Drive-style upload tray, bottom-right. Shows every upload in the queue with its
 * own progress; failed ones can be retried, running ones canceled. Hidden while
 * the queue is empty; "Clear" drops the finished rows.
 */
const UploadPanel: FC = () => {
	const items = useUploadQueue();
	const [collapsed, setCollapsed] = useState(false);
	if (!items.length) return null;

	const running = items.filter(i => i.status === 'uploading' || i.status === 'queued').length;
	const failed = items.filter(i => i.status === 'error').length;
	const done = items.filter(i => i.status === 'done').length;
	const title = running
		? `Uploading ${running} item${running === 1 ? '' : 's'}`
		: failed
			? `${failed} upload${failed === 1 ? '' : 's'} failed`
			: `${done} upload${done === 1 ? '' : 's'} complete`;

	return (
		<Box
			position='fixed'
			bottom={{ base: 3, md: 5 }}
			right={{ base: 3, md: 5 }}
			left={{ base: 3, md: 'auto' }}
			w={{ md: '360px' }}
			zIndex='popover'
			bg='bg.panel'
			borderWidth='1px'
			borderColor='border'
			borderRadius='lg'
			boxShadow='lg'
			overflow='hidden'>
			<Flex
				align='center'
				gap={2}
				px={4}
				py={2.5}
				bg='bg.subtle'
				borderBottomWidth={collapsed ? 0 : '1px'}
				borderColor='border'>
				<Text
					flex={1}
					fontSize='sm'
					fontWeight='600'>
					{title}
				</Text>
				{failed > 0 && !running && (
					<Button
						size='xs'
						variant='ghost'
						onClick={() => uploadQueue.retryFailed()}>
						Retry all
					</Button>
				)}
				{running > 0 ? (
					<Button
						size='xs'
						variant='ghost'
						onClick={() => uploadQueue.cancelAll()}>
						Cancel
					</Button>
				) : (
					<Button
						size='xs'
						variant='ghost'
						onClick={() => uploadQueue.clear()}>
						Clear
					</Button>
				)}
				<IconButton
					aria-label={collapsed ? 'Expand uploads' : 'Collapse uploads'}
					size='xs'
					variant='ghost'
					onClick={() => setCollapsed(c => !c)}>
					{collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</IconButton>
			</Flex>

			{!collapsed && (
				<Box
					maxH='280px'
					overflowY='auto'>
					{items.map(item => (
						<Flex
							key={item.id}
							align='center'
							gap={3}
							px={4}
							py={2}
							borderBottomWidth='1px'
							borderColor='border.muted'
							_last={{ borderBottomWidth: 0 }}>
							<Box
								flex={1}
								minW={0}>
								<Text
									fontSize='sm'
									truncate
									title={[...item.segments, item.name].join(' / ')}>
									{item.segments.length > 0 && (
										<Text
											as='span'
											color='fg.muted'>
											{item.segments.join(' / ')} /{' '}
										</Text>
									)}
									{item.name}
								</Text>
								{item.status === 'uploading' && (
									<Progress.Root
										mt={1}
										size='xs'
										value={Math.round(item.progress * 100)}>
										<Progress.Track>
											<Progress.Range />
										</Progress.Track>
									</Progress.Root>
								)}
								{item.status === 'error' && (
									<Text
										fontSize='xs'
										color='fg.error'
										truncate>
										{item.error}
									</Text>
								)}
								{item.status === 'canceled' && (
									<Text
										fontSize='xs'
										color='fg.muted'>
										Canceled
									</Text>
								)}
								{item.status === 'queued' && (
									<Text
										fontSize='xs'
										color='fg.muted'>
										Waiting…
									</Text>
								)}
							</Box>
							{item.status === 'done' && (
								<Box color='green.solid'>
									<Check size={16} />
								</Box>
							)}
							{item.status === 'error' && (
								<>
									<Box color='fg.error'>
										<AlertCircle size={16} />
									</Box>
									<IconButton
										aria-label='Retry'
										size='xs'
										variant='ghost'
										onClick={() => uploadQueue.retry(item.id)}>
										<RotateCcw size={14} />
									</IconButton>
								</>
							)}
							{(item.status === 'uploading' || item.status === 'queued') && (
								<IconButton
									aria-label='Cancel upload'
									size='xs'
									variant='ghost'
									onClick={() => uploadQueue.cancel(item.id)}>
									<X size={14} />
								</IconButton>
							)}
						</Flex>
					))}
				</Box>
			)}
		</Box>
	);
};

export default UploadPanel;
