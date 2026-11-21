'use client';

import { FC, FormEvent, useEffect, useState } from 'react';
import { Box, Button, Checkbox, Field, Flex, Input, Text } from '@chakra-ui/react';
import { ShieldCheck } from 'lucide-react';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton } from '@/components/library';
import { styles } from '@/components/library/config';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { ProjectRoleInput, ProjectRoleOption, ProjectRoleTarget } from '@/components/library/store/services/tenantApi';

/**
 * Making or changing one of the project's own roles (WO-50): its name, and per
 * model what it may do — view, add, edit, delete, and publish where records are
 * drafts until published (docs/cms D11) — plus the media library and History. Adding, editing or deleting includes viewing, so those tick View
 * too, and unticking View clears the row. Select all, each row's All and each
 * column heading tick a whole group at once. A server refusal carries `on`.
 */

const ACTIONS = [
	{ key: 'view', label: 'View' },
	{ key: 'create', label: 'Add' },
	{ key: 'edit', label: 'Edit' },
	{ key: 'delete', label: 'Delete' },
	{ key: 'publish', label: 'Publish' },
] as const;

const labelCss: any = { fontSize: '13px', fontWeight: '600', m: 0 };

const RoleDialog: FC<{
	open: boolean;
	onClose: () => void;
	role?: ProjectRoleOption | null;
	targets: ProjectRoleTarget[];
	saving?: boolean;
	error?: { message: string; on?: string } | null;
	onSave: (r: ProjectRoleInput) => void;
	onEdit: () => void;
	/** Keys of their own under the grid — a panel role's report keys (docs/panel-users PU-03). */
	extras?: { key: string; label: string; description?: string }[];
	/** The header's line under the title. */
	intro?: string;
	guide?: string;
}> = ({ open, onClose, role, targets, saving, error, onSave, onEdit, extras = [], intro, guide = 'project-roles' }) => {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [keys, setKeys] = useState<Set<string>>(new Set());
	useEffect(() => {
		if (!open) return;
		setName(role?.name || '');
		setDescription(role?.description || '');
		setKeys(new Set(role?.permissions || []));
	}, [open, role?._id]);

	const toggle = (route: string, action: string, on: boolean) => {
		onEdit();
		setKeys(prev => {
			const next = new Set(prev);
			if (on) {
				next.add(`${action}-${route}`);
				next.add(`view-${route}`);
			} else if (action === 'view') ACTIONS.forEach(a => next.delete(`${a.key}-${route}`));
			else next.delete(`${action}-${route}`);
			return next;
		});
	};
	/** A whole column on or off, for every row that has it. */
	const column = (action: string) => {
		const rows = targets.filter(t => t.actions.includes(action as any));
		const all = rows.length > 0 && rows.every(t => keys.has(`${action}-${t.route}`));
		rows.forEach(t => toggle(t.route, action, !all));
	};
	/** A tri-state: every key on, some on, none on. */
	const stateOf = (list: string[]): boolean | 'indeterminate' => {
		const on = list.filter(k => keys.has(k)).length;
		return on === 0 ? false : on === list.length ? true : 'indeterminate';
	};
	const rowKeys = (t: ProjectRoleTarget) => ACTIONS.filter(a => t.actions.includes(a.key as any)).map(a => `${a.key}-${t.route}`);
	const columnKeys = (action: string) => targets.filter(t => t.actions.includes(action as any)).map(t => `${action}-${t.route}`);
	const everyKey = [...targets.flatMap(rowKeys), ...extras.map(x => x.key)];
	/** Turn a set of keys all on, or all off. */
	const setMany = (list: string[], on: boolean) => {
		onEdit();
		setKeys(prev => {
			const next = new Set(prev);
			list.forEach(k => (on ? next.add(k) : next.delete(k)));
			return next;
		});
	};
	const allState = stateOf(everyKey);

	const submit = (e?: FormEvent) => {
		e?.preventDefault();
		onSave({ name: name.trim(), description: description.trim(), permissions: [...keys] });
	};
	const errorAt = (on: string) => (error?.on === on ? error.message : undefined);

	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='lg'
			forceModal>
			<DialogHeader
				divider
				icon={<ShieldCheck size={17} strokeWidth={1.75} />}
				description={intro || 'Only for this project. Pick what it may do with each model’s records.'}>
				{role ? `Edit “${role.name}”` : 'New role'}
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<form
					id='project-role'
					onSubmit={submit}>
					<Flex
						direction='column'
						gap={4}>
						<Field.Root
							required
							invalid={!!errorAt('name')}>
							<Field.Label {...labelCss}>Name</Field.Label>
							<Input
								size='sm'
								autoFocus
								maxLength={60}
								value={name}
								placeholder='Sales rep'
								onChange={e => {
									onEdit();
									setName(e.target.value);
								}}
							/>
							<Field.ErrorText>{errorAt('name')}</Field.ErrorText>
						</Field.Root>
						<Field.Root>
							<Field.Label {...labelCss}>Description</Field.Label>
							<Input
								size='sm'
								maxLength={300}
								value={description}
								placeholder='Optional — shown when choosing a role'
								onChange={e => {
									onEdit();
									setDescription(e.target.value);
								}}
							/>
						</Field.Root>
						<Box>
							<Flex
								align='baseline'
								justify='space-between'>
								<Text {...labelCss}>What it can do</Text>
								<Flex
									align='center'
									gap={3}>
									<Checkbox.Root
										size='sm'
										checked={allState}
										disabled={!everyKey.length}
										onCheckedChange={() => setMany(everyKey, allState !== true)}>
										<Checkbox.HiddenInput />
										<Checkbox.Control />
										<Checkbox.Label
											fontSize='12.5px'
											fontWeight='500'>
											Select all
										</Checkbox.Label>
									</Checkbox.Root>
									<GuideLink section={guide} />
								</Flex>
							</Flex>
							<Box
								mt={2}
								borderWidth='1px'
								borderColor='border'
								borderRadius='md'
								overflowX='auto'>
								<Box
									as='table'
									w='100%'
									fontSize='13px'
									css={{ borderCollapse: 'collapse', '& td, & th': { padding: '8px 12px' } }}>
									<thead>
										<Box
											as='tr'
											bg='bg.muted'>
											<Box
												as='th'
												textAlign='left'
												fontWeight='600'>
												Model
											</Box>
											{ACTIONS.map(a => (
												<Box
													as='th'
													key={a.key}
													w='72px'
													textAlign='center'>
													<Checkbox.Root
														size='sm'
														flexDirection='column'
														gap={1}
														title={`${a.label}: every model or none`}
														checked={stateOf(columnKeys(a.key))}
														disabled={!columnKeys(a.key).length}
														onCheckedChange={() => column(a.key)}>
														<Checkbox.HiddenInput aria-label={`${a.label} for every model`} />
														<Checkbox.Label
															fontSize='12.5px'
															fontWeight='600'>
															{a.label}
														</Checkbox.Label>
														<Checkbox.Control />
													</Checkbox.Root>
												</Box>
											))}
											<Box
												as='th'
												w='60px'
												textAlign='center'
												fontWeight='600'
												borderLeftWidth='1px'
												borderColor='border.muted'>
												All
											</Box>
										</Box>
									</thead>
									<tbody>
										{targets.map(t => (
											<Box
												as='tr'
												key={t.route}
												borderTopWidth='1px'
												borderColor='border.muted'>
												<Box as='td'>{t.name}</Box>
												{ACTIONS.map(a => (
													<Box
														as='td'
														key={a.key}
														textAlign='center'>
														{t.actions.includes(a.key) && (
															<Checkbox.Root
																size='sm'
																checked={keys.has(`${a.key}-${t.route}`)}
																onCheckedChange={e => toggle(t.route, a.key, !!e.checked)}>
																<Checkbox.HiddenInput aria-label={`${a.label} ${t.name}`} />
																<Checkbox.Control />
															</Checkbox.Root>
														)}
													</Box>
												))}
												<Box
													as='td'
													textAlign='center'
													borderLeftWidth='1px'
													borderColor='border.muted'>
													<Checkbox.Root
														size='sm'
														checked={stateOf(rowKeys(t))}
														onCheckedChange={() => setMany(rowKeys(t), stateOf(rowKeys(t)) !== true)}>
														<Checkbox.HiddenInput aria-label={`Everything on ${t.name}`} />
														<Checkbox.Control />
													</Checkbox.Root>
												</Box>
											</Box>
										))}
									</tbody>
								</Box>
							</Box>
							{extras.length > 0 && (
								<Flex
									direction='column'
									gap={2}
									mt={3}>
									{extras.map(x => (
										<Checkbox.Root
											key={x.key}
											size='sm'
											alignItems='flex-start'
											checked={keys.has(x.key)}
											onCheckedChange={e => {
												onEdit();
												setKeys(prev => {
													const next = new Set(prev);
													if (e.checked) next.add(x.key);
													else next.delete(x.key);
													return next;
												});
											}}>
											<Checkbox.HiddenInput />
											<Checkbox.Control mt='2px' />
											<Checkbox.Label>
												<Text
													fontSize='13px'
													fontWeight='500'>
													{x.label}
												</Text>
												{x.description && (
													<Text
														fontSize='12px'
														color='fg.muted'>
														{x.description}
													</Text>
												)}
											</Checkbox.Label>
										</Checkbox.Root>
									))}
								</Flex>
							)}
							{errorAt('permissions') && (
								<Text
									role='alert'
									fontSize='12.5px'
									color='red.fg'
									mt={1.5}>
									{errorAt('permissions')}
								</Text>
							)}
						</Box>
						{error && !error.on && (
							<Text
								role='alert'
								fontSize='13px'
								color='red.fg'>
								{error.message}
							</Text>
						)}
					</Flex>
				</form>
			</DialogBody>
			<DialogFooter>
				<DiscardButton onClick={onClose}>Cancel</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					type='submit'
					form='project-role'
					disabled={!name.trim() || !keys.size}
					loading={saving}>
					{role ? 'Save' : 'Add the role'}
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

export default RoleDialog;
