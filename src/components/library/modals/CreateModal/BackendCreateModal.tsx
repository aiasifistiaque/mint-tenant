'use client';

import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { Button, Flex, useDisclosure } from '@chakra-ui/react';

import { useCustomToast, useIsMobile, useFormData } from '../../hooks';

import {
	ModalFormSection,
	usePostMutation,
	useUpdateByIdMutation,
	FormMain,
	useLazyGetByIdToEditQuery,
	DiscardButton,
	DialogCloseButton,
	DialogHeader,
	DialogFooter,
	Dialog,
	DialogBody,
} from '../..';

import CreateModalProps from './types';
import { styles } from '../../config';

const CreateModal = (props: CreateModalProps) => {
	const {
		data,
		trigger,
		path,
		title,
		type,
		id,
		invalidate,
		children,
		doc,
		prompt,
		populate,
		layout,
		defaults,
	} = props;

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

		setFormData({ ...formData, ...newFieldData, ...defaults });
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

	const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter') e.preventDefault();
	};

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
		if (isLoading) return;
		if (isSuccess) onModalClose();
	}, [isLoading]);

	useEffect(() => {
		if (populate) return;
		if (prevData) setFormData(prevData);
	}, [prevData, isFetching]);

	const footer = (
		<>
			{!isMobile && (
				<DiscardButton
					disabled={isLoading}
					onClick={onModalClose}>
					Discard
				</DiscardButton>
			)}
			<Button
				{...(styles.MODAL_BUTTON as any)}
				{...(isMobile && { w: 'full' })}
				type='submit'
				loading={isLoading}
				loadingText='Processing'
				spinnerPlacement='start'>
				{prompt?.btnText || 'Confirm'}
			</Button>
		</>
	);

	return (
		<>
			<Flex onClick={onModalOpen}>{children || trigger || title || path}</Flex>

			<Dialog
				isOpen={isOpen}
				onClose={onModalClose}>
				<form
					onSubmit={handleSubmit}
					onKeyDown={handleKeyDown}>
					<DialogHeader>
						{prompt?.title || title || `${type === 'update' ? 'Update' : 'Create'} ${path}`}
					</DialogHeader>
					<DialogCloseButton />

					<DialogBody px={{ base: 0, md: 6 }}>
						<ModalFormSection>
							<FormMain
								fields={data}
								formData={formData}
								setFormData={setFormData}
								setChangedData={setChangedData}
								isModal={true}
							/>
						</ModalFormSection>
					</DialogBody>
					{/* Pinned under the form on every screen; on a phone it holds the one
					    full-width primary button, inset like the fields above it. */}
					<DialogFooter>{footer}</DialogFooter>
				</form>
			</Dialog>
		</>
	);
};

export default CreateModal;
