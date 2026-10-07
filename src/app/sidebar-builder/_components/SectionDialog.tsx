'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Dialog, Flex, Input, Portal, Textarea } from '@chakra-ui/react';
import { radius } from '@/components/library';
import { Section } from './draft';
import { Toggle } from './ItemDialog';
import { DocLink, IconField, Label } from './ui';
import { ModalFooter } from '@/components/library';

type Props = {
	section: Section | null;
	isNew: boolean;
	onClose: () => void;
	onSave: (section: Section) => void;
};

/** A sidebar section: the heading, its icon, and whether it shows. */
const SectionDialog: FC<Props> = ({ section, isNew, onClose, onSave }) => {
	const [draft, setDraft] = useState<Section | null>(section);
	const [touched, setTouched] = useState(false);

	useEffect(() => {
		setDraft(section);
		setTouched(false);
	}, [section]);

	if (!draft) return null;
	const set = (patch: Partial<Section>) => setDraft(d => (d ? { ...d, ...patch } : d));

	const save = () => {
		setTouched(true);
		if (!draft.name.trim()) return;
		onSave({ ...draft, name: draft.name.trim() });
	};

	return (
		<Dialog.Root
			placement='center'
			size='md'
			open={!!section}
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
								<Dialog.Title fontSize='16px'>{isNew ? 'Add a section' : 'Edit section'}</Dialog.Title>
								<DocLink section='sections' />
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
										hint='The heading its pages are grouped under.'>
										Name
									</Label>
									<Input
										size='sm'
										autoFocus
										value={draft.name}
										maxLength={200}
										placeholder='e.g. Accounts'
										onChange={e => set({ name: e.target.value })}
									/>
									{touched && !draft.name.trim() && (
										<Box
											fontSize='xs'
											color='red.fg'
											mt={1}>
											Give the section a name.
										</Box>
									)}
								</Box>

								<IconField
									value={draft.icon}
									onChange={icon => set({ icon })}
									hint='Shown beside the section name. Copy a name from the Lucide catalogue.'
								/>

								<Toggle
									label='Show in the sidebar'
									hint='Off hides the section and every page in it, without deleting anything.'
									checked={draft.isActive}
									onChange={isActive => set({ isActive })}
								/>

								<Box>
									<Label hint='Shown when the pointer rests on the section.'>Tooltip</Label>
									<Input
										size='sm'
										value={draft.tooltip}
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
									{isNew ? 'Add section' : 'Done'}
								</Button>
							</Flex>
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default SectionDialog;
