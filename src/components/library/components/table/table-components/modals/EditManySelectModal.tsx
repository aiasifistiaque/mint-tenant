'use client';

import { Dialog, Button, useDisclosure, Text, Portal } from '@chakra-ui/react';
import { useEffect, useRef, FC, useState } from 'react';
import { useCustomToast, MenuItem } from '../../../..';
import { useUpdateManyMutation } from '../../../../store';
import Dropdown from '../../../../cl/Dropdown';
import ModalFooter from '../../../../modals/modal-components/CustomModalFooter';

type EditManyModalType = {
	title?: string;
	items: any[];
	path: string;
	keys: string;
	options: {
		label: string;
		value: string | number | boolean;
	}[];
	keyType?: string;
	prompt?: {
		title?: string;
		body?: string;
	};
};

const EditManySelectModal: FC<EditManyModalType> = ({
	title,
	path,
	items,
	prompt,
	keys,
	options,
	keyType = 'string',
}) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const cancelRef = useRef<any>(undefined);
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

			<Dialog.Root
				lazyMount
				unmountOnExit
				open={isOpen}
				onOpenChange={e => !e.open && closeItem()}
				role='alertdialog'>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<form onSubmit={handleSubmit}>
							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>{prompt?.title || `Edit Item`}</Dialog.Title>
								</Dialog.Header>

								<Dialog.Body pt={4}>
									<Text>{prompt?.body || 'Please select an option'}</Text>
									<Dropdown
										size='sm'
										mt={4}
										value={value}
										onChange={v => setValue(v)}>
										<option
											disabled
											value=''>
											Select option
										</option>
										{options?.map(({ label, value }: { label: string; value: any }, i: number) => (
											<option
												key={i}
												value={value}>
												{label}
											</option>
										))}
									</Dropdown>
								</Dialog.Body>

								<ModalFooter>
									{!isLoading && (
										<Dialog.CloseTrigger asChild>
											<Button
												ref={cancelRef}
												px={3}
												size='sm'
												variant='outline'>
												Discard
											</Button>
										</Dialog.CloseTrigger>
									)}
									<Button
										type='submit'
										disabled={!value}
										loading={isLoading}
										colorPalette='brand'
										px={3}
										size='sm'>
										Edit
									</Button>
								</ModalFooter>
							</Dialog.Content>
						</form>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default EditManySelectModal;
