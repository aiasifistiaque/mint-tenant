'use client';
import { Button, Flex, FlexProps, IconButton, useDisclosure } from '@chakra-ui/react';
import { FC, ReactNode, useEffect, useState } from 'react';

import {
	Column,
	DeleteImageButton,
	Icon,
	InsertModal,
	InsertModalBody,
	InsertModalCloseButton,
	InsertModalContent,
	InsertModalHeader,
	InsertModalOverlay,
} from '../../..';
import FormFields from './FormFields';

type UploadModalProps = {
	trigger?: ReactNode;
	handleDataChange: any;
	type?: 'add' | 'edit' | 'delete';
	multiple?: boolean;
	handleDelete?: any;
	value: any[];
	name: string;
	prevVal?: { image?: string; title: string; description: string };
	index?: number;
	hasImage?: boolean;
	section?: any;
	availableFields?: any[];
};

const FormSectionModal: FC<UploadModalProps> = ({
	trigger,
	handleDataChange,
	handleDelete,
	type = 'add',
	value,
	name,
	prevVal,
	index = 0,
	section,
	availableFields,
}) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const [formData, setFormData] = useState<any>({});
	const [changedData, setChangedData] = useState<any>({});
	const [fields, setFields] = useState<any[]>(availableFields || []);

	useEffect(() => {
		setFields(availableFields || []);
	}, [availableFields]);

	const closeModal = () => {
		setFormData({});
		setChangedData({});
		onClose();
	};

	const openModal = () => {
		setFormData(prevVal || {});
		onOpen();
	};

	const handleAddSection = (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		const newArr = [...(Array.isArray(value) ? value : []), formData];
		if (handleDataChange) {
			const event = {
				target: {
					name: name,
					value: newArr,
				},
			} as any;
			handleDataChange(event);
		}
		setFormData({});
		closeModal();
	};

	const handleEditSection = (e: any) => {
		// if (!val.title || !val.description) return;
		e.preventDefault();
		e.stopPropagation();

		const newArr = Array.isArray(value) ? [...value] : [];
		if (index >= 0 && index < newArr.length) {
			newArr[index] = formData;
		}

		if (handleDataChange) {
			const event = {
				target: {
					name: name,
					value: newArr,
				},
			} as any;
			handleDataChange(event);
		}
		setFormData({});
		closeModal();
	};

	const handleSubmit = type == 'add' ? handleAddSection : handleEditSection;

	const buttonTypes = {
		add: (
			<Button
				w='full'
				size='sm'
				colorPalette='white'>
				{section?.addBtnText || 'Add Item'}
			</Button>
		),
		edit: (
			<IconButton
				variant='outline'
				aria-label='edit-section'
				size='xs'
				colorPalette='brand'>
				<Icon name='edit' />
			</IconButton>
		),
		delete: <DeleteImageButton onClick={handleDelete} />,
	};

	let triggerButton = (buttonTypes[type] as any) || trigger;

	return (
		<>
			{type == 'delete' ? (
				<DeleteImageButton onClick={handleDelete} />
			) : (
				<Flex onClick={openModal}>{triggerButton}</Flex>
			)}
			<InsertModal
				size='xl'
				isOpen={isOpen}
				onClose={closeModal}>
				<InsertModalOverlay />
				<InsertModalContent>
					<InsertModalHeader>Add New Section to the Form</InsertModalHeader>
					<InsertModalCloseButton />
					<InsertModalBody flex={1}>
						<Column
							gap={4}
							as='form'
							onSubmit={handleSubmit}>
							<FormFields
								initialValue={formData}
								availableFields={fields}
								onFormChange={setFormData}
							/>
							<Flex {...footerCss}>
								<Button
									colorPalette='white'
									size='sm'
									onClick={closeModal}>
									Discard
								</Button>
								<Button
									size='sm'
									type='submit'>
									{type == 'add' ? 'Insert' : 'Update'}
								</Button>
							</Flex>
						</Column>
					</InsertModalBody>
				</InsertModalContent>
			</InsertModal>
		</>
	);
};

const footerCss: FlexProps = {
	justify: 'flex-end',
	pb: 4,
	align: 'center',
	gap: 2,
	flex: 1,
};

export default FormSectionModal;
