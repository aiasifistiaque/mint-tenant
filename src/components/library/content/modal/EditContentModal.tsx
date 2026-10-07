import { FormEvent, useEffect, useState, ReactNode, MouseEvent } from 'react';
import { Flex, FlexProps, useDisclosure, Dialog, Portal } from '@chakra-ui/react';

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
} from '../..';
import { useUpdateContentMutation } from '../../store/services/contentApi';

type CreateModalProps = FlexProps & {
	dataModel: InputData<any>[];
	children?: ReactNode;
	path?: string;
	title?: string;
	data: any;
	contentType?: 'basic' | 'content';
	setIsOpen?: any;
	setHover?: any;
};

const EditContentModal = ({
	data,
	dataModel,
	children,
	path = 'nexa',
	title,
	contentType = 'content',
	setIsOpen,
	setHover,
	...props
}: CreateModalProps) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const [formData, setFormData] = useFormData<any>(dataModel, data);
	const [trigger, result] = useUpdateContentMutation();

	const onModalOpen = () => {
		setFormData(data);
		onOpen();
		setIsOpen && setIsOpen(true);
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
		trigger({
			body: formData,
			path,
			type: contentType,
		});
	};

	const onModalClose = () => {
		setFormData({});
		setHover && setHover(false);
		setIsOpen && setIsOpen(false);
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
			<Flex
				onClick={onModalOpen}
				{...props}>
				{children || title || path}
			</Flex>

			<Dialog.Root
				lazyMount
				unmountOnExit
				size='xl'
				open={isOpen}
				onOpenChange={e => (e.open ? onOpen() : onModalClose())}
				closeOnInteractOutside={false}>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content onClick={(e: MouseEvent) => e.stopPropagation()}>
							<Dialog.Header>
								<Dialog.Title>{`Update Content`}</Dialog.Title>
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

export default EditContentModal;
