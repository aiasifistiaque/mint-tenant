'use client';

import { Dialog, Button, useDisclosure, Portal } from '@chakra-ui/react';
import { useEffect, FC, useRef } from 'react';

import { useCopyItemMutation } from '../../../../store';
import { useCustomToast, MenuItem } from '../../../..';
import ModalFooter from '../../../../modals/modal-components/CustomModalFooter';

type DeleteItemModalProps = {
	title?: string;
	id: string;
	path: string;
	// Controlled mode: when `open` is passed, the dialog's open state is driven
	// by the caller instead of an internal useDisclosure, and no trigger is
	// rendered — used by TableMenu so the dialog lives outside the dropdown
	// menu's own mount lifecycle.
	open?: boolean;
	onClose?: () => void;
};

const DuplicateModal: FC<DeleteItemModalProps> = ({
	title,
	path,
	id,
	open: controlledOpen,
	onClose: onControlledClose,
}) => {
	const isControlled = controlledOpen !== undefined;
	const { open: internalOpen, onOpen, onClose: internalOnClose } = useDisclosure();
	const isOpen = isControlled ? controlledOpen : internalOpen;
	const cancelRef = useRef<any>(undefined);

	const [trigger, result] = useCopyItemMutation();

	const closeItem = () => {
		result?.reset();
		if (isControlled) onControlledClose?.();
		else internalOnClose();
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({ path: path, body: { id } });
	};

	useEffect(() => {
		if (result?.isSuccess && !result?.isLoading) {
			closeItem();
		}
	}, [result?.isLoading]);

	useCustomToast({
		successText: `${title ? title : 'Item'} Copied Successfully`,
		isSuccess: result?.isSuccess,
		isError: result?.isError,
		isLoading: result?.isLoading,
		error: result?.error,
	});

	return (
		<>
			{!isControlled && (
				<MenuItem
					onClick={onOpen}
					icon='duplicate'>
					Make Copy
				</MenuItem>
			)}

			<Dialog.Root
				lazyMount
				unmountOnExit
				open={isOpen}
				onOpenChange={(e: any) => !e.open && closeItem()}
				placement='center'>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>Create Duplicate Entry</Dialog.Title>
							</Dialog.Header>

							<Dialog.Body>Are you sure you want to make a copy of this item?</Dialog.Body>

							<ModalFooter>
								{!result?.isLoading && (
									<Dialog.CloseTrigger asChild>
										<Button
											ref={cancelRef}
											onClick={closeItem}
											px={3}
											size='sm'
											variant='outline'>
											Discard
										</Button>
									</Dialog.CloseTrigger>
								)}
								<Button
									loading={result?.isLoading}
									onClick={handleSubmit}
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

export default DuplicateModal;
