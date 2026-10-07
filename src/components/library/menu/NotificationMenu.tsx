'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Button, Center, Flex, Popover, Portal, Spinner, Text } from '@chakra-ui/react';
import { Bell } from 'lucide-react';
import MenuIconContainer from './MenuIconContainer';
import {
	useGetNotificationsQuery,
	useGetUnreadNotificationCountQuery,
	useMarkAllNotificationsReadMutation,
	useMarkNotificationReadMutation,
} from '../store';
import { when } from '../cl/format';
import { IS_TENANT_PANEL } from '../config/lib/constants/panel';

/**
 * The navbar bell, between search and the user menu. The badge is the unread
 * count, checked every 30 seconds and when the tab regains focus. Clicking it
 * opens a dropdown of the latest notifications: opening one marks it read and
 * goes to what it's about (a record's view page); "View all" goes to
 * /notifications.
 */

const POLL_MS = 30_000;
const LATEST = 8;

const NotificationMenu = ({ iconSize }: { iconSize?: number }) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const { data: count } = useGetUnreadNotificationCountQuery(undefined, {
		pollingInterval: POLL_MS,
		refetchOnFocus: true,
		refetchOnMountOrArgChange: true,
	});
	// Only fetched while the dropdown is open.
	const { data, isFetching, isError } = useGetNotificationsQuery(
		{ limit: LATEST },
		{ skip: !open, refetchOnMountOrArgChange: true }
	);
	const [markRead] = useMarkNotificationReadMutation();
	const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

	const unread = count?.unread || 0;
	const list: any[] = data?.doc || [];

	const openOne = async (n: any) => {
		setOpen(false);
		if (!n.read) markRead({ id: n._id }).catch(() => {});
		if (n.href) router.push(n.href);
	};

	return (
		<Popover.Root
			open={open}
			onOpenChange={e => setOpen(e.open)}
			positioning={{ placement: 'bottom-end', gutter: 8 }}
			lazyMount
			unmountOnExit>
			{/* Styled the same as the user menu's icon (SelfMenu), which wraps its trigger the same way. */}
			<MenuIconContainer
				asChild
				position='relative'>
				<Popover.Trigger
					aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
					title='Notifications'>
					<Center>
						<Bell
							size={iconSize || 16}
							strokeWidth={1.75}
						/>
					</Center>
					{unread > 0 && (
						<Box
							position='absolute'
							top='-4px'
							right='-4px'
							minW='16px'
							h='16px'
							px='4px'
							borderRadius='full'
							bg='red.500'
							color='white'
							fontSize='10px'
							fontWeight='700'
							lineHeight='16px'
							textAlign='center'
							pointerEvents='none'>
							{unread > 99 ? '99+' : unread}
						</Box>
					)}
				</Popover.Trigger>
			</MenuIconContainer>
			<Portal>
				<Popover.Positioner>
					<Popover.Content
						w={{ base: 'calc(100vw - 32px)', sm: '380px' }}
						maxW='380px'
						p={0}
						overflow='hidden'>
						<Flex
							align='center'
							justify='space-between'
							px={4}
							py={3}
							borderBottomWidth='1px'
							borderColor='border.muted'>
							<Text
								fontSize='sm'
								fontWeight='600'>
								Notifications
								{unread > 0 && (
									<Text
										as='span'
										color='fg.muted'
										fontWeight='400'>
										{' '}
										· {unread} unread
									</Text>
								)}
							</Text>
							<Button
								size='2xs'
								variant='ghost'
								disabled={!unread}
								loading={markingAll}
								onClick={() => markAll()}>
								Mark all as read
							</Button>
						</Flex>

						<Box
							maxH='420px'
							overflowY='auto'>
							{isFetching && !list.length ? (
								<Center py={8}>
									<Spinner size='sm' />
								</Center>
							) : isError ? (
								<Text
									fontSize='sm'
									color='fg.muted'
									px={4}
									py={6}
									textAlign='center'>
									Couldn’t load notifications.
								</Text>
							) : !list.length ? (
								<Box
									px={4}
									py={8}
									textAlign='center'>
									<Text
										fontSize='sm'
										fontWeight='500'>
										You’re all caught up
									</Text>
									<Text
										fontSize='xs'
										color='fg.muted'>
										{IS_TENANT_PANEL ? 'Invitations, records shared with you and what your site sends in show up here.' : 'When someone gives you access to a record, it shows up here.'}
									</Text>
								</Box>
							) : (
								list.map((n, i) => (
									<Flex
										key={n._id}
										as='button'
										w='full'
										textAlign='left'
										gap={3}
										px={4}
										py={2.5}
										borderTopWidth={i ? '1px' : 0}
										borderColor='border.muted'
										bg={n.read ? 'transparent' : 'bg.subtle'}
										_hover={{ bg: 'bg.muted' }}
										onClick={() => openOne(n)}>
										<Box
											flex='1'
											minW={0}>
											<Text
												fontSize='sm'
												fontWeight={n.read ? '400' : '600'}
												lineClamp={2}>
												{n.title}
											</Text>
											<Text
												fontSize='xs'
												color='fg.muted'>
												{when(n.createdAt)}
											</Text>
										</Box>
										{!n.read && (
											<Box
												mt='7px'
												boxSize='8px'
												borderRadius='full'
												bg='blue.500'
												flexShrink={0}
												aria-label='Unread'
											/>
										)}
									</Flex>
								))
							)}
						</Box>

						<Box
							borderTopWidth='1px'
							borderColor='border.muted'>
							<Link
								href='/notifications'
								onClick={() => setOpen(false)}>
								<Text
									fontSize='sm'
									textAlign='center'
									py={2.5}
									color='fg.muted'
									_hover={{ color: 'fg', bg: 'bg.subtle' }}>
									View all notifications
								</Text>
							</Link>
						</Box>
					</Popover.Content>
				</Popover.Positioner>
			</Portal>
		</Popover.Root>
	);
};

export default NotificationMenu;
