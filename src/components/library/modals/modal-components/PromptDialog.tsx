'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { Box, Button, CloseButton, Dialog, Flex, Input, Portal, Text } from '@chakra-ui/react';
import { CircleHelp, Trash2, TriangleAlert } from 'lucide-react';
import { radius, styles } from '../../config';
import ModalFooter from './CustomModalFooter';

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

const TONES: Record<Tone, { bg: string; fg: string; icon: ReactNode; palette?: string }> = {
	danger: { bg: 'red.subtle', fg: 'red.fg', icon: <Trash2 size={18} strokeWidth={1.75} />, palette: 'red' },
	warning: { bg: 'orange.subtle', fg: 'orange.fg', icon: <TriangleAlert size={18} strokeWidth={1.75} /> },
	default: { bg: 'bg.muted', fg: 'fg.muted', icon: <CircleHelp size={18} strokeWidth={1.75} /> },
};

/**
 * The one "are you sure?" dialog: delete a record, delete ticked rows, revoke
 * a key, restart an app. An icon in the tone's colour, the question, what
 * happens, the record it happens to, and Cancel / the action on the footer
 * ledge. Focus starts on Cancel, so Enter on a destructive prompt does nothing
 * you didn't choose.
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

	return (
		<Dialog.Root
			lazyMount
			unmountOnExit
			role='alertdialog'
			placement='center'
			size={size}
			open={open}
			initialFocusEl={() => cancelRef.current}
			onOpenChange={e => !e.open && !loading && onClose()}>
			<Portal>
				<Dialog.Backdrop
					_light={{ bg: styles.color.MODAL_OVERLAY.LIGHT }}
					_dark={{ bg: styles.color.MODAL_OVERLAY.DARK }}
				/>
				<Dialog.Positioner px={4}>
					<Dialog.Content
						{...(styles.MODAL as any)}
						borderRadius={radius.MODAL}
						onClick={(e: any) => e.stopPropagation()}>
						<Dialog.CloseTrigger
							asChild
							top={3}
							insetEnd={3}>
							<CloseButton
								size='sm'
								borderRadius='full'
								color='fg.muted'
								_hover={{ bg: 'bg.muted', color: 'fg' }}
							/>
						</Dialog.CloseTrigger>

						<Dialog.Body
							px={{ base: 5, md: 6 }}
							pt={{ base: 5, md: 6 }}
							pb={{ base: 5, md: 6 }}>
							<Flex
								gap={4}
								align='flex-start'
								direction={{ base: 'column', sm: 'row' }}>
								<Flex
									flexShrink={0}
									w='40px'
									h='40px'
									align='center'
									justify='center'
									borderRadius='full'
									bg={t.bg}
									color={t.fg}>
									{icon || t.icon}
								</Flex>

								<Flex
									direction='column'
									gap={3}
									flex={1}
									minW={0}>
									<Box pr={6}>
										<Dialog.Title
											fontSize='16px'
											fontWeight='600'
											letterSpacing='-0.01em'
											lineHeight='1.4'>
											{title}
										</Dialog.Title>
										{description && (
											<Dialog.Description
												mt={1}
												fontSize='13px'
												lineHeight='1.55'
												color='fg.muted'>
												{description}
											</Dialog.Description>
										)}
									</Box>

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
								</Flex>
							</Flex>
						</Dialog.Body>

						<ModalFooter>
							{aside && (
								<Box
									mr='auto'
									fontSize='xs'
									color='fg.muted'>
									{aside}
								</Box>
							)}
							<Button
								ref={cancelRef}
								size='sm'
								px={3}
								variant='outline'
								disabled={loading}
								onClick={onClose}>
								{cancelLabel}
							</Button>
							<Button
								size='sm'
								px={3}
								colorPalette={t.palette}
								loading={loading}
								loadingText={loadingText}
								spinnerPlacement='start'
								disabled={blocked}
								onClick={onConfirm}>
								{confirmLabel}
							</Button>
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default PromptDialog;
