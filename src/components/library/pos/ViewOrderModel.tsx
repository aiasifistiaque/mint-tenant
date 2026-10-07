'use client';
import { useEffect, useState } from 'react';
import { useDisclosure, Flex, Heading, Drawer, Portal } from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';

import PosInput from './PosInput';

import {
	ModalContainer,
	Column,
	VTextarea,
	useGetByIdQuery,
	Align,
	MenuItem,
	useUpdateByIdMutation,
	useCustomToast,
	useIsMobile,
	OrderItems,
	OrderListGrid,
	GenericModal,
	GenericModalHeader,
	GenericModalBody,
} from '..';
import { OrderAddress, OrderButton, OrderCustomer } from './pos-card/odder';

const ViewOrderModal = ({ id }: { id: string }) => {
	const { data, isFetching, isError, isSuccess, refetch } = useGetByIdQuery({
		id: id,
		path: 'orders',
	});
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const [status, setStatus] = useState();

	const [trigger, result] = useUpdateByIdMutation();

	const onModalOpen = () => {
		onOpen();
		refetch();
	};

	const onModalClose = () => {
		setStatus(data?.status);
		onClose();
	};

	useEffect(() => {
		if (!isFetching && isSuccess) setStatus(data?.status);
	}, [isFetching]);

	const { colorMode } = useColorMode();
	const borderColor = colorMode === 'light' ? 'border.emphasized' : 'stroke.deepD';

	const onUpdate = () => {
		trigger({ id: id, body: { status }, path: 'orders' });
	};

	useCustomToast({
		successText: 'Order status updated successfully',
		isSuccess: result?.isSuccess,
		isError: result?.isError,
		isLoading: result?.isLoading,
		error: result?.error,
	});

	const renderLeftSection = <OrderItems data={data} />;

	const renderRightSection = (
		<>
			<Align
				py={3}
				borderBottom='1px dashed'
				borderTop='1px dashed'
				borderColor={borderColor}>
				<Heading size='sm'>Billing Details</Heading>
			</Align>

			<PosInput
				valueType='price'
				value={data?.dueAmount}
				label='Total Due'
				disabled
			/>
			<PosInput
				value={data?.paidAmount}
				disabled
				label='Paid Amount'
				valueType='price'
			/>
			<PosInput
				disabled
				value={data?.paymentMethod}
				valueType='text'
				label='Payment Method'
			/>
			<PosInput
				value={status}
				onChange={(e: any) => setStatus(e.target.value)}
				valueType='select'
				label='Order Status'
				options={[
					'pending',
					'order-placed',
					'confirmed',
					'out-for-delivery',
					'delivered',
					'completed',
					'cancelled',
				]}
			/>
			<VTextarea
				value={data?.note}
				disabled
				label='Note'
			/>
		</>
	);

	const isSmallScreen = useIsMobile();

	const modalContent = (
		<>
			<GenericModalHeader>
				Order Details
				{data?.customer && <OrderCustomer data={data?.customer} />}
				{data?.address && <OrderAddress address={data?.address} />}
			</GenericModalHeader>
			{data && (
				<GenericModalBody>
					<OrderListGrid>
						<Flex flexDirection='column'>{renderLeftSection}</Flex>
						<Column
							flex={1}
							gap={4}>
							<Column
								gap={2}
								flex={1}>
								{renderRightSection}
							</Column>

							<OrderButton
								loading={result?.isLoading}
								onClick={onUpdate}
								disabled={!data || status == data?.status}>
								Update Order
							</OrderButton>
						</Column>
					</OrderListGrid>
				</GenericModalBody>
			)}
		</>
	);

	const drawerContent = (
		<>
			<Drawer.Header>
				Order Details
				{data?.customer && <OrderCustomer data={data?.customer} />}
				{data?.address && <OrderAddress address={data?.address} />}
				<Drawer.CloseTrigger />
			</Drawer.Header>
			{data && (
				<Drawer.Body>
					<OrderListGrid>
						<Flex flexDirection='column'>{renderLeftSection}</Flex>
						<Column
							flex={1}
							gap={4}>
							<Column
								gap={2}
								flex={1}>
								{renderRightSection}
							</Column>

							<OrderButton
								loading={result?.isLoading}
								onClick={onUpdate}
								disabled={!data || status == data?.status}>
								Update Order
							</OrderButton>
						</Column>
					</OrderListGrid>
				</Drawer.Body>
			)}
		</>
	);

	return (
		<>
			<MenuItem onClick={onModalOpen}>View Order</MenuItem>

			{isSmallScreen ? (
				<Drawer.Root
					lazyMount
					unmountOnExit
					open={isOpen}
					placement='bottom'
					onOpenChange={e => (e.open ? onOpen() : onModalClose())}>
					<Portal>
						<Drawer.Backdrop />
						<Drawer.Positioner>
							<Drawer.Content>{drawerContent}</Drawer.Content>
						</Drawer.Positioner>
					</Portal>
				</Drawer.Root>
			) : (
				<GenericModal
					isOpen={isOpen}
					onClose={onModalClose}
					size='full'
					closeOnOverlayClick={false}>
					{modalContent}
				</GenericModal>
			)}
		</>
	);
};

export default ViewOrderModal;
