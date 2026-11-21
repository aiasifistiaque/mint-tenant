'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { Box, Button, Input, Text } from '@chakra-ui/react';
import { CircleHelp, Trash2, TriangleAlert } from 'lucide-react';
import { radius, styles } from '../../config';
import {
	Dialog,
	DialogBody,
	DialogCloseButton,
	DialogFooter,
	DialogHeader,
} from '../../components/table/table-components/menu-modals';

type Tone = 'danger' | 'warning' | 'default';

export type PromptDialogProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: ReactNode;
	/** What will actually happen, in plain words. */
	description?: ReactNode;
	/** The thing being acted on (a record's code and name), shown in a chip. */
	subject?: ReactNode;
	tone?: Tone;
	/** Replaces the tone's icon. */
	icon?: ReactNode;
	confirmLabel?: ReactNode;
	cancelLabel?: ReactNode;
	loading?: boolean;
	loadingText?: string;
	/** Keeps the confirm button off, e.g. until a form inside is valid. */
	disabled?: boolean;
	/** The confirm stays off until this exact text is typed. */
	typeToConfirm?: string;
	/** Left side of the footer: a guide link, a note. */
	aside?: ReactNode;
	size?: 'xs' | 'sm' | 'md';
	children?: ReactNode;
};

const TONES: Record<Tone, { fg: string; icon: ReactNode; palette?: string }> = {
	danger: { fg: 'red.fg', icon: <Trash2 size={17} strokeWidth={1.75} />, palette: 'red' },
	warning: { fg: 'orange.fg', icon: <TriangleAlert size={17} strokeWidth={1.75} /> },
	default: { fg: 'fg.muted', icon: <CircleHelp size={17} strokeWidth={1.75} /> },
};

/**
 * The one "are you sure?" dialog: delete a record, delete ticked rows, revoke
 * a key, restart an app. Built on the shared modal shell (Dialog + DialogHeader
 * / DialogBody / DialogFooter), so it looks like every other modal — a centred
 * dialog on a computer, a bottom sheet on a phone. The tone's icon in the
 * header, what happens, the record it happens to, and Cancel / the action on
 * the footer. Focus starts on Cancel, so Enter on a destructive prompt does
 * nothing you didn't choose.
 */
const PromptDialog: FC<PromptDialogProps> = ({
	open,
	onClose,
	onConfirm,
	title,
	description,
	subject,
	tone = 'danger',
	icon,
	confirmLabel = tone === 'danger' ? 'Delete' : 'Confirm',
	cancelLabel = 'Cancel',
	loading,
	loadingText,
	disabled,
	typeToConfirm,
	aside,
	size = 'sm',
	children,
}) => {
	const t = TONES[tone];
	const cancelRef = useRef<HTMLButtonElement>(null);
	const [typed, setTyped] = useState('');

	// Reopening must not inherit the last attempt's text.
	useEffect(() => {
		if (open) setTyped('');
	}, [open]);

	const blocked = disabled || (!!typeToConfirm && typed.trim() !== typeToConfirm);
	const hasBody = !!(subject || children || typeToConfirm);

	return (
		<Dialog
			isOpen={open}
			onClose={() => !loading && onClose()}
			size={size}
			forceModal
			role='alertdialog'
			initialFocusEl={() => cancelRef.current}>
			<DialogHeader
				icon={
					<Box
						as='span'
						display='flex'
						color={t.fg}>
						{icon || t.icon}
					</Box>
				}
				description={description}>
				{title}
			</DialogHeader>
			<DialogCloseButton />
			{hasBody && (
				<DialogBody>
					<Box
						display='flex'
						flexDirection='column'
						gap={3}>
						{subject && (
							<Box
								px={3}
								py={2}
								borderWidth='1px'
								borderColor='border'
								borderRadius='md'
								bg='bg.subtle'
								fontSize='13px'
								fontWeight='500'
								wordBreak='break-word'>
								{subject}
							</Box>
						)}

						{children}

						{typeToConfirm && (
							<Box>
								<Text
									fontSize='13px'
									mb={1.5}>
									Type{' '}
									<Text
										as='span'
										fontWeight='600'
										fontFamily='mono'>
										{typeToConfirm}
									</Text>{' '}
									to confirm.
								</Text>
								<Input
									size='sm'
									value={typed}
									autoComplete='off'
									placeholder={typeToConfirm}
									borderRadius={radius.INPUT}
									onChange={e => setTyped(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && !blocked && !loading && onConfirm()}
								/>
							</Box>
						)}
					</Box>
				</DialogBody>
			)}

			<DialogFooter>
				{aside && (
					<Box
						mr='auto'
						fontSize='xs'
						color='fg.muted'>
						{aside}
					</Box>
				)}
				{/* DiscardButton's look; a plain Button so focus can start here. */}
				<Button
					ref={cancelRef}
					variant='outline'
					{...(styles.MODAL_BUTTON as any)}
					borderRadius={radius.BUTTON}
					disabled={loading}
					onClick={onClose}>
					{cancelLabel}
				</Button>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					colorPalette={t.palette}
					loading={loading}
					loadingText={loadingText}
					spinnerPlacement='start'
					disabled={blocked}
					onClick={onConfirm}>
					{confirmLabel}
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

export default PromptDialog;
