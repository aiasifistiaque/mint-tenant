import { Button, useDisclosure, Flex } from '@chakra-ui/react';

import {
	useFormData,
	FormContent,
	ModalContainer,
	InputData,
	DiscardButton,
	Address,
	useLazyGetByIdToEditQuery,
	GenericModal,
	GenericModalHeader,
	GenericModalCloseButton,
	GenericModalBody,
	GenericModalFooter,
	GenericModalContent,
} from '../..';

const inputFields: InputData<Address>[] = [
	{
		name: 'address.name',
		label: 'Recipient Name',
		isRequired: true,
		type: 'text',
	},
	{
		name: 'address.email',
		label: 'Recipient Email',
		isRequired: true,
		type: 'text',
		span: 1,
	},
	{
		name: 'address.phone',
		label: 'Recipient Phone',
		isRequired: true,
		type: 'text',
		span: 1,
	},
	{
		name: 'address.street',
		label: 'Street Address',
		isRequired: true,
		type: 'textarea',
	},
	{
		name: 'address.city',
		label: 'City',
		isRequired: true,
		type: 'text',
		span: 1,
	},
	{
		name: 'address.state',
		label: 'State',
		isRequired: false,
		type: 'text',
		span: 1,
	},
	{
		name: 'address.country',
		label: 'Country',
		isRequired: false,
		type: 'text',
		span: 1,
		value: () => 'Bangladesh',
	},
	{
		name: 'address.postalCode',
		label: 'Post Code',
		isRequired: true,
		type: 'text',
		span: 1,
	},
];

const EditAddressWidget = ({ id }: { id: string }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const [fetch, { data: prevData }] = useLazyGetByIdToEditQuery();

	const [formData, setFormData] = useFormData<any>(inputFields, prevData);

	const onModalOpen = () => {
		onOpen();
		let newFieldData = {};
		inputFields?.map((field: any) => {
			if (field?.value) newFieldData = { ...newFieldData, [field.name]: field.value };
		});
		setFormData({ ...formData, ...newFieldData });
		onOpen();
		fetch({ path: 'orders', id });
	};

	const onModalClose = () => {
		setFormData({});
		onClose();
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();

		onModalClose();
	};

	const addressNotSet = (
		<Button
			size='sm'
			colorPalette='brand'
			onClick={onModalOpen}>
			Update
		</Button>
	);

	return (
		<>
			<Flex>{addressNotSet}</Flex>

			<GenericModal
				size='xl'
				isOpen={isOpen}
				onClose={onClose}>
				<GenericModalContent>
					<GenericModalCloseButton />
					<GenericModalHeader>Edit Customer</GenericModalHeader>
					<form onSubmit={handleSubmit}>
						<GenericModalBody>
							<FormContent
								formData={formData}
								setFormData={setFormData}
								data={inputFields}
							/>
						</GenericModalBody>
						<GenericModalFooter>
							<DiscardButton
								mr={2}
								onClick={onModalClose}>
								Discard
							</DiscardButton>
							<Button
								size='sm'
								type='submit'>
								Submit
							</Button>
						</GenericModalFooter>
					</form>
				</GenericModalContent>
			</GenericModal>
		</>
	);
};

export default EditAddressWidget;
