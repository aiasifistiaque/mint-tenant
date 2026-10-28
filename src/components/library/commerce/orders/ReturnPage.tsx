'use client';

import { FC, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Flex, Grid, Table, Text, Textarea } from '@chakra-ui/react';
import { DetailRow, DetailSkeleton, EmptyState, ErrorState, PageHeader, Panel, dateTime } from '../../cl';
import { PromptDialog } from '../..';
import { projectHref } from '../../config/lib/constants/panel';
import { toaster } from '@/components/ui/toaster';
import { useGetStoreReturnQuery, useMoveStoreReturnMutation } from '../../store/services/commerceApi';
import type { CommerceView, StoreReturnStatus } from '../../store/services/commerceApi';
import GuideLink from '../../tenant/GuideLink';
import { moneyFor } from '../pos/receipt';
import { RETURN_NEXT, ReturnBadge, showValue, storeRoutes } from './common';

/**
 * A return's own page (backend docs/ecommerce EC-09): what came back from which
 * order, why and in what condition, the refund due and paid, the stock it put
 * back — and its status flow. Refunding is the returns engine's (EC-08).
 */

const STEPS: StoreReturnStatus[] = ['requested', 'approved', 'received', 'refunded', 'closed'];

const ReturnPage: FC<{ id: string; store: CommerceView }> = ({ id, store }) => {
	const router = useRouter();
	const m = moneyFor(store.answers.store.currency);
	const routes = useMemo(() => storeRoutes(store), [store]);
	const { data, isLoading, error, refetch } = useGetStoreReturnQuery(id);
	const [move, moving] = useMoveStoreReturnMutation();
	const [asking, setAsking] = useState<{ to: StoreReturnStatus; label: string; danger?: boolean } | null>(null);
	const [note, setNote] = useState('');

	if (isLoading) return <DetailSkeleton rows={8} />;
	if (error || !data)
		return (error as any)?.status === 404 ? (
			<EmptyState
				title='Return not found'
				action={<Button onClick={() => router.push(projectHref('/store/returns'))}>Back to Returns</Button>}
			/>
		) : (
			<ErrorState
				error={error as any}
				onRetry={refetch}
			/>
		);

	const r = data.return;
	const next = RETURN_NEXT[r.status] || [];
	const at = STEPS.indexOf(r.status);
	const go = async () => {
		if (!asking) return;
		try {
			await move({ id, to: asking.to, note: note.trim() || undefined, routes }).unwrap();
			toaster.success({ title: `Return ${asking.to}` });
			setAsking(null);
			setNote('');
		} catch (e: any) {
			toaster.error({ title: e?.data?.message || 'Couldn’t change the return' });
		}
	};

	return (
		<Box>
			<PageHeader
				breadcrumbs={[{ href: projectHref('/store/returns'), title: 'Returns' }]}
				title={`Return ${r.code}`}
				badge={<ReturnBadge value={r.status} />}
				meta={[dateTime(r.createdAt), data.order && `from order ${data.order.code}`, r.by && `taken by ${r.by}`].filter(Boolean).join(' · ')}
				actions={
					<Flex
						gap={2}
						align='center'>
						<GuideLink section='store-returns-page' />
						{next.map(s => (
							<Button
								key={s.to}
								size='sm'
								variant={s.danger ? 'outline' : 'solid'}
								colorPalette={s.danger ? 'red' : undefined}
								onClick={() => setAsking(s as any)}>
								{s.label}
							</Button>
						))}
					</Flex>
				}
			/>

			{r.status !== 'rejected' && (
				<Flex
					gap={1}
					mb={4}>
					{STEPS.map((s, i) => (
						<Box
							key={s}
							flex={1}>
							<Box
								h='4px'
								borderRadius='full'
								bg={i <= at ? 'fg' : 'border'}
							/>
							<Text
								mt={1}
								fontSize='12px'
								color={i === at ? 'fg' : 'fg.muted'}
								fontWeight={i === at ? '600' : '400'}
								textTransform='capitalize'>
								{s}
							</Text>
						</Box>
					))}
				</Flex>
			)}

			<Grid
				mt={2}
				templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 320px' }}
				gap={4}
				alignItems='start'>
				<Flex
					direction='column'
					gap={4}
					minW={0}>
					<Panel
						flush
						title='Items'>
						<Box overflowX='auto'>
							<Table.Root
								size='sm'
								variant='line'>
								<Table.Header>
									<Table.Row bg='transparent'>
										<Table.ColumnHeader>Item</Table.ColumnHeader>
										<Table.ColumnHeader>Why</Table.ColumnHeader>
										<Table.ColumnHeader textAlign='end'>Qty</Table.ColumnHeader>
										<Table.ColumnHeader textAlign='end'>Refund</Table.ColumnHeader>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{r.lines.map((l, i) => (
										<Table.Row key={i}>
											<Table.Cell>
												<Text fontWeight='500'>{l.name}</Text>
												<Text
													fontSize='12px'
													color='fg.muted'>
													{[l.sku && `SKU ${l.sku}`, l.condition, l.restock ? 'back to stock' : 'not restocked'].filter(Boolean).join(' · ')}
												</Text>
											</Table.Cell>
											<Table.Cell
												color='fg.muted'
												textTransform='capitalize'>
												{(l.reason || '—').replace(/-/g, ' ')}
											</Table.Cell>
											<Table.Cell textAlign='end'>{l.quantity}</Table.Cell>
											<Table.Cell
												textAlign='end'
												fontWeight='600'>
												{m(l.total)}
											</Table.Cell>
										</Table.Row>
									))}
								</Table.Body>
							</Table.Root>
						</Box>
						<Box
							px={4}
							py={3}
							borderTopWidth='1px'
							ml='auto'
							w='280px'>
							<Flex justify='space-between'>
								<Text>Refund due</Text>
								<Text>{m(r.refundDue)}</Text>
							</Flex>
							<Flex
								justify='space-between'
								fontWeight='700'>
								<Text>Refunded</Text>
								<Text>{m(r.refunded)}</Text>
							</Flex>
						</Box>
					</Panel>

					<Panel
						flush
						title='Refunds'>
						{data.payments.length ? (
							<Table.Root
								size='sm'
								variant='line'>
								<Table.Body>
									{data.payments.map(p => (
										<Table.Row key={p._id}>
											<Table.Cell>{[p.code, p.methodLabel || p.method].filter(Boolean).join(' · ')}</Table.Cell>
											<Table.Cell color='fg.muted'>{dateTime(p.createdAt)}</Table.Cell>
											<Table.Cell
												textAlign='end'
												fontWeight='600'>
												{m(p.amount)}
											</Table.Cell>
										</Table.Row>
									))}
								</Table.Body>
							</Table.Root>
						) : (
							<Text
								px={4}
								py={3}
								color='fg.muted'
								fontSize='14px'>
								Nothing refunded yet.
							</Text>
						)}
					</Panel>

					<Panel
						flush
						title='Stock movements'>
						{data.movements.length ? (
							<Table.Root
								size='sm'
								variant='line'>
								<Table.Body>
									{data.movements.map((mv: any) => (
										<Table.Row key={mv._id}>
											<Table.Cell>{mv.label || 'Item'}</Table.Cell>
											<Table.Cell color='fg.muted'>{mv.reason}</Table.Cell>
											<Table.Cell
												textAlign='end'
												fontWeight='600'>
												{Number(mv.change) > 0 ? '+' : ''}
												{mv.change}
											</Table.Cell>
										</Table.Row>
									))}
								</Table.Body>
							</Table.Root>
						) : (
							<Text
								px={4}
								py={3}
								color='fg.muted'
								fontSize='14px'>
								No stock put back yet.
							</Text>
						)}
					</Panel>
				</Flex>

				<Flex
					direction='column'
					gap={4}>
					<Panel title='Order'>
						{data.order ? (
							<Box fontSize='14px'>
								<Text
									fontWeight='600'
									fontFamily='mono'>
									{data.order.code}
								</Text>
								<Text color='fg.muted'>
									{dateTime(data.order.createdAt)} · {m(data.order.total)}
								</Text>
								<Button
									mt={3}
									size='xs'
									variant='outline'
									onClick={() => router.push(projectHref(`/store/orders/${data.order!._id}`))}>
									Open order
								</Button>
							</Box>
						) : (
							<Text color='fg.muted'>The order is gone.</Text>
						)}
					</Panel>
					<Panel title='Details'>
						<DetailRow
							label='Customer'
							value={data.customer?.name || 'Walk-in'}
						/>
						<DetailRow
							label='Back to'
							value={data.outlet?.name || '—'}
						/>
						<DetailRow
							label='Restocked'
							value={r.restocked ? 'Yes' : 'No'}
						/>
						{r.note && (
							<DetailRow
								label='Notes'
								value={<Text whiteSpace='pre-line'>{r.note}</Text>}
							/>
						)}
					</Panel>
					{!!data.extra?.length && (
						<Panel title='More details'>
							{data.extra.map(f => (
								<DetailRow
									key={f.key}
									label={f.label}
									value={showValue(f.value)}
								/>
							))}
						</Panel>
					)}
				</Flex>
			</Grid>

			<PromptDialog
				open={!!asking}
				onClose={() => setAsking(null)}
				onConfirm={go}
				tone={asking?.danger ? 'danger' : 'default'}
				title={`${asking?.label} return ${r.code}?`}
				confirmLabel={asking?.label}
				loading={moving.isLoading}>
				<Textarea
					mt={3}
					size='sm'
					placeholder='A note (optional — kept on the return)'
					value={note}
					onChange={e => setNote(e.target.value)}
				/>
			</PromptDialog>
		</Box>
	);
};

export default ReturnPage;
