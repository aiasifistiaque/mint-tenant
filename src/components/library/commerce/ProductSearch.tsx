'use client';

import { FC } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Flex, Grid, Skeleton, Table, Text } from '@chakra-ui/react';
import { EmptyState, Panel } from '../cl';
import GuideLink from '../tenant/GuideLink';
import { projectHref } from '../config/lib/constants/panel';
import { useGetCommerceSettingsQuery, useGetProductSearchInsightQuery } from '../store/services/commerceApi';
import { help } from './sections';
import { RulesTouching } from './SearchRules';

/**
 * A product's Search tab (backend docs/search SI-14): the last 30 days of the store's website search for it — how often
 * it was shown, opened, added to the bag and ordered from a search, the searches that led to it most, and the
 * keywords the search knows it by.
 */
const ProductSearch: FC<{ id: string }> = ({ id }) => {
	const { data, isLoading, error } = useGetProductSearchInsightQuery(id);
	const { data: store } = useGetCommerceSettingsQuery();
	const currency = (store?.answers as any)?.store?.currency || '';
	if (isLoading) return <Skeleton h='200px' />;
	if (error || !data) return <EmptyState title='Couldn’t load search' description={(error as any)?.data?.message || 'Try again in a moment.'} />;
	const tiles: [string, string, string?][] = [
		['Shown in searches', data.shown.toLocaleString(), 'Searches whose first page had it'],
		['Opened from search', data.clicks.toLocaleString()],
		['Added to the bag', data.carts.toLocaleString()],
		[
			`Sold from search · ${data.units.toLocaleString()} ${data.units === 1 ? 'unit' : 'units'}`,
			`${currency ? `${currency} ` : ''}${Math.round(data.revenue).toLocaleString()}`,
			'Units, and their total, on orders placed within a day of the search',
		],
	];
	return (
		<Panel
			id='store-product-search'
			title='Website search, last 30 days'
			subtitle={data.indexed ? 'How shoppers found this product by searching your website.' : 'Not in the search yet — it’s added when it’s active, or after the next rebuild.'}
			actions={<GuideLink section='store-product-search' />}>
			<Box p={4}>
				<Grid templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }} gap={3} mb={4}>
					{tiles.map(([label, value, title]) => (
						<Box key={label} title={title}>
							<Text fontSize='20px' fontWeight='600' lineHeight='1.2'>
								{value}
							</Text>
							<Text fontSize='12px' color='fg.muted'>
								{label}
							</Text>
						</Box>
					))}
				</Grid>
				<Text fontSize='13px' fontWeight='600' mb={1}>
					Searches that led here
				</Text>
				{!data.queries.length ? (
					<Text {...help}>None yet: nobody has opened it from a search in the last 30 days.</Text>
				) : (
					<Table.Root size='sm' variant='line' mb={4}>
						<Table.Header>
							<Table.Row bg='transparent'>
								<Table.ColumnHeader>Search</Table.ColumnHeader>
								<Table.ColumnHeader textAlign='end'>Opened</Table.ColumnHeader>
								<Table.ColumnHeader textAlign='end'>To the bag</Table.ColumnHeader>
								<Table.ColumnHeader textAlign='end'>Orders</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{data.queries.map(q => (
								<Table.Row key={q.nq} bg='transparent'>
									<Table.Cell>
										<NextLink href={projectHref(`/store/settings/search?try=${encodeURIComponent(q.q)}#store-search-try`)}>
											<Text as='span' fontWeight='500' _hover={{ textDecoration: 'underline' }}>
												{q.q}
											</Text>
										</NextLink>
									</Table.Cell>
									<Table.Cell textAlign='end'>{q.clicks}</Table.Cell>
									<Table.Cell textAlign='end'>{q.carts}</Table.Cell>
									<Table.Cell textAlign='end'>{q.orders}</Table.Cell>
								</Table.Row>
							))}
						</Table.Body>
					</Table.Root>
				)}
				<Text fontSize='13px' fontWeight='600' mt={data.queries.length ? 0 : 4} mb={1}>
					Its search words
				</Text>
				{data.keywords.length ? (
					<Flex gap={1} wrap='wrap'>
						{data.keywords.map(k => (
							<Badge key={k} size='sm' variant='surface'>
								{k}
							</Badge>
						))}
					</Flex>
				) : (
					<Text {...help}>None. Words shoppers use that aren’t in its name or description go in the product’s Search words field.</Text>
				)}
				<Box mt={4}>
					<RulesTouching product={id} />
				</Box>
			</Box>
		</Panel>
	);
};

export default ProductSearch;
