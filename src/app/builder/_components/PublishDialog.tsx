'use client';

import { FC, useState } from 'react';
import { Button, Dialog, Portal, Text, Textarea } from '@chakra-ui/react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '@/components/library';
import DiscardButton from '@/components/library/components/buttons/DiscardButton';

/** A notch smaller than the usual size sm, like the section modals' buttons. */
const COMPACT = { size: 'xs', h: '28px', px: 3 } as const;

type Props = {
	isOpen: boolean;
	onClose: () => void;
	/** Called with the version note (trimmed; undefined when left blank). */
	onConfirm: (note?: string) => void;
	route: string;
	/** Unsaved edits are saved before publishing — said so in the text. */
	isDirty: boolean;
	/** Where the publish is: saving the unsaved edits, then publishing. */
	step?: 'saving' | 'publishing' | null;
};

/**
 * "Publish /route?" — the same portalled Dialog as the table's confirm and
 * delete prompts (ConfirmModal, DeleteItemModal).
 *
 * The version note's state lives here, not in RouteEditor: held there, every
 * keystroke re-rendered the whole editor — all its tabs and the settings
 * editor — which is what made typing in the old prompt lag. The content is
 * mounted only while open, so a fresh note each time and no hidden DOM.
 */
const PublishDialog: FC<Props> = ({ isOpen, onClose, onConfirm, route, isDirty, step }) => {
	const [note, setNote] = useState('');
	const isLoading = !!step;

	const close = () => {
		setNote('');
		onClose();
	};

	return (
		<Dialog.Root
			placement='center'
			lazyMount
			unmountOnExit
			open={isOpen}
			onOpenChange={e => !e.open && !isLoading && close()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						borderWidth='1px'
						borderColor='border'
						_dark={{ bg: 'background.dark' }}>
						<AlertDialogHeader>Publish /{route}?</AlertDialogHeader>

						<Dialog.Body
							p={4}
							pb={6}>
							<Text
								fontSize='sm'
								color='fg.muted'>
								The draft{isDirty ? ' (including your unsaved changes)' : ''} goes live: the table, its filters
								and buttons change for every admin straight away. The current version is kept and can be restored.
							</Text>
							<Textarea
								mt={3}
								size='sm'
								rows={4}
								autoFocus
								resize='vertical'
								placeholder='Note for the version history (optional) — what changed and why'
								value={note}
								disabled={isLoading}
								onChange={e => setNote(e.target.value)}
								// Enter is a new line; Ctrl/⌘+Enter publishes.
								onKeyDown={e =>
									e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isLoading && onConfirm(note.trim() || undefined)
								}
							/>
							<Text
								mt={1}
								fontSize='xs'
								color='fg.subtle'>
								Ctrl/⌘ + Enter to publish
							</Text>
						</Dialog.Body>

						<ModalFooter>
							<DiscardButton
								{...COMPACT}
								disabled={isLoading}
								onClick={close}>
								Cancel
							</DiscardButton>
							<Button
								{...COMPACT}
								loading={isLoading}
								loadingText={step === 'saving' ? 'Saving' : 'Publishing'}
								spinnerPlacement='start'
								onClick={() => onConfirm(note.trim() || undefined)}>
								Publish
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default PublishDialog;
