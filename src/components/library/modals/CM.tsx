import { FormEvent, useEffect, useState, MouseEvent } from 'react';
import { Flex, useDisclosure } from '@chakra-ui/react';

import { useCustomToast, useIsMobile, useFormData } from '../hooks';

import {
	ModalFormSection,
	InputData,
	usePostMutation,
	useUpdateByIdMutation,
	FormMain,
	useLazyGetByIdToEditQuery,
	DiscardButton,
	ModalSubmitButton,
	Align,
	DialogCloseButton,
	DialogHeader,
	DialogFooter,
	Dialog,
	DialogOverlay,
	DialogContent,
	DialogBody,
} from '..';

type CreateModalProps = {
	data: InputData<any>[];
	trigger?: any;
	path: string;
	type?: 'post' | 'update';
	id?: string;
	title?: string;
	invalidate?: any;
	children?: any;
	doc?: any;
	populate?: any;
	prompt?: {
		title?: string;
		body?: string;
		btnText?: string;
		successMsg?: string;
	};
};

const CreateModal = (props: CreateModalProps) => {
	const { data, trigger, path, title, type, id, invalidate, children, doc, prompt, populate } =
		props;

	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const [fetch, { data: prevData, isFetching, isUninitialized }] = useLazyGetByIdToEditQuery();
	const [formData, setFormData] = useFormData<any>(data, populate || prevData);
	const isMobile = useIsMobile();

	const [callApi, result] = usePostMutation();
	const [updateApi, updateResult] = useUpdateByIdMutation();

	const onModalOpen = () => {
		onOpen();
		let newFieldData = {};

		data?.map(field => {
			if (field?.getValue) newFieldData = { ...newFieldData, [field.name]: field?.getValue(doc) };
			if (field?.value) newFieldData = { ...newFieldData, [field.name]: field?.value };
		});

		setFormData({ ...formData, ...newFieldData });
		if (type == 'update') {
			if (populate) {
				setFormData(populate);
				return;
			}
			fetch({ path, id });
		}
	};

	const { isSuccess, isLoading } = type === 'update' ? updateResult : result;

	const [changedData, setChangedData] = useState({});

	const successText = prompt?.successMsg
		? prompt?.successMsg
		: type == 'update'
		? 'Information Updated Successfully'
		: 'Item added successfully';

	useCustomToast({
		successText,
		...result,
	});

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		e.stopPropagation();

		const findExcludedFields = data.filter((field: any) => field?.isExcluded);
		const toPostData = { ...formData };

		// Remove excluded fields from toPostData
		findExcludedFields.forEach((field: any) => {
			if (field.name in toPostData) delete toPostData[field.name];
		});

		if (type === 'update') updateApi({ path, id: id || 'id', body: changedData, invalidate });
		else callApi({ path, body: toPostData, invalidate });
	};

	const onModalClose = () => {
		setFormData({});
		result.reset();
		onClose();
	};

	useEffect(() => {
		if (isSuccess && !isLoading) onModalClose();
	}, [isLoading]);

	useEffect(() => {
		if (populate) return;
		if (prevData) setFormData(prevData);
	}, [prevData, isFetching]);

	const footer = (
		<>
			{!isMobile && <DiscardButton onClick={onModalClose}>Discard</DiscardButton>}
			<ModalSubmitButton
				{...(isMobile && { w: 'full' })}
				isLoading={isLoading}>
				{prompt?.btnText || 'Confirm'}
			</ModalSubmitButton>
		</>
	);

	return (
		<>
			<Flex onClick={onModalOpen}>{children || trigger || title || path}</Flex>

			<Dialog
				isOpen={isOpen}
				onClose={onModalClose}>
				<DialogOverlay />
				<form onSubmit={handleSubmit}>
					<DialogContent onClick={(e: MouseEvent) => e.stopPropagation()}>
						<DialogHeader>
							{prompt?.title || title || `${type === 'update' ? 'Update' : 'Create'} ${path}`}
						</DialogHeader>
						<DialogCloseButton />

						<DialogBody>
							<ModalFormSection>
								<FormMain
									fields={data}
									formData={formData}
									setFormData={setFormData}
									setChangedData={setChangedData}
									isModal={true}
								/>
							</ModalFormSection>
							{isMobile && <Align py={5}>{footer}</Align>}
						</DialogBody>
						{!isMobile && <DialogFooter>{footer}</DialogFooter>}
					</DialogContent>
				</form>
			</Dialog>
		</>
	);
};

export default CreateModal;
