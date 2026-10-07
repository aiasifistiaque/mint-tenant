'use client';

import { useDisclosure } from '@chakra-ui/react';
import { FC } from 'react';

import {
	MenuModal,
	MenuModalHeader,
	MenuModalBody,
	MenuModalCloseButton,
	MenuItem,
	Column,
	ViewItem,
} from '../../..';

type ListInventoryModalProps = {
	path: string;
	id: string;
	key: string;
	data: any;
	doc?: any;
};

const ListInventoryModal: FC<ListInventoryModalProps> = ({ key, id, path, data, doc }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const closeModal = () => {
		onClose();
	};

	return (
		<>
			<MenuItem onClick={onOpen}>List Inventory</MenuItem>

			<MenuModal
				size='xl'
				forceModal
				isOpen={isOpen}
				onClose={closeModal}>
				<MenuModalHeader>Inventory Details</MenuModalHeader>
				<MenuModalCloseButton />
				<MenuModalBody px={0}>
					<Column
						gap={4}
						py={2}>
						<ViewItem
							isLoading={false}
							title='Total Stock'
							type='number'>
							{data?.totalStock}
						</ViewItem>
						<ViewItem
							isLoading={false}
							title='Stock in Main Warehouse'
							type='number'>
							{data?.stock}
						</ViewItem>
						{data?.inventory?.map((inv: any, i: number) => (
							<ViewItem
								key={i}
								isLoading={false}
								title={`Stock in ${inv?.location?.name}`}
								type='number'>
								{inv?.stock}
							</ViewItem>
						))}
					</Column>
				</MenuModalBody>
			</MenuModal>
		</>
	);
};

export default ListInventoryModal;
