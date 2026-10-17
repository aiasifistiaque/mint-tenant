'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import dynamic from 'next/dynamic';
import { Box, Button, Center, Flex, Grid, HoverCard, Image, Portal, Spinner, Text } from '@chakra-ui/react';
import { ArrowUpRight, PanelRight } from 'lucide-react';
import { useGetByIdQuery } from '../../../../store';
import { IS_TENANT_PANEL } from '../../../../config/lib/constants/panel';
import { useWorkspace } from '../../../../tenant/useWorkspace';
import { cardOf, fetchPathOf, idOf, labelOf, viewHrefOf, viewRouteOf } from './linked';

// Loaded on first use: the drawer draws a whole record page, which draws these chips again.
const RecordDrawer = dynamic(() => import('../../record/RecordDrawer'), { ssr: false });

/**
 * One linked record, as a chip naming it. Hovering shows a card of the
 * record — fetched when the card first opens — with a button to its view
 * page; clicking the chip goes there too. Quick view opens the record in the
 * side drawer, for those allowed to view that model.
 *
 * Record pages draw these for every linked field; tables only for a field
 * whose settings turn on `linkPreview`. Clicks stay inside the chip, card and
 * drawer, so a table row under them doesn't open too.
 *
 * `item` is the record as it came back (populated `{_id, name, …}`) or just
 * its id, in which case the chip looks the name up. `label` overrides the
 * name, e.g. the value a view field already shows.
 */

type Props = {
	/** The route the record lives under (a field's `model`), e.g. `clients`. */
	route: string;
	item: any;
	label?: string;
};

const initials = (text: string) =>
	text
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(w => w[0]?.toUpperCase())
		.join('') || '?';

const RecordLink = ({ route, item, label }: Props) => {
	const [open, setOpen] = useState(false);
	const [drawer, setDrawer] = useState(false);
	const id = idOf(item);
	const known = label || labelOf(item);
	const { can } = useWorkspace({ skip: !IS_TENANT_PANEL });

	const { data, isFetching, isError, error } = useGetByIdQuery(
		{ path: fetchPathOf(route), id },
		// Looked up straight away only when there's nothing to call it by.
		{ skip: !id || (!open && !!known) }
	);

	if (!id) return null;

	const record = { ...(item && typeof item === 'object' ? item : {}), ...(data && typeof data === 'object' ? data : {}) };
	const found = known || labelOf(data);
	const name = found || (isFetching ? 'Loading…' : 'Unknown');
	const card = cardOf(record);
	const gone = isError && (error as any)?.status === 404;
	const href = viewHrefOf(route, id);
	// Not for admins (read through /access-users): their own page is the way in.
	// The super admin panel has no per-model permissions here; the record's
	// own fetch failing with 403 hides it there.
	const ownRoute = fetchPathOf(route) === route && viewRouteOf(route) === route;
	const forbidden = isError && (error as any)?.status === 403;
	const quickView = ownRoute && !gone && !forbidden && (IS_TENANT_PANEL ? can(`view-${route}`) : true);

	return (
		<Box
			as='span'
			display='inline-flex'
			maxW='full'
			onClick={e => e.stopPropagation()}>
			<HoverCard.Root
				open={open}
				openDelay={250}
				closeDelay={150}
				lazyMount
				unmountOnExit
				positioning={{ placement: 'top-start', gutter: 6 }}
				onOpenChange={e => setOpen(e.open)}>
				<HoverCard.Trigger asChild>
					<NextLink
						href={href}
						onClick={e => e.stopPropagation()}>
						<Flex
							as='span'
							display='inline-flex'
							align='center'
							gap={1}
							maxW='min(220px, 100%)'
							h='20px'
							pl='2px'
							pr={1.5}
							borderRadius='full'
							borderWidth='1px'
							borderColor='border'
							bg='bg.subtle'
							fontSize='11px'
							fontWeight='500'
							color='fg'
							cursor='pointer'
							transition='background 0.15s, border-color 0.15s'
							_hover={{ bg: 'bg.muted', borderColor: 'border.emphasized' }}>
							<Center
								as='span'
								boxSize='15px'
								flexShrink={0}
								borderRadius='full'
								bg='bg.emphasized'
								fontSize='8px'
								fontWeight='600'
								color='fg.muted'>
								{found ? initials(found) : '?'}
							</Center>
							<Text
								as='span'
								// The chip's size, not the table cell's.
								fontSize='inherit'
								truncate>
								{name}
							</Text>
						</Flex>
					</NextLink>
				</HoverCard.Trigger>
				<Portal>
					{/* Above dialogs (1400): the chip also shows in view modals. */}
					<HoverCard.Positioner css={{ '--z-index': '1500' }}>
						<HoverCard.Content
							w='280px'
							p={0}
							overflow='hidden'>
							<Flex
								gap={3}
								align='center'
								p={3}>
								{card.image ? (
									<Image
										src={card.image}
										alt=''
										boxSize='40px'
										borderRadius='md'
										objectFit='cover'
										flexShrink={0}
									/>
								) : (
									<Center
										boxSize='40px'
										flexShrink={0}
										borderRadius='full'
										bg='bg.muted'
										fontSize='sm'
										fontWeight='600'
										color='fg.muted'>
										{found ? initials(found) : '?'}
									</Center>
								)}
								<Box minW={0}>
									<Text
										fontSize='sm'
										fontWeight='600'
										truncate>
										{card.title || name}
									</Text>
									{card.subtitle && (
										<Text
											fontSize='xs'
											color='fg.muted'
											truncate>
											{card.subtitle}
										</Text>
									)}
								</Box>
							</Flex>

							{isFetching && !card.details.length ? (
								<Center pb={3}>
									<Spinner size='xs' />
								</Center>
							) : gone ? (
								<Text
									px={3}
									pb={3}
									fontSize='xs'
									color='fg.muted'>
									This record no longer exists.
								</Text>
							) : (
								!!card.details.length && (
									<Grid
										templateColumns='auto minmax(0, 1fr)'
										columnGap={3}
										rowGap={1}
										px={3}
										pb={3}
										fontSize='xs'>
										{card.details.map(d => (
											<Box
												key={d.label}
												display='contents'>
												<Text color='fg.muted'>{d.label}</Text>
												<Text truncate>{d.value}</Text>
											</Box>
										))}
									</Grid>
								)
							)}

							{!gone && (
								<Flex
									justify='flex-end'
									gap={2}
									px={3}
									py={2}
									borderTopWidth='1px'
									borderColor='border.muted'>
									{quickView && (
										<Button
											size='xs'
											variant='ghost'
											// The card closes first: open, the focus left in it counts as a
										// click outside the drawer, which shut again straight away.
										onClick={() => {
											setOpen(false);
											setTimeout(() => setDrawer(true), 200);
										}}>
											<PanelRight size={14} />
											Quick view
										</Button>
									)}
									<Button
										asChild
										size='xs'
										variant='outline'>
										<NextLink href={href}>
											View
											<ArrowUpRight size={14} />
										</NextLink>
									</Button>
								</Flex>
							)}
						</HoverCard.Content>
					</HoverCard.Positioner>
				</Portal>
			</HoverCard.Root>
			{drawer && (
				<RecordDrawer
					open={drawer}
					onClose={() => setDrawer(false)}
					path={route}
					id={id}
				/>
			)}
		</Box>
	);
};

export default RecordLink;
