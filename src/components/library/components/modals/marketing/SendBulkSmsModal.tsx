'use client';

import { Button, useDisclosure, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import {
	MenuModal,
	MenuModalHeader,
	MenuModalBody,
	MenuModalCloseButton,
	MenuModalFooter,
	DiscardButton,
	MenuItem,
	VTextarea,
	usePostMutation,
	useCustomToast,
} from '../../..';

const SendBulkSmsModal = ({ path, ids }: { path: string; ids: string[] }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const [text, setText] = useState<string>('');
	const [trigger, result] = usePostMutation();

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({
			path: '/customers/sms',
			body: {
				ids: ids,
				message: text,
			},
		});
	};

	useCustomToast({
		...result,
		successText: 'SMS sent successfully',
	});

	const closeModal = () => {
		setText('');
		onClose();
	};

	useEffect(() => {
		if (!result?.isLoading && result?.isSuccess) closeModal();
	}, [result]);

	return (
		<>
			<MenuItem onClick={onOpen}>Send Marketing SMS</MenuItem>

			<MenuModal
				forceModal
				isOpen={isOpen}
				onClose={closeModal}>
				<MenuModalHeader>Write your custom Message</MenuModalHeader>
				<MenuModalCloseButton />
				<MenuModalBody>
					<VTextarea
						label='Message'
						placeholder='Enter your message'
						value={text}
						onChange={(e: any) => setText(e.target.value)}
					/>
					<Text>Character Count: {text?.length || 0}</Text>
				</MenuModalBody>
				<MenuModalFooter>
					<>
						<DiscardButton
							mr={2}
							onClick={closeModal}>
							Discard
						</DiscardButton>
						<Button
							size='sm'
							onClick={handleSubmit}
							loading={result?.isLoading}>
							Send
						</Button>
					</>
				</MenuModalFooter>
			</MenuModal>
		</>
	);
};

export default SendBulkSmsModal;
