'use client';

import { IconButton, useDisclosure } from '@chakra-ui/react';
import { FC } from 'react';

import { Icon } from '../../..';
import PromptDialog from '../../../modals/modal-components/PromptDialog';

type DeleteItemModalProps = {
	idx: number;
	value: any;
	handleDataChange: any;
	name: string;
};

const DeleteSection: FC<DeleteItemModalProps> = ({ value, handleDataChange, name, idx }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const closeItem = () => {
		onClose();
	};

	const handleDelete = () => {
		const newArr = Array.isArray(value) ? [...value] : [];
		if (idx >= 0 && idx < newArr.length) {
			newArr.splice(idx, 1);
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

		onClose();
	};

	return (
		<>
			<IconButton
				variant='outline'
				aria-label='Delete'
				size='xs'
				colorPalette='red'
				onClick={onOpen}>
				<Icon name='delete' />
			</IconButton>

			<PromptDialog
				open={isOpen}
				onClose={closeItem}
				onConfirm={handleDelete}
				tone='danger'
				title='Delete this entry?'
				description='It’s removed from the list; the change is kept when you save the record.'
			/>
		</>
	);
};

export default DeleteSection;
