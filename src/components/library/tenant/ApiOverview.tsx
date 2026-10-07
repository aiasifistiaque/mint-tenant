'use client';

import { FC } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, Flex, Grid, Skeleton, Text } from '@chakra-ui/react';
import { Lock } from 'lucide-react';
import { useGetApiOverviewQuery } from '../store/services/tenantApi';
import { CopyValue, Panel, StatTile, StatusDot, when } from '../cl';
import { BACKEND, projectHref } from '../config/lib/constants/panel';
import GuideLink from './GuideLink';
import { useWorkspace } from './useWorkspace';

/**
 * An API project's home (docs/templates T-09, TD2): its base address, the
 * endpoints that are on, calls in the last day, the latest calls and webhook
 * deliveries — above whatever widgets the dashboard builder adds.
 * Data: GET /api-overview.
 */

const ACTION: Record<string, [string, string]> = {
	list: ['GET', ''],
	get: ['GET', '/:id'],
	create: ['POST', ''],
	update: ['PUT', '/:id'],
	delete: ['DELETE', '/:id'],
};
const TONE: Record<string, string> = { GET: 'green', POST: 'blue', PUT: 'orange', DELETE: 'red' };

const Method: FC<{ m: string }> = ({ m }) => (
	<Badge
		size='sm'
		variant='subtle'
		colorPalette={TONE[m] || 'gray'}
		fontFamily='mono'
		minW='56px'
		justifyContent='center'>
		{m}
	</Badge>
);

const ApiOverview: FC = () => {
	const { project, can } = useWorkspace();
	const { data, isLoading } = useGetApiOverviewQuery(undefined, { pollingInterval: 30000 });
	const base = project ? `${BACKEND.replace(/\/tenant\/api\/?$/, '')}/public/api/${project.publicSlug}` : '';
	if (isLoading || !data) return <Skeleton h='240px' />;
	const builds = can('build');

	return (
		<Flex
			direction='column'
			gap={4}>
			<Panel
				title='Your API'
				subtitle='What your site or app calls'
				actions={<GuideLink section='api' />}>
				<Flex
					direction='column'
					gap={3}>
					<Box>
						<Text
							fontSize='12px'
							color='fg.muted'
							mb={1}>
							Base address
						</Text>
						<CopyValue value={base} />
					</Box>
					<Grid
						templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }}
						gap={3}>
						<StatTile
							label='Endpoints on'
							value={String(data.endpoints.length)}
						/>
						<StatTile
							label='Calls, last day'
							value={data.day.calls.toLocaleString()}
						/>
						<StatTile
							label='Failed calls'
							value={data.day.failed.toLocaleString()}
						/>
						<StatTile
							label='Webhooks on'
							value={`${data.webhooks.active} of ${data.webhooks.total}`}
						/>
					</Grid>
					{builds && (
						<Flex
							gap={2}
							wrap='wrap'>
							<Button
								asChild
								size='xs'
								variant='outline'>
								<NextLink href={projectHref('/public-api')}>Public API and reference</NextLink>
							</Button>
							<Button
								asChild
								size='xs'
								variant='outline'>
								<NextLink href={projectHref('/webhooks')}>Webhooks</NextLink>
							</Button>
						</Flex>
					)}
				</Flex>
			</Panel>

			<Grid
				templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
				gap={4}
				alignItems='start'>
				<Panel
					title='Endpoints'
					subtitle='Switched on in Public API'
					flush>
					{data.endpoints.length ? (
						data.endpoints.map(e => (
							<Box
								key={e.route}
								px={4}
								py={3}
								borderTopWidth='1px'
								borderColor='border.muted'
								_first={{ borderTopWidth: 0 }}>
								<Flex
									align='center'
									gap={2}
									mb={1.5}>
									<Text
										fontSize='13px'
										fontWeight='600'>
										{e.title}
									</Text>
									{e.auth === 'customer' && (
										<Flex
											align='center'
											gap={1}
											fontSize='11.5px'
											color='fg.muted'>
											<Lock size={11} />
											{e.ownerOnly ? 'Customers · own records' : 'Customers'}
										</Flex>
									)}
								</Flex>
								<Flex
									direction='column'
									gap={1}>
									{['list', 'get', 'create', 'update', 'delete']
										.filter(a => e.actions.includes(a))
										.map(a => (
											<Flex
												key={a}
												align='center'
												gap={2}>
												<Method m={ACTION[a][0]} />
												<Text
													fontSize='12px'
													fontFamily='mono'
													truncate>
													/{e.route}
													{ACTION[a][1]}
												</Text>
											</Flex>
										))}
								</Flex>
							</Box>
						))
					) : (
						<Text
							px={4}
							py={3}
							fontSize='12.5px'
							color='fg.muted'>
							No endpoints yet — switch a model’s public API on and its endpoints show here.
						</Text>
					)}
				</Panel>

				<Flex
					direction='column'
					gap={4}>
					<Panel
						title='Recent calls'
						subtitle='The last 20, kept a week'
						flush>
						{data.calls.length ? (
							data.calls.map((c, i) => (
								<Flex
									key={i}
									align='center'
									gap={2}
									px={4}
									py={1.5}
									borderTopWidth='1px'
									borderColor='border.muted'
									_first={{ borderTopWidth: 0 }}>
									<Method m={c.method} />
									<Text
										fontSize='12px'
										fontFamily='mono'
										flex={1}
										truncate>
										{c.path}
									</Text>
									<Text
										fontSize='12px'
										fontFamily='mono'
										color={c.status >= 400 ? 'red.fg' : 'fg.muted'}>
										{c.status}
									</Text>
									<Text
										fontSize='11.5px'
										color='fg.muted'
										whiteSpace='nowrap'
										display={{ base: 'none', md: 'block' }}>
										{when(c.at)}
									</Text>
								</Flex>
							))
						) : (
							<Text
								px={4}
								py={3}
								fontSize='12.5px'
								color='fg.muted'>
								No calls yet. Try one from the reference on the Public API page.
							</Text>
						)}
					</Panel>

					{data.deliveries.length > 0 && (
						<Panel
							title='Latest webhook deliveries'
							flush>
							{data.deliveries.map(d => (
								<Flex
									key={d._id}
									align='center'
									gap={2}
									px={4}
									py={1.5}
									borderTopWidth='1px'
									borderColor='border.muted'
									_first={{ borderTopWidth: 0 }}>
									<StatusDot
										tone={d.pending ? 'pending' : d.ok ? 'running' : 'failed'}
										showLabel={false}
									/>
									<Text
										fontSize='12px'
										fontFamily='mono'
										flex={1}
										truncate>
										{d.route} · {d.event}
									</Text>
									<Text
										fontSize='12px'
										color={d.ok ? 'fg.muted' : d.pending ? 'orange.fg' : 'red.fg'}>
										{d.pending ? 'Retrying' : d.ok ? d.status : d.error || 'Failed'}
									</Text>
									<Text
										fontSize='11.5px'
										color='fg.muted'>
										{when(d.createdAt)}
									</Text>
								</Flex>
							))}
						</Panel>
					)}
				</Flex>
			</Grid>
		</Flex>
	);
};

export default ApiOverview;
