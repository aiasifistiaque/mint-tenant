'use client';

import { Dialog, Button, useDisclosure, Text, Portal } from '@chakra-ui/react';
import { useEffect, useRef, FC, useState } from 'react';

import {
	useCustomToast,
	MenuItem,
	AlertSubmitButton,
	useUpdateByIdMutation,
	PromptType,
	Column,
	Input,
	AlertDialogHeader,
} from '../../../..';
import ModalFooter from '../../../../modals/modal-components/CustomModalFooter';

type UpdateKeyProps = {
	id: string;
	path: string;
	type: 'text' | 'number';
	item: {
		title?: string;
		path: string;
		invalidate?: string[] | undefined;
		key: string;
		dataPath?: string;
		prompt?: PromptType;
	};
	doc?: any;
	icon?: string;
	// Controlled mode: when `open` is passed, the dialog's open state is driven
	// by the caller instead of an internal useDisclosure, and no trigger is
	// rendered — used by TableMenu so the dialog lives outside the dropdown
	// menu's own mount lifecycle.
	open?: boolean;
	onClose?: () => void;
};

const UpdateStringModal: FC<UpdateKeyProps> = ({
	item,
	doc,
	id,
	path,
	type,
	icon,
	open: controlledOpen,
	onClose: onControlledClose,
}) => {
	const isControlled = controlledOpen !== undefined;
	const { open: internalOpen, onOpen, onClose: internalOnClose } = useDisclosure();
	const isOpen = isControlled ? controlledOpen : internalOpen;
	const { title, prompt, invalidate, dataPath, key } = item;

	const cancelRef = useRef<any>(undefined);
	const [value, setValue] = useState<any>();

	const [trigger, result] = useUpdateByIdMutation();
	const { isLoading, isSuccess, reset } = result;

	const closeItem = () => {
		reset();
		setValue(undefined);
		if (isControlled) onControlledClose?.();
		else internalOnClose();
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({
			path: path,
			id,
			body: {
				[key]: value,
			},
			invalidate,
		});
	};

	useEffect(() => {
		if (!isLoading && isSuccess) {
			closeItem();
		}
	}, [isLoading]);

	const onModalOpen = () => {
		onOpen();
		setValue(doc?.[key]);
	};

	// Controlled path: there's no trigger onClick to hang initialization off
	// of, so run it whenever the caller flips `open` to true.
	useEffect(() => {
		if (isControlled && controlledOpen) setValue(doc?.[key]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isControlled, controlledOpen]);

	useCustomToast({
		successText: prompt?.successMsg || `Item updated successfully`,
		...result,
	});

	return (
		<>
			{!isControlled && (
				<MenuItem
					icon={'update-key'}
					onClick={onModalOpen}>
					{title}
				</MenuItem>
			)}

			<Dialog.Root
				lazyMount
				unmountOnExit
				placement='center'
				open={isOpen}
				onOpenChange={e => !e.open && closeItem()}>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content>
							<form onSubmit={handleSubmit}>
								<AlertDialogHeader>
									<Dialog.Title>{prompt?.title || `Update Item`}</Dialog.Title>
								</AlertDialogHeader>

								<Dialog.Body p={6}>
									<Column gap={4}>
										<Text>{prompt?.body || 'Please select an option'}</Text>
										<Input
											size='sm'
											value={value}
											onChange={e => setValue(e.target.value)}
											type={type}
										/>
									</Column>
								</Dialog.Body>

								<ModalFooter>
									{!isLoading && (
										// <Dialog.CloseTrigger asChild>
										<Button
											px={3}
											onClick={closeItem}
											ref={cancelRef}
											size='sm'
											variant='outline'>
											Discard
										</Button>
										// </Dialog.CloseTrigger>
									)}
									<AlertSubmitButton
										disabled={!value}
										loading={isLoading}>
										{prompt?.btnText || 'Update'}
									</AlertSubmitButton>
								</ModalFooter>
							</form>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default UpdateStringModal;
