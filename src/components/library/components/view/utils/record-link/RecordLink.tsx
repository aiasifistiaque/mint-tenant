'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Center, Flex, Grid, HoverCard, Image, Portal, Spinner, Text } from '@chakra-ui/react';
import { ArrowUpRight } from 'lucide-react';
import { useGetByIdQuery } from '../../../../store';
import { cardOf, fetchPathOf, idOf, labelOf, viewHrefOf } from './linked';

/**
 * One linked record, as a chip naming it. Hovering shows a card of the
 * record — fetched when the card first opens — with a button to its view
 * page; clicking the chip goes there too.
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
	const id = idOf(item);
	const known = label || labelOf(item);

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

	return (
		<HoverCard.Root
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
						gap={1.5}
						maxW='240px'
						h='24px'
						pl='3px'
						pr={2}
						borderRadius='full'
						borderWidth='1px'
						borderColor='border'
						bg='bg.subtle'
						fontSize='12px'
						fontWeight='500'
						color='fg'
						cursor='pointer'
						transition='background 0.15s, border-color 0.15s'
						_hover={{ bg: 'bg.muted', borderColor: 'border.emphasized' }}>
						<Center
							as='span'
							boxSize='18px'
							flexShrink={0}
							borderRadius='full'
							bg='bg.emphasized'
							fontSize='9px'
							fontWeight='600'
							color='fg.muted'>
							{found ? initials(found) : '?'}
						</Center>
						<Text
							as='span'
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
								px={3}
								py={2}
								borderTopWidth='1px'
								borderColor='border.muted'>
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
	);
};

export default RecordLink;
