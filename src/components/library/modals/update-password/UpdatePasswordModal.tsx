import { useEffect, useState } from 'react';
import { Dialog, Flex, Portal, useDisclosure, Button, Text, CloseButton } from '@chakra-ui/react';

import {
	useCustomToast,
	ModalFormSection,
	VInput,
	useUpdatePasswordMutation,
	AlertDialogContent,
	AlertDialogHeader,
	Align,
} from '../..';
import DiscardButton from '../../components/buttons/DiscardButton';
import ModalFooter from '../modal-components/CustomModalFooter';

const EMPTY = { oldPassword: '', password: '', confirm: '' };

/**
 * "Change Password" on /settings — PUT auth/change-password (the backend
 * route was missing until 2026-09-26, so this always failed with a 404).
 * The mismatch and length checks here only save a round trip; the server
 * runs the same ones, plus the current-password check.
 *
 * A plain Chakra Dialog, portalled, built like the table's confirm and delete
 * prompts (ConfirmModal, DeleteItemModal): mounted only while open.
 */
const UpdatePasswordModal = ({ trigger, path }: { trigger?: any; path?: any }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const [formData, setFormData] = useState<typeof EMPTY>(EMPTY);
	const [tried, setTried] = useState(false);

	const [register, result] = useUpdatePasswordMutation();

	const handleChange = (e: any) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		if (result.isError) result.reset();
	};

	const problem =
		formData.password && formData.password.length < 8
			? 'The new password must be at least 8 characters'
			: formData.confirm && formData.password !== formData.confirm
				? 'The new passwords do not match'
				: '';

	// The server's reason (wrong current password, reused password) — shown
	// here by the fields, cleared as soon as they're edited again.
	const serverError = result.isError ? (result.error as any)?.data?.message || 'Could not update the password' : '';

	const handleSubmit = (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		setTried(true);
		if (problem) return;
		register(formData);
	};

	const onModalClose = () => {
		// Back to empty strings, not {}: undefined values turned the inputs
		// uncontrolled, and the next open misbehaved.
		setFormData(EMPTY);
		setTried(false);
		result.reset();
		onClose();
	};

	useCustomToast({
		isLoading: result.isLoading,
		isError: result.isError,
		error: result.error,
		isSuccess: result.isSuccess,
		successText: 'Password Updated Successfully',
	});

	useEffect(() => {
		if (result.isSuccess && !result.isLoading) {
			onModalClose();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [result.isSuccess, result.isLoading]);

	return (
		<>
			<Flex onClick={onOpen}>{trigger || path}</Flex>
			<Dialog.Root
				placement='center'
				size='md'
				open={isOpen}
				closeOnInteractOutside={false}
				onOpenChange={e => !e.open && !result.isLoading && onModalClose()}>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<AlertDialogContent
							px={0}
							borderWidth='1px'
							borderColor='border'>
							<AlertDialogHeader>Change password</AlertDialogHeader>
							<Dialog.CloseTrigger
								asChild
								top={2}
								right={2}>
								<CloseButton size='sm' />
							</Dialog.CloseTrigger>

							<form onSubmit={handleSubmit}>
								<Dialog.Body
									p={4}
									pb={6}>
									<ModalFormSection>
										<VInput
											label='Current Password'
											name='oldPassword'
											value={formData.oldPassword}
											onChange={handleChange}
											type='password'
											autoComplete='current-password'
											autoFocus
											isRequired
										/>
										<VInput
											label='New Password'
											name='password'
											value={formData.password}
											onChange={handleChange}
											type='password'
											autoComplete='new-password'
											helper='At least 8 characters'
											isRequired
										/>
										<VInput
											label='Confirm New Password'
											name='confirm'
											value={formData.confirm}
											onChange={handleChange}
											type='password'
											autoComplete='new-password'
											isRequired
										/>
										{((problem && (tried || formData.confirm.length >= formData.password.length)) || serverError) && (
											<Text
												fontSize='sm'
												color='red.fg'>
												{problem || serverError}
											</Text>
										)}
									</ModalFormSection>
								</Dialog.Body>

								<ModalFooter>
									<DiscardButton
										disabled={result.isLoading}
										onClick={onModalClose}>
										Cancel
									</DiscardButton>
									<Button
										size='sm'
										px={3}
										type='submit'
										loading={result.isLoading}
										loadingText='Updating'
										spinnerPlacement='start'>
										Update password
									</Button>
								</ModalFooter>
							</form>
						</AlertDialogContent>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default UpdatePasswordModal;
