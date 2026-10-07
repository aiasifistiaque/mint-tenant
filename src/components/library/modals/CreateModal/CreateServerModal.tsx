'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { Button, Flex, useDisclosure } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import { useCustomToast, useIsMobile, useFormData } from '../../hooks';
import { FooterStatus, FormSkeleton, formKeys, nounOf } from './CreateModal';

import {
	ModalFormSection,
	usePostMutation,
	FormMain,
	DiscardButton,
	DialogCloseButton,
	DialogHeader,
	DialogFooter,
	Dialog,
	DialogBody,
	MenuItem,
	useGetConfigQuery,
} from '../..';
import { styles } from '../../config';

type CreateServerModalProps = {
	trigger?: any;
	path: string;
	title?: string;
	invalidate?: any;
	children?: any;
	doc?: any;
	populate?: any;
	isMenu?: boolean;
	item?: any;
	icon?: string;
	layout?: any;
	onNewItemAdd?: (data: any) => void;
	prompt?: {
		title?: string;
		body?: string;
		btnText?: string;
		successMsg?: string;
	};
};

const CreateServerModal = (props: CreateServerModalProps) => {
	const {
		trigger,
		path,
		title,
		onNewItemAdd,
		isMenu,
		invalidate,
		children,
		doc,
		prompt,
		populate,
		layout,
		icon,
	} = props;

	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const { data, isFetching } = useGetConfigQuery(path);

	const [formData, setFormData] = useFormData<any>(data, populate);
	const isMobile = useIsMobile();

	const [callApi, result] = usePostMutation();

	const [schema, setSchema] = useState<any>([]);

	const onModalOpen = () => {
		onOpen();
		let newFieldData = {};

		data?.form?.map((field: any) => {
			if (field?.getValue) newFieldData = { ...newFieldData, [field.name]: field?.getValue(doc) };
			if (field?.value) newFieldData = { ...newFieldData, [field.name]: field?.value };
		});

		setFormData({ ...formData, ...newFieldData });
	};

	const { isSuccess, isLoading } = result;

	const [changedData, setChangedData] = useState({});

	useEffect(() => {
		if (data) {
			let newFieldData = {};
			const fields = data?.form;
			setSchema(fields);
			fields?.map((field: any) => {
				if (field?.getValue) newFieldData = { ...newFieldData, [field.name]: field?.getValue(doc) };
				if (field?.value) newFieldData = { ...newFieldData, [field.name]: field?.value };
			});

			setFormData({ ...formData, ...newFieldData });
		}
	}, [isFetching]);

	const successText = prompt?.successMsg || 'Item added successfully';

	useCustomToast({
		successText,
		...result,
	});

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		e.stopPropagation();

		let findExcludedFields: any = [];

		const fields: any = data?.form;
		findExcludedFields = fields.filter((field: any) => field?.isExcluded);

		const toPostData = { ...formData };

		// Remove excluded fields from toPostData
		findExcludedFields.forEach((field: any) => {
			if (field.name in toPostData) delete toPostData[field.name];
		});

		callApi({ path, body: toPostData, invalidate });
	};

	const onModalClose = () => {
		setFormData({});
		result.reset();

		onClose();
	};

	useEffect(() => {
		if (isLoading) return;
		if (isSuccess) {
			if (onNewItemAdd) {
				onNewItemAdd(result?.data?.doc);
			}
			onModalClose();
		}
	}, [isLoading]);

	useEffect(() => {
		if (populate) return;
	}, [isFetching]);

	const footer = (
		<>
			{!isMobile && <FooterStatus />}
			{!isMobile && (
				<DiscardButton
					disabled={isLoading}
					onClick={onModalClose}>
					Cancel
				</DiscardButton>
			)}
			<Button
				{...(styles.MODAL_BUTTON as any)}
				{...(isMobile && { w: 'full' })}
				type='submit'
				disabled={isFetching}
				loading={isLoading}
				loadingText='Creating'
				spinnerPlacement='start'>
				{prompt?.btnText || `Create ${nounOf(path)}`}
			</Button>
		</>
	);

	return (
		<>
			{isMenu ? (
				<MenuItem
					icon={icon}
					onClick={onModalOpen}>
					{children || trigger || title || path}
				</MenuItem>
			) : (
				<Flex onClick={onModalOpen}>{children || trigger || title || path}</Flex>
			)}

			<Dialog
				isOpen={isOpen}
				onClose={onModalClose}>
				<form
					onSubmit={handleSubmit}
					onKeyDown={formKeys(!isFetching && !isLoading)}>
					<DialogHeader
						divider
						icon={
							<Plus
								size={18}
								strokeWidth={1.75}
							/>
						}>
						{prompt?.title ||
							(!title || ['create', 'add', 'new'].includes(String(title).toLowerCase()) ? `New ${nounOf(path)}` : title)}
					</DialogHeader>
					<DialogCloseButton top={{ base: 4, md: 5 }} />

					<DialogBody pt={{ base: 4, md: 5 }}>
						<ModalFormSection>
							{isFetching ? (
								<FormSkeleton />
							) : (
								<FormMain
									fields={data?.form}
									formData={formData}
									setFormData={setFormData}
									setChangedData={setChangedData}
									isModal={true}
								/>
							)}
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

export default CreateServerModal;
