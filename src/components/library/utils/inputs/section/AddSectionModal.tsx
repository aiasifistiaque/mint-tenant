'use client';
import { Button, IconButton, useDisclosure } from '@chakra-ui/react';
import { FC, useState } from 'react';
import { Plus } from 'lucide-react';

import {
	Column,
	Icon,
	InsertModal,
	InsertModalBody,
	InsertModalCloseButton,
	InsertModalContent,
	InsertModalFooter,
	InsertModalHeader,
	VImage,
	VInput,
	VTextarea,
} from '../../..';
import { SECTION_BUTTON } from './sectionButtons';

type Item = { image?: string; title: string; description: string };

type UploadModalProps = {
	handleDataChange: any;
	type?: 'add' | 'edit';
	multiple?: boolean;
	value: Item[];
	name: string;
	prevVal?: Item;
	index?: number;
	hasImage?: boolean;
	section?: any;
};

const empty = (hasImage?: boolean): Item => (hasImage ? { image: '', title: '', description: '' } : { title: '', description: '' });

/** Adds or edits one entry of a custom section list: a title, a description, and an image when the field has one. */
const AddSectionModal: FC<UploadModalProps> = ({ handleDataChange, type = 'add', value, name, prevVal, index = 0, hasImage, section }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const [val, setVal] = useState<Item>(prevVal || empty(hasImage));

	const openModal = () => {
		setVal(prevVal || empty(hasImage));
		onOpen();
	};

	const handleChange = (e: any) => {
		const { name, value } = e.target;
		setVal(prev => ({ ...prev, [name]: value }));
	};

	const isValid = !!val.title?.trim() && !!val.description?.trim();

	const handleSubmit = () => {
		if (!isValid) return;
		const newArr = Array.isArray(value) ? [...value] : [];
		if (type == 'add') newArr.push(val);
		else if (index >= 0 && index < newArr.length) newArr[index] = val;
		handleDataChange?.({ target: { name, value: newArr } });
		onClose();
	};

	const title = section?.title || (type == 'edit' ? 'Edit entry' : 'Add entry');

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
					{section?.addBtnText || 'Add item'}
				</Button>
			)}
			<InsertModal
				isOpen={isOpen}
				onClose={onClose}>
				<InsertModalContent>
					<InsertModalHeader>{title}</InsertModalHeader>
					<InsertModalCloseButton />
					<InsertModalBody>
						<Column gap={4}>
							{hasImage && (
								<VImage
									name='image'
									label='Image'
									value={val?.image}
									onChange={(image: any) => setVal(prev => ({ ...prev, image }))}
								/>
							)}
							<VInput
								name='title'
								label='Title'
								isRequired
								value={val?.title}
								onChange={handleChange}
							/>
							<VTextarea
								name='description'
								label='Description'
								isRequired
								value={val?.description}
								minH='180px'
								onChange={handleChange}
							/>
						</Column>
					</InsertModalBody>

					<InsertModalFooter>
						<Button
							{...SECTION_BUTTON}
							variant='outline'
							onClick={onClose}>
							Cancel
						</Button>
						<Button
							{...SECTION_BUTTON}
							disabled={!isValid}
							onClick={handleSubmit}>
							{type == 'add' ? 'Add' : 'Save'}
						</Button>
					</InsertModalFooter>
				</InsertModalContent>
			</InsertModal>
		</>
	);
};

export default AddSectionModal;
