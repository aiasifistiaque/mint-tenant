'use client';
import { Button, IconButton, useDisclosure } from '@chakra-ui/react';
import { FC, useState } from 'react';
import { Plus } from 'lucide-react';

import {
	Column,
	FormMain,
	Icon,
	InsertModal,
	InsertModalBody,
	InsertModalCloseButton,
	InsertModalContent,
	InsertModalFooter,
	InsertModalHeader,
	useFormData,
} from '../../..';
import { SECTION_BUTTON } from './sectionButtons';

type UploadModalProps = {
	handleDataChange: any;
	dataModel?: any;
	type?: 'add' | 'edit';
	multiple?: boolean;
	value: { title: string; description: string }[];
	name: string;
	prevVal?: { title: string; description: string };
	index?: number;
};

/** Adds or edits one entry of a custom section, with the fields of its dataModel. */
const AddCustomSection: FC<UploadModalProps> = ({ handleDataChange, type = 'add', value, name, prevVal, index = 0, dataModel }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const [formData, setFormData] = useFormData<any>(dataModel, prevVal);
	const [, setChangedData] = useState({});

	// Reset on open (below), not on close: clearing while the dialog fades out
	// empties its inputs under React.
	const closeModal = () => onClose();

	const openModal = () => {
		setFormData(prevVal || {});
		onOpen();
	};

	const handleSubmit = () => {
		const newArr = Array.isArray(value) ? [...value] : [];
		if (type == 'add') newArr.push(formData);
		else if (index >= 0 && index < newArr.length) newArr[index] = formData;
		handleDataChange?.({ target: { name, value: newArr } });
		closeModal();
	};

	return (
		<>
			{type == 'edit' ? (
				<IconButton
					variant='outline'
					aria-label='Edit'
					size='xs'
					onClick={openModal}>
					<Icon name='edit' />
				</IconButton>
			) : (
				<Button
					size='sm'
					variant='outline'
					onClick={openModal}>
					<Plus size={14} />
					Add section
				</Button>
			)}
			<InsertModal
				isOpen={isOpen}
				onClose={closeModal}>
				<InsertModalContent>
					<InsertModalHeader>{type == 'edit' ? 'Edit section' : 'Add section'}</InsertModalHeader>
					<InsertModalCloseButton />
					<InsertModalBody>
						<Column gap={4}>
							<FormMain
								isModal={true}
								fields={dataModel}
								setFormData={setFormData}
								formData={formData}
								setChangedData={setChangedData}
							/>
						</Column>
					</InsertModalBody>

					<InsertModalFooter>
						<Button
							{...SECTION_BUTTON}
							variant='outline'
							onClick={closeModal}>
							Cancel
						</Button>
						<Button
							{...SECTION_BUTTON}
							onClick={handleSubmit}>
							{type == 'add' ? 'Add' : 'Save'}
						</Button>
					</InsertModalFooter>
				</InsertModalContent>
			</InsertModal>
		</>
	);
};

export default AddCustomSection;
