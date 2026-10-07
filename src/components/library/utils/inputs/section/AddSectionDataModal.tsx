'use client';
import { Button, IconButton, useDisclosure } from '@chakra-ui/react';
import { FC, useId, useState } from 'react';
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
} from '../../..';
import { SECTION_BUTTON } from './sectionButtons';
import { evaluate, parse } from '../../../functions/formula';

/**
 * A row with its formula fields calculated from the row's other values
 * (`total = quantity * rate`) — so the list, and a record formula over it
 * like sum(items.total), read right before the server recalculates on save.
 */
export const withRowFormulas = (row: any, dataModel: any[] = []) => {
	const out = { ...row };
	for (const f of dataModel || []) {
		if (f?.type !== 'formula' || !f.formula) continue;
		try {
			out[f.name] = evaluate(parse(f.formula), out);
		} catch {
			/* left as is; the server refuses a broken formula anyway */
		}
	}
	return out;
};

type UploadModalProps = {
	handleDataChange: any;
	type?: 'add' | 'edit';
	multiple?: boolean;
	value: { image?: string; title: string; description: string }[];
	name: string;
	prevVal?: { image?: string; title: string; description: string };
	index?: number;
	dataModel: any;
	hasImage?: boolean;
	section?: any;
};

const AddSectionDataModal: FC<UploadModalProps> = ({
	handleDataChange,
	type = 'add',
	value,
	name,
	prevVal,
	index = 0,
	dataModel,
	section,
}) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const [formData, setFormData] = useState<any>({});
	const [changedData, setChangedData] = useState<any>({});

	// Reset on open, not on close: clearing while the dialog fades out
	// empties its inputs under React (controlled -> uncontrolled).
	const closeModal = () => onClose();

	const openModal = () => {
		setFormData(prevVal || {});
		setChangedData({});
		onOpen();
	};

	const handleAddSection = (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		const newArr = [...(Array.isArray(value) ? value : []), withRowFormulas(formData, section?.dataModel)];
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

	const handleEditSection = (e: any) => {
		// if (!val.title || !val.description) return;
		e.preventDefault();
		e.stopPropagation();

		const newArr = Array.isArray(value) ? [...value] : [];
		if (index >= 0 && index < newArr.length) {
			newArr[index] = withRowFormulas(formData, section?.dataModel);
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
	// The footer's submit button sits outside the form, so it names it.
	const formId = `section-row-${useId()}`;

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
				size='xl'
				isOpen={isOpen}
				onClose={closeModal}>
				<InsertModalContent>
					<InsertModalHeader>
						{section?.title ? section?.title : type == 'edit' ? 'Edit row' : 'Add row'}
					</InsertModalHeader>
					<InsertModalCloseButton />
					<InsertModalBody>
						<Column
							gap={4}
							as='form'
							id={formId}
							onSubmit={handleSubmit}>
							<FormMain
								fields={(section?.dataModel || []).map((f: any, i: number) =>
									i === 0 && !f.sectionTitle ? { ...f, sectionTitle: section?.title || 'Details' } : f
								)}
								formData={formData}
								setFormData={setFormData}
								setChangedData={setChangedData}
								isModal={true}
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
							type='submit'
							form={formId}>
							{type == 'add' ? 'Add' : 'Save'}
						</Button>
					</InsertModalFooter>
				</InsertModalContent>
			</InsertModal>
		</>
	);
};

export default AddSectionDataModal;
