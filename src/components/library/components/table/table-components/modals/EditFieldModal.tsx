'use client';

import { Dialog, Button, useDisclosure, Portal } from '@chakra-ui/react';
import { useEffect, useRef, FC } from 'react';
import { useCustomToast, MenuItem } from '../../../..';
import { useGetByIdToEditQuery, useUpdateManyMutation } from '../../../../store';
import ModalFooter from '../../../../modals/modal-components/CustomModalFooter';

type EditManyModalType = {
	title?: string;
	item: string;
	path: string;
	keys: string;
	value: any;
	keyType: string;

	prompt?: {
		title?: string;
		body?: string;
	};
};

const EditFieldModal: FC<EditManyModalType> = ({
	title,
	path,
	item,
	prompt,
	keys,
	keyType = 'string',
	value,
}) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const cancelRef = useRef<any>(undefined);

	const { data, isFetching } = useGetByIdToEditQuery({ path, id: item });

	const [trigger, result] = useUpdateManyMutation();
	const { isLoading, isSuccess, isError, error, reset } = result;

	const closeItem = () => {
		reset();
		onClose();
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({
			path,
			body: {
				ids: [item],
				type: keyType,
				updates: {
					[keys]: value,
				},
			},
		});
	};

	useEffect(() => {
		if (!isLoading && isSuccess) {
			closeItem();
		}
	}, [isLoading]);

	useCustomToast({
		successText: `Info Updated Successfully`,
		isSuccess,
		isError,
		isLoading,
		error,
	});

	return (
		<>
			<MenuItem onClick={onOpen}>{title}</MenuItem>

			<Dialog.Root
				lazyMount
				unmountOnExit
				open={isOpen}
				onOpenChange={(e: any) => !e.open && closeItem()}
				role='alertdialog'>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content
							boxShadow='lg'
							borderRadius='xl'
							bg='menu.light'
							_dark={{
								bg: 'menu.dark',
							}}>
							<Dialog.Header>
								<Dialog.Title>{prompt?.title || `Edit ${title}`}</Dialog.Title>
							</Dialog.Header>

							<Dialog.Body pt={4}>
								{prompt?.body || 'Are you sure you want to edit these items?'}
							</Dialog.Body>

							<ModalFooter>
								{!isLoading && (
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
									loading={isLoading}
									colorPalette='brand'
									onClick={handleSubmit}
									px={3}
									size='sm'>
									Edit
								</Button>
							</ModalFooter>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default EditFieldModal;
