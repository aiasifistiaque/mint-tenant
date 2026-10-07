'use client';

import { FC } from 'react';
import { Box, CloseButton, Dialog, Flex, Grid, Portal, Text } from '@chakra-ui/react';
import { AlertDialogContent, AlertDialogHeader } from '@/components/library';
import KindIcon from './KindIcon';
import { FieldKind, KINDS, KIND_GROUPS } from './modelKinds';

/**
 * "Add a field": every kind as a card — its picture, its name and what it's
 * for, grouped — so the first thing chosen is what the field holds, in plain
 * words, rather than a word in a dropdown. The kind can still be changed in
 * the field's row afterwards.
 */

const GROUP_HINT: Record<string, string> = {
	Text: 'Words people type',
	Values: 'Numbers, dates and yes/no',
	Choices: 'Picked from a list',
	Media: 'Uploads',
	Links: 'Other records',
	Sections: 'Groups of fields',
};

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onPick: (kind: FieldKind) => void;
	/** The kinds offered — all by default; a section's own fields get SUB_KINDS. */
	kinds?: FieldKind[];
};

const KindPicker: FC<Props> = ({ isOpen, onClose, onPick, kinds }) => {
	const offered = KINDS.filter(k => !k.hidden && (!kinds || kinds.includes(k.value)));
	return (
		<Dialog.Root
			open={isOpen}
			onOpenChange={e => !e.open && onClose()}
			size='xl'
			placement='center'
			scrollBehavior='inside'
			lazyMount
			unmountOnExit>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent maxW='860px'>
						<AlertDialogHeader>What will this field hold?</AlertDialogHeader>
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
								Pick a type — you can change it later. You’ll name the field next.
							</Text>
							<Flex
								direction='column'
								gap={5}>
								{KIND_GROUPS.filter(g => offered.some(k => k.group === g)).map(g => (
									<Box key={g}>
										<Flex
											align='baseline'
											gap={2}
											mb={2}>
											<Text
												fontSize='xs'
												fontWeight='600'
												textTransform='uppercase'
												letterSpacing='0.06em'>
												{g}
											</Text>
											<Text
												fontSize='xs'
												color='fg.muted'>
												{GROUP_HINT[g]}
											</Text>
										</Flex>
										<Grid
											templateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }}
											gap={2}>
											{offered
												.filter(k => k.group === g)
												.map(k => (
													<Flex
														key={k.value}
														as='button'
														data-kind={k.value}
														align='flex-start'
														gap={3}
														p={3}
														textAlign='left'
														borderWidth='1px'
														borderColor='border'
														borderRadius='lg'
														bg='bg.panel'
														cursor='pointer'
														transition='border-color 0.12s, background 0.12s'
														_hover={{ borderColor: 'fg.muted', bg: 'bg.subtle' }}
														_focusVisible={{ outline: '2px solid', outlineColor: 'fg', outlineOffset: '1px' }}
														onClick={() => onPick(k.value)}>
														<KindIcon kind={k.value} />
														<Box minW={0}>
															<Text
																fontSize='sm'
																fontWeight='600'
																lineHeight='1.3'>
																{k.label}
															</Text>
															<Text
																fontSize='xs'
																color='fg.muted'
																lineHeight='1.35'
																mt={0.5}
																lineClamp={2}>
																{k.hint}
															</Text>
														</Box>
													</Flex>
												))}
										</Grid>
									</Box>
								))}
							</Flex>
						</Dialog.Body>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default KindPicker;
