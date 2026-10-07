'use client';

import { Button, useDisclosure, Text } from '@chakra-ui/react';
import { useEffect, FC, useState } from 'react';
import {
	useCustomToast,
	MenuItem,
	EditDataSelect,
	MenuModal,
	MenuModalHeader,
	MenuModalCloseButton,
	MenuModalBody,
	MenuModalFooter,
} from '../../../..';
import { useUpdateManyMutation } from '../../../../store';

type EditManyModalType = {
	title?: string;
	path: string;
	keys: string;
	items: any[];
	dataPath: string;
	dataModel?: any;
	keyType?: string;
	prompt?: {
		title?: string;
		body?: string;
	};
};

const EditManySelectModal: FC<EditManyModalType> = ({
	title,
	path,
	prompt,
	keys,
	items,
	dataPath,
	dataModel,
	keyType = 'string',
}) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const [value, setValue] = useState<any>();

	const [trigger, result] = useUpdateManyMutation();
	const { isLoading, isSuccess, isError, error, reset } = result;

	const closeItem = () => {
		reset();
		setValue(undefined);
		onClose();
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({
			path,
			body: {
				ids: items,
				type: keyType,
				updates: {
					[keys]: value,
				},
			},
		});
	};

	useEffect(() => {
		if (!isLoading && isSuccess) {
			closeItem();
		}
	}, [isLoading]);

	useCustomToast({
		successText: `Batch item updated successfully`,
		isSuccess,
		isError,
		isLoading,
		error,
	});

	return (
		<>
			<MenuItem onClick={onOpen}>{title}</MenuItem>

			<MenuModal
				forceModal
				isOpen={isOpen}
				onClose={closeItem}>
				<form onSubmit={handleSubmit}>
					<MenuModalHeader>{prompt?.title || `Edit Item`}</MenuModalHeader>
					<MenuModalCloseButton />

					<MenuModalBody
						pt={4}
						gap={4}>
						<Text mb={2}>{prompt?.body || 'Please select an option'}</Text>

						<EditDataSelect
							dataModel={dataModel}
							isRequired={true}
							dataPath={dataPath}
							value={value}
							onChange={e => {
								setValue(e.target.value);
							}}
						/>
					</MenuModalBody>

					<MenuModalFooter>
						{!isLoading && (
							<Button
								onClick={closeItem}
								colorPalette='white'>
								Discard
							</Button>
						)}
						<Button
							type='submit'
							disabled={!value}
							loading={isLoading}
							colorPalette='brand'
							size='sm'>
							Update
						</Button>
					</MenuModalFooter>
					{/* </AlertDialogContent> */}
				</form>
				{/* </AlertDialogOverlay> */}
			</MenuModal>
		</>
	);
};

export default EditManySelectModal;
