'use client';
import { Button, Flex, IconButton, useDisclosure } from '@chakra-ui/react';
import { FC, useEffect, useState, ReactNode } from 'react';

import {
	Column,
	DeleteImageButton,
	Icon,
	InsertModal,
	InsertModalBody,
	InsertModalCloseButton,
	InsertModalContent,
	InsertModalFooter,
	InsertModalHeader,
	InsertModalOverlay,
	VInput,
	VTextarea,
} from '../../..';

type UploadModalProps = {
	trigger?: ReactNode;
	handleDataChange: any;
	type?: 'add' | 'edit' | 'delete';
	multiple?: boolean;
	handleDelete?: any;
	value: string[];
	name: string;
	prevVal?: string;
	index?: number;
};

const ArrayStringModal: FC<UploadModalProps> = ({
	multiple,
	trigger,
	handleDataChange,
	handleDelete,
	type = 'add',
	value,
	name,
	prevVal,
	index = 0,
}) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const closeModal = () => {
		setVal('');
		onClose();
	};

	const [val, setVal] = useState<string>(prevVal || '');

	const openModal = () => {
		setVal(prevVal || '');
		onOpen();
	};

	const handleChange = (e: any) => setVal(e.target.value);

	const handleAddSection = () => {
		if (!val) return;
		const newArr = [...(Array.isArray(value) ? value : []), val];
		if (handleDataChange) {
			const event = {
				target: {
					name: name,
					value: newArr,
				},
			} as any;
			handleDataChange(event);
		}

		setVal('');
		onClose();
	};

	const handleEditSection = () => {
		if (!val) return;

		const newArr = Array.isArray(value) ? [...value] : [];
		if (index >= 0 && index < newArr.length) {
			newArr[index] = val;
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
		closeModal();
	};

	const handleSubmit = type == 'add' ? handleAddSection : handleEditSection;

	const buttonTypes = {
		add: (
			<Button
				size='sm'
				colorPalette='brand'>
				Add Section
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
				isOpen={isOpen}
				onClose={closeModal}>
				<InsertModalOverlay />
				<InsertModalContent>
					<InsertModalHeader>{type == 'edit' ? 'Update' : 'Add'} Section</InsertModalHeader>
					<InsertModalCloseButton />
					<InsertModalBody flex={1}>
						<Column gap={4}>
							<VTextarea
								label='Enter Value'
								value={val}
								h='full'
								minH='400px'
								onChange={handleChange}
							/>
						</Column>
					</InsertModalBody>

					<InsertModalFooter>
						<Flex
							gap={2}
							flex={1}>
							<Button
								size='sm'
								disabled={!val}
								onClick={handleSubmit}>
								{type == 'add' ? 'Insert' : 'Update'} Section
							</Button>
							<Button
								colorPalette='gray'
								size='sm'
								onClick={onClose}>
								Cancel
							</Button>
						</Flex>
					</InsertModalFooter>
				</InsertModalContent>
			</InsertModal>
		</>
	);
};

export default ArrayStringModal;
