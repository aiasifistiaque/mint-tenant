'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { Button, Dialog, Flex, Input, Link, Portal, Text } from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '../../modals';
import DiscardButton from '../../components/buttons/DiscardButton';
import PromptDialog from '../../modals/modal-components/PromptDialog';
import { GUIDE } from './utils';

/** A link into the media guide, opened beside the page rather than in place of it. */
export const DocLink: FC<{ section: string; label?: string }> = ({ section, label = 'How this works' }) => (
	<Link
		href={`${GUIDE}#${section}`}
		target='_blank'
		rel='noopener noreferrer'
		display='inline-flex'
		alignItems='center'
		gap={1}
		fontSize='xs'
		color='fg.muted'
		flexShrink={0}
		_hover={{ color: 'fg', textDecoration: 'underline' }}>
		{label}
		<ExternalLink size={11} />
	</Link>
);

/**
 * The portalled Dialog every media dialog uses (see ConfirmModal / PublishDialog):
 * header with a guide link, body, and the shared ModalFooter.
 */
export const MediaDialog: FC<{
	isOpen: boolean;
	onClose: () => void;
	title: ReactNode;
	doc?: string;
	children: ReactNode;
	footer?: ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	placement?: 'center' | 'top';
	busy?: boolean;
	/** What gets focus on open — otherwise the first focusable, the guide link. */
	initialFocusEl?: () => HTMLElement | null;
}> = ({ isOpen, onClose, title, doc, children, footer, size = 'sm', placement = 'center', busy, initialFocusEl }) => (
	<Dialog.Root
		placement={placement}
		size={size}
		initialFocusEl={initialFocusEl}
		open={isOpen}
		onOpenChange={e => !e.open && !busy && onClose()}>
		<Portal>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<AlertDialogContent
					borderWidth='1px'
					borderColor='border'
					_dark={{ bg: 'background.dark' }}>
					{/* The title element sizes to its text; stretch it so the guide link sits at the far right. */}
					<AlertDialogHeader css={{ '& > *': { flex: 1 } }}>
						<Flex
							w='full'
							align='center'
							justify='space-between'
							gap={3}>
							<span>{title}</span>
							{doc && <DocLink section={doc} />}
						</Flex>
					</AlertDialogHeader>
					<Dialog.Body
						p={4}
						pb={5}>
						{children}
					</Dialog.Body>
					{footer && <ModalFooter>{footer}</ModalFooter>}
				</AlertDialogContent>
			</Dialog.Positioner>
		</Portal>
	</Dialog.Root>
);

/** "New folder" — one name field, Enter to create. */
export const NameDialog: FC<{
	isOpen: boolean;
	onClose: () => void;
	title: string;
	label: string;
	initial?: string;
	confirmLabel: string;
	busy?: boolean;
	doc?: string;
	onConfirm: (name: string) => void;
}> = ({ isOpen, onClose, title, label, initial = '', confirmLabel, busy, doc, onConfirm }) => {
	const [name, setName] = useState(initial);
	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (isOpen) setName(initial);
	}, [isOpen, initial]);
	const submit = () => name.trim() && !busy && onConfirm(name.trim());

	return (
		<MediaDialog
			isOpen={isOpen}
			onClose={onClose}
			title={title}
			doc={doc}
			busy={busy}
			initialFocusEl={() => inputRef.current}
			footer={
				<>
					<DiscardButton
						onClick={onClose}
						disabled={busy}>
						Cancel
					</DiscardButton>
					<Button
						size='sm'
						px={3}
						loading={busy}
						disabled={!name.trim()}
						onClick={submit}>
						{confirmLabel}
					</Button>
				</>
			}>
			<Text
				fontSize='xs'
				fontWeight='600'
				mb={1.5}>
				{label}
			</Text>
			<Input
				ref={inputRef}
				size='sm'
				value={name}
				onFocus={e => e.target.select()}
				onChange={e => setName(e.target.value)}
				onKeyDown={e => e.key === 'Enter' && submit()}
			/>
		</MediaDialog>
	);
};

/** Yes/no prompt for the irreversible actions (delete forever, empty trash). */
export const ConfirmDialog: FC<{
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	confirmLabel: string;
	busy?: boolean;
	doc?: string;
	onConfirm: () => void;
}> = ({ isOpen, onClose, title, children, confirmLabel, busy, doc, onConfirm }) => (
	<PromptDialog
		open={isOpen}
		onClose={onClose}
		onConfirm={onConfirm}
		tone='danger'
		title={title}
		description={children}
		confirmLabel={confirmLabel}
		loading={busy}
		aside={doc && <DocLink section={doc} />}
	/>
);
