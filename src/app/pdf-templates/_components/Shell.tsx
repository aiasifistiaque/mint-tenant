'use client';

import { FC, ReactNode } from 'react';
import { CloseButton, Dialog, Portal, Text } from '@chakra-ui/react';
import { ModalFooter, radius } from '@/components/library';

/** The dialog frame every PDF templates dialog uses: title, body, one footer. */
const Shell: FC<{
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	description?: ReactNode;
	maxW?: string;
	footer?: ReactNode;
	children: ReactNode;
	/** A selector inside the dialog for the cursor on opening (else its first control). */
	initialFocus?: string;
}> = ({ open, onClose, title, description, maxW = '640px', footer, children, initialFocus }) => (
	<Dialog.Root
		open={open}
		initialFocusEl={initialFocus ? () => document.querySelector<HTMLElement>(`[role=dialog] ${initialFocus}`) : undefined}
		onOpenChange={e => !e.open && onClose()}
		size='xl'
		placement='top'
		scrollBehavior='inside'
		lazyMount
		unmountOnExit>
		<Portal>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content
					maxW={maxW}
					borderRadius={radius.MODAL}
					bg='bg.panel'
					borderWidth='1px'
					borderColor='border'>
					<Dialog.Header
						px={{ base: 4, md: 6 }}
						pt={{ base: 4, md: 5 }}
						pb={description ? 1 : { base: 3, md: 4 }}
						pr={12}
						flexDirection='column'
						alignItems='flex-start'>
						<Dialog.Title fontSize='16px'>{title}</Dialog.Title>
					</Dialog.Header>
					{description && (
						<Text
							px={{ base: 4, md: 6 }}
							pb={4}
							fontSize='xs'
							color='fg.muted'>
							{description}
						</Text>
					)}
					<Dialog.CloseTrigger
						asChild
						top={3}
						right={3}>
						<CloseButton size='sm' />
					</Dialog.CloseTrigger>
					<Dialog.Body
						px={{ base: 4, md: 6 }}
						pt={0}
						pb={{ base: 4, md: 5 }}>
						{children}
					</Dialog.Body>
					{footer && <ModalFooter>{footer}</ModalFooter>}
				</Dialog.Content>
			</Dialog.Positioner>
		</Portal>
	</Dialog.Root>
);

export default Shell;
