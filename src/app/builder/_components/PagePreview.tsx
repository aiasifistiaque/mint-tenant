'use client';

import { FC, ReactNode } from 'react';
import { Badge, Box, Button, CloseButton, Dialog, Flex, Grid, Portal, Tabs, Text } from '@chakra-ui/react';
import { Calendar, Check, ChevronDown, Download, MoreHorizontal, Plus, Search, Upload } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '@/components/library';
import { ConsoleTabs } from '@/components/library/cl';
import { AREAS, AreaKey, AreaTabLabel } from './areas';
import { TableField as BaseField } from './TableColumnsEditor';

/** A column's field, plus whether the form asks for it. */
type TableField = BaseField & { required?: boolean };
export type PreviewField = TableField;
import { EditableFilter } from './filterTypes';

/**
 * What the page will look like with the edits made so far — saved or not —
 * in three pictures: the table page, the form, and a record's own page. The
 * values are the route's latest records when it has any, so people see their
 * own data in the new layout; nothing in here can be clicked through.
 */

export type PreviewTab = 'table' | 'form' | 'view';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	tab: PreviewTab;
	onTabChange: (tab: PreviewTab) => void;
	/** The config's `route` block — title, buttons, row menu, selection. */
	page?: any;
	columns: string[];
	fields: TableField[];
	filters: EditableFilter[];
	form: any[];
	formRules?: Record<string, any>;
	view: any[];
	viewTabs: any[];
	records: any[];
	loading?: boolean;
};

const ICON = { size: 12, strokeWidth: 1.75 };

/* ------------------------------------------------------------- values */

const isDate = (v: any) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v);
const IMAGE_INPUTS = ['image', 'image-array'];

/** A stored value as one line of text: a linked record by its name, a date as a date, a list joined. */
const show = (v: any, f?: TableField): string => {
	if (v === undefined || v === null || v === '') return '—';
	if (typeof v === 'boolean') return v ? 'Yes' : 'No';
	if (isDate(v)) return new Date(v).toLocaleDateString();
	if (Array.isArray(v)) {
		if (!v.length) return '—';
		if (typeof v[0] === 'object') return `${v.length} ${v.length === 1 ? 'row' : 'rows'}`;
		return v.map(x => show(x, f)).join(', ');
	}
	if (typeof v === 'object') return v.name || v.title || v.label || v.code || v.email || '1 linked';
	if (f?.options?.length) {
		const o = f.options.find((x: any) => String(x.value ?? x) === String(v));
		if (o && typeof o === 'object' && o.label) return o.label;
	}
	return String(v);
};

const Value: FC<{ v: any; f?: TableField }> = ({ v, f }) => {
	if (f && IMAGE_INPUTS.includes(f.input || '') && v) {
		const src = Array.isArray(v) ? v[0] : v;
		if (typeof src === 'string')
			return (
				<Box
					as='img'
					{...({ src, alt: '' } as any)}
					w='28px'
					h='28px'
					objectFit='cover'
					borderRadius='md'
				/>
			);
	}
	if (f?.input === 'select' && v)
		return (
			<Badge
				size='sm'
				variant='subtle'>
				{show(v, f)}
			</Badge>
		);
	return <>{show(v, f)}</>;
};

/* --------------------------------------------------------- the parts */

/** A fake control: an outlined box with muted text. */
const Fake: FC<{ children?: ReactNode; h?: string; dashed?: boolean; muted?: boolean; w?: string }> = ({
	children,
	h = '32px',
	dashed,
	muted,
	w,
}) => (
	<Flex
		align='center'
		justify='space-between'
		gap={2}
		minH={h}
		w={w}
		px={2.5}
		borderWidth='1px'
		borderStyle={dashed ? 'dashed' : 'solid'}
		borderColor='border'
		borderRadius='md'
		bg={muted ? 'bg.subtle' : 'bg.panel'}
		color='fg.subtle'
		fontSize='12px'
		overflow='hidden'
		// The theme paints every p and span in the page's text colour; a placeholder is muted.
		css={{ '& p, & span': { color: 'inherit', fontSize: 'inherit' } }}>
		{children}
	</Flex>
);

const Muted: FC<{ children: ReactNode }> = ({ children }) => (
	<Text
		fontSize='12px'
		color='fg.muted'>
		{children}
	</Text>
);

/** The input a field gets in the form, by its input type. */
const Control: FC<{ f?: TableField; value?: any }> = ({ f, value }) => {
	const input = f?.input || 'text';
	const filled = value !== undefined && value !== null && value !== '';
	const text = filled ? show(value, f) : '';
	if (['textarea', 'editor', 'basic-editor'].includes(input)) return <Fake h='64px'>{text || 'Several lines…'}</Fake>;
	if (['checkbox', 'switch'].includes(input))
		return (
			<Flex
				align='center'
				gap={2}
				h='32px'>
				<Box
					w='30px'
					h='17px'
					borderRadius='full'
					bg={value ? 'fg' : 'border'}
					position='relative'>
					<Box
						position='absolute'
						top='2px'
						left={value ? '15px' : '2px'}
						w='13px'
						h='13px'
						borderRadius='full'
						bg='bg.panel'
					/>
				</Box>
				<Muted>{value ? 'Yes' : 'No'}</Muted>
			</Flex>
		);
	if (input === 'date')
		return (
			<Fake>
				<Text>{text || 'Pick a date'}</Text>
				<Calendar {...ICON} />
			</Fake>
		);
	if (['select', 'select-tag', 'data-menu', 'data-select', 'data-tag', 'nested-data-menu'].includes(input))
		return (
			<Fake>
				<Text truncate>{text || (input.startsWith('data') || input.startsWith('nested') ? 'Choose a record…' : 'Pick one')}</Text>
				<ChevronDown {...ICON} />
			</Fake>
		);
	if (['image', 'image-array', 'file', 'file-array', 'video', 'icon'].includes(input))
		return (
			<Fake
				h='48px'
				dashed>
				<Flex
					align='center'
					gap={1.5}
					mx='auto'>
					<Upload {...ICON} />
					<Text>{filled ? 'Uploaded' : 'Upload'}</Text>
				</Flex>
			</Fake>
		);
	if (input === 'formula' || input === 'read-only' || input === 'view-only')
		return (
			<Fake muted>
				<Text>{text || 'Worked out for you'}</Text>
			</Fake>
		);
	if (input === 'section-data-array')
		return (
			<Fake
				h='44px'
				dashed>
				<Flex
					align='center'
					gap={1.5}>
					<Plus {...ICON} />
					<Text>{filled ? `${show(value, f)} — add another` : 'Add row'}</Text>
				</Flex>
			</Fake>
		);
	return <Fake>{text || f?.label || ''}</Fake>;
};

const FieldLabel: FC<{ f?: TableField; k: string; required?: boolean }> = ({ f, k, required }) => (
	<Text
		fontSize='12px'
		fontWeight='600'
		mb={1}>
		{f?.label || k}
		{required && (
			<Text
				as='span'
				color='red.fg'
				ml={0.5}>
				*
			</Text>
		)}
	</Text>
);

/* ---------------------------------------------------------- the pages */

const TablePreview: FC<Props> = ({ page = {}, columns, fields, filters, records }) => {
	const byKey = new Map(fields.map(f => [f.key, f]));
	const cols = columns.filter(c => typeof c === 'string');
	const rows = records.length ? records.slice(0, 5) : [{}, {}, {}];
	const menu: any[] = page.menu || [];
	const select = !!page.select?.show;
	const hasAdd = !!page.button || !!page.isModal;
	return (
		<Flex
			direction='column'
			gap={3}>
			<Flex
				align='flex-start'
				justify='space-between'
				gap={3}
				flexWrap='wrap'>
				<Box>
					<Text
						fontSize='lg'
						fontWeight='600'>
						{page.title || 'Untitled page'}
					</Text>
					{page.subTitle && <Muted>{page.subTitle}</Muted>}
				</Box>
				<Flex gap={2}>
					{page.export && !page.bulkUpload && (
						<Fake>
							<Download {...ICON} />
							<Text>Export</Text>
						</Fake>
					)}
					{page.bulkUpload && (
						<Fake>
							<MoreHorizontal {...ICON} />
						</Fake>
					)}
					{hasAdd && (
						<Flex
							align='center'
							gap={1.5}
							h='32px'
							px={3}
							borderRadius='md'
							bg='fg'
							color='bg'
							fontSize='12px'>
							<Plus {...ICON} />
							{page.button?.title || 'Add'}
						</Flex>
					)}
				</Flex>
			</Flex>

			{(page.search !== false || (page.filters !== false && filters.length > 0)) && (
				<Flex
					gap={2}
					flexWrap='wrap'
					align='center'>
					{page.search !== false && (
						<Fake w='220px'>
							<Flex
								align='center'
								gap={1.5}>
								<Search {...ICON} />
								<Text>Search…</Text>
							</Flex>
						</Fake>
					)}
					{page.filters !== false &&
						filters.map(f => (
							<Flex
								key={f.uid}
								align='center'
								gap={1}
								h='28px'
								px={2.5}
								borderWidth='1px'
								borderStyle='dashed'
								borderColor='purple.muted'
								color='purple.fg'
								borderRadius='full'
								fontSize='11.5px'>
								<Plus {...ICON} />
								{f.label || f.name}
							</Flex>
						))}
				</Flex>
			)}

			<Box
				borderWidth='1px'
				borderColor='border'
				borderRadius='lg'
				overflowX='auto'>
				<Box
					as='table'
					w='full'
					fontSize='12px'
					css={{ borderCollapse: 'collapse', '& td, & th': { whiteSpace: 'nowrap' } }}>
					<Box
						as='thead'
						bg='bg.subtle'>
						<tr>
							{select && <Box as='th' w='32px' />}
							{cols.map(c => (
								<Box
									as='th'
									key={c}
									textAlign='left'
									fontWeight='600'
									color='fg.muted'
									px={3}
									py={2}>
									{byKey.get(c)?.label || c}
								</Box>
							))}
							{menu.length > 0 && <Box as='th' w='32px' />}
						</tr>
					</Box>
					<tbody>
						{rows.map((r: any, i: number) => (
							<Box
								as='tr'
								key={r._id || i}
								borderTopWidth='1px'
								borderColor='border.muted'>
								{select && (
									<Box
										as='td'
										px={3}>
										<Box
											w='13px'
											h='13px'
											borderWidth='1px'
											borderColor='border'
											borderRadius='sm'
										/>
									</Box>
								)}
								{cols.map(c => (
									<Box
										as='td'
										key={c}
										px={3}
										py={2}
										maxW='220px'
										overflow='hidden'
										textOverflow='ellipsis'>
										{records.length ? (
											<Value
												v={r[c]}
												f={byKey.get(c)}
											/>
										) : (
											<Box
												h='8px'
												w={`${40 + ((i * 17 + c.length * 7) % 50)}%`}
												borderRadius='full'
												bg='bg.emphasized'
											/>
										)}
									</Box>
								))}
								{menu.length > 0 && (
									<Box
										as='td'
										px={2}
										color='fg.muted'>
										<MoreHorizontal {...ICON} />
									</Box>
								)}
							</Box>
						))}
					</tbody>
				</Box>
			</Box>

			{menu.length > 0 && (
				<Flex
					gap={1.5}
					align='center'
					flexWrap='wrap'>
					<Muted>⋯ on each row:</Muted>
					{menu.map((m, i) => (
						<Badge
							key={i}
							size='sm'
							variant='outline'>
							{m.title || m.type}
						</Badge>
					))}
				</Flex>
			)}
			{select && (
				<Flex
					gap={1.5}
					align='center'
					flexWrap='wrap'>
					<Muted>With rows ticked:</Muted>
					{(page.select?.menu || []).map((m: any, i: number) => (
						<Badge
							key={i}
							size='sm'
							variant='outline'>
							{m.title || m.type}
						</Badge>
					))}
					{page.archive && (
						<Badge
							size='sm'
							variant='outline'>
							Archive
						</Badge>
					)}
				</Flex>
			)}
		</Flex>
	);
};

const FormPreview: FC<Props> = ({ form, fields, formRules = {}, page = {}, records }) => {
	const byKey = new Map(fields.map(f => [f.key, f]));
	// The form opens empty: it's the add form.
	void records;
	const required = (k: string) => !!byKey.get(k)?.required;
	return (
		<Box
			maxW='620px'
			mx='auto'
			borderWidth='1px'
			borderColor='border'
			borderRadius='lg'
			bg='bg.panel'
			overflow='hidden'>
			<Flex
				px={4}
				py={3}
				borderBottomWidth='1px'
				borderColor='border.muted'>
				<Text
					fontSize='sm'
					fontWeight='600'>
					{page.button?.title || `New ${page.title || 'record'}`}
				</Text>
			</Flex>
			<Flex
				direction='column'
				gap={5}
				p={4}>
				{form.length === 0 && <Muted>This form has no sections yet.</Muted>}
				{form.map((s: any, si: number) => (
					<Box key={si}>
						{(s.sectionTitle || s.description) && (
							<Box mb={3}>
								{s.sectionTitle && (
									<Text
										fontSize='13px'
										fontWeight='600'
										color='orange.fg'>
										{s.sectionTitle}
									</Text>
								)}
								{s.description && <Muted>{s.description}</Muted>}
							</Box>
						)}
						<Flex
							direction='column'
							gap={3}>
							{(s.fields || []).map((row: any, ri: number) => {
								const keys: string[] = (Array.isArray(row) ? row : [row]).filter((k: any) => typeof k === 'string');
								return (
									<Grid
										key={ri}
										templateColumns={`repeat(${Math.max(keys.length, 1)}, minmax(0, 1fr))`}
										gap={3}>
										{keys.map(k => (
											<Box key={k}>
												<FieldLabel
													f={byKey.get(k)}
													k={k}
													required={required(k)}
												/>
												<Control f={byKey.get(k)} />
												{formRules[k] && (
													<Text
														fontSize='11px'
														color='orange.fg'
														mt={1}>
														Shows only when {formRules[k].field ? byKey.get(formRules[k].field)?.label || formRules[k].field : 'its rule'} matches
													</Text>
												)}
											</Box>
										))}
									</Grid>
								);
							})}
						</Flex>
					</Box>
				))}
			</Flex>
			<Flex
				justify='flex-end'
				gap={2}
				px={4}
				py={3}
				borderTopWidth='1px'
				borderColor='border.muted'>
				<Fake>
					<Text>Cancel</Text>
				</Fake>
				<Flex
					align='center'
					gap={1.5}
					h='32px'
					px={3}
					borderRadius='md'
					bg='fg'
					color='bg'
					fontSize='12px'>
					<Check {...ICON} />
					Save
				</Flex>
			</Flex>
		</Box>
	);
};

const ViewPreview: FC<Props> = ({ view, form, viewTabs, fields, records, page = {} }) => {
	const byKey = new Map(fields.map(f => [f.key, f]));
	const record = records[0] || {};
	// No view config: the page groups fields as the form does.
	const sections: any[] = view.length
		? view
		: form.map((s: any) => ({ title: s.sectionTitle, columns: 2, fields: (s.fields || []).flat() }));
	const name = record.name || record.title || record.code || `A ${page.title ? page.title.toLowerCase() : 'record'}`;
	return (
		<Flex
			direction='column'
			gap={4}>
			<Box>
				<Text
					fontSize='lg'
					fontWeight='600'>
					{name}
				</Text>
				<Muted>{records.length ? 'Your latest record, in the new layout' : 'An example record — this page has no records yet'}</Muted>
			</Box>
			{viewTabs.length > 0 && (
				<Flex gap={1}>
					{['Overview', ...viewTabs.map((t: any) => t.title || t.related)].map((t, i) => (
						<Box
							key={i}
							px={3}
							py={1}
							borderRadius='full'
							fontSize='12px'
							bg={i === 0 ? 'bg.inverted' : 'transparent'}
							color={i === 0 ? 'fg.inverted' : 'fg.muted'}>
							{t}
						</Box>
					))}
				</Flex>
			)}
			{sections.length === 0 && <Muted>This page has no sections yet.</Muted>}
			{sections.map((s: any, si: number) => (
				<Box
					key={si}
					borderWidth='1px'
					borderColor='border'
					borderRadius='lg'
					bg='bg.panel'
					overflow='hidden'>
					{(s.title || s.description) && (
						<Box
							px={4}
							py={2.5}
							borderBottomWidth='1px'
							borderColor='border.muted'>
							<Text
								fontSize='13px'
								fontWeight='600'
								color='pink.fg'>
								{s.title}
							</Text>
							{s.description && <Muted>{s.description}</Muted>}
						</Box>
					)}
					<Grid
						templateColumns={{ base: '1fr', md: `repeat(${Math.min(Math.max(s.columns || 2, 1), 3)}, minmax(0, 1fr))` }}
						gap={4}
						p={4}>
						{(s.fields || []).map((it: any, ii: number) => {
							if (typeof it === 'string')
								return (
									<Box
										key={ii}
										minW={0}>
										<Text
											fontSize='11px'
											color='fg.muted'>
											{byKey.get(it)?.label || it}
										</Text>
										<Box
											fontSize='13px'
											truncate>
											<Value
												v={record[it]}
												f={byKey.get(it)}
											/>
										</Box>
									</Box>
								);
							if ('related' in it)
								return (
									<Box
										key={ii}
										gridColumn='1 / -1'>
										<Text
											fontSize='12px'
											fontWeight='600'
											mb={1.5}>
											{it.title || it.related}
										</Text>
										<Fake
											h='56px'
											dashed>
											<Text>
												A list of {it.related} linked to this record
												{it.columns?.length ? ` — ${it.columns.join(', ')}` : ''}
											</Text>
										</Fake>
									</Box>
								);
							if ('field' in it)
								return (
									<Box
										key={ii}
										minW={0}>
										<Text
											fontSize='11px'
											color='fg.muted'>
											{it.label || byKey.get(it.field)?.label || it.field}
										</Text>
										<Text
											fontSize='13px'
											truncate>
											{(it.show || [])
												.map((k: string) => (record[it.field] && typeof record[it.field] === 'object' ? record[it.field][k] : undefined))
												.filter(Boolean)
												.join(' · ') || (it.show || []).join(', ')}
										</Text>
									</Box>
								);
							return null;
						})}
					</Grid>
				</Box>
			))}
		</Flex>
	);
};

const TABS: { value: PreviewTab; area: AreaKey }[] = [
	{ value: 'table', area: 'table' },
	{ value: 'form', area: 'form' },
	{ value: 'view', area: 'view' },
];

const PagePreview: FC<Props> = props => {
	const { isOpen, onClose, tab, onTabChange, records, loading } = props;
	return (
		<Dialog.Root
			open={isOpen}
			onOpenChange={e => !e.open && onClose()}
			size='cover'
			placement='center'
			scrollBehavior='inside'
			lazyMount
			unmountOnExit>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						maxW='1100px'
						w='calc(100vw - 32px)'>
						<AlertDialogHeader>Preview</AlertDialogHeader>
						<Dialog.CloseTrigger
							asChild
							top={3}
							right={3}>
							<CloseButton size='sm' />
						</Dialog.CloseTrigger>
						<Dialog.Body
							p={4}
							pt={0}>
							<Text
								fontSize='sm'
								color='fg.muted'
								mb={4}>
								How the page looks with your changes — even ones not saved yet.{' '}
								{loading
									? 'Loading your records…'
									: records.length
									? `Filled in with your latest ${records.length === 1 ? 'record' : `${records.length} records`}.`
									: 'There are no records yet, so the rows are placeholders.'}{' '}
								Nothing here can be clicked.
							</Text>
							<ConsoleTabs
								value={tab}
								onChange={v => onTabChange(v as PreviewTab)}
								tabs={TABS.map(t => ({ value: t.value, label: <AreaTabLabel area={t.area} /> }))}>
								{TABS.map(t => (
									<Tabs.Content
										key={t.value}
										value={t.value}
										p={0}>
										<Box
											p={{ base: 3, md: 5 }}
											borderRadius='lg'
											bg='bg.subtle'
											borderTopWidth='3px'
											borderTopColor={`${AREAS[t.area].palette}.solid`}
											pointerEvents='none'
											userSelect='none'
											aria-hidden>
											{t.value === 'table' ? (
												<TablePreview {...props} />
											) : t.value === 'form' ? (
												<FormPreview {...props} />
											) : (
												<ViewPreview {...props} />
											)}
										</Box>
									</Tabs.Content>
								))}
							</ConsoleTabs>
						</Dialog.Body>
						<ModalFooter>
							<Button
								size='sm'
								px={3}
								onClick={onClose}>
								Back to editing
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default PagePreview;
