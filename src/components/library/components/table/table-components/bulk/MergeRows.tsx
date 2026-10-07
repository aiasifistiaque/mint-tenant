'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, Grid, RadioGroup, Skeleton, Text } from '@chakra-ui/react';
import { MenuItem } from '../../../../menu';
import { toaster } from '@/components/ui/toaster';
import { useGetSchemaQuery } from '../../../../store/services/commonApi';
import { useMergeMutation, useMergePreviewQuery } from '../../../../store/services/bulkApi';
import convertToViewFields from '../../../../model/functions/convertToViewFields';
import getValue from '../../../../functions/getValue';
import { BulkDialog, BulkProps, COMPACT, CancelButton, comparable, errorOf, nameOf, renderField, rows, useClearSelection, useRecords } from './shared';

const MAX = 10;
const empty = (v: any) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
const dateOf = (v: any) => (v ? new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/**
 * Merge duplicates: keep one of the ticked records, take any field's value
 * from another, and every record linking to the others is moved to the one
 * kept (invoices of a duplicate client, say). The others are removed; the
 * server keeps a copy for 30 days.
 */
const MergeRows: FC<BulkProps> = ({ path, items, title }) => {
	const [open, setOpen] = useState(false);
	const ids = items.slice(0, MAX);
	const { docs, loading, error } = useRecords(path, ids, open);
	const { data: schema } = useGetSchemaQuery(path, { skip: !open || !path });
	const [keep, setKeep] = useState('');
	const [values, setValues] = useState<Record<string, string>>({});
	const [merge, { isLoading }] = useMergeMutation();
	const clear = useClearSelection();

	// The oldest record is kept by default — usually the one other records already point at.
	useEffect(() => {
		if (!docs.length) return;
		const oldest = [...docs].sort((a, b) => +new Date(a.createdAt || 0) - +new Date(b.createdAt || 0))[0];
		setKeep(String(oldest._id));
	}, [docs]);

	const others = ids.filter(id => id !== keep);
	const { data: preview, isFetching: previewing } = useMergePreviewQuery(
		{ path, keep, merge: others },
		{ skip: !open || !keep || !others.length }
	);
	const editable = new Set(preview?.editable || []);

	// Fields whose values differ, and that a merge may set.
	const fields = useMemo(
		() => (schema ? convertToViewFields({ schema }).filter((f: any) => f.type !== 'menu' && !f.dataKey.includes('.')) : []),
		[schema]
	);
	const conflicts = fields.filter((f: any) => {
		if (!editable.has(f.dataKey)) return false;
		const vals = docs.map(d => comparable(d[f.dataKey]));
		return new Set(vals.filter(Boolean)).size > 1 || (new Set(vals).size > 1 && vals.some(Boolean));
	});

	// Each conflict defaults to the kept record's value, or the first filled one when it has none.
	useEffect(() => {
		if (!keep || !docs.length) return;
		const next: Record<string, string> = {};
		const kept = docs.find(d => String(d._id) === keep);
		for (const f of conflicts) {
			if (empty(kept?.[f.dataKey])) {
				const filled = docs.find(d => !empty(d[f.dataKey]));
				if (filled) next[f.dataKey] = String(filled._id);
			}
		}
		setValues(next);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [keep, docs.length, preview?.editable?.length]);

	const keptDoc = docs.find(d => String(d._id) === keep);
	const close = () => setOpen(false);

	const run = async () => {
		try {
			const body = Object.fromEntries(Object.entries(values).filter(([, id]) => id && id !== keep));
			const r = await merge({ path, keep, merge: others, values: body }).unwrap();
			close();
			clear();
			toaster.create({
				type: 'success',
				title: `Merged ${rows(r.merged, 'record')} into ${nameOf(keptDoc)}`,
				description: r.linksMoved ? `${rows(r.linksMoved, 'linked record')} now point at it.` : undefined,
			});
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not merge', description: errorOf(e, '') });
		}
	};

	const openIt = () => {
		if (items.length < 2) return toaster.create({ type: 'info', title: 'Tick 2 or more rows to merge them' });
		if (items.length > MAX) return toaster.create({ type: 'info', title: `At most ${MAX} records can be merged at once` });
		setOpen(true);
	};

	return (
		<>
			<MenuItem onClick={openIt}>{title || 'Merge duplicates'}</MenuItem>
			<BulkDialog
				open={open}
				onClose={close}
				busy={isLoading}
				size='lg'
				title={`Merge ${ids.length} records`}
				footer={
					<>
						<CancelButton
							onClick={close}
							disabled={isLoading}
						/>
						<Button
							{...COMPACT}
							colorPalette='red'
							loading={isLoading}
							loadingText='Merging'
							disabled={!keep || loading || !!error}
							onClick={run}>
							Merge into {keptDoc ? nameOf(keptDoc) : '…'}
						</Button>
					</>
				}>
				{error ? (
					<Text
						fontSize='sm'
						color='fg.error'>
						{error}
					</Text>
				) : loading || !docs.length ? (
					<Skeleton h='120px' />
				) : (
					<Flex
						direction='column'
						gap={5}>
						<Box>
							<Text
								fontSize='xs'
								fontWeight='600'
								mb={2}>
								Keep this one
							</Text>
							<RadioGroup.Root
								size='sm'
								value={keep}
								onValueChange={e => setKeep(e.value || '')}>
								<Flex
									direction='column'
									gap={1.5}>
									{docs.map(d => (
										<RadioGroup.Item
											key={String(d._id)}
											value={String(d._id)}
											px={3}
											py={2}
											borderWidth='1px'
											borderColor={String(d._id) === keep ? 'fg' : 'border'}
											borderRadius='md'
											cursor='pointer'>
											<RadioGroup.ItemHiddenInput />
											<RadioGroup.ItemIndicator />
											<RadioGroup.ItemText
												flex={1}
												minW={0}>
												<Flex
													justify='space-between'
													gap={3}>
													<Text
														fontSize='sm'
														fontWeight='500'
														truncate>
														{nameOf(d)}
														{d.code && (d.name || d.title) ? (
															<Text
																as='span'
																color='fg.muted'
																fontWeight='400'>
																{' '}
																· {d.code}
															</Text>
														) : null}
													</Text>
													<Text
														fontSize='xs'
														color='fg.muted'
														flexShrink={0}>
														Added {dateOf(d.createdAt)}
													</Text>
												</Flex>
											</RadioGroup.ItemText>
										</RadioGroup.Item>
									))}
								</Flex>
							</RadioGroup.Root>
						</Box>

						{conflicts.length > 0 && (
							<Box>
								<Text
									fontSize='xs'
									fontWeight='600'
									mb={1}>
									Where they differ, keep the value from
								</Text>
								<Text
									fontSize='xs'
									color='fg.muted'
									mb={2}>
									Pick a value in each row; the rest of the kept record stays as it is.
								</Text>
								<Box
									borderWidth='1px'
									borderColor='border'
									borderRadius='lg'
									overflow='auto'>
									{conflicts.map((f: any) => {
										const chosen = values[f.dataKey] || keep;
										return (
											<Grid
												key={f.dataKey}
												templateColumns={`minmax(100px, 0.6fr) repeat(${docs.length}, minmax(140px, 1fr))`}
												borderBottomWidth='1px'
												borderColor='border.muted'
												_last={{ borderBottomWidth: 0 }}>
												<Text
													px={3}
													py={2}
													fontSize='xs'
													color='fg.muted'>
													{f.title || f.dataKey}
												</Text>
												{docs.map(d => {
													const id = String(d._id);
													const v = getValue({ dataKey: f.dataKey, type: f.type, data: d });
													const on = chosen === id;
													return (
														<Box
															key={id}
															as='button'
															textAlign='left'
															px={3}
															py={2}
															minW={0}
															fontSize='13px'
															cursor='pointer'
															borderLeftWidth='1px'
															borderColor='border.muted'
															bg={on ? 'bg.emphasized' : undefined}
															outline={on ? '1.5px solid' : undefined}
															outlineColor='fg'
															outlineOffset='-2px'
															_hover={{ bg: on ? 'bg.emphasized' : 'bg.subtle' }}
															onClick={() => setValues(vs => ({ ...vs, [f.dataKey]: id }))}>
															{empty(v) ? (
																<Text color='fg.muted'>—</Text>
															) : (
																renderField(f, d)
															)}
														</Box>
													);
												})}
											</Grid>
										);
									})}
								</Box>
							</Box>
						)}

						<Box
							p={3}
							borderRadius='md'
							bg='bg.subtle'
							fontSize='sm'>
							{previewing || !preview ? (
								<Text color='fg.muted'>Checking what links to them…</Text>
							) : preview.total ? (
								<>
									<Text>
										<strong>{rows(preview.total, 'linked record')}</strong> will move to {nameOf(keptDoc)}:
									</Text>
									<Text
										color='fg.muted'
										fontSize='xs'
										mt={1}>
										{preview.links.map(l => `${l.count} ${l.model} (${l.path})`).join(' · ')}
									</Text>
								</>
							) : (
								<Text color='fg.muted'>Nothing links to the others, so nothing else changes.</Text>
							)}
							<Text
								color='fg.muted'
								fontSize='xs'
								mt={2}>
								{rows(others.length, 'record')} will be removed. The server keeps a copy for 30 days.
							</Text>
						</Box>
					</Flex>
				)}
			</BulkDialog>
		</>
	);
};

export default MergeRows;
