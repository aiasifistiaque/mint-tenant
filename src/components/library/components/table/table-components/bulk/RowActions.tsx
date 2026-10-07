'use client';

import { FC, useMemo, useState } from 'react';
import { Box, Button, Flex, Grid, IconButton, Input, Text, Textarea } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { MenuItem } from '../../../../menu';
import PromptDialog from '../../../../modals/modal-components/PromptDialog';
import Dropdown from '../../../../cl/Dropdown';
import { toaster } from '@/components/ui/toaster';
import { useGetConfigQuery } from '../../../../store/services/commonApi';
import {
	StatusSkip,
	useBulkArchiveMutation,
	useBulkDeleteMutation,
	useBulkDuplicateMutation,
	useBulkRestoreMutation,
	useBulkStatusMutation,
} from '../../../../store/services/bulkApi';
import { useAppSelector } from '../../../../hooks/useReduxHooks';
import { BulkDialog, BulkProps, COMPACT, CancelButton, errorOf, rows, useClearSelection } from './shared';

/* ------------------------------------------------------------------ delete */

/** Delete the ticked rows, with Undo in the toast for 10 seconds. */
export const DeleteRows: FC<BulkProps> = ({ path, items, title }) => {
	const [open, setOpen] = useState(false);
	const [del, { isLoading }] = useBulkDeleteMutation();
	const [restore] = useBulkRestoreMutation();
	const clear = useClearSelection();

	const run = async () => {
		try {
			const r = await del({ path, ids: items }).unwrap();
			setOpen(false);
			clear();
			toaster.create({
				type: 'success',
				title: `${rows(r.deleted, 'record')} deleted`,
				description: r.skipped ? `${rows(r.skipped, 'record')} you can’t delete were left` : undefined,
				duration: 10000,
				action: {
					label: 'Undo',
					onClick: async () => {
						try {
							const back = await restore({ path, batch: r.batch }).unwrap();
							toaster.create({ type: 'success', title: `${rows(back.restored, 'record')} restored` });
						} catch (e) {
							toaster.create({ type: 'error', title: 'Could not undo', description: errorOf(e, '') });
						}
					},
				},
			});
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not delete', description: errorOf(e, '') });
		}
	};

	return (
		<>
			<MenuItem
				color='red.500'
				onClick={() => setOpen(true)}>
				{title || 'Delete'}
			</MenuItem>
			<PromptDialog
				open={open}
				onClose={() => setOpen(false)}
				onConfirm={run}
				tone='danger'
				title={`Delete ${rows(items.length, 'record')}?`}
				description='They’re removed from this list for everyone. You can undo it for a few seconds after, from the message that appears.'
				confirmLabel={`Delete ${rows(items.length, 'record')}`}
				loading={isLoading}
				loadingText='Deleting'
			/>
		</>
	);
};

/* --------------------------------------------------------------- duplicate */

const SIMPLE_TYPES = ['text', 'string', 'email', 'number', 'date', 'date-only', 'select', 'textarea'];

/** Copy each ticked row; optionally set some fields on every copy. */
export const DuplicateRows: FC<BulkProps> = ({ path, items, title }) => {
	const [open, setOpen] = useState(false);
	const [overrides, setOverrides] = useState<{ key: string; value: any }[]>([]);
	const [duplicate, { isLoading }] = useBulkDuplicateMutation();
	const clear = useClearSelection();
	const { data: config } = useGetConfigQuery(path, { skip: !open || !path });
	const fields = useMemo(
		() => (Array.isArray(config?.form) ? config.form : []).filter((f: any) => f?.name && SIMPLE_TYPES.includes(f.type)),
		[config]
	);
	const fieldOf = (key: string) => fields.find((f: any) => f.name === key);

	const run = async () => {
		try {
			const body = Object.fromEntries(overrides.filter(o => o.key).map(o => [o.key, o.value]));
			const r = await duplicate({ path, ids: items, overrides: Object.keys(body).length ? body : undefined }).unwrap();
			setOpen(false);
			setOverrides([]);
			clear();
			toaster.create({
				type: r.failed.length ? 'warning' : 'success',
				title: `${rows(r.created.length, 'copy')} made`.replace('copys', 'copies'),
				description: r.failed.length ? `Couldn’t copy ${r.failed.map(f => f.name).join(', ')}: ${r.failed[0].message}` : undefined,
			});
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not duplicate', description: errorOf(e, '') });
		}
	};

	return (
		<>
			<MenuItem onClick={() => setOpen(true)}>{title || 'Duplicate'}</MenuItem>
			<BulkDialog
				open={open}
				onClose={() => setOpen(false)}
				busy={isLoading}
				title={`Duplicate ${rows(items.length, 'record')}`}
				footer={
					<>
						<CancelButton
							onClick={() => setOpen(false)}
							disabled={isLoading}
						/>
						<Button
							{...COMPACT}
							loading={isLoading}
							loadingText='Copying'
							onClick={run}>
							Duplicate
						</Button>
					</>
				}>
				<Text
					fontSize='sm'
					color='fg.muted'
					mb={4}>
					Each record gets a copy with the same details. Codes are numbered anew and anything that has to be unique
					gets “-copy” added.
				</Text>
				<Text
					fontSize='xs'
					fontWeight='600'
					mb={2}>
					Change on the copies (optional)
				</Text>
				<Flex
					direction='column'
					gap={2}>
					{overrides.map((o, i) => {
						const f = fieldOf(o.key);
						const options: any[] = f?.dataModel || f?.options || [];
						const set = (patch: Partial<{ key: string; value: any }>) =>
							setOverrides(list => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
						return (
							<Grid
								key={i}
								templateColumns='minmax(0, 1fr) minmax(0, 1.2fr) 28px'
								gap={2}
								alignItems='center'>
								<Dropdown
									size='sm'
									placeholder='Field'
									value={o.key}
									onChange={v => set({ key: v, value: '' })}>
									{fields.map((x: any) => (
										<option
											key={x.name}
											value={x.name}>
											{x.label || x.name}
										</option>
									))}
								</Dropdown>
								{f?.type === 'select' && options.length ? (
									<Dropdown
										size='sm'
										placeholder='Value'
										value={o.value ?? ''}
										onChange={v => set({ value: v })}>
										{options.map((opt: any) => (
											<option
												key={String(opt.value ?? opt)}
												value={String(opt.value ?? opt)}>
												{String(opt.label ?? opt.value ?? opt)}
											</option>
										))}
									</Dropdown>
								) : (
									<Input
										size='sm'
										type={f?.type === 'number' ? 'number' : f?.type?.startsWith('date') ? 'date' : 'text'}
										placeholder='Value'
										value={o.value ?? ''}
										onChange={e => set({ value: f?.type === 'number' ? Number(e.target.value) : e.target.value })}
									/>
								)}
								<IconButton
									size='xs'
									variant='ghost'
									aria-label='Remove'
									color='fg.muted'
									onClick={() => setOverrides(list => list.filter((_, j) => j !== i))}>
									<Trash2 size={14} />
								</IconButton>
							</Grid>
						);
					})}
					<Button
						alignSelf='flex-start'
						size='xs'
						variant='outline'
						disabled={!fields.length}
						onClick={() => setOverrides(list => [...list, { key: '', value: '' }])}>
						<Plus size={14} />
						Change a field
					</Button>
				</Flex>
			</BulkDialog>
		</>
	);
};

/* ----------------------------------------------------------------- archive */

/** Archive the ticked rows — or, in the Archived view, restore them. */
export const ArchiveRows: FC<BulkProps> = ({ path, items, title }) => {
	const viewingArchived = useAppSelector((s: any) => s.table?.filters?.archived === 'only');
	const [archive, { isLoading }] = useBulkArchiveMutation();
	const clear = useClearSelection();

	const run = async () => {
		try {
			const r = await archive({ path, ids: items, archived: !viewingArchived }).unwrap();
			clear();
			toaster.create({
				type: 'success',
				title: viewingArchived ? `${rows(r.changed, 'record')} restored` : `${rows(r.changed, 'record')} archived`,
				description: viewingArchived ? 'They’re back in the list.' : 'Find them under “Archived” above the table.',
				duration: 6000,
				action: {
					label: 'Undo',
					onClick: () => archive({ path, ids: items, archived: viewingArchived }),
				},
			});
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not archive', description: errorOf(e, '') });
		}
	};

	return (
		<MenuItem
			disabled={isLoading}
			onClick={run}>
			{viewingArchived ? 'Restore from archive' : title || 'Archive'}
		</MenuItem>
	);
};

/* ------------------------------------------------------------------ status */

/** Move the ticked rows to another status, where the route's rules allow it. */
export const StatusRows: FC<BulkProps> = ({ path, items, title, route }) => {
	const cfg = route?.status;
	const [open, setOpen] = useState(false);
	const [to, setTo] = useState('');
	const [reason, setReason] = useState('');
	const [skipped, setSkipped] = useState<StatusSkip[] | null>(null);
	const [move, { isLoading }] = useBulkStatusMutation();
	const clear = useClearSelection();
	const { data: config } = useGetConfigQuery(path, { skip: !open || !path });
	const field = (Array.isArray(config?.form) ? config.form : []).find((f: any) => f?.name === cfg?.field);
	const options: { value: string; label: string }[] = (field?.dataModel || field?.options || []).map((o: any) => ({
		value: String(o?.value ?? o),
		label: String(o?.label ?? o?.value ?? o),
	}));
	const labelOf = (v: string) => options.find(o => o.value === v)?.label || v;

	// The selection clears once the dialog closes: clearing it hides the
	// selection bar, and this dialog with it, before the skipped rows are read.
	const close = () => {
		if (skipped) clear();
		setOpen(false);
		setTo('');
		setReason('');
		setSkipped(null);
	};

	const run = async () => {
		try {
			const r = await move({ path, ids: items, to, reason: reason.trim() || undefined }).unwrap();
			if (!r.skipped.length) clear();
			toaster.create({
				type: r.skipped.length ? 'warning' : 'success',
				title: `${rows(r.changed, 'record')} moved to ${labelOf(to)}`,
				description: r.skipped.length ? `${rows(r.skipped.length, 'record')} skipped — listed in the dialog` : undefined,
			});
			if (r.skipped.length) setSkipped(r.skipped);
			else close();
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not change the status', description: errorOf(e, '') });
		}
	};

	return (
		<>
			<MenuItem onClick={() => setOpen(true)}>{title || 'Change status'}</MenuItem>
			<BulkDialog
				open={open}
				onClose={close}
				busy={isLoading}
				title={skipped ? 'Some rows weren’t moved' : `Change the ${field?.label?.toLowerCase() || 'status'} of ${rows(items.length)}`}
				footer={
					skipped ? (
						<CancelButton onClick={close}>Close</CancelButton>
					) : (
						<>
							<CancelButton
								onClick={close}
								disabled={isLoading}
							/>
							<Button
								{...COMPACT}
								loading={isLoading}
								loadingText='Moving'
								disabled={!to || (cfg?.requireReason && !reason.trim())}
								onClick={run}>
								Move
							</Button>
						</>
					)
				}>
				{!cfg?.field ? (
					<Text
						fontSize='sm'
						color='fg.muted'>
						This list has no status set up. Choose its status field in the route builder (Table → Bulk actions).
					</Text>
				) : skipped ? (
					<Flex
						direction='column'
						gap={1.5}>
						{skipped.map(s => (
							<Flex
								key={s.id}
								justify='space-between'
								gap={3}
								fontSize='sm'>
								<Text truncate>{s.name}</Text>
								<Text
									color='fg.muted'
									flexShrink={0}>
									{s.why.replace(s.from, labelOf(s.from)).replace(to, labelOf(to))}
								</Text>
							</Flex>
						))}
					</Flex>
				) : (
					<Flex
						direction='column'
						gap={4}>
						<Box>
							<Text
								fontSize='xs'
								fontWeight='600'
								mb={1.5}>
								Move to
							</Text>
							<Dropdown
								size='sm'
								placeholder={options.length ? 'Pick a status' : 'Loading…'}
								value={to}
								onChange={setTo}>
								{options.map(o => (
									<option
										key={o.value}
										value={o.value}>
										{o.label}
									</option>
								))}
							</Dropdown>
							{cfg?.transitions && (
								<Text
									fontSize='xs'
									color='fg.muted'
									mt={1.5}>
									Rows that can’t move there from where they are now are skipped and listed.
								</Text>
							)}
						</Box>
						<Box>
							<Text
								fontSize='xs'
								fontWeight='600'
								mb={1.5}>
								Reason {cfg?.requireReason ? '' : '(optional)'}
							</Text>
							<Textarea
								size='sm'
								rows={3}
								placeholder='Why — saved in each record’s history'
								value={reason}
								onChange={e => setReason(e.target.value)}
							/>
						</Box>
					</Flex>
				)}
			</BulkDialog>
		</>
	);
};
