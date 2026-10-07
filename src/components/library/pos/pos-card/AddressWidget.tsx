import { Button, useDisclosure, Flex, Text } from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';

import {
	IconButton,
	useFormData,
	FormContent,
	ModalContainer,
	Column,
	InputData,
	useAppDispatch,
	useAppSelector,
	useGetByIdQuery,
	DiscardButton,
	Address,
	removeAddress,
	setAddress,
	GenericModal,
	GenericModalHeader,
	GenericModalCloseButton,
	GenericModalBody,
	GenericModalFooter,
	GenericModalContent,
} from '../..';

const inputFields: InputData<Address>[] = [
	{
		name: 'name',
		label: 'Recipient Name',
		isRequired: true,
		type: 'text',
	},
	{
		name: 'email',
		label: 'Recipient Email',
		isRequired: true,
		type: 'text',
		span: 1,
	},
	{
		name: 'phone',
		label: 'Recipient Phone',
		isRequired: true,
		type: 'text',
		span: 1,
	},
	{
		name: 'street',
		label: 'Street Address',
		isRequired: true,
		type: 'textarea',
	},
	{
		name: 'city',
		label: 'City',
		isRequired: true,
		type: 'text',
		span: 1,
	},
	{
		name: 'state',
		label: 'State',
		isRequired: false,
		type: 'text',
		span: 1,
	},
	{
		name: 'country',
		label: 'Country',
		isRequired: false,
		type: 'text',
		span: 1,
	},
	{
		name: 'postalCode',
		label: 'Post Code',
		isRequired: true,
		type: 'text',
		span: 1,
	},
];

const AddressWidget = ({ id }: { id?: string }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const dispatch = useAppDispatch();
	const { isAddressSet, address, user }: any = useAppSelector(state => state.cart);
	const { colorMode } = useColorMode();

	const { data, isFetching } = useGetByIdQuery(
		{
			path: 'customers',
			id: user,
		},
		{
			skip: !user,
		}
	);

	const [formData, setFormData] = useFormData<any>(inputFields);

	const onModalOpen = () => {
		setFormData({
			name: data?.name,
			email: data?.email,
			phone: data?.phone,
		});
		onOpen();
	};

	const onModalClose = () => {
		setFormData({});
		onClose();
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		dispatch(setAddress(formData));
		onModalClose();
	};

	const deleteAddress = (e: any) => {
		dispatch(removeAddress());
	};

	const addressIsSet = (
		<Flex
			justify='space-between'
			flex={1}>
			<Column gap={0}>
				<Text
					fontSize='.8rem'
					fontWeight='600'>
					{`${address?.street}, ${address?.city},`} {`${address?.postalCode}, ${address?.country}`}
				</Text>
			</Column>

			<IconButton
				tooltip='Delete Address'
				aria-label='Delete Address'
				colorPalette='red'
				variant='outline'
				iconName='delete'
				size='xs'
				onClick={deleteAddress}
			/>
		</Flex>
	);

	const addressNotSet = (
		<Button
			size='sm'
			fontWeight='700'
			variant='plain'
			onClick={onModalOpen}>
			Add Delivery Address
		</Button>
	);

	return (
		<>
			<Flex
				py={1}
				pl={3}>
				{isAddressSet ? addressIsSet : addressNotSet}
			</Flex>

			<GenericModal
				size='xl'
				isOpen={isOpen}
				onClose={onClose}>
				<GenericModalContent>
					<GenericModalCloseButton />
					<GenericModalHeader>Delivery Address</GenericModalHeader>
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
								size='sm'
								borderWidth={colorMode === 'light' ? 1 : 0}
								borderColor={colorMode === 'light' ? 'container.borderLight' : undefined}
								bg={colorMode === 'light' ? 'container.newLight' : undefined}
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

export default AddressWidget;
