import { useEffect, useState } from 'react';
import { Flex, Button } from '@chakra-ui/react';

import {
	useCustomToast,
	ModalFormSection,
	VInput,
	useUpdatePasswordMutation,
	GenericModal,
	GenericModalHeader,
	GenericModalCloseButton,
	GenericModalBody,
	GenericModalFooter,
} from '../..';
import { useDisclosure } from '@chakra-ui/react';
import ModalContainer from '../../menu/ModalContainer';

const UpdatePasswordModalV3 = ({ trigger, path }: { trigger?: any; path?: any }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const [formData, setFormData] = useState<any>({
		oldPassword: '',
		password: '',
		confirm: '',
	});

	const [register, result] = useUpdatePasswordMutation();

	const handleChange = (e: any) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		register(formData);
	};

	const onModalClose = () => {
		setFormData({});
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
	}, [result]);

	return (
		<>
			<Flex onClick={onOpen}>{trigger || path}</Flex>
			<GenericModal
				size='xl'
				isOpen={isOpen}
				onClose={onModalClose}
				closeOnOverlayClick={false}>
				<ModalContainer>
					<GenericModalHeader>Update Password</GenericModalHeader>
					<GenericModalCloseButton />
					<form onSubmit={handleSubmit}>
						<GenericModalBody>
							<ModalFormSection>
								<VInput
									label='Old Password'
									name='oldPassword'
									value={formData.oldPassword}
									onChange={handleChange}
									type='password'
									isRequired
								/>
								<VInput
									label='Password'
									name='password'
									value={formData.password}
									onChange={handleChange}
									type='password'
									isRequired
								/>
								<VInput
									label='Confirm Password'
									name='confirm'
									value={formData.confirm}
									onChange={handleChange}
									type='password'
									isRequired
								/>
							</ModalFormSection>
						</GenericModalBody>
						<GenericModalFooter py={4}>
							<Button
								mr={2}
								size='sm'
								variant='outline'
								onClick={onModalClose}>
								Discard
							</Button>
							<Button
								size='sm'
								type='submit'
								loading={result.isLoading}>
								Update
							</Button>
						</GenericModalFooter>
					</form>
				</ModalContainer>
			</GenericModal>
		</>
	);
};

export default UpdatePasswordModalV3;
