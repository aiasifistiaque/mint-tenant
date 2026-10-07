'use client';

import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { Box, Button, CloseButton, Dialog, Flex, Grid, IconButton, Input, Portal, Switch, Text } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { ModalFooter, radius, useGetConfigQuery } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { OptionFilter, OptionFilterOp } from '@/components/library/functions/optionFilters';
import { DashboardGrid } from '@/components/library/dashboard/widgets';
import {
	DONUT_MAX,
	RANGE_LABEL,
	Range,
	SIZE_LABEL,
	TYPE_LABEL,
	Widget,
	WidgetSize,
	WidgetType,
	defaultTitle,
} from '@/components/library/dashboard/types';
import { mainRoute, modelLabel, useLinkModels } from '@/app/builder/_components/useLinkModels';
import { DocLink } from './ui';

/**
 * One widget's settings, with the widget itself previewed live beside them —
 * real numbers, fetched as they'd be on the dashboard. Edits are staged here;
 * Done hands them to the builder, which saves the whole dashboard on Save.
 */

type Props = {
	widget: Widget | null;
	isNew: boolean;
	onClose: () => void;
	onDone: (w: Widget) => void;
};

const SENSITIVE = /pass(word)?|token|secret|api_?key|apikey|private|otp|salt|hash/i;
const NUMBER_INPUTS = ['number', 'formula', 'price', 'profit', 'slider'];
const DATE_INPUTS = ['date', 'date-only', 'datetime'];
const GROUP_INPUTS = ['select', 'select-tag', 'tag', 'case-tag', 'checkbox', 'switch', 'boolean', 'data-menu', 'data-tag', 'nested-data-menu'];
const BOOL_INPUTS = ['checkbox', 'switch', 'boolean'];
const OPS: { value: OptionFilterOp; label: string }[] = [
	{ value: 'eq', label: 'is' },
	{ value: 'ne', label: 'is not' },
	{ value: 'in', label: 'is one of' },
];
const ICON = { size: 14, strokeWidth: 1.75 };

type Field = { key: string; label: string; input?: string; options?: { value: any; label?: any }[] };

const Label: FC<{ children: ReactNode; hint?: ReactNode }> = ({ children, hint }) => (
	<Box mb={1.5}>
		<Text
			fontSize='xs'
			fontWeight='600'>
			{children}
		</Text>
		{hint && (
			<Text
				fontSize='11px'
				color='fg.muted'>
				{hint}
			</Text>
		)}
	</Box>
);

const Section: FC<{ title: string; anchor: string; children: ReactNode }> = ({ title, anchor, children }) => (
	<Flex
		direction='column'
		gap={3}
		pt={4}
		borderTopWidth='1px'
		borderColor='border.muted'
		_first={{ pt: 0, borderTopWidth: 0 }}>
		<Flex
			align='center'
			justify='space-between'>
			<Text
				fontSize='sm'
				fontWeight='600'>
				{title}
			</Text>
			<DocLink section={anchor} />
		</Flex>
		{children}
	</Flex>
);

const WidgetDialog: FC<Props> = ({ widget, isNew, onClose, onDone }) => {
	const [w, setW] = useState<Widget | null>(widget);
	useEffect(() => setW(widget), [widget]);
	const { models, isLoading: modelsLoading } = useLinkModels();
	const { data: config, isFetching } = useGetConfigQuery(w?.route || '', { skip: !w?.route });

	const fields: Field[] = useMemo(
		() =>
			Object.entries<any>(config?.schema || {})
				.filter(([key]) => key !== '_id' && !SENSITIVE.test(key))
				.map(([key, s]) => ({ key, label: s?.label || s?.title || key, input: s?.type, options: s?.options })),
		[config]
	);
	if (!w) return null;

	const set = (patch: Partial<Widget>) => setW(x => (x ? { ...x, ...patch } : x));
	const linked = models.find(m => m.routes.includes(w.route));
	const numberFields = fields.filter(f => NUMBER_INPUTS.includes(f.input || ''));
	const dateFields = [
		...fields.filter(f => DATE_INPUTS.includes(f.input || '') || /At$/.test(f.key)),
		...(fields.some(f => f.key === 'createdAt') ? [] : [{ key: 'createdAt', label: 'Created' }]),
	];
	const groupFields = fields.filter(f => GROUP_INPUTS.includes(f.input || ''));
	const otherFields = fields.filter(f => !GROUP_INPUTS.includes(f.input || '') && !NUMBER_INPUTS.includes(f.input || ''));
	const fieldOf = (key?: string) => fields.find(f => f.key === key);
	const byField = w.type === 'chart' && w.group === 'field';

	/** Another model: its fields differ, so field choices go back to the defaults. */
	const pickModel = (name: string) => {
		const m = models.find(x => x.name === name);
		if (!m) return;
		set({ route: mainRoute(m), field: undefined, by: undefined, columns: [], filters: [], dateField: 'createdAt', metric: w.type === 'recent' ? undefined : 'count' });
	};
	const pickType = (type: WidgetType) => {
		if (type === w.type) return;
		const keep = { id: w.id, route: w.route, title: w.title, filters: w.filters };
		if (type === 'stat') setW({ ...keep, type, size: 'sm', metric: 'count', range: 'all', dateField: 'createdAt' });
		else if (type === 'chart')
			setW({ ...keep, type, size: 'lg', metric: 'count', range: '30d', dateField: 'createdAt', group: 'time', chart: 'bar', interval: 'day' });
		else setW({ ...keep, type, size: 'lg', columns: [], limit: 5, sort: '-createdAt' });
	};

	const problems = [
		!w.route && 'Pick the model it reads.',
		w.type !== 'recent' && w.metric && w.metric !== 'count' && !w.field && `Pick the number field to ${w.metric === 'sum' ? 'add up' : 'average'}.`,
		byField && !w.by && 'Pick the field to break it down by.',
		(w.filters || []).some(f => !f.field) && 'A condition has no field — pick one or remove it.',
	].filter(Boolean) as string[];

	const filters = w.filters || [];
	const setFilters = (next: OptionFilter[]) => set({ filters: next });
	const setFilter = (i: number, patch: Partial<OptionFilter>) =>
		setFilters(filters.map((f, j) => (j === i ? (Object.fromEntries(Object.entries({ ...f, ...patch }).filter(([, v]) => v !== undefined)) as OptionFilter) : f)));

	const fieldOptions = (list: Field[]) =>
		list.map(f => (
			<option
				key={f.key}
				value={f.key}>
				{f.label}
			</option>
		));

	return (
		<Dialog.Root
			open={!!widget}
			onOpenChange={e => !e.open && onClose()}
			size='xl'
			placement='top'
			scrollBehavior='inside'>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content
						maxW='1080px'
						borderRadius={radius.MODAL}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'>
						<Dialog.Header
							px={{ base: 4, md: 6 }}
							pt={{ base: 4, md: 5 }}
							pb={{ base: 3, md: 4 }}
							pr={12}>
							<Dialog.Title fontSize='16px'>{isNew ? `Add a ${TYPE_LABEL[w.type].toLowerCase()}` : `Edit ${TYPE_LABEL[w.type].toLowerCase()}`}</Dialog.Title>
						</Dialog.Header>
						<Dialog.CloseTrigger
							asChild
							top={3}
							right={3}>
							<CloseButton size='sm' />
						</Dialog.CloseTrigger>

						<Dialog.Body
							px={{ base: 4, md: 6 }}
							pt={0}
							pb={{ base: 4, md: 5 }}>
							<Grid
								templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }}
								gap={6}
								alignItems='start'>
								<Flex
									direction='column'
									gap={4}>
									<Section
										title='What it shows'
										anchor='widgets'>
										<Flex gap={1.5}>
											{(['stat', 'chart', 'recent'] as WidgetType[]).map(t => (
												<Button
													key={t}
													size='xs'
													variant={w.type === t ? 'solid' : 'outline'}
													onClick={() => pickType(t)}>
													{TYPE_LABEL[t]}
												</Button>
											))}
										</Flex>
										<Grid
											templateColumns={{ base: '1fr', md: '1fr 1fr' }}
											gap={3}>
											<Box>
												<Label hint='The records it reads.'>Model</Label>
												<Dropdown
													size='sm'
													disabled={!models.length}
													placeholder={modelsLoading ? 'Loading models…' : 'Pick a model'}
													value={linked?.name || ''}
													onChange={pickModel}>
													{models.map(m => (
														<option
															key={m.name}
															value={m.name}>
															{modelLabel(m)}
														</option>
													))}
												</Dropdown>
											</Box>
											{linked && linked.routes.length > 1 ? (
												<Box>
													<Label hint='This model has more than one page.'>Served on</Label>
													<Dropdown
														size='sm'
														value={w.route}
														onChange={route => set({ route })}>
														{linked.routes.map(r => (
															<option
																key={r}
																value={r}>
																/{r}
															</option>
														))}
													</Dropdown>
												</Box>
											) : (
												<Box>
													<Label hint='Its share of the dashboard’s width.'>Size</Label>
													<Dropdown
														size='sm'
														value={w.size}
														onChange={v => set({ size: v as WidgetSize })}>
														{(Object.keys(SIZE_LABEL) as WidgetSize[]).map(s => (
															<option
																key={s}
																value={s}>
																{SIZE_LABEL[s]}
															</option>
														))}
													</Dropdown>
												</Box>
											)}
										</Grid>
										<Grid
											templateColumns={{ base: '1fr', md: linked && linked.routes.length > 1 ? '1fr 1fr' : '1fr' }}
											gap={3}>
											<Box>
												<Label>Title</Label>
												<Input
													size='sm'
													value={w.title || ''}
													maxLength={80}
													placeholder={defaultTitle(w, linked?.name)}
													onChange={e => set({ title: e.target.value })}
												/>
											</Box>
											{linked && linked.routes.length > 1 && (
												<Box>
													<Label>Size</Label>
													<Dropdown
														size='sm'
														value={w.size}
														onChange={v => set({ size: v as WidgetSize })}>
														{(Object.keys(SIZE_LABEL) as WidgetSize[]).map(s => (
															<option
																key={s}
																value={s}>
																{SIZE_LABEL[s]}
															</option>
														))}
													</Dropdown>
												</Box>
											)}
										</Grid>
									</Section>

									{w.type !== 'recent' && w.route && (
										<Section
											title='The number'
											anchor={w.type === 'stat' ? 'numbers' : 'charts'}>
											<Grid
												templateColumns={{ base: '1fr', md: '1fr 1fr' }}
												gap={3}>
												<Box>
													<Label>Measure</Label>
													<Dropdown
														size='sm'
														value={w.metric || 'count'}
														onChange={v => set({ metric: v as any, ...(v === 'count' && { field: undefined }) })}>
														<option value='count'>How many records</option>
														<option value='sum'>Total of a number field</option>
														<option value='avg'>Average of a number field</option>
													</Dropdown>
												</Box>
												{w.metric && w.metric !== 'count' && (
													<Box>
														<Label>Number field</Label>
														<Dropdown
															size='sm'
															disabled={isFetching}
															placeholder={numberFields.length ? 'Pick a field' : 'No number fields'}
															value={w.field || ''}
															onChange={v => set({ field: v })}>
															{fieldOptions(numberFields)}
														</Dropdown>
													</Box>
												)}
												<Box>
													<Label>Time range</Label>
													<Dropdown
														size='sm'
														value={w.range || 'all'}
														onChange={v => set({ range: v as Range, ...(v === 'all' && { compare: false }) })}>
														{(Object.keys(RANGE_LABEL) as Range[]).map(r => (
															<option
																key={r}
																value={r}>
																{RANGE_LABEL[r]}
															</option>
														))}
													</Dropdown>
												</Box>
												<Box>
													<Label hint='The date the range reads.'>Dated by</Label>
													<Dropdown
														size='sm'
														value={w.dateField || 'createdAt'}
														onChange={v => set({ dateField: v })}>
														{fieldOptions(dateFields as Field[])}
													</Dropdown>
												</Box>
												<Box>
													<Label hint='Before the number, e.g. BDT'>Prefix</Label>
													<Input
														size='sm'
														maxLength={12}
														value={w.prefix || ''}
														onChange={e => set({ prefix: e.target.value })}
													/>
												</Box>
												<Box>
													<Label hint='After the number, e.g. kg'>Suffix</Label>
													<Input
														size='sm'
														maxLength={12}
														value={w.suffix || ''}
														onChange={e => set({ suffix: e.target.value })}
													/>
												</Box>
											</Grid>
											{w.type === 'stat' && (
												<Switch.Root
													size='sm'
													disabled={w.range === 'all'}
													checked={!!w.compare && w.range !== 'all'}
													onCheckedChange={d => set({ compare: d.checked })}>
													<Switch.HiddenInput />
													<Switch.Control />
													<Switch.Label fontSize='sm'>
														Compare with the period before{w.range === 'all' ? ' (pick a time range first)' : ''}
													</Switch.Label>
												</Switch.Root>
											)}
										</Section>
									)}

									{w.type === 'chart' && w.route && (
										<Section
											title='The chart'
											anchor='charts'>
											<Flex gap={1.5}>
												<Button
													size='xs'
													variant={!byField ? 'solid' : 'outline'}
													onClick={() => !byField || set({ group: 'time', chart: 'bar', interval: w.interval || 'day' })}>
													Over time
												</Button>
												<Button
													size='xs'
													variant={byField ? 'solid' : 'outline'}
													onClick={() => byField || set({ group: 'field', chart: 'donut', limit: Math.min(w.limit || 6, DONUT_MAX) })}>
													Broken down by a field
												</Button>
											</Flex>
											<Grid
												templateColumns={{ base: '1fr', md: '1fr 1fr' }}
												gap={3}>
												{byField ? (
													<>
														<Box>
															<Label>Break down by</Label>
															<Dropdown
																size='sm'
																disabled={isFetching}
																placeholder='Pick a field'
																value={w.by || ''}
																onChange={v => set({ by: v })}>
																<optgroup label='Choices and links'>{fieldOptions(groupFields)}</optgroup>
																<optgroup label='Other fields'>{fieldOptions(otherFields)}</optgroup>
															</Dropdown>
														</Box>
														<Box>
															<Label>Drawn as</Label>
															<Dropdown
																size='sm'
																value={w.chart || 'donut'}
																onChange={v => set({ chart: v as any, ...(v === 'donut' && (w.limit || 6) > DONUT_MAX && { limit: DONUT_MAX }) })}>
																<option value='donut'>Donut</option>
																<option value='bar'>Bars</option>
															</Dropdown>
														</Box>
														<Box>
															<Label hint='The rest is added up as “Other”.'>Show the top</Label>
															<Dropdown
																size='sm'
																value={String(w.limit || 6)}
																onChange={v => set({ limit: Number(v) })}>
																{Array.from({ length: w.chart === 'donut' ? DONUT_MAX - 1 : 11 }, (_, i) => i + 2).map(n => (
																	<option
																		key={n}
																		value={String(n)}>
																		{n}
																	</option>
																))}
															</Dropdown>
														</Box>
													</>
												) : (
													<>
														<Box>
															<Label>One bar per</Label>
															<Dropdown
																size='sm'
																value={w.interval || 'day'}
																onChange={v => set({ interval: v as any })}>
																<option value='day'>Day</option>
																<option value='week'>Week</option>
																<option value='month'>Month</option>
															</Dropdown>
														</Box>
														<Box>
															<Label>Drawn as</Label>
															<Dropdown
																size='sm'
																value={w.chart || 'bar'}
																onChange={v => set({ chart: v as any })}>
																<option value='bar'>Columns</option>
																<option value='line'>Line</option>
															</Dropdown>
														</Box>
													</>
												)}
											</Grid>
										</Section>
									)}

									{w.type === 'recent' && w.route && (
										<Section
											title='The list'
											anchor='recent'>
											<Box>
												<Label hint='Up to 6, in the order picked. None: the first columns of its table.'>Columns</Label>
												<Flex
													gap={1.5}
													flexWrap='wrap'>
													{fields.map(f => {
														const at = (w.columns || []).indexOf(f.key);
														return (
															<Button
																key={f.key}
																size='2xs'
																variant={at >= 0 ? 'solid' : 'outline'}
																disabled={at < 0 && (w.columns || []).length >= 6}
																onClick={() =>
																	set({ columns: at >= 0 ? (w.columns || []).filter(k => k !== f.key) : [...(w.columns || []), f.key] })
																}>
																{at >= 0 ? `${at + 1}. ` : ''}
																{f.label}
															</Button>
														);
													})}
												</Flex>
											</Box>
											<Grid
												templateColumns={{ base: '1fr', md: '1fr 1fr' }}
												gap={3}>
												<Box>
													<Label>How many</Label>
													<Dropdown
														size='sm'
														value={String(w.limit || 5)}
														onChange={v => set({ limit: Number(v) })}>
														{[3, 5, 8, 10, 15, 20].map(n => (
															<option
																key={n}
																value={String(n)}>
																{n}
															</option>
														))}
													</Dropdown>
												</Box>
												<Box>
													<Label>Order</Label>
													<Dropdown
														size='sm'
														value={w.sort || '-createdAt'}
														onChange={v => set({ sort: v })}>
														<option value='-createdAt'>Newest first</option>
														<option value='createdAt'>Oldest first</option>
														<optgroup label='Highest first'>
															{[...numberFields, ...dateFields.filter(f => f.key !== 'createdAt')].map(f => (
																<option
																	key={f.key}
																	value={`-${f.key}`}>
																	{f.label}
																</option>
															))}
														</optgroup>
													</Dropdown>
												</Box>
											</Grid>
										</Section>
									)}

									{w.route && (
										<Section
											title='Only records where'
											anchor='filters'>
											<Text
												fontSize='xs'
												color='fg.muted'>
												{filters.length
													? 'Counted only when every condition holds.'
													: 'Every record of the model, within what each admin may see. Add a condition to narrow it.'}
											</Text>
											{filters.map((f, i) => {
												const target = fieldOf(f.field);
												const isBool = BOOL_INPUTS.includes(target?.input || '');
												const op = f.op || 'eq';
												return (
													<Flex
														key={i}
														gap={2}
														align='center'
														flexWrap='wrap'>
														<Dropdown
															size='xs'
															w='160px'
															placeholder='Field'
															value={f.field || ''}
															onChange={v => setFilter(i, { field: v, value: undefined })}>
															{fieldOptions(fields)}
														</Dropdown>
														<Dropdown
															size='xs'
															w='100px'
															disabled={isBool}
															value={isBool ? 'eq' : op}
															onChange={v => setFilter(i, { op: v === 'eq' ? undefined : (v as OptionFilterOp) })}>
															{OPS.map(o => (
																<option
																	key={o.value}
																	value={o.value}>
																	{o.label}
																</option>
															))}
														</Dropdown>
														{isBool ? (
															<Dropdown
																size='xs'
																w='90px'
																placeholder='Yes / no'
																value={f.value === true ? 'true' : f.value === false ? 'false' : ''}
																onChange={v => setFilter(i, { value: v === 'true' })}>
																<option value='true'>Yes</option>
																<option value='false'>No</option>
															</Dropdown>
														) : target?.options?.length && op !== 'in' ? (
															<Dropdown
																size='xs'
																w='150px'
																placeholder='Value'
																value={f.value ?? ''}
																onChange={v => setFilter(i, { value: v })}>
																{target.options.map((o: any) => (
																	<option
																		key={String(o.value)}
																		value={String(o.value)}>
																		{String(o.label ?? o.value)}
																	</option>
																))}
															</Dropdown>
														) : (
															<Input
																size='xs'
																w='170px'
																placeholder={op === 'in' ? 'Values, comma separated' : 'Value'}
																value={Array.isArray(f.value) ? f.value.join(', ') : f.value ?? ''}
																onChange={e =>
																	setFilter(i, {
																		value:
																			op === 'in'
																				? e.target.value
																						.split(',')
																						.map(x => x.trim())
																						.filter(Boolean)
																				: e.target.value,
																	})
																}
															/>
														)}
														<IconButton
															size='xs'
															variant='ghost'
															aria-label='Remove condition'
															color='red.500'
															_dark={{ color: 'red.300' }}
															onClick={() => setFilters(filters.filter((_, j) => j !== i))}>
															<Trash2 {...ICON} />
														</IconButton>
													</Flex>
												);
											})}
											<Box>
												<Button
													size='xs'
													variant='outline'
													onClick={() => setFilters([...filters, { field: '' }])}>
													<Plus {...ICON} />
													Add condition
												</Button>
											</Box>
										</Section>
									)}
								</Flex>

								<Box
									position={{ lg: 'sticky' }}
									top={0}>
									<Flex
										align='center'
										justify='space-between'
										mb={2}>
										<Text
											fontSize='xs'
											fontWeight='600'
											color='fg.muted'>
											Preview — live numbers
										</Text>
										<DocLink
											section='preview'
											label='About the preview'
										/>
									</Flex>
									<Box
										p={3}
										bg='bg.subtle'
										borderRadius='md'>
										{/* Full width here, whatever its size on the dashboard. */}
										<DashboardGrid
											preview
											widgets={[{ ...w, size: 'full' }]}
										/>
									</Box>
								</Box>
							</Grid>
						</Dialog.Body>

						<ModalFooter>
							{problems.length > 0 && (
								<Text
									fontSize='xs'
									color='fg.muted'
									mr='auto'>
									{problems[0]}
								</Text>
							)}
							<Button
								size='xs'
								h='28px'
								px={3}
								variant='outline'
								onClick={onClose}>
								Cancel
							</Button>
							<Button
								size='xs'
								h='28px'
								px={3}
								disabled={problems.length > 0}
								onClick={() => onDone(w)}>
								{isNew ? 'Add to dashboard' : 'Done'}
							</Button>
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default WidgetDialog;
