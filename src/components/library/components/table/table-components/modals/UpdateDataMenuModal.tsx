'use client';

import { Dialog, Button, useDisclosure, Text, Portal } from '@chakra-ui/react';
import { useEffect, useRef, FC, useState } from 'react';

import {
	useCustomToast,
	MenuItem,
	EditDataSelect,
	AlertSubmitButton,
	useUpdateByIdMutation,
	PromptType,
} from '../../../..';
import ModalFooter from '../../../../modals/modal-components/CustomModalFooter';

type UpdateKeyProps = {
	id: string;
	item: {
		title?: string;
		path: string;
		invalidate?: string[] | undefined;
		key: string;
		dataPath?: string;
		prompt?: PromptType;
	};
	doc?: any;
	// Controlled mode: when `open` is passed, the dialog's open state is driven
	// by the caller instead of an internal useDisclosure, and no trigger is
	// rendered — used by TableMenu so the dialog lives outside the dropdown
	// menu's own mount lifecycle.
	open?: boolean;
	onClose?: () => void;
};

const UpdateDataMenuModal: FC<UpdateKeyProps> = ({
	item,
	doc,
	id,
	open: controlledOpen,
	onClose: onControlledClose,
}) => {
	const isControlled = controlledOpen !== undefined;
	const { open: internalOpen, onOpen, onClose: internalOnClose } = useDisclosure();
	const isOpen = isControlled ? controlledOpen : internalOpen;
	const { title, path, prompt, invalidate, dataPath, key } = item;

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

	useCustomToast({
		successText: prompt?.successMsg || `Item updated successfully`,
		...result,
	});

	return (
		<>
			{!isControlled && <MenuItem onClick={onOpen}>{title}</MenuItem>}

			<Dialog.Root
				lazyMount
				unmountOnExit
				open={isOpen}
				onOpenChange={e => !e.open && closeItem()}>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<form onSubmit={handleSubmit}>
							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>{prompt?.title || `Update Item`}</Dialog.Title>
								</Dialog.Header>

								<Dialog.Body py={4}>
									<Text>{prompt?.body || 'Please select an option'}</Text>

									<EditDataSelect
										isRequired={true}
										dataPath={dataPath || ''}
										value={value}
										onChange={e => {
											setValue(e.target.value);
										}}
									/>
								</Dialog.Body>

								<ModalFooter>
									{!isLoading && (
										<Dialog.CloseTrigger asChild>
											<Button
												ref={cancelRef}
												px={3}
												size='sm'
												variant='outline'>
												Discard
											</Button>
										</Dialog.CloseTrigger>
									)}
									<AlertSubmitButton
										disabled={!value}
										isLoading={isLoading}>
										{prompt?.btnText || 'Update'}
									</AlertSubmitButton>
								</ModalFooter>
							</Dialog.Content>
						</form>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default UpdateDataMenuModal;
