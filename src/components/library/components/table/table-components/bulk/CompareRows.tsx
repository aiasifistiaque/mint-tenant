'use client';

import { FC, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { Box, Flex, Grid, Skeleton, Switch, Text } from '@chakra-ui/react';
import { MenuItem } from '../../../../menu';
import { toaster } from '@/components/ui/toaster';
import { useGetSchemaQuery } from '../../../../store/services/commonApi';
import convertToViewFields from '../../../../model/functions/convertToViewFields';
import getValue from '../../../../functions/getValue';
import { BulkDialog, BulkProps, CancelButton, comparable, nameOf, renderField, useRecords } from './shared';
import { projectHref } from '../../../../config/lib/constants/panel';

const MAX = 4;
// `_model`: which model a project's record belongs to (one collection per project) — the same on every row.
const SKIP = ['_id', '__v', '_model', 'password'];

/**
 * 2–4 ticked records side by side: one column each, a row per field, rendered
 * the way the view page renders them. Rows whose values differ are tinted, and
 * "Differences only" hides the rest.
 */
const CompareRows: FC<BulkProps> = ({ path, items, title }) => {
	const [open, setOpen] = useState(false);
	const [diffOnly, setDiffOnly] = useState(false);
	const ids = items.slice(0, MAX);
	const { docs, loading, error } = useRecords(path, ids, open);
	const { data: schema } = useGetSchemaQuery(path, { skip: !open || !path });

	const fields = useMemo(
		() => (schema ? convertToViewFields({ schema }).filter((f: any) => f.type !== 'menu' && !SKIP.includes(f.dataKey)) : []),
		[schema]
	);
	const table = fields.map((f: any) => {
		const values = docs.map(d => getValue({ dataKey: f.dataKey, type: f.type, data: d }));
		const differs = new Set(values.map(comparable)).size > 1;
		return { f, values, differs };
	});
	const shown = diffOnly ? table.filter(r => r.differs) : table;
	const diffCount = table.filter(r => r.differs).length;
	const cols = `minmax(120px, 0.7fr) repeat(${Math.max(docs.length, ids.length)}, minmax(160px, 1fr))`;

	const openIt = () => {
		if (items.length < 2) return toaster.create({ type: 'info', title: 'Tick 2 to 4 rows to compare them' });
		if (items.length > MAX) toaster.create({ type: 'info', title: `Comparing the first ${MAX} of ${items.length} rows` });
		setOpen(true);
	};

	return (
		<>
			<MenuItem onClick={openIt}>{title || 'Compare'}</MenuItem>
			<BulkDialog
				open={open}
				onClose={() => setOpen(false)}
				size='cover'
				title={`Compare ${ids.length} records`}
				footer={<CancelButton onClick={() => setOpen(false)}>Close</CancelButton>}>
				<Flex
					align='center'
					justify='space-between'
					mb={3}
					gap={3}
					flexWrap='wrap'>
					<Text
						fontSize='sm'
						color='fg.muted'>
						{loading ? 'Loading…' : error ? error : `${diffCount} of ${table.length} fields differ.`}
					</Text>
					<Switch.Root
						size='sm'
						checked={diffOnly}
						onCheckedChange={e => setDiffOnly(e.checked)}>
						<Switch.HiddenInput />
						<Switch.Control />
						<Switch.Label fontSize='sm'>Differences only</Switch.Label>
					</Switch.Root>
				</Flex>

				<Box
					borderWidth='1px'
					borderColor='border'
					borderRadius='lg'
					overflow='auto'>
					<Grid
						templateColumns={cols}
						position='sticky'
						top={0}
						zIndex={1}
						bg='bg.muted'
						borderBottomWidth='1px'
						borderColor='border'>
						<Box />
						{(docs.length ? docs : ids).map((d: any, i: number) => (
							<Box
								key={i}
								px={3}
								py={2.5}
								minW={0}>
								{loading ? (
									<Skeleton h='14px' />
								) : (
									<NextLink
										href={projectHref(`/view/${path}/${d._id}`)}
										target='_blank'>
										<Text
											fontSize='sm'
											fontWeight='600'
											truncate
											_hover={{ textDecoration: 'underline' }}>
											{nameOf(d)}
										</Text>
										{d.code && (d.name || d.title) && (
											<Text
												fontSize='xs'
												color='fg.muted'>
												{d.code}
											</Text>
										)}
									</NextLink>
								)}
							</Box>
						))}
					</Grid>
					{!loading &&
						shown.map(({ f, values, differs }) => (
							<Grid
								key={f.dataKey}
								templateColumns={cols}
								borderBottomWidth='1px'
								borderColor='border.muted'
								bg={differs ? 'bg.subtle' : undefined}
								_last={{ borderBottomWidth: 0 }}>
								<Flex
									px={3}
									py={2}
									gap={1.5}
									align='center'>
									{/* Differs: a dot beside the label, so it reads without relying on the tint. */}
									<Box
										w='6px'
										h='6px'
										borderRadius='full'
										flexShrink={0}
										bg={differs ? 'orange.solid' : 'transparent'}
										title={differs ? 'Differs' : undefined}
									/>
									<Text
										fontSize='xs'
										color={differs ? 'fg' : 'fg.muted'}
										fontWeight={differs ? '500' : '400'}>
										{f.title || f.dataKey}
									</Text>
								</Flex>
								{values.map((v: any, i: number) => (
									<Box
										key={i}
										px={3}
										py={2}
										minW={0}
										fontSize='13px'>
										{v === undefined || v === null || v === '' ? (
											<Text color='fg.muted'>—</Text>
										) : (
											renderField(f, docs[i])
										)}
									</Box>
								))}
							</Grid>
						))}
				</Box>
			</BulkDialog>
		</>
	);
};

export default CompareRows;
