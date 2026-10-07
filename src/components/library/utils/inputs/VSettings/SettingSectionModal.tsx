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
import FormFields from './SettingFields';

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
	sectionKey: string;
	availableFields: string[];
};

const SettingSectionModal: FC<UploadModalProps> = ({
	trigger,
	handleDataChange,
	handleDelete,
	type = 'add',
	value,
	name,
	prevVal,
	index = 0,
	section,
	sectionKey,
	availableFields,
}) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const [formData, setFormData] = useState<any>({
		title: '',
		type: 'string',
		required: false,
		sort: false,
		unique: false,
		search: false,
		edit: false,
		trim: false,
		min: 0,
		max: 99999999,
		filter: {},
	});
	const [changedData, setChangedData] = useState<any>({});

	const onChange = (e: any) => {
		const { name, value, type, checked } = e.target;
		const val = type === 'checkbox' ? checked : value;

		setFormData((prev: any) => ({
			...prev,
			[name]: val,
		}));
	};

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
		const newObj = { ...value, [sectionKey]: formData };
		if (handleDataChange) {
			const event = {
				target: {
					name: name,
					value: newObj,
				},
			} as any;
			handleDataChange(event);
		}
		setFormData({
			title: '',
			type: 'string',
			required: false,
			sort: false,
			unique: false,
			search: false,
			edit: false,
			trim: false,
			min: 0,
			max: 99999999,
			filter: {},
		});
		closeModal();
	};

	const handleEditSection = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const newArr = Array.isArray(value) ? [...value] : [];

		// Base field data
		const fieldData: any = {
			title: formData.title,
			type: formData.type,
			required: formData.required,
			sort: formData.sort,
			unique: formData.unique,
			edit: formData.edit,
			filter: formData.filter,
		};

		// Only add min/max for number types
		if (formData.type === 'number') {
			fieldData.min = formData.min;
			fieldData.max = formData.max;
		}

		if (fieldData.type === 'string' || fieldData.type === 'text' || fieldData.type === 'email') {
			fieldData.trim = formData.trim;
			fieldData.search = formData.search;
		}

		if (index >= 0 && index < newArr.length) {
			newArr[index] = fieldData;
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
				size='sm'
				colorPalette='white'>
				{section?.addBtnText || 'Add Setting'}
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
					<InsertModalHeader>{`Enter Values for field ${sectionKey}`}</InsertModalHeader>
					<InsertModalCloseButton />
					<InsertModalBody flex={1}>
						<Column
							gap={4}
							as='form'
							onSubmit={handleSubmit}>
							<FormFields
								sectionKey={sectionKey}
								formData={formData}
								onChange={onChange}
								availableFields={availableFields}
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

export default SettingSectionModal;
