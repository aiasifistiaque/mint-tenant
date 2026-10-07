'use client';

import { FC } from 'react';
import { useDisclosure, Flex } from '@chakra-ui/react';
import { MenuItem } from '../../../..';
import RecordDrawer from '../../../view/record/RecordDrawer';

type Props = {
	title?: string;
	id: string;
	path: string;
	trigger?: any;
	// Controlled mode: when `open` is passed, the dialog's open state is driven
	// by the caller instead of an internal useDisclosure, and no trigger is
	// rendered — used by TableMenu so the dialog lives outside the dropdown
	// menu's own mount lifecycle.
	open?: boolean;
	onClose?: () => void;
};

/** The table menu's "View": the record's quick-view drawer (RecordDrawer). */
const ViewServerModal: FC<Props> = ({
	title,
	path,
	trigger,
	id,
	open: controlledOpen,
	onClose: onControlledClose,
}) => {
	const isControlled = controlledOpen !== undefined;
	const { open: internalOpen, onOpen, onClose: internalOnClose } = useDisclosure();
	const isOpen = isControlled ? controlledOpen : internalOpen;
	const closeItem = () => (isControlled ? onControlledClose?.() : internalOnClose());

	const renderTrigger = () => {
		if (isControlled) return null;
		if (trigger) {
			return <Flex onClick={onOpen}>{trigger}</Flex>;
		} else {
			return (
				<MenuItem
					icon='view-outline'
					onClick={onOpen}>
					{title || 'View'}
				</MenuItem>
			);
		}
	};

	return (
		<>
			{renderTrigger()}
			<RecordDrawer
				open={isOpen}
				onClose={closeItem}
				path={path}
				id={id}
				title={title}
			/>
		</>
	);
};

export default ViewServerModal;
