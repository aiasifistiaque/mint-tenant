'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Flex, IconButton, Text } from '@chakra-ui/react';
import { Bell, Check, Inbox, KeyRound, MailPlus, Trash2, UserCheck, UserCog } from 'lucide-react';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import {
	Layout,
	useDeleteNotificationMutation,
	useGetNotificationsQuery,
	useMarkAllNotificationsReadMutation,
	useMarkNotificationReadMutation,
} from '@/components/library';
import { EmptyState, ErrorState, PageHeader, Panel, TableSkeleton, when } from '@/components/library/cl';

/**
 * The signed-in person's notifications, newest first — an admin's, or in the
 * tenant panel a tenant user's from every organization (WO-37). Opening one
 * marks it read and goes where it points (a record's page, Members, Home…).
 * The navbar bell links here.
 */

const PAGE_SIZE = 20;

const ICONS: Record<string, any> = {
	'access-granted': KeyRound,
	invitation: MailPlus,
	'member-joined': UserCheck,
	'member-changed': UserCog,
	'site-record': Inbox,
};

const NotificationsPage = () => {
	const router = useRouter();
	const [unreadOnly, setUnreadOnly] = useState(false);
	const [page, setPage] = useState(1);
	const { data, isLoading, isFetching, isError, error, refetch } = useGetNotificationsQuery(
		{ page, limit: PAGE_SIZE, unread: unreadOnly },
		{ refetchOnMountOrArgChange: true, refetchOnFocus: true }
	);
	const [markRead] = useMarkNotificationReadMutation();
	const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
	const [remove] = useDeleteNotificationMutation();

	const list: any[] = data?.doc || [];
	const unread = data?.unread || 0;
	const totalPages = data?.totalPages || 1;

	const open = async (n: any) => {
		if (!n.read) await markRead({ id: n._id }).catch(() => {});
		if (n.href) router.push(n.href);
	};

	return (
		<Layout
			title='Notifications'
			path='notifications'>
			<Flex
				direction='column'
				gap={5}
				pb={10}
				maxW='860px'>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '/notifications', title: 'Notifications' },
					]}
					title='Notifications'
					meta={unread ? `${unread} unread` : 'All caught up'}
					actions={
						<>
							<Button
								size='sm'
								variant={unreadOnly ? 'solid' : 'outline'}
								onClick={() => {
									setUnreadOnly(u => !u);
									setPage(1);
								}}>
								{unreadOnly ? 'Showing unread' : 'Unread only'}
							</Button>
							<Button
								size='sm'
								variant='outline'
								disabled={!unread}
								loading={markingAll}
								onClick={() => markAll()}>
								<Check size={14} />
								Mark all as read
							</Button>
						</>
					}
				/>

				<Panel flush>
					{isLoading ? (
						<Box p={4}>
							<TableSkeleton
								rows={5}
								cols={1}
							/>
						</Box>
					) : isError ? (
						<Box p={4}>
							<ErrorState
								error={error}
								onRetry={refetch}
							/>
						</Box>
					) : list.length === 0 ? (
						<Box p={4}>
							<EmptyState
								title={unreadOnly ? 'Nothing unread' : 'No notifications yet'}
								description={IS_TENANT_PANEL ? 'Invitations, records shared with you and what your site sends in show up here.' : 'When someone gives you access to a record, it shows up here.'}
							/>
						</Box>
					) : (
						list.map((n, i) => {
							const Icon = ICONS[n.type] || Bell;
							return (
								<Flex
									key={n._id}
									role='button'
									tabIndex={0}
									cursor='pointer'
									onKeyDown={e => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											open(n);
										}
									}}
									w='full'
									textAlign='left'
									align='flex-start'
									gap={3}
									px={4}
									py={3}
									borderTopWidth={i ? '1px' : 0}
									borderColor='border.muted'
									bg={n.read ? 'transparent' : 'bg.subtle'}
									_hover={{ bg: 'bg.muted' }}
									opacity={isFetching ? 0.7 : 1}
									onClick={() => open(n)}>
									<Flex
										mt='2px'
										boxSize='28px'
										flexShrink={0}
										align='center'
										justify='center'
										borderRadius='full'
										borderWidth='1px'
										borderColor='border'
										color='fg.muted'>
										<Icon size={14} />
									</Flex>
									<Box
										flex='1'
										minW={0}>
										<Text
											fontSize='sm'
											fontWeight={n.read ? '400' : '600'}>
											{n.title}
										</Text>
										<Text
											fontSize='xs'
											color='fg.muted'>
											{[n.message, n.organizationName, when(n.createdAt)].filter(Boolean).join(' · ')}
										</Text>
									</Box>
									{!n.read && (
										<Box
											mt='8px'
											boxSize='8px'
											borderRadius='full'
											bg='blue.500'
											flexShrink={0}
											aria-label='Unread'
										/>
									)}
									<IconButton
										size='xs'
										variant='ghost'
										aria-label='Delete notification'
										title='Delete'
										onKeyDown={e => e.stopPropagation()}
										onClick={e => {
											e.stopPropagation();
											remove(n._id);
										}}>
										<Trash2 size={14} />
									</IconButton>
								</Flex>
							);
						})
					)}
				</Panel>

				{totalPages > 1 && (
					<Flex
						justify='space-between'
						align='center'>
						<Button
							size='sm'
							variant='outline'
							disabled={page <= 1}
							onClick={() => setPage(p => p - 1)}>
							Newer
						</Button>
						<Text
							fontSize='xs'
							color='fg.muted'>
							Page {page} of {totalPages}
						</Text>
						<Button
							size='sm'
							variant='outline'
							disabled={page >= totalPages}
							onClick={() => setPage(p => p + 1)}>
							Older
						</Button>
					</Flex>
				)}
			</Flex>
		</Layout>
	);
};

export default NotificationsPage;
