'use client';

import { Dialog, Button, Flex, useDisclosure, Portal } from '@chakra-ui/react';
import { FC, useRef } from 'react';
import ModalFooter from '../../../modals/modal-components/CustomModalFooter';

type DeleteItemModalProps = {
	title?: string;
	trigger: any;
	onClick: any;
	description?: string;
};

const EmptyCartModal: FC<DeleteItemModalProps> = ({ trigger, title, description, onClick }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const cancelRef = useRef<any>(undefined);

	const closeItem = () => {
		onClose();
	};

	const handleDelete = () => {
		onClick();
		closeItem();
	};

	return (
		<>
			<Flex onClick={onOpen}>{trigger}</Flex>

			<Dialog.Root
				lazyMount
				unmountOnExit
				open={isOpen}
				onOpenChange={e => !e.open && closeItem()}
				role='alertdialog'>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>{title || 'Delete'}</Dialog.Title>
							</Dialog.Header>

							<Dialog.Body>
								{description || `Are you sure? You can't undo this action afterwards.`}
							</Dialog.Body>

							<ModalFooter>
								<Dialog.CloseTrigger asChild>
									<Button
										ref={cancelRef}
										px={3}
										size='sm'
										variant='outline'>
										Discard
									</Button>
								</Dialog.CloseTrigger>

								<Button
									colorPalette='red'
									onClick={handleDelete}
									px={3}
									size='sm'>
									Proceed
								</Button>
							</ModalFooter>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default EmptyCartModal;
