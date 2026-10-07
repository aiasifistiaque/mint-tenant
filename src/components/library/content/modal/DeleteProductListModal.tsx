// 'use client';

// import {
// 	AlertDialog,
// 	AlertDialogBody,
// 	AlertDialogFooter,
// 	AlertDialogOverlay,
// 	Button,
// 	Flex,
// 	useDisclosure,
// } from '@chakra-ui/react';
// import  { useEffect } from 'react';

// import {
// 	useCustomToast,
// 	AlertDialogHeader,
// 	AlertDialogContent,
// 	useDeleteByIdMutation,
// } from '../../';

// type DeleteItemModalProps = {
// 	title?: string;
// 	id: string;
// 	path?: string;
// 	children: ReactNode;
// };

// const DeleteProductListModal: FC<DeleteItemModalProps> = ({
// 	title,
// 	id,
// 	children,
// 	path = 'nexa',
// }) => {
// 	const {open: isOpen, onOpen, onClose } = useDisclosure();
// 	const cancelRef = useRef<any>(undefined);

// 	const [trigger, result] = useDeleteByIdMutation();

// 	const closeItem = () => {
// 		result?.reset();
// 		onClose();
// 	};

// 	const handleDelete = (e: any) => {
// 		e.preventDefault();
// 		trigger({
// 			id: id,
// 			path: `/contents/product/${path}`,
// 			invalidate: ['content', 'product', 'products'],
// 		});
// 	};

// 	useEffect(() => {
// 		if (result?.isSuccess && !result?.isLoading) {
// 			closeItem();
// 		}
// 	}, [result?.isLoading]);

// 	useCustomToast({
// 		successText: `${title ? title : 'Item'} Deleted Successfully`,
// 		isSuccess: result?.isSuccess,
// 		isError: result?.isError,
// 		isLoading: result?.isLoading,
// 		error: result?.error,
// 	});

// 	return (
// 		<>
// 			<Flex onClick={onOpen}>{children}</Flex>

// 			<AlertDialog
// 				isOpen={isOpen}
// 				leastDestructiveRef={cancelRef}
// 				onClose={closeItem}>
// 				<AlertDialogOverlay>
// 					<AlertDialogContent>
// 						<AlertDialogHeader>Delete {title}</AlertDialogHeader>

// 						<AlertDialogBody>
// 							Are you sure? You {`can't`} undo this action afterwards.
// 						</AlertDialogBody>

// 						<AlertDialogFooter>
// 							{!result?.isLoading && (
// 								<Button
// 									ref={cancelRef}
// 									onClick={closeItem}
// 									size='sm'
// 									colorPalette='gray'>
// 									Discard
// 								</Button>
// 							)}
// 							<Button
// 								isLoading={result?.isLoading}
// 								colorPalette='red'
// 								onClick={handleDelete}
// 								ml={2}
// 								size='sm'>
// 								Delete
// 							</Button>
// 						</AlertDialogFooter>
// 					</AlertDialogContent>
// 				</AlertDialogOverlay>
// 			</AlertDialog>
// 		</>
// 	);
// };

// export default DeleteProductListModal;

'use client';

import { Button, Flex, useDisclosure, Portal } from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';
import { useEffect, ReactNode, FC, useRef } from 'react';

import { useCustomToast, useDeleteByIdMutation, useDeleteProductlistByKeyIdMutation } from '../..';
import ModalFooter from '../../modals/modal-components/CustomModalFooter';

type DeleteItemModalProps = {
	title?: string;
	id: string;
	path?: string;
	children: ReactNode;
	productListKeys?: any;
};

const DeleteProductListModal: FC<DeleteItemModalProps> = ({
	title,
	id,
	children,
	path = 'pulse',
	productListKeys,
}) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const cancelRef = useRef<any>(undefined);
	const [trigger, result] = useDeleteByIdMutation();
	const [triggerProduct, productResult] = useDeleteProductlistByKeyIdMutation();
	const closeItem = () => {
		result?.reset();
		productResult?.reset();
		onClose();
	};

	const handleDelete = (e: any) => {
		e.preventDefault();
		if (productListKeys) {
			triggerProduct({
				id: id,
				path: `/contents/product/${path}`,
				key: productListKeys,
				invalidate: ['content', 'product', 'products'],
			});
		} else {
			trigger({
				id: id,
				path: `/contents/product/${path}`,
				invalidate: ['content', 'product', 'products'],
			});
		}
	};

	useEffect(() => {
		if (result?.isSuccess && !result?.isLoading) {
			closeItem();
		}
	}, [result?.isLoading]);

	useEffect(() => {
		if (productResult?.isSuccess && !productResult?.isLoading) {
			closeItem();
		}
	}, [productResult?.isLoading]);

	useCustomToast({
		successText: `${title ? title : 'Item'} Deleted Successfully`,
		isSuccess: result?.isSuccess,
		isError: result?.isError,
		isLoading: result?.isLoading,
		error: result?.error,
	});
	useCustomToast({
		successText: `${title ? title : 'Item'} Deleted Successfully`,
		isSuccess: productResult?.isSuccess,
		isError: productResult?.isError,
		isLoading: productResult?.isLoading,
		error: productResult?.error,
	});

	return (
		<>
			<Flex onClick={onOpen}>{children}</Flex>

			<Dialog.Root
				lazyMount
				unmountOnExit
				open={isOpen}
				onOpenChange={(e: any) => (e.open ? onOpen() : closeItem())}
				role='alertdialog'>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>Delete {title}</Dialog.Title>
							</Dialog.Header>

							<Dialog.Body>Are you sure? You {`can't`} undo this action afterwards.</Dialog.Body>

							<ModalFooter>
								{!result?.isLoading && (
									<Dialog.ActionTrigger asChild>
										<Button
											onClick={closeItem}
											px={3}
											size='sm'
											variant='outline'>
											Discard
										</Button>
									</Dialog.ActionTrigger>
								)}
								<Button
									loading={result?.isLoading}
									colorPalette='red'
									onClick={handleDelete}
									px={3}
									size='sm'>
									Delete
								</Button>
							</ModalFooter>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default DeleteProductListModal;
