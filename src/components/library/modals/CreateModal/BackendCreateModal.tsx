'use client';

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { Button, Flex, useDisclosure } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

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
import { nounOf } from './CreateModal';
import { lockText, meets } from '../../functions/fieldLocks';
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
		heading,
		description,
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

	// Editing: a field the record's state has locked (settings `lockWhen` — a
	// paid bill's status) shows read-only with the reason. The server refuses
	// the change anyway; this says so before anyone tries.
	const record = populate || prevData;
	const fields = useMemo(
		() =>
			type === 'update' && record
				? (data || []).map((f: any) =>
						f?.lockWhen?.length && meets(record, f.lockWhen, f.lockMatch)
							? { ...f, type: 'locked', helper: `Locked: can’t be changed once ${lockText(f.lockWhen, f.lockMatch)}` }
							: f
				  )
				: data,
		[data, record, type]
	);

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
					Cancel
				</DiscardButton>
			)}
			<Button
				{...(styles.MODAL_BUTTON as any)}
				{...(isMobile && { w: 'full' })}
				type='submit'
				loading={isLoading}
				loadingText='Processing'
				spinnerPlacement='start'>
				{prompt?.btnText || (type === 'update' ? 'Save changes' : 'Create')}
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
					{/* The edit drawer's header: a tile, the record kind's name ("New customer" — not the
					    route, which can be "projects2"), and a line under it when one is set. */}
					<DialogHeader
						divider
						icon={<Plus size={18} strokeWidth={1.75} />}
						description={prompt?.description || description || undefined}>
						{prompt?.title || heading || title || `New ${nounOf(path)}`}
					</DialogHeader>
					<DialogCloseButton top={{ base: 4, md: 5 }} />

					<DialogBody
						px={{ base: 0, md: 6 }}
						pt={{ base: 4, md: 5 }}>
						<ModalFormSection>
							<FormMain
								fields={fields}
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
