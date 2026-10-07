'use client';

import { Flex, useDisclosure } from '@chakra-ui/react';
import { useEffect, FC } from 'react';

import {
	useCustomToast,
	MenuItem,
	useDeleteByIdMutation,
	useAppSelector,
	useLazyGetAllQuery,
} from '../../../..';
import PromptDialog from '../../../../modals/modal-components/PromptDialog';
import { nounOf, recordLabel } from '../../../../modals/CreateModal/CreateModal';

type DeleteItemModalProps = {
	title?: string;
	id: string;
	path: string;
	item: any;
	/** The row being deleted — its code and name are shown in the dialog. */
	doc?: any;
	children?: React.ReactNode;
	// Controlled mode: when `open` is passed, the dialog's open state is driven
	// by the caller instead of an internal useDisclosure, and no trigger is
	// rendered — used by TableMenu so the dialog lives outside the dropdown
	// menu's own mount lifecycle.
	open?: boolean;
	onClose?: () => void;
};

const DeleteItemModal: FC<DeleteItemModalProps> = ({
	title,
	path,
	id,
	item,
	doc,
	children,
	open: controlledOpen,
	onClose: onControlledClose,
}) => {
	const { page, limit, search, sort, filters }: any = useAppSelector((state: any) => state.table);
	const isControlled = controlledOpen !== undefined;
	const { open: internalOpen, onOpen, onClose: internalOnClose } = useDisclosure();
	const isOpen = isControlled ? controlledOpen : internalOpen;

	const [trigger, result] = useDeleteByIdMutation();
	const [getAllTrigger, getAllResults] = useLazyGetAllQuery();

	const { isSuccess, isError, isLoading, error } = result;

	const closeItem = () => {
		result?.reset();
		if (isControlled) onControlledClose?.();
		else internalOnClose();
	};

	const handleDelete = (e: any) => {
		e.preventDefault();
		trigger({ path: path, id: id, invalidate: [path, item?.invalidate] });
	};

	useEffect(() => {
		if (isSuccess && !isLoading) {
			getAllTrigger({
				page,
				limit,
				search,
				sort,
				filters,
				path,
			});
			closeItem();
		}
	}, [result?.isSuccess]);

	useCustomToast({
		successText: item?.prompt?.successMsg || `${title ? title : 'Item'} Deleted Successfully`,
		...result,
	});

	const noun = nounOf(path);
	const titleText = item?.prompt?.title || `Delete this ${noun}?`;
	const bodyText =
		item?.prompt?.body || `It's removed for everyone who uses this list. This can't be undone.`;

	return (
		<>
			{isControlled ? null : children ? (
				<Flex onClick={onOpen}>{children}</Flex>
			) : (
				<MenuItem
					color='red.500'
					_dark={{ color: 'red.300' }}
					icon='delete-outline'
					onClick={onOpen}>
					{title || 'Delete'}
				</MenuItem>
			)}
			<PromptDialog
				open={isOpen}
				onClose={closeItem}
				onConfirm={() => handleDelete({ preventDefault() {} })}
				tone='danger'
				title={titleText}
				description={bodyText}
				subject={recordLabel(doc) || undefined}
				confirmLabel={item?.prompt?.btnText || `Delete ${noun}`}
				loading={isLoading}
				loadingText='Deleting'
			/>
		</>
	);
};

export default DeleteItemModal;
