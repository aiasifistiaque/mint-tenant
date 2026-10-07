'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Collapsible, Dialog, Flex, Grid, Input, InputGroup, Portal, Switch, Text, Textarea } from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
import { radius } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { cleanHref, defaultPermission, Item, itemProblem, Section } from './draft';
import { DocLink, IconField, Label } from './ui';
import { ModalFooter } from '@/components/library';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';

export type PermissionGroup = { title: string; fields: { label: string; value: string }[] };

type Props = {
	/** The page being edited, or a blank one for "Add page". */
	item: Item | null;
	sectionKey: string;
	sections: Section[];
	permissions: PermissionGroup[];
	isNew: boolean;
	onClose: () => void;
	onSave: (item: Item, sectionKey: string) => void;
};

/**
 * One page of the sidebar. The fields a person needs are up front — its
 * label, where it goes, which section it's in, and who can see it; tooltip,
 * description and icon wait under "More options".
 */
const ItemDialog: FC<Props> = ({ item, sectionKey, sections, permissions, isNew, onClose, onSave }) => {
	const [draft, setDraft] = useState<Item | null>(item);
	const [section, setSection] = useState(sectionKey);
	const [touched, setTouched] = useState(false);

	useEffect(() => {
		setDraft(item);
		setSection(sectionKey);
		setTouched(false);
	}, [item, sectionKey]);

	if (!draft) return null;
	const set = (patch: Partial<Item>) => setDraft(d => (d ? { ...d, ...patch } : d));
	const problem = itemProblem(draft);
	const suggested = defaultPermission(draft.href);
	const known = permissions.some(g => g.fields.some(f => f.value === draft.permission));

	const save = () => {
		setTouched(true);
		if (problem) return;
		onSave(
			{
				...draft,
				name: draft.name.trim(),
				href: cleanHref(draft.href),
				permission: draft.permission.trim() || suggested,
			},
			section
		);
	};

	return (
		<Dialog.Root
			placement='center'
			size='md'
			open={!!item}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content
						borderRadius={radius.MODAL}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'>
						<Dialog.Header
							px={{ base: 4, md: 6 }}
							pt={{ base: 4, md: 5 }}
							pb={{ base: 3, md: 4 }}
							fontSize='16px'
							fontWeight='600'>
							<Flex
								align='center'
								justify='space-between'
								gap={3}
								pr={2}>
								<Dialog.Title fontSize='16px'>{isNew ? 'Add a page' : 'Edit page'}</Dialog.Title>
								<DocLink section='pages' />
							</Flex>
						</Dialog.Header>

						<Dialog.Body
							px={{ base: 4, md: 6 }}
							pt={0}
							pb={{ base: 4, md: 5 }}>
							<Flex
								direction='column'
								gap={4}>
								<Box>
									<Label
										required
										hint='What people read in the sidebar.'>
										Label
									</Label>
									<Input
										size='sm'
										autoFocus
										value={draft.name}
										placeholder='e.g. Invoices'
										onChange={e => set({ name: e.target.value })}
									/>
									{touched && !draft.name.trim() && <Error>Give the page a label.</Error>}
								</Box>

								<Box>
									<Label
										required
										hint='The admin address it opens — the part after the domain.'>
										Page address
									</Label>
									<InputGroup
										startElement={
											<Text
												fontSize='sm'
												color='fg.muted'>
												/
											</Text>
										}>
										<Input
											size='sm'
											fontFamily='mono'
											value={draft.href}
											placeholder='invoices'
											onChange={e => set({ href: e.target.value.replace(/^\/+/, '') })}
										/>
									</InputGroup>
									{touched && !cleanHref(draft.href) && <Error>Say which page it opens.</Error>}
								</Box>

								<Box>
									<Label hint='The group it sits under.'>Section</Label>
									<Dropdown
										value={section}
										onChange={setSection}>
										{sections.map(s => (
											<option
												key={s.key}
												value={s.key}>
												{s.name || 'Untitled section'}
											</option>
										))}
									</Dropdown>
								</Box>

								<Toggle
									label='Show in the sidebar'
									hint='Off hides it for everyone without deleting it.'
									checked={draft.isActive}
									onChange={isActive => set({ isActive })}
								/>

								<Box
									borderWidth='1px'
									borderColor='border.muted'
									borderRadius='md'
									p={3}>
									<Toggle
										label={IS_TENANT_PANEL ? 'Only people who can view records' : 'Only people with a permission'}
										hint={
											IS_TENANT_PANEL
												? 'Off shows it to everyone who can open the project. On: only roles with View on records.'
												: 'Off shows it to everyone who can sign in. The page itself still checks access.'
										}
										checked={draft.permissionProtected}
										onChange={permissionProtected =>
											set({ permissionProtected, permission: draft.permission || suggested })
										}
									/>
									{/* Projects have no per-page permissions to pick from (WO-21): the page's view key is used. */}
									{draft.permissionProtected && !IS_TENANT_PANEL && (
										<Box mt={3}>
											<Flex
												align='center'
												justify='space-between'
												mb={1.5}>
												<Text
													fontSize='xs'
													fontWeight='600'>
													Permission
												</Text>
												<DocLink
													section='access'
													label='Which one?'
												/>
											</Flex>
											<Dropdown
												value={draft.permission}
												placeholder='Pick a permission'
												onChange={permission => set({ permission })}>
												{!known && draft.permission && (
													<option value={draft.permission}>{draft.permission} (current)</option>
												)}
												{permissions.map(g => (
													<optgroup
														key={g.title}
														label={g.title}>
														{g.fields.map(f => (
															<option
																key={f.value}
																value={f.value}>
																{`${f.label} (${f.value})`}
															</option>
														))}
													</optgroup>
												))}
											</Dropdown>
											<Text
												fontSize='xs'
												color='fg.muted'
												mt={1.5}>
												Roles holding this permission (or all permissions) see the page.
											</Text>
										</Box>
									)}
								</Box>

								<Collapsible.Root>
									<Collapsible.Trigger asChild>
										<Button
											size='xs'
											variant='ghost'
											px={1}
											color='fg.muted'>
											More options
											<ChevronDown size={12} />
										</Button>
									</Collapsible.Trigger>
									<Collapsible.Content>
										<Grid
											gap={4}
											pt={3}>
											<Box>
												<Label hint='Shown when the pointer rests on the page in the sidebar.'>Tooltip</Label>
												<Input
													size='sm'
													value={draft.tooltip}
													maxLength={200}
													onChange={e => set({ tooltip: e.target.value })}
												/>
											</Box>
											<Box>
												<Label hint='A note for the people who manage the sidebar.'>Description</Label>
												<Textarea
													size='sm'
													rows={2}
													value={draft.description}
													onChange={e => set({ description: e.target.value })}
												/>
											</Box>
											<IconField
												value={draft.icon}
												onChange={icon => set({ icon })}
												hint='Stored with the page for places that show page icons. The sidebar shows section icons only.'
											/>
										</Grid>
									</Collapsible.Content>
								</Collapsible.Root>
							</Flex>
						</Dialog.Body>

						<ModalFooter>
							<Flex
								gap={2}
								justify='flex-end'
								w='full'>
								<Button
									px={3}
									size='sm'
									variant='outline'
									onClick={onClose}>
									Cancel
								</Button>
								<Button
									px={3}
									size='sm'
									onClick={save}>
									{isNew ? 'Add page' : 'Done'}
								</Button>
							</Flex>
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

const Error: FC<{ children: string }> = ({ children }) => (
	<Text
		fontSize='xs'
		color='red.fg'
		mt={1}>
		{children}
	</Text>
);

export const Toggle: FC<{ label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }> = ({
	label,
	hint,
	checked,
	onChange,
}) => (
	<Flex
		align='center'
		justify='space-between'
		gap={4}>
		<Box>
			<Text
				fontSize='sm'
				fontWeight='500'>
				{label}
			</Text>
			<Text
				fontSize='xs'
				color='fg.muted'>
				{hint}
			</Text>
		</Box>
		<Switch.Root
			checked={checked}
			onCheckedChange={d => onChange(d.checked)}>
			<Switch.HiddenInput />
			<Switch.Control />
		</Switch.Root>
	</Flex>
);

export default ItemDialog;
