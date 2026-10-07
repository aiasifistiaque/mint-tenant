'use client';

import { Heading, ListChecks, MoreHorizontal } from 'lucide-react';
import { ToneTitle } from './areas';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { FC } from 'react';
import { Box, Button, Flex, Grid, Input, Text } from '@chakra-ui/react';
import { RotateCcw } from 'lucide-react';
import { Dropdown, Panel } from '@/components/library/cl';
import MenuItemsEditor from './MenuItemsEditor';
import TotalsEditor from './TotalsEditor';
import StatusEditor from './StatusEditor';
import { TableField } from './TableColumnsEditor';
import { BULK_MENU_TYPES, ROW_MENU_TYPES } from './menuTypes';
import { FieldLabel, Toggle } from './ui';

/**
 * The table page's own config — the `route` block of a config file: its
 * header and buttons, the ⋯ row menu, and bulk actions. Used by the route
 * builder's Table tab and the model wizard's Config step.
 *
 * Each panel takes the whole `route` object and hands back the next one.
 * `code` is the code file's `route` block, when there is one: it's what the
 * "The code has it on" hints and the reset buttons compare against.
 */

type PageConfig = Record<string, any>;
type Props = {
	value: PageConfig;
	onChange: (next: PageConfig) => void;
	route: string;
	code?: PageConfig;
};

const DEFAULT_ADD_BUTTON = { title: 'Add Item', isModal: true };

export const PageOptionsPanel: FC<Props> = ({ value: page, onChange, route, code }) => {
	const set = (patch: PageConfig) => onChange({ ...page, ...patch });
	const hasAddButton = !!page.button || !!page.isModal;
	const toggleAddButton = (on: boolean) => {
		if (on) set({ button: code?.button || DEFAULT_ADD_BUTTON, isModal: code?.isModal });
		else {
			const { button, ...rest } = page;
			onChange({ ...rest, isModal: false });
		}
	};

	return (
		<Panel
			title={
				<ToneTitle
					icon={Heading}
					palette='teal'>
					Page header and buttons
				</ToneTitle>
			}
			subtitle='The title above the table, its buttons, and how the table behaves.'>
			<Flex
				direction='column'
				gap={4}>
				<Grid
					templateColumns={{ base: '1fr', md: '1fr 1fr' }}
					gap={4}>
					<Box>
						<FieldLabel>Title</FieldLabel>
						<Input
							size='sm'
							value={page.title || ''}
							onChange={e => set({ title: e.target.value })}
						/>
					</Box>
					<Box>
						<FieldLabel>Subtitle</FieldLabel>
						<Input
							size='sm'
							value={page.subTitle || ''}
							onChange={e => set({ subTitle: e.target.value })}
						/>
					</Box>
				</Grid>

				<Toggle
					label='Add button'
					hint='Create a new record from the table page.'
					code={code ? !!(code.button || code.isModal) : undefined}
					checked={hasAddButton}
					onChange={toggleAddButton}
				/>
				{hasAddButton && (
					<Grid
						templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }}
						gap={4}
						pl={{ md: 4 }}>
						<Box>
							<FieldLabel>Button text</FieldLabel>
							<Input
								size='sm'
								value={page.button?.title || ''}
								onChange={e => set({ button: { ...page.button, title: e.target.value } })}
							/>
						</Box>
						<Box>
							<FieldLabel>Opens</FieldLabel>
							<Dropdown
								size='sm'
								value={page.button?.path !== undefined ? 'page' : 'modal'}
								onChange={v => {
									const { path, isModal, ...rest } = page.button || {};
									set({ button: v === 'page' ? { ...rest, path: `/${route}/create` } : { ...rest, isModal: true } });
								}}>
								<option value='modal'>A pop-up over the table</option>
								<option value='page'>Its own page</option>
							</Dropdown>
						</Box>
						{page.button?.path !== undefined && (
							<Box>
								<FieldLabel>Page address</FieldLabel>
								<Input
									size='sm'
									value={page.button?.path || ''}
									placeholder={`/${route}/create`}
									onChange={e => set({ button: { ...page.button, path: e.target.value } })}
								/>
								<Text
									fontSize='xs'
									color='fg.muted'
									mt={1}>
									{page.button?.path && page.button.path.replace(/^\/+/, '') !== `${route}/create`
										? 'Opens this address instead of the built-in page.'
										: 'The built-in page with the same form. Change it only to send people to a page of your own.'}
								</Text>
							</Box>
						)}
					</Grid>
				)}

				<Toggle
					label='Export button'
					hint='Download the table as CSV or PDF.'
					code={code ? !!code.export : undefined}
					checked={!!page.export}
					onChange={v => set({ export: v })}
				/>
				<Toggle
					label='Bulk upload'
					hint='Add many records from an Excel, CSV or JSON file. Every row is checked before anything is saved. Moves Export into a ⋯ menu beside the add button.'
					code={code ? !!code.bulkUpload : undefined}
					checked={!!page.bulkUpload}
					onChange={v => set({ bulkUpload: v || undefined })}
				/>
				<Toggle
					label='Search'
					hint='The search box above the table.'
					checked={page.search !== false}
					onChange={v => set({ search: v ? undefined : false })}
				/>
				<Toggle
					label='Filter row'
					hint='The filter chips.'
					checked={page.filters !== false}
					onChange={v => set({ filters: v ? undefined : false })}
				/>
				<Toggle
					label='Clickable rows'
					hint='Clicking a row opens it.'
					code={code ? !!code.clickable : undefined}
					checked={!!page.clickable}
					onChange={v => set({ clickable: v, toPath: v ? page.toPath || `/view/${route}` : page.toPath })}
				/>
				<Grid
					templateColumns={{ base: '1fr', md: '1fr 1fr' }}
					gap={4}>
					{page.clickable && (
						<Box>
							<FieldLabel>Row opens</FieldLabel>
							<Input
								size='sm'
								value={page.toPath || ''}
								placeholder={`/view/${route}`}
								onChange={e => set({ toPath: e.target.value })}
							/>
							<Text
								fontSize='11px'
								color='fg.muted'
								mt={1}>
								The row&apos;s id is appended: {page.toPath || `/view/${route}`}/&lt;id&gt;
							</Text>
						</Box>
					)}
					<Box>
						<FieldLabel>Rows per page</FieldLabel>
						<Input
							size='sm'
							type='number'
							min={1}
							max={500}
							value={page.limit ?? ''}
							placeholder='The admin default'
							onChange={e => set({ limit: e.target.value ? Math.max(1, Number(e.target.value)) : undefined })}
						/>
					</Box>
				</Grid>
			</Flex>
		</Panel>
	);
};

export const RowMenuPanel: FC<Props & { fields: TableField[] }> = ({ value: page, onChange, code, fields }) => (
	<Panel
		title={
			<ToneTitle
				icon={MoreHorizontal}
				palette='teal'>
				Row menu
			</ToneTitle>
		}
		subtitle='What the ⋯ button on every row offers — View, Edit, Delete and more — in order. Drag to reorder.'
		actions={
			code?.menu &&
			JSON.stringify(page.menu || []) !== JSON.stringify(code.menu) && (
				<Button
					size='xs'
					variant='outline'
					onClick={() => onChange({ ...page, menu: code.menu })}>
					<RotateCcw size={14} />
					{IS_TENANT_PANEL ? 'Starting menu' : 'Code menu'}
				</Button>
			)
		}>
		<MenuItemsEditor
			items={page.menu || []}
			types={ROW_MENU_TYPES}
			fields={fields}
			addLabel='Add menu item'
			onChange={menu => onChange({ ...page, menu })}
		/>
	</Panel>
);

export const BulkActionsPanel: FC<Props & { fields: TableField[] }> = ({ value: page, onChange, code, fields }) => (
	<Panel
		title={
			<ToneTitle
				icon={ListChecks}
				palette='teal'>
				Actions on selected rows
			</ToneTitle>
		}
		subtitle='Tick boxes on each row, and what can be done to all the ticked rows at once.'>
		<Flex
			direction='column'
			gap={4}>
			<Toggle
				label='Select rows'
				hint='Checkboxes on each row, with a menu for the selection.'
				code={code ? !!code.select?.show : undefined}
				checked={!!page.select?.show}
				onChange={v => onChange({ ...page, select: { menu: [], ...page.select, show: v } })}
			/>
			{page.select?.show && (
				<MenuItemsEditor
					items={page.select?.menu || []}
					types={BULK_MENU_TYPES}
					fields={fields}
					addLabel='Add action'
					onChange={menu => onChange({ ...page, select: { ...page.select, menu } })}
				/>
			)}
			{page.select?.show && (
				<Toggle
					label='Archive rows'
					hint='An “Archive” action hides rows from the list without deleting them; an “Archived” switch above the table shows them, to restore.'
					code={code ? !!code.archive : undefined}
					checked={!!page.archive}
					onChange={v => {
						const { archive: _a, ...rest } = page;
						onChange(v ? { ...rest, archive: true } : rest);
					}}
				/>
			)}
			{page.select?.show && (
				<StatusEditor
					value={page.status}
					fields={fields}
					onChange={status => {
						const { status: _s, ...rest } = page;
						onChange(status ? { ...rest, status } : rest);
					}}
				/>
			)}
			{page.select?.show && (
				<TotalsEditor
					value={page.totals}
					fields={fields}
					onChange={totals => {
						const { totals: _old, ...rest } = page;
						onChange(totals ? { ...rest, totals } : rest);
					}}
				/>
			)}
		</Flex>
	</Panel>
);
