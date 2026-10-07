// import  { FormEvent, useEffect, useState } from 'react';
// import {
// 	Flex,
// 	Modal,
// 	ModalBody,
// 	ModalCloseButton,
// 	ModalOverlay,
// 	useDisclosure,
// } from '@chakra-ui/react';

// import {
// 	ModalFormSection,
// 	useCustomToast,
// 	ModalContainer,
// 	useFormData,
// 	InputData,
// 	ModalHeader,
// 	ModalFooter,
// 	FormMain,
// 	DiscardButton,
// 	ModalSubmitButton,
// 	useUpdateByIdMutation,
// } from '../..';

// type CreateModalProps = {
// 	dataModel: InputData<any>[];
// 	children?: ReactNode;
// 	path?: string;
// 	type?: 'post' | 'update';
// 	id: string;
// 	title?: string;
// 	data: any;
// };

// const EditProductListModal = ({
// 	data,
// 	dataModel,
// 	children,
// 	path = 'nexa',
// 	title,
// 	type,
// 	id,
// }: CreateModalProps) => {
// 	const {open: isOpen, onOpen, onClose } = useDisclosure();

// 	const [formData, setFormData] = useFormData<any>(dataModel, data);

// 	const [trigger, result] = useUpdateByIdMutation();

// 	const onModalOpen = () => {
// 		setFormData(data);
// 		onOpen();
// 	};

// 	const { isSuccess, isLoading, isError, error } = result;

// 	const [changedData, setChangedData] = useState({});

// 	useCustomToast({
// 		successText: 'Contnt Updated',
// 		isSuccess,
// 		isError,
// 		isLoading,
// 		error,
// 	});

// 	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
// 		e.preventDefault();
// 		e.stopPropagation();
// 		trigger({
// 			id: id,
// 			body: formData,
// 			path: `/contents/product/${path}`,
// 			invalidate: ['content', 'product', 'products'],
// 		});
// 	};

// 	const onModalClose = () => {
// 		setFormData({});
// 		result.reset();
// 		onClose();
// 	};

// 	useEffect(() => {
// 		if (isSuccess && !isLoading) {
// 			onModalClose();
// 		}
// 	}, [isLoading]);

// 	return (
// 		<>
// 			<Flex onClick={onModalOpen}>{children || title || path}</Flex>

// 			<Modal
// 				size='2xl'
// 				isOpen={isOpen}
// 				onClose={onModalClose}
// 				closeOnOverlayClick={false}>
// 				<ModalOverlay />
// 				<ModalContainer onClick={(e: MouseEvent) => e.stopPropagation()}>
// 					<ModalHeader>{`Update ${title}`}</ModalHeader>
// 					<ModalCloseButton />
// 					<form onSubmit={handleSubmit}>
// 						<ModalBody px={6}>
// 							{/* <Text>{JSON.stringify(formData)}</Text> */}
// 							<ModalFormSection>
// 								<FormMain
// 									fields={dataModel}
// 									formData={formData}
// 									setFormData={setFormData}
// 									setChangedData={setChangedData}
// 									isModal={true}
// 								/>
// 							</ModalFormSection>
// 						</ModalBody>
// 						<ModalFooter>
// 							<DiscardButton
// 								mr={2}
// 								onClick={onModalClose}>
// 								Discard
// 							</DiscardButton>
// 							<ModalSubmitButton isLoading={isLoading}>Confirm</ModalSubmitButton>
// 						</ModalFooter>
// 					</form>
// 				</ModalContainer>
// 			</Modal>
// 		</>
// 	);
// };

// export default EditProductListModal;

import { FormEvent, useEffect, useState, ReactNode, MouseEvent } from 'react';
import { Flex, useDisclosure, Dialog, Portal } from '@chakra-ui/react';

import {
	ModalFormSection,
	useCustomToast,
	ModalContainer,
	useFormData,
	InputData,
	ModalHeader,
	ModalFooter,
	FormMain,
	DiscardButton,
	ModalSubmitButton,
	useUpdateByIdMutation,
} from '../..';

type CreateModalProps = {
	dataModel: InputData<any>[];
	children?: ReactNode;
	path?: string;
	type?: 'post' | 'update';
	id: string;
	title?: string;
	data: any;
	productListKeys?: any;
};

const EditProductListModal = ({
	data,
	dataModel,
	children,
	path = 'nexa',
	title,
	type,
	productListKeys,
	id,
}: CreateModalProps) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const [formData, setFormData] = useFormData<any>(dataModel, data);
	const [trigger, result] = useUpdateByIdMutation();

	const onModalOpen = () => {
		setFormData(data);
		onOpen();
	};

	const { isSuccess, isLoading, isError, error } = result;

	const [changedData, setChangedData] = useState({});

	useCustomToast({
		successText: 'Contnt Updated',
		isSuccess,
		isError,
		isLoading,
		error,
	});

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (productListKeys) {
			trigger({
				id: id,
				body: { ...formData, key: productListKeys },
				path: `/contents/product/${path}`,
				invalidate: ['content', 'product', 'products'],
			});
		} else {
			trigger({
				id: id,
				body: formData,
				path: `/contents/product/${path}`,
				invalidate: ['content', 'product', 'products'],
			});
		}
	};

	const onModalClose = () => {
		setFormData({});
		result.reset();
		onClose();
	};

	useEffect(() => {
		if (isSuccess && !isLoading) {
			onModalClose();
		}
	}, [isLoading]);

	return (
		<>
			<Flex onClick={onModalOpen}>{children || title || path}</Flex>

			<Dialog.Root
				lazyMount
				unmountOnExit
				size='xl'
				open={isOpen}
				onOpenChange={(e: any) => (e.open ? onOpen() : onModalClose())}
				closeOnInteractOutside={false}>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content onClick={(e: MouseEvent) => e.stopPropagation()}>
							<Dialog.Header>
								<Dialog.Title>{`Update ${title}`}</Dialog.Title>
							</Dialog.Header>
							<Dialog.CloseTrigger />
							<form onSubmit={handleSubmit}>
								<Dialog.Body px={6}>
									<ModalFormSection>
										<FormMain
											fields={dataModel}
											formData={formData}
											setFormData={setFormData}
											setChangedData={setChangedData}
											isModal={true}
										/>
									</ModalFormSection>
								</Dialog.Body>
								<ModalFooter>
									<DiscardButton
										onClick={onModalClose}>
										Discard
									</DiscardButton>
									<ModalSubmitButton isLoading={isLoading}>Confirm</ModalSubmitButton>
								</ModalFooter>
							</form>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default EditProductListModal;
