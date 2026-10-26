'use client';

import { FC } from 'react';
import NextLink from 'next/link';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useGetAnalyticsLiveQuery } from '@/components/library';
import { EmptyState, ErrorState, Panel, TableSkeleton } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import { ago, deviceLine, placeLine, sourceLine, visitorName } from './format';

/**
 * Analytics → Live (docs/multi-tenancy WO-56): who did something on the site
 * in the last 5 minutes and the page they're on; checks again every 15 seconds.
 */
const Live: FC = () => {
	const { data, isLoading, isError, refetch } = useGetAnalyticsLiveQuery(undefined, { pollingInterval: 15_000, skipPollingIfUnfocused: true });
	const visitors = data?.visitors || [];
	return (
		<Panel
			title={
				<Flex
					align='center'
					gap={2}>
					<Box
						boxSize='8px'
						borderRadius='full'
						bg={data?.now ? 'green.solid' : 'fg.subtle'}
					/>
					{data ? `${data.now} on the site now` : 'On the site now'}
				</Flex>
			}
			subtitle='Anyone active in the last 5 minutes — updates every 15 seconds'
			actions={<GuideLink section='live-visitors' />}
			flush>
			{isLoading ? (
				<Box p={4}>
					<TableSkeleton />
				</Box>
			) : isError ? (
				<ErrorState
					message='Couldn’t load who’s on the site.'
					onRetry={refetch}
				/>
			) : !visitors.length ? (
				<EmptyState
					title='Nobody on the site right now'
					description='Visitors show here within a few seconds of opening a page.'
				/>
			) : (
				<Flex direction='column'>
					{visitors.map(v => (
						<Flex
							key={v.visitorId}
							asChild
							gap={3}
							px={4}
							py={3}
							align={{ base: 'flex-start', md: 'center' }}
							direction={{ base: 'column', md: 'row' }}
							borderBottomWidth='1px'
							borderColor='border.muted'
							_last={{ borderBottomWidth: 0 }}
							_hover={{ bg: 'bg.muted' }}>
							<NextLink href={projectHref(`/analytics/visitors/${encodeURIComponent(v.visitorId)}`)}>
								<Box
									flex='1'
									minW={0}>
									<Text
										fontSize='13px'
										fontWeight='500'
										truncate>
										{visitorName(v)}
									</Text>
									<Text
										fontSize='11.5px'
										color='fg.muted'
										truncate>
										{[placeLine(v), deviceLine(v), sourceLine(v.channel, v.source)].filter(Boolean).join(' · ') || v.visitorId}
									</Text>
								</Box>
								<Box
									flex='1'
									minW={0}>
									<Text
										fontSize='13px'
										fontFamily='mono'
										truncate>
										{v.path || '—'}
									</Text>
									{v.title && (
										<Text
											fontSize='11.5px'
											color='fg.muted'
											truncate>
											{v.title}
										</Text>
									)}
								</Box>
								<Text
									fontSize='12px'
									color='fg.muted'
									whiteSpace='nowrap'>
									{ago(v.lastSeen)}
								</Text>
							</NextLink>
						</Flex>
					))}
				</Flex>
			)}
		</Panel>
	);
};

export default Live;
