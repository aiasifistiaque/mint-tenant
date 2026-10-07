import { FormEvent, useEffect, useState, MouseEvent, ReactNode } from 'react';
import { Flex, useDisclosure, Dialog, Portal } from '@chakra-ui/react';

import {
	ModalFormSection,
	useCustomToast,
	useFormData,
	InputData,
	ModalFooter,
	FormMain,
	DiscardButton,
	ModalSubmitButton,
} from '../..';
import { useAddHomeCategoryMutation } from '../../store/services/contentApi';

type CreateModalProps = {
	dataModel: InputData<any>[];
	children?: ReactNode;
	path?: string;
	id?: string;
	title?: string;
	data?: any;
	productListKeys?: any;
	setProductListKeys?: any;
};

const AddProductListModal = ({
	data = [],
	dataModel,
	children,
	path = 'nexa',
	title,
	productListKeys,
}: CreateModalProps) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const [formData, setFormData] = useFormData<any>(dataModel);

	const [trigger, result] = useAddHomeCategoryMutation();

	const onModalOpen = () => {
		setFormData(data);
		onOpen();
	};

	const { isSuccess, isLoading, isError, error } = result;

	const [changedData, setChangedData] = useState({});

	useCustomToast({
		successText: 'Content Updated',
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
				body: { ...formData, key: productListKeys },
				path: path,
			});
		} else {
			trigger({
				body: formData,
				path: path,
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

export default AddProductListModal;
